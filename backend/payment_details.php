<?php
// backend/api/payment_details.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized.']);
    exit;
}

$payment_id = (int)($_GET['payment_id'] ?? 0);
$user_id = (int)$_SESSION['user_id'];

if ($payment_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payment ID.']);
    exit;
}

try {
    $pdo = Database::getConnection();

    $userModel = new User();
    $user = $userModel->findById($user_id);

    $stmt = $pdo->prepare("
        SELECT p.id, p.amount, p.quantity, p.status, p.transaction_id, e.title as event_title, u.fullname
        FROM payments p
        JOIN events e ON p.event_id = e.id
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ? AND p.user_id = ?
    ");
    $stmt->execute([$payment_id, $user_id]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        http_response_code(404);
        echo json_encode(['error' => 'Payment not found.']);
        exit;
    }

    echo json_encode(['success' => true, 'user' => $user, 'payment' => $payment]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
