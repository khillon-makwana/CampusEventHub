<?php
// backend/api/mpesa_stk_push.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../mpesa_integration/MpesaService.php';

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;

session_start();

if (!isset($_SESSION['user_id'])) {
    Response::error('Unauthorized.', 401);
}

$user_id = (int)$_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
$inputs = Validator::sanitize($data ?? []);
$payment_id = (int)($inputs['payment_id'] ?? 0);
$phone = preg_replace('/\D+/', '', $inputs['phone'] ?? '');

if ($payment_id <= 0) {
    Response::error('Invalid payment ID.', 400);
}
if (!preg_match('/^2547\d{8}$/', $phone)) {
    Response::error('Enter a valid Safaricom number in format 2547XXXXXXXX.', 422);
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ? AND user_id = ? AND status = 'pending'");
    $stmt->execute([$payment_id, $user_id]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        Response::error('Payment not found or already processed.', 404);
    }

    $mpesa = new MpesaService();
    // $config = require __DIR__ . '/../mpesa_integration/config.php'; // Not needed if MpesaService handles it or uses env
    
    // Use the site's base URL (from your .env) + the callback path
    $base = rtrim($_ENV['APP_URL'], '/');
    $callbackUrl = $base . '/backend/mpesa_integration/mpesa_callback.php?payment_id=' . urlencode((string)$payment_id);
    
    $accountReference = 'EVT' . (int)$payment['event_id'] . 'P' . (int)$payment_id;

    $response = $mpesa->stkPush((int)$payment['amount'], $phone, $callbackUrl, $accountReference, 'Ticket Purchase');

    if (!empty($response['CheckoutRequestID'])) {
        $stmt = $pdo->prepare("UPDATE payments SET transaction_id = ?, phone_number = ? WHERE id = ?");
        $stmt->execute([$response['CheckoutRequestID'], $phone, $payment_id]);
        
        Response::json(['success' => true, 'message' => 'STK push sent. Check your phone.', 'response' => $response]);
    } else {
        throw new Exception($response['errorMessage'] ?? 'Failed to initiate STK push.');
    }

} catch (Exception $e) {
    Response::error($e->getMessage(), 500);
}
