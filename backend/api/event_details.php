<?php
// backend/api/event_details.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;

session_start();

// 1. GET EVENT ID
$event_id = (int)($_GET['id'] ?? 0);
if ($event_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid event ID.']);
    exit;
}

// 2. INITIALIZE VARIABLES
$user_id = (int)($_SESSION['user_id'] ?? 0);
$event = null;
$is_owner = false;
$attendance_status = null;
$user_feedback = null;
$all_feedback = [];
$similar_events = [];
$user = null;

try {
    $pdo = Database::getConnection();

    // 3. GET LOGGED-IN USER (for layout)
    if ($user_id > 0) {
        $userModel = new User();
        $user = $userModel->findById($user_id);
    }

    // 4. GET MAIN EVENT DATA
    $stmt = $pdo->prepare("
        SELECT e.*, u.fullname as organizer_name,
            COALESCE(SUM(ea.quantity), 0) as attendee_count,
            GROUP_CONCAT(DISTINCT ac.name SEPARATOR ', ') as category_names
        FROM events e 
        LEFT JOIN users u ON e.user_id = u.id 
        LEFT JOIN event_attendees ea ON e.id = ea.event_id AND ea.status = 'going'
        LEFT JOIN event_categories ec ON e.id = ec.event_id
        LEFT JOIN attendee_category ac ON ec.category_id = ac.id
        WHERE e.id = ? AND e.status IN ('upcoming', 'ongoing', 'completed')
        GROUP BY e.id
    ");
    $stmt->execute([$event_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        http_response_code(404);
        echo json_encode(['error' => 'Event not found or not available']);
        exit;
    }

    // 5. GET USER-SPECIFIC DATA (if logged in)
    if ($user_id > 0) {
        // Check if owner
        $is_owner = ($event['user_id'] == $user_id);

        // Check attendance status
        $stmt_attend = $pdo->prepare("SELECT status FROM event_attendees WHERE event_id = ? AND user_id = ?");
        $stmt_attend->execute([$event_id, $user_id]);
        $attendance = $stmt_attend->fetch(PDO::FETCH_ASSOC);
        if ($attendance) {
            $attendance_status = $attendance['status'];
        }

        // Check for existing feedback
        $stmt_feedback = $pdo->prepare("SELECT rating, comment FROM feedback WHERE event_id = ? AND user_id = ?");
        $stmt_feedback->execute([$event_id, $user_id]);
        $user_feedback = $stmt_feedback->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    // 6. GET ALL FEEDBACK FOR THE EVENT
    $stmt_all_feedback = $pdo->prepare("
        SELECT f.*, u.fullname 
        FROM feedback f 
        JOIN users u ON f.user_id = u.id 
        WHERE f.event_id = ? 
        ORDER BY f.created_at DESC 
        LIMIT 10
    ");
    $stmt_all_feedback->execute([$event_id]);
    $all_feedback = $stmt_all_feedback->fetchAll(PDO::FETCH_ASSOC);

    // 7. GET SIMILAR EVENTS
    $stmt_similar = $pdo->prepare("
        SELECT e.id, e.title, e.location, e.event_date, e.image, e.status
        FROM events e 
        JOIN event_categories ec ON e.id = ec.event_id 
        WHERE ec.category_id IN (
            SELECT category_id FROM event_categories WHERE event_id = ?
        ) 
        AND e.id != ? 
        AND e.status IN ('upcoming', 'ongoing')
        GROUP BY e.id 
        ORDER BY e.event_date ASC 
        LIMIT 3
    ");
    $stmt_similar->execute([$event_id, $event_id]);
    $similar_events = $stmt_similar->fetchAll(PDO::FETCH_ASSOC);

    // 8. SEND COMBINED JSON RESPONSE
    echo json_encode([
        'success' => true,
        'user' => $user,
        'event' => $event,
        'is_owner' => $is_owner,
        'attendance_status' => $attendance_status,
        'user_feedback' => $user_feedback,
        'all_feedback' => $all_feedback,
        'similar_events' => $similar_events
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
