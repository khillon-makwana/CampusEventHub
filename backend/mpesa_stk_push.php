<?php
// backend/api/mpesa_stk_push.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../mpesa_integration/MpesaService.php';

use App\Config\Database;

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized.']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
$payment_id = (int)($data['payment_id'] ?? 0);
$phone = preg_replace('/\D+/', '', $data['phone'] ?? '');

if ($payment_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payment ID.']);
    exit;
}
if (!preg_match('/^2547\d{8}$/', $phone)) {
    http_response_code(422);
    echo json_encode(['error' => 'Enter a valid Safaricom number in format 2547XXXXXXXX.']);
    exit;
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ? AND user_id = ? AND status = 'pending'");
    $stmt->execute([$payment_id, $user_id]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        http_response_code(404);
        echo json_encode(['error' => 'Payment not found or already processed.']);
        exit;
    }

    $mpesa = new MpesaService();
    $config = require __DIR__ . '/../mpesa_integration/config.php';
    
    // Use the site's base URL (from your .env) + the callback path
    $base = rtrim($_ENV['APP_URL'], '/');
    $callbackUrl = $base . '/backend/mpesa_integration/mpesa_callback.php?payment_id=' . urlencode((string)$payment_id);
    
    $accountReference = 'EVT' . (int)$payment['event_id'] . 'P' . (int)$payment_id;

    $response = $mpesa->stkPush((int)$payment['amount'], $phone, $callbackUrl, $accountReference, 'Ticket Purchase');

    if (!empty($response['CheckoutRequestID'])) {
        $stmt = $pdo->prepare("UPDATE payments SET transaction_id = ?, phone_number = ? WHERE id = ?");
        $stmt->execute([$response['CheckoutRequestID'], $phone, $payment_id]);
        
        echo json_encode(['success' => true, 'message' => 'STK push sent. Check your phone.', 'response' => $response]);
    } else {
        throw new Exception($response['errorMessage'] ?? 'Failed to initiate STK push.');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
