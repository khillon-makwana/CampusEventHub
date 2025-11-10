<?php
// backend/api/view_ticket.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Please log in.']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];
$ticket_id = (int)($_GET['ticket_id'] ?? 0);

if ($ticket_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid Ticket ID.']);
    exit;
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
        http_response_code(404);
        echo json_encode(['error' => 'Ticket not found or you do not have permission to view it.']);
        exit;
    }

    // 4. SEND RESPONSE
    echo json_encode([
        'success' => true,
        'user' => $user, // For layout
        'ticket' => $ticket
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
