<?php
// backend/api/rsvp_actions.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    Response::error('Unauthorized.', 401);
}

$user_id = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$rsvp_id = (int)($_GET['rsvp_id'] ?? 0);

if ($rsvp_id <= 0) {
    Response::error('Invalid RSVP ID.', 400);
}

try {
    $pdo = Database::getConnection();

    // 2. GET RSVP DETAILS (and its event_id)
    $stmt_rsvp = $pdo->prepare("SELECT * FROM event_attendees WHERE id = ?");
    $stmt_rsvp->execute([$rsvp_id]);
    $rsvp = $stmt_rsvp->fetch(PDO::FETCH_ASSOC);

    if (!$rsvp) {
        Response::error('RSVP not found.', 404);
    }

    $event_id = (int)$rsvp['event_id'];
    $attendee_user_id = (int)$rsvp['user_id'];

    // 3. SECURITY CHECK: Verify the logged-in user OWNS the event
    $stmt_owner = $pdo->prepare("SELECT id, total_tickets, ticket_price FROM events WHERE id = ? AND user_id = ?");
    $stmt_owner->execute([$event_id, $user_id]);
    $event = $stmt_owner->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        Response::error("You are not authorized to manage this event's RSVPs.", 403);
    }

    // 4. HANDLE 'PUT' REQUEST (Edit RSVP)
    if ($method === 'POST') { // React/HTML forms don't always send PUT
        $data = Validator::sanitize(json_decode(file_get_contents('php://input'), true));
        $status = (string)($data['status'] ?? '');
        $category_id = (int)($data['category_id'] ?? 0);

        if (empty($status) || $category_id <= 0) {
            Response::error('Invalid status or category.', 422);
        }

        $update = $pdo->prepare("UPDATE event_attendees SET status = ?, category_id = ? WHERE id = ?");
        $update->execute([$status, $category_id, $rsvp_id]);

        Response::json(['success' => true, 'message' => 'RSVP updated.']);
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

        Response::json(['success' => true, 'message' => 'Attendee removed.']);
    } 
    else {
        Response::error('Method Not Allowed.', 405);
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
    Response::error($e->getMessage(), $code);
}
