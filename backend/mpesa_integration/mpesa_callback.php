<?php
// backend/mpesa_integration/mpesa_callback.php
// This file is called by Safaricom, not by your React app.

// Use project autoloader and Database class
require_once dirname(__DIR__) . '/vendor/autoload.php';
use App\Config\Database;

// Log raw callback for debugging
$raw = file_get_contents('php://input');
@file_put_contents(__DIR__ . '/callback_log.txt', date('c') . "\n" . $raw . "\n\n", FILE_APPEND);

$payload = json_decode($raw, true);
if (!isset($payload['Body']['stkCallback'])) {
    http_response_code(400);
    echo json_encode(['status' => 'invalid', 'message' => 'Missing stkCallback']);
    exit;
}

$cb = $payload['Body']['stkCallback'];
$resultCode = (int)($cb['ResultCode'] ?? 1);
$resultDesc = (string)($cb['ResultDesc'] ?? '');
$checkoutRequestId = (string)($cb['CheckoutRequestID'] ?? '');
$merchantRequestId = (string)($cb['MerchantRequestID'] ?? '');

$payment_id = isset($_GET['payment_id']) ? (int)$_GET['payment_id'] : 0;

$metaItems = $cb['CallbackMetadata']['Item'] ?? [];
$meta = [];
foreach ($metaItems as $item) {
    if (isset($item['Name'])) {
        $meta[$item['Name']] = $item['Value'] ?? null;
    }
}
$mpesaAmount = $meta['Amount'] ?? null;
$mpesaReceipt = $meta['MpesaReceiptNumber'] ?? null;
$mpesaPhone = $meta['PhoneNumber'] ?? null;

try {
    $pdo = Database::getConnection();

    if ($payment_id <= 0 && $checkoutRequestId) {
        $stmt = $pdo->prepare("SELECT id FROM payments WHERE transaction_id = ? LIMIT 1");
        $stmt->execute([$checkoutRequestId]);
        $payment_id = (int)$stmt->fetchColumn();
    }

    if ($payment_id <= 0) {
        http_response_code(200); // Acknowledge Safaricom
        echo json_encode(['status' => 'ignored', 'message' => 'Payment not found']);
        exit;
    }

    if ($resultCode !== 0) {
        $stmt = $pdo->prepare("UPDATE payments SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->execute([$payment_id]);
        http_response_code(200);
        echo json_encode(['status' => 'failed', 'message' => $resultDesc]);
        exit;
    }

    // Success path
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ? FOR UPDATE");
    $stmt->execute([$payment_id]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$payment) {
        $pdo->rollBack();
        http_response_code(200);
        echo json_encode(['status' => 'ignored', 'message' => 'Payment row missing']);
        exit;
    }

    if (($payment['status'] ?? '') === 'completed') {
        $pdo->commit();
        echo json_encode(['status' => 'ok', 'message' => 'Already completed']);
        exit;
    }

    // 1. UPDATE the successful payment
    $stmt = $pdo->prepare("UPDATE payments SET status = 'completed', mpesa_receipt_number = ?, phone_number = COALESCE(?, phone_number), transaction_id = COALESCE(transaction_id, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$mpesaReceipt, $mpesaPhone, $checkoutRequestId, $payment_id]);

    // 2. CLEANUP old pending payments
    $stmt_cleanup = $pdo->prepare("
        DELETE FROM payments 
        WHERE user_id = ? 
        AND event_id = ? 
        AND status = 'pending' 
        AND id != ?
    ");
    $stmt_cleanup->execute([
        (int)$payment['user_id'], 
        (int)$payment['event_id'], 
        $payment_id
    ]);

    // 3. CREATE Tickets
    for ($i = 0; $i < (int)$payment['quantity']; $i++) {
        $ticket_code = 'TICKET_' . strtoupper(uniqid()) . '_' . mt_rand(1000, 9999);
        $stmt = $pdo->prepare("INSERT INTO tickets (event_id, user_id, ticket_code, status, purchase_date) VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)");
        $stmt->execute([(int)$payment['event_id'], (int)$payment['user_id'], $ticket_code]);
        $ticket_id = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare("INSERT INTO payment_tickets (payment_id, ticket_id) VALUES (?, ?)");
        $stmt->execute([$payment_id, $ticket_id]);
    }

    // 4. UPDATE Event Availability
    $stmt = $pdo->prepare("UPDATE events SET available_tickets = GREATEST(0, available_tickets - ?) WHERE id = ?");
    $stmt->execute([(int)$payment['quantity'], (int)$payment['event_id']]);

    // 5. UPDATE Attendee List
    $stmt = $pdo->prepare("INSERT INTO event_attendees (event_id, user_id, status, category_id, quantity) VALUES (?, ?, 'going', 1, ?) ON DUPLICATE KEY UPDATE status = 'going', quantity = quantity + VALUES(quantity)");
    $stmt->execute([(int)$payment['event_id'], (int)$payment['user_id'], (int)$payment['quantity']]);

    // 6. SEND NOTIFICATION (This was the missing part)
    try {
        // We must re-require the autoloader and services here
        require_once dirname(__DIR__) . '/vendor/autoload.php';
        $mailer = new \App\Services\Mailer();
        $notificationManager = new \App\Services\NotificationManager($mailer);
        $notificationManager->sendRSVPConfirmation((int)$payment['user_id'], (int)$payment['event_id'], 'going');
    } catch (Exception $e) {
        // Log notification error but don't fail the main transaction
        @file_put_contents(__DIR__ . '/callback_errors.log', date('c') . ' NOTIFICATION_ERROR: ' . $e->getMessage() . "\n", FILE_APPEND);
    }
    // --- END NOTIFICATION BLOCK ---

    $pdo->commit();

    http_response_code(200);
    echo json_encode(['status' => 'ok', 'payment_id' => $payment_id, 'receipt' => $mpesaReceipt]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    @file_put_contents(__DIR__ . '/callback_errors.log', date('c') . ' ' . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(200); // Still send 200 to Safaricom
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>