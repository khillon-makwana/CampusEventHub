<?php
// backend/api/payment_status.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;

session_start();

if (!isset($_SESSION['user_id'])) {
    Response::error('Unauthorized', 401);
}

$payment_id = (int)($_GET['payment_id'] ?? 0);
if ($payment_id <= 0) {
    Response::error('Invalid payment_id', 400);
}

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->prepare("SELECT status, event_id FROM payments WHERE id = ? AND user_id = ?");
    $stmt->execute([$payment_id, $_SESSION['user_id']]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        Response::error('Payment not found', 404);
    }

    $status = $row['status'];
    $resp = ['status' => $status];

    if ($status === 'completed') {
        // Get first ticket for this payment
        $stmt_ticket = $pdo->prepare("SELECT t.id FROM tickets t JOIN payment_tickets pt ON t.id = pt.ticket_id WHERE pt.payment_id = ? LIMIT 1");
        $stmt_ticket->execute([$payment_id]);
        $ticket_id = (int)$stmt_ticket->fetchColumn();
        if ($ticket_id) { $resp['ticket_id'] = $ticket_id; }
    } elseif ($status === 'failed') {
        $resp['event_id'] = (int)$row['event_id'];
    }

    Response::json($resp);

} catch (Throwable $e) {
    Response::error('Server error', 500);
}
