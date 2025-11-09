<?php
// backend/api/purchase_ticket.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Please log in.']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];
$pdo = Database::getConnection();

// --- Handle GET Request: Fetch event data for the page ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $event_id = (int)($_GET['event_id'] ?? 0);
    if ($event_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid Event ID.']);
        exit;
    }

    try {
        $userModel = new User();
        $user = $userModel->findById($user_id);

        $stmt = $pdo->prepare("
            SELECT e.id, e.title, e.location, e.event_date, e.available_tickets, e.ticket_price, u.fullname as organizer_name 
            FROM events e 
            JOIN users u ON e.user_id = u.id 
            WHERE e.id = ? AND e.status IN ('upcoming', 'ongoing')
        ");
        $stmt->execute([$event_id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found or not available.']);
            exit;
        }

        echo json_encode(['success' => true, 'user' => $user, 'event' => $event]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    }
    exit;
}

// --- Handle POST Request: Create pending payment ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $event_id = (int)($data['event_id'] ?? 0);
    $quantity = (int)($data['quantity'] ?? 1);

    if ($event_id <= 0 || $quantity <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid event ID or quantity.']);
        exit;
    }

    try {
        // Get event details again to verify price and availability
        $stmt_event = $pdo->prepare("SELECT ticket_price, available_tickets FROM events WHERE id = ?");
        $stmt_event->execute([$event_id]);
        $event = $stmt_event->fetch(PDO::FETCH_ASSOC);

        if (!$event) {
            http_response_code(404);
            echo json_encode(['error' => 'Event not found.']);
            exit;
        }

        if ($event['available_tickets'] < $quantity) {
            http_response_code(409); // Conflict
            echo json_encode(['error' => "Only {$event['available_tickets']} tickets available."]);
            exit;
        }

        $total_amount = $event['ticket_price'] * $quantity;
        $transaction_id = 'PENDING_' . time() . '_' . uniqid();

        $stmt_insert = $pdo->prepare("
            INSERT INTO payments (user_id, event_id, amount, quantity, payment_method, transaction_id, status)
            VALUES (?, ?, ?, ?, 'mpesa', ?, 'pending')
        ");
        $stmt_insert->execute([$user_id, $event_id, $total_amount, $quantity, $transaction_id]);
        $payment_id = $pdo->lastInsertId();

        echo json_encode(['success' => true, 'payment_id' => $payment_id]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    }
    exit;
}

// Fallback for invalid request method
http_response_code(405); // Method Not Allowed
echo json_encode(['error' => 'Invalid request method.']);