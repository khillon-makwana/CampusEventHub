<?php
// backend/api/manage_rsvps.php
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
$event_id = (int)($_GET['event_id'] ?? 0);

if ($event_id <= 0) {
    Response::error('Invalid Event ID.', 400);
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
        Response::error("You're not authorized to manage this event.", 403);
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
    Response::json([
        'success' => true,
        'user' => $user,
        'event' => $event,
        'attendees' => $attendees,
        'all_categories' => $all_categories,
        'summary' => $summary
    ]);

} catch (PDOException $e) {
    Response::error('Database error', 500, $e->getMessage());
}
