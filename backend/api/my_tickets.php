<?php
// backend/api/my_tickets.php
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
$pdo = Database::getConnection();

// 2. HANDLE 'POST' REQUEST (Delete Tickets)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    try {
        if (isset($data['delete_all']) && $data['delete_all'] === true) {
            // Delete all tickets for the user
            $stmt = $pdo->prepare("DELETE FROM tickets WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $count = $stmt->rowCount();
            echo json_encode(['success' => true, 'message' => "Successfully deleted {$count} ticket(s)."]);

        } elseif (isset($data['ticket_ids']) && is_array($data['ticket_ids']) && !empty($data['ticket_ids'])) {
            // Delete selected tickets
            $placeholders = implode(',', array_fill(0, count($data['ticket_ids']), '?'));
            $stmt = $pdo->prepare("DELETE FROM tickets WHERE id IN ($placeholders) AND user_id = ?");
            
            $params = $data['ticket_ids'];
            $params[] = $user_id;
            
            $stmt->execute($params);
            $count = $stmt->rowCount();
            echo json_encode(['success' => true, 'message' => "Successfully deleted {$count} ticket(s)."]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'No tickets selected for deletion.']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    }
    exit;
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

        echo json_encode([
            'success' => true,
            'user' => $user,
            'tickets' => $tickets,
            'pending_payment' => $pending_payment
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    }
    exit;
}

// Fallback for invalid request method
http_response_code(405); // Method Not Allowed
echo json_encode(['error' => 'Invalid request method.']);
