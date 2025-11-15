<?php
// backend/api/events_actions.php

// --- CORS must come before everything else ---
require_once __DIR__ . '/cors.php';

require_once __DIR__ . '/../vendor/autoload.php';
use App\Config\Database;

// --- START SESSION ---
session_start();

// --- AUTHENTICATION CHECK ---
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Please log in to perform this action.']);
    exit;
}

// --- INPUT VALIDATION ---
$data = json_decode(file_get_contents('php://input'), true);
$event_id = (int)($data['event_id'] ?? $data['id'] ?? 0);
$action = (string)($data['action'] ?? '');
$user_id = (int)$_SESSION['user_id'];
$ticket_id = (int)($data['ticket_id'] ?? 0);

if (empty($action) || ($event_id <= 0 && $ticket_id <= 0)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid ID or action.']);
    exit;
}

try {
    $pdo = Database::getConnection();

    switch ($action) {

        // --- ATTENDEE ACTIONS ---
        case 'attend':
        case 'interested':
            $new_status = ($action === 'attend') ? 'going' : 'interested';

            $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ? AND status IN ('upcoming', 'ongoing')");
            $stmt->execute([$event_id]);
            $event = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$event) {
                http_response_code(404);
                echo json_encode(['error' => 'Event not found or not available.']);
                exit;
            }

            if ($new_status === 'going' && $event['ticket_price'] > 0) {
                http_response_code(402); // Payment Required
                echo json_encode([
                    'success' => false,
                    'error' => 'This is a paid event. Please purchase a ticket.',
                    'payment_required' => true,
                    'event_id' => $event_id
                ]);
                exit;
            }

            if ($new_status === 'going' && $event['total_tickets'] > 0 && $event['available_tickets'] <= 0) {
                http_response_code(409); // Conflict
                echo json_encode(['error' => 'Sorry, this event is fully booked.']);
                exit;
            }

            $stmt_rsvp = $pdo->prepare("SELECT status, quantity FROM event_attendees WHERE event_id = ? AND user_id = ?");
            $stmt_rsvp->execute([$event_id, $user_id]);
            $current_rsvp = $stmt_rsvp->fetch(PDO::FETCH_ASSOC);
            $current_status = $current_rsvp['status'] ?? null;

            $pdo->beginTransaction();

            if ($current_status === 'going' && $new_status === 'interested') {
                if ($event['total_tickets'] > 0) {
                    $stmt_ticket = $pdo->prepare("UPDATE events SET available_tickets = available_tickets + 1 WHERE id = ?");
                    $stmt_ticket->execute([$event_id]);
                }
                $stmt_update_rsvp = $pdo->prepare("UPDATE event_attendees SET status = 'interested', quantity = 0 WHERE event_id = ? AND user_id = ?");
                $stmt_update_rsvp->execute([$event_id, $user_id]);

            } elseif ($new_status === 'going' && $current_status !== 'going') {
                if ($event['total_tickets'] > 0) {
                    $stmt_ticket = $pdo->prepare("UPDATE events SET available_tickets = available_tickets - 1 WHERE id = ?");
                    $stmt_ticket->execute([$event_id]);
                }
                $stmt_update_rsvp = $pdo->prepare("
                    INSERT INTO event_attendees (event_id, user_id, status, category_id, quantity)
                    VALUES (?, ?, 'going', 1, 1)
                    ON DUPLICATE KEY UPDATE status = 'going', quantity = 1
                ");
                $stmt_update_rsvp->execute([$event_id, $user_id]);

            } elseif ($new_status === 'interested' && $current_status !== 'going') {
                $stmt_update_rsvp = $pdo->prepare("
                    INSERT INTO event_attendees (event_id, user_id, status, category_id, quantity)
                    VALUES (?, ?, 'interested', 1, 0)
                    ON DUPLICATE KEY UPDATE status = 'interested', quantity = 0
                ");
                $stmt_update_rsvp->execute([$event_id, $user_id]);
            }

            $pdo->commit();
            // --- NEW NOTIFICATION BLOCK ---
            try {
                $mailer = new \App\Services\Mailer();
                $notificationManager = new \App\Services\NotificationManager($mailer);
                $notificationManager->sendRSVPConfirmation($user_id, $event_id, $new_status);
            } catch (Exception $e) {
                // Log notification error but don't fail the request
                error_log("Failed to send RSVP notification: " . $e->getMessage());
            }
            // --- END NEW BLOCK ---
            echo json_encode(['success' => true, 'message' => 'Your RSVP has been updated!', 'new_status' => $new_status]);
            break;

        case 'unattend':
            $stmt_rsvp = $pdo->prepare("SELECT status, quantity FROM event_attendees WHERE event_id = ? AND user_id = ?");
            $stmt_rsvp->execute([$event_id, $user_id]);
            $current_rsvp = $stmt_rsvp->fetch(PDO::FETCH_ASSOC);

            if ($current_rsvp) {
                $pdo->beginTransaction();

                $stmt_del = $pdo->prepare("DELETE FROM event_attendees WHERE event_id = ? AND user_id = ?");
                $stmt_del->execute([$event_id, $user_id]);

                if ($current_rsvp['status'] === 'going') {
                    $stmt_event = $pdo->prepare("SELECT total_tickets, ticket_price FROM events WHERE id = ?");
                    $stmt_event->execute([$event_id]);
                    $event = $stmt_event->fetch(PDO::FETCH_ASSOC);

                    if ($event && $event['total_tickets'] > 0 && $event['ticket_price'] <= 0) {
                        $spots_to_free = $current_rsvp['quantity'] > 0 ? (int)$current_rsvp['quantity'] : 1;
                        $stmt_ticket = $pdo->prepare("UPDATE events SET available_tickets = available_tickets + ? WHERE id = ?");
                        $stmt_ticket->execute([$spots_to_free, $event_id]);
                    }
                }

                $stmt_feedback = $pdo->prepare("DELETE FROM feedback WHERE event_id = ? AND user_id = ?");
                $stmt_feedback->execute([$event_id, $user_id]);

                $pdo->commit();
                echo json_encode(['success' => true, 'message' => 'You are no longer attending this event.', 'new_status' => null]);
            } else {
                echo json_encode(['success' => true, 'message' => 'You were not attending this event.']);
            }
            break;

        case 'submit_feedback':
            $rating = (int)($data['rating'] ?? 0);
            $comment = trim($data['comment'] ?? '');

            if ($rating < 1 || $rating > 5) {
                http_response_code(422);
                echo json_encode(['error' => 'Please provide a valid rating (1â€“5 stars).']);
                exit;
            }

            $stmt_check = $pdo->prepare("
                SELECT e.status
                FROM events e
                JOIN event_attendees ea ON e.id = ea.event_id
                WHERE e.id = ? AND ea.user_id = ? AND ea.status = 'going'
            ");
            $stmt_check->execute([$event_id, $user_id]);
            $event_status = $stmt_check->fetch(PDO::FETCH_COLUMN);

            if ($event_status === 'ongoing' || $event_status === 'completed') {
                $stmt_upsert = $pdo->prepare("
                    INSERT INTO feedback (event_id, user_id, rating, comment)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP
                ");
                $stmt_upsert->execute([$event_id, $user_id, $rating, $comment, $rating, $comment]);

                $stmt_refetch = $pdo->prepare("SELECT rating, comment FROM feedback WHERE event_id = ? AND user_id = ?");
                $stmt_refetch->execute([$event_id, $user_id]);
                $user_feedback = $stmt_refetch->fetch(PDO::FETCH_ASSOC);

                echo json_encode(['success' => true, 'message' => 'Thank you for your feedback!', 'user_feedback' => $user_feedback]);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'You can only leave feedback for events you attended that are ongoing or completed.']);
            }
            break;

        case 'delete_feedback':
            $stmt_del = $pdo->prepare("DELETE FROM feedback WHERE event_id = ? AND user_id = ?");
            $stmt_del->execute([$event_id, $user_id]);

            if ($stmt_del->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Feedback deleted.', 'user_feedback' => null]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Feedback not found.']);
            }
            break;

        // --- EVENT OWNER ACTIONS ---
        case 'publish':
        case 'cancel':
        case 'mark_ongoing':
        case 'mark_completed':
            $new_status = '';
            $allowed_current_status = [];

            switch ($action) {
                case 'publish':       $new_status = 'upcoming';  $allowed_current_status = ['draft']; break;
                case 'cancel':        $new_status = 'cancelled'; $allowed_current_status = ['upcoming', 'ongoing', 'draft']; break;
                case 'mark_ongoing':  $new_status = 'ongoing';   $allowed_current_status = ['upcoming']; break;
                case 'mark_completed':$new_status = 'completed'; $allowed_current_status = ['upcoming', 'ongoing']; break;
            }

            $placeholders = implode(',', array_fill(0, count($allowed_current_status), '?'));
            $stmt = $pdo->prepare("UPDATE events SET status = ? WHERE id = ? AND user_id = ? AND status IN ($placeholders)");
            $params = [$new_status, $event_id, $user_id, ...$allowed_current_status];
            $stmt->execute($params);

            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => "Event status updated to {$new_status}.", 'new_status' => $new_status]);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'Event not found, or action not permitted for its current status.']);
            }
            break;

        // --- TICKET ACTIONS ---
        case 'mark_ticket_used':
        case 'mark_ticket_active':
        case 'cancel_ticket':
            if ($ticket_id <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid Ticket ID.']);
                exit;
            }

            $stmt_owner = $pdo->prepare("
                SELECT e.id FROM events e
                JOIN tickets t ON e.id = t.event_id
                WHERE t.id = ? AND e.user_id = ?
            ");
            $stmt_owner->execute([$ticket_id, $user_id]);

            if (!$stmt_owner->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied. You do not own this event.']);
                exit;
            }

            $new_ticket_status = match ($action) {
                'mark_ticket_used'   => 'used',
                'mark_ticket_active' => 'active',
                'cancel_ticket'      => 'cancelled',
                default              => ''
            };

            $stmt_update = $pdo->prepare("UPDATE tickets SET status = ? WHERE id = ?");
            $stmt_update->execute([$new_ticket_status, $ticket_id]);

            echo json_encode(['success' => true, 'message' => "Ticket marked as {$new_ticket_status}."]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action specified.']);
            break;
    }

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    $code = ($e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
