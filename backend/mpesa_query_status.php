<?php
// backend/api/mpesa_query_status.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../mpesa_integration/MpesaService.php';

use App\Config\Database;

session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$payment_id = (int)($data['payment_id'] ?? 0);

if ($payment_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payment_id']);
    exit;
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ? AND user_id = ?");
    $stmt->execute([$payment_id, $_SESSION['user_id']]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        http_response_code(404);
        echo json_encode(['error' => 'Payment not found']);
        exit;
    }

    if ($payment['status'] === 'completed') {
        $stmt_ticket = $pdo->prepare("SELECT t.id FROM tickets t JOIN payment_tickets pt ON t.id = pt.ticket_id WHERE pt.payment_id = ? LIMIT 1");
        $stmt_ticket->execute([$payment_id]);
        $ticket_id = (int)$stmt_ticket->fetchColumn();
        echo json_encode(['status' => 'completed', 'ticket_id' => $ticket_id]);
        exit;
    }
    if (empty($payment['transaction_id']) || str_starts_with($payment['transaction_id'], 'PENDING_')) {
        http_response_code(400);
        echo json_encode(['error' => 'STK push not yet initiated or transaction ID is missing.']);
        exit;
    }

    $mpesa = new MpesaService();
    $resp = $mpesa->queryStkStatus($payment['transaction_id']);

    $resultCode = (int)($resp['ResultCode'] ?? 1);
    $resultDesc = (string)($resp['ResultDesc'] ?? '');

    if ($resultCode === 0) {
        // Payment is successful, manually trigger completion logic
        // This is a simplified version of mpesa_callback.php
        $pdo->beginTransaction();

        $stmt_lock = $pdo->prepare("SELECT status FROM payments WHERE id = ? FOR UPDATE");
        $stmt_lock->execute([$payment_id]);
        if ($stmt_lock->fetch(PDO::FETCH_COLUMN) === 'completed') {
            $pdo->commit(); // Already done, just commit
        } else {
            // Mark payment complete
            $stmt_update = $pdo->prepare("UPDATE payments SET status = 'completed', mpesa_receipt_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt_update->execute([($resp['MpesaReceiptNumber'] ?? 'N/A'), $payment_id]);

            // Issue Tickets
            for ($i = 0; $i < (int)$payment['quantity']; $i++) {
                $ticket_code = 'TICKET_' . strtoupper(uniqid()) . '_' . mt_rand(1000, 9999);
                $stmt_tix = $pdo->prepare("INSERT INTO tickets (event_id, user_id, ticket_code, status, purchase_date) VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)");
                $stmt_tix->execute([(int)$payment['event_id'], (int)$payment['user_id'], $ticket_code]);
                $ticket_id = (int)$pdo->lastInsertId();
                $stmt_link = $pdo->prepare("INSERT INTO payment_tickets (payment_id, ticket_id) VALUES (?, ?)");
                $stmt_link->execute([$payment_id, $ticket_id]);
            }
            
            // Update event
            $stmt_event = $pdo->prepare("UPDATE events SET available_tickets = GREATEST(0, available_tickets - ?) WHERE id = ?");
            $stmt_event->execute([(int)$payment['quantity'], (int)$payment['event_id']]);
            $stmt_attend = $pdo->prepare("INSERT INTO event_attendees (event_id, user_id, status, category_id, quantity) VALUES (?, ?, 'going', 1, ?) ON DUPLICATE KEY UPDATE status = 'going', quantity = quantity + VALUES(quantity)");
            $stmt_attend->execute([(int)$payment['event_id'], (int)$payment['user_id'], (int)$payment['quantity']]);
            
            $pdo->commit();
        }

        // Get the first ticket ID to redirect to
        $stmt_ticket = $pdo->prepare("SELECT t.id FROM tickets t JOIN payment_tickets pt ON t.id = pt.ticket_id WHERE pt.payment_id = ? LIMIT 1");
        $stmt_ticket->execute([$payment_id]);
        $ticket_id = (int)$stmt_ticket->fetchColumn();
        echo json_encode(['status' => 'completed', 'ticket_id' => $ticket_id]);

    } else {
        // Still pending or failed
        echo json_encode(['status' => 'pending', 'message' => $resultDesc]);
    }

} catch (Throwable $e) {
    if(isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
