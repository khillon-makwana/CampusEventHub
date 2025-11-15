<?php
// backend/api/rsvp_actions.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized.']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$rsvp_id = (int)($_GET['rsvp_id'] ?? 0);

if ($rsvp_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid RSVP ID.']);
    exit;
}

try {
    $pdo = Database::getConnection();

    // 2. GET RSVP DETAILS (and its event_id)
    $stmt_rsvp = $pdo->prepare("SELECT * FROM event_attendees WHERE id = ?");
    $stmt_rsvp->execute([$rsvp_id]);
    $rsvp = $stmt_rsvp->fetch(PDO::FETCH_ASSOC);

    if (!$rsvp) {
        throw new Exception('RSVP not found.', 404);
    }

    $event_id = (int)$rsvp['event_id'];
    $attendee_user_id = (int)$rsvp['user_id'];

    // 3. SECURITY CHECK: Verify the logged-in user OWNS the event
    $stmt_owner = $pdo->prepare("SELECT id, total_tickets, ticket_price FROM events WHERE id = ? AND user_id = ?");
    $stmt_owner->execute([$event_id, $user_id]);
    $event = $stmt_owner->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        throw new Exception("You are not authorized to manage this event's RSVPs.", 403);
    }

    // 4. HANDLE 'PUT' REQUEST (Edit RSVP)
    if ($method === 'POST') { // React/HTML forms don't always send PUT
        $data = json_decode(file_get_contents('php://input'), true);
        $status = (string)($data['status'] ?? '');
        $category_id = (int)($data['category_id'] ?? 0);

        if (empty($status) || $category_id <= 0) {
            throw new Exception('Invalid status or category.', 422);
        }

        $update = $pdo->prepare("UPDATE event_attendees SET status = ?, category_id = ? WHERE id = ?");
        $update->execute([$status, $category_id, $rsvp_id]);

        echo json_encode(['success' => true, 'message' => 'RSVP updated.']);
    } 
    // 5. HANDLE 'DELETE' REQUEST
    elseif ($method === 'DELETE') {
        $pdo->beginTransaction();

        // Delete the RSVP
        $stmt_del = $pdo->prepare("DELETE FROM event_attendees WHERE id = ?");
        $stmt_del->execute([$rsvp_id]);

        // Refund ticket (if they were 'going' and it was a free, ticketed event)
        if ($rsvp['status'] === 'going') {
            if ($event['total_tickets'] > 0 && $event['ticket_price'] <= 0) {
                $spots_to_free = $rsvp['quantity'] > 0 ? (int)$rsvp['quantity'] : 1;
                $stmt_ticket = $pdo->prepare("UPDATE events SET available_tickets = available_tickets + ? WHERE id = ?");
                $stmt_ticket->execute([$spots_to_free, $event_id]);
            }
        }

        // Delete associated feedback
        $stmt_feedback = $pdo->prepare("DELETE FROM feedback WHERE event_id = ? AND user_id = ?");
        $stmt_feedback->execute([$event_id, $attendee_user_id]);

        $pdo->commit();

        echo json_encode(['success' => true, 'message' => 'Attendee removed.']);
    } 
    else {
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed.']);
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}
