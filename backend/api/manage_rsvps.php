<?php
// backend/api/manage_rsvps.php
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
$event_id = (int)($_GET['event_id'] ?? 0);

if ($event_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid Event ID.']);
    exit;
}

try {
    $pdo = Database::getConnection();

    // 2. GET USER (for layout)
    $userModel = new User();
    $user = $userModel->findById($user_id);

    // 3. SECURITY CHECK: Verify user owns this event
    $stmt = $pdo->prepare("SELECT id, title FROM events WHERE id = ? AND user_id = ?");
    $stmt->execute([$event_id, $user_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        http_response_code(403);
        echo json_encode(['error' => "You're not authorized to manage this event."]);
        exit;
    }

    // 4. FETCH ATTENDEES (using correct table name: attendee_category)
    $stmt_attendees = $pdo->prepare("
        SELECT ea.id, u.fullname, u.email, ea.status, ea.quantity, ea.registered_at, ea.category_id
        FROM event_attendees ea
        JOIN users u ON ea.user_id = u.id
        WHERE ea.event_id = ?
        ORDER BY ea.registered_at DESC
    ");
    $stmt_attendees->execute([$event_id]);
    $attendees = $stmt_attendees->fetchAll(PDO::FETCH_ASSOC);

    // 5. FETCH ALL AVAILABLE CATEGORIES (for the Edit modal)
    $catStmt = $pdo->query("SELECT id, name FROM attendee_category ORDER BY name ASC");
    $all_categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. CALCULATE SUMMARY
    $summary = [
        'total' => 0,     // Total users who RSVP'd
        'going' => 0,     // Total tickets/spots taken
        'interested' => 0,
        'not_going' => 0,
    ];

    foreach ($attendees as $a) {
        $summary['total']++;
        $status = strtolower($a['status']);
        $quantity = (int)($a['quantity'] ?? 1); 
        
        if ($status === 'going') {
            $summary['going'] += $quantity; // Sum quantities for 'going'
        } elseif ($status === 'interested') {
            $summary['interested']++;
        } elseif ($status === 'not going' || $status === 'not_going') {
            $summary['not_going']++;
        }
    }

    // 7. SEND RESPONSE
    echo json_encode([
        'success' => true,
        'user' => $user,
        'event' => $event,
        'attendees' => $attendees,
        'all_categories' => $all_categories,
        'summary' => $summary
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
