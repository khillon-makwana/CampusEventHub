<?php
// backend/api/view_ticket.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;
use App\Helpers\Response;
use App\Helpers\Validator;

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    Response::error('Unauthorized. Please log in.', 401);
}

$user_id = (int)$_SESSION['user_id'];
$ticket_id = (int)($_GET['ticket_id'] ?? 0);

if ($ticket_id <= 0) {
    Response::error('Invalid Ticket ID.', 400);
}

try {
    $pdo = Database::getConnection();

    // 2. GET USER
    $userModel = new User();
    $user = $userModel->findById($user_id);

    // 3. FETCH TICKET (and verify ownership)
    $stmt = $pdo->prepare("
        SELECT t.*, e.title as event_title, e.event_date, e.location, e.description, e.image,
               u.fullname as user_name, u.email as user_email,
               p.transaction_id, p.amount, p.purchase_date, p.mpesa_receipt_number,
               p.status as payment_status, p.quantity
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        JOIN users u ON t.user_id = u.id
        LEFT JOIN payment_tickets pt ON t.id = pt.ticket_id
        LEFT JOIN payments p ON pt.payment_id = p.id
        WHERE t.id = ? AND t.user_id = ?
    ");
    $stmt->execute([$ticket_id, $user_id]);
    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$ticket) {
        Response::error('Ticket not found or you do not have permission to view it.', 404);
    }

    // 4. SEND RESPONSE
    Response::json([
        'success' => true,
        'user' => $user, // For layout
        'ticket' => $ticket
    ]);

} catch (PDOException $e) {
    Response::error('Database error', 500, $e->getMessage());
}
