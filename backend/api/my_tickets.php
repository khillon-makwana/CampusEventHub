<?php
// backend/api/my_tickets.php
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
$pdo = Database::getConnection();

// 2. HANDLE 'POST' REQUEST (Delete Tickets)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $inputs = Validator::sanitize($data ?? []);

    try {
        if (isset($data['delete_all']) && $data['delete_all'] === true) {
            // Delete all tickets for the user
            $stmt = $pdo->prepare("DELETE FROM tickets WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $count = $stmt->rowCount();
            Response::json(['success' => true, 'message' => "Successfully deleted {$count} ticket(s)."]);

        } elseif (isset($data['ticket_ids']) && is_array($data['ticket_ids']) && !empty($data['ticket_ids'])) {
            // Delete selected tickets
            // Note: We don't sanitize ticket_ids array structure itself, but we ensure they are integers in the query
            $ticket_ids = $data['ticket_ids'];
            $placeholders = implode(',', array_fill(0, count($ticket_ids), '?'));
            $stmt = $pdo->prepare("DELETE FROM tickets WHERE id IN ($placeholders) AND user_id = ?");
            
            $params = $ticket_ids;
            $params[] = $user_id;
            
            $stmt->execute($params);
            $count = $stmt->rowCount();
            Response::json(['success' => true, 'message' => "Successfully deleted {$count} ticket(s)."]);
        } else {
            Response::error('No tickets selected for deletion.', 400);
        }
    } catch (PDOException $e) {
        Response::error('Database error', 500, $e->getMessage());
    }
}


// 3. HANDLE 'GET' REQUEST (Fetch Tickets)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get user
        $userModel = new User();
        $user = $userModel->findById($user_id);

        // Check for pending payments
        $stmt_pending = $pdo->prepare("
            SELECT p.id, p.amount, e.title as event_title
            FROM payments p
            JOIN events e ON p.event_id = e.id
            WHERE p.user_id = ? AND p.status = 'pending'
            ORDER BY p.created_at DESC
            LIMIT 1
        ");
        $stmt_pending->execute([$user_id]);
        $pending_payment = $stmt_pending->fetch(PDO::FETCH_ASSOC) ?: null;

        // Fetch user's tickets
        $stmt_tickets = $pdo->prepare("
            SELECT t.*, e.title as event_title, e.event_date, e.location, e.image,
                   p.transaction_id, p.purchase_date, p.amount, p.mpesa_receipt_number,
                   p.status as payment_status, p.quantity
            FROM tickets t
            JOIN events e ON t.event_id = e.id
            LEFT JOIN payment_tickets pt ON t.id = pt.ticket_id
            LEFT JOIN payments p ON pt.payment_id = p.id
            WHERE t.user_id = ?
            ORDER BY t.purchase_date DESC
        ");
        $stmt_tickets->execute([$user_id]);
        $tickets = $stmt_tickets->fetchAll(PDO::FETCH_ASSOC);

        Response::json([
            'success' => true,
            'user' => $user,
            'tickets' => $tickets,
            'pending_payment' => $pending_payment
        ]);

    } catch (PDOException $e) {
        Response::error('Database error', 500, $e->getMessage());
    }
}

// Fallback for invalid request method
Response::error('Invalid request method.', 405);
