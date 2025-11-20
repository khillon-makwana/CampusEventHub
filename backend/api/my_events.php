<?php
// backend/api/my_events.php
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
$events = [];
$event_stats = [
    'total' => 0,
    'upcoming' => 0,
    'ongoing' => 0,
    'completed' => 0,
    'draft' => 0,
    'cancelled' => 0
];
$user = null;

try {
    $pdo = Database::getConnection();

    // 2. GET USER DATA
    $userModel = new User();
    $user = $userModel->findById($user_id);

    // 3. GET EVENTS DATA (using correct table: attendee_category)
    $stmt = $pdo->prepare("
        SELECT e.*, 
               COALESCE(SUM(ea.quantity), 0) as attendee_count,
               COUNT(DISTINCT ec.category_id) as category_count,
               GROUP_CONCAT(ac.name SEPARATOR ', ') as category_names
        FROM events e 
        LEFT JOIN event_attendees ea ON e.id = ea.event_id AND ea.status = 'going'
        LEFT JOIN event_categories ec ON e.id = ec.event_id
        LEFT JOIN attendee_category ac ON ec.category_id = ac.id
        WHERE e.user_id = ? 
        GROUP BY e.id 
        ORDER BY 
            CASE 
                WHEN e.status = 'ongoing' THEN 1
                WHEN e.status = 'upcoming' THEN 2
                WHEN e.status = 'draft' THEN 3
                WHEN e.status = 'completed' THEN 4
                WHEN e.status = 'cancelled' THEN 5
                ELSE 6
            END,
            e.event_date ASC
    ");
    $stmt->execute([$user_id]);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. CALCULATE STATISTICS
    $event_stats['total'] = count($events);
    foreach ($events as $event) {
        if (isset($event_stats[$event['status']])) {
            $event_stats[$event['status']]++;
        }
    }

    // 5. SEND JSON RESPONSE
    Response::json([
        'success' => true,
        'user' => $user,
        'events' => $events,
        'stats' => $event_stats
    ]);

} catch (PDOException $e) {
    Response::error('Database error', 500, ['message' => $e->getMessage()]);
}
