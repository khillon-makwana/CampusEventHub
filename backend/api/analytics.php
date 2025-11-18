<?php
// backend/api/analytics.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;
use App\Services\Mailer;
use App\Services\NotificationManager;

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];
$event_id_filter = $_GET['event_id'] ?? 'all'; // 'all' or a specific ID

try {
    $pdo = Database::getConnection();

    // 1. Get User and Notification Count (for Layout)
    $userModel = new User();
    $user = $userModel->findById($user_id);
    $notificationManager = new NotificationManager(new Mailer());
    $unread_count = $notificationManager->getUnreadCount($user_id);

    // 2. Get Events for Dropdown
    $stmt_events = $pdo->prepare("SELECT id, title, event_date, status FROM events WHERE user_id = ? ORDER BY created_at DESC");
    $stmt_events->execute([$user_id]);
    $events_list = $stmt_events->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Build SQL conditions based on filter
    $event_condition = "e.user_id = ?";
    $params = [$user_id];
    
    if ($event_id_filter !== 'all') {
        $event_id = (int)$event_id_filter;
        // Security check: ensure user owns this event
        $stmt_check = $pdo->prepare("SELECT id FROM events WHERE id = ? AND user_id = ?");
        $stmt_check->execute([$event_id, $user_id]);
        if ($stmt_check->fetch() === false) {
            http_response_code(403);
            echo json_encode(['error' => 'You do not have permission to view this event.']);
            exit;
        }
        // User owns it, so update the queries
        $event_condition = "e.id = ?";
        $params = [$event_id];
    }
    
    // 4. Run All Metrics Queries
    $metrics = [];
    
    // Total Tickets Sold
    $sql = "SELECT IFNULL(SUM(ea.quantity), 0) FROM event_attendees ea JOIN events e ON ea.event_id = e.id WHERE $event_condition AND ea.status='going'";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    $metrics['totalTicketsSold'] = (int)$stmt->fetchColumn();

    // Total Revenue
    $sql = "SELECT IFNULL(SUM(p.amount), 0) FROM payments p JOIN events e ON p.event_id = e.id WHERE $event_condition AND p.status='completed'";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    $metrics['totalRevenue'] = (float)$stmt->fetchColumn();

    // Average Rating
    $sql = "SELECT IFNULL(ROUND(AVG(f.rating), 1), 0) FROM feedback f JOIN events e ON f.event_id = e.id WHERE $event_condition";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    $metrics['averageRating'] = (float)$stmt->fetchColumn();

    // Total Attendees (Unique)
    $sql = "SELECT COUNT(DISTINCT ea.user_id) FROM event_attendees ea JOIN events e ON ea.event_id = e.id WHERE $event_condition";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    $metrics['totalAttendees'] = (int)$stmt->fetchColumn();

    // These metrics are only relevant for "All Events"
    if ($event_id_filter === 'all') {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM events WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $metrics['totalEvents'] = (int)$stmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM feedback f JOIN events e ON f.event_id = e.id WHERE e.user_id = ?");
        $stmt->execute([$user_id]);
        $metrics['totalFeedback'] = (int)$stmt->fetchColumn();
    }
    
    // 5. Get Chart/Table Data
    $charts = [];
    $tables = [];

    // RSVP Breakdown
    $sql = "SELECT ea.status, COUNT(*) AS total FROM event_attendees ea JOIN events e ON ea.event_id = e.id WHERE $event_condition GROUP BY ea.status";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    $charts['rsvpStatus'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Rating Distribution
    $sql = "SELECT f.rating, COUNT(*) AS total FROM feedback f JOIN events e ON f.event_id = e.id WHERE $event_condition GROUP BY f.rating ORDER BY f.rating ASC";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    $charts['ratingDist'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Revenue Over Time
    $sql = "SELECT DATE(p.created_at) AS date, SUM(p.amount) AS total FROM payments p JOIN events e ON p.event_id = e.id WHERE $event_condition AND p.status='completed' AND p.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(p.created_at) ORDER BY date ASC";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    $charts['revenueOverTime'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Tickets Sold Over Time
    $sql = "SELECT DATE(ea.registered_at) AS date, SUM(ea.quantity) AS total FROM event_attendees ea JOIN events e ON ea.event_id = e.id WHERE $event_condition AND ea.status='going' AND ea.registered_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(ea.registered_at) ORDER BY date ASC";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    $charts['ticketsSoldOverTime'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Recent Feedback
    $sql = "SELECT e.title, f.rating, f.comment, f.created_at, u.fullname FROM feedback f JOIN events e ON f.event_id = e.id JOIN users u ON f.user_id = u.id WHERE $event_condition ORDER BY f.created_at DESC LIMIT 5";
    $stmt = $pdo->prepare($sql); $stmt->execute($params);
    $tables['recentFeedback'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // "All Events" specific charts
    if ($event_id_filter === 'all') {
        $stmt = $pdo->prepare("SELECT status, COUNT(*) AS total FROM events WHERE user_id = ? GROUP BY status");
        $stmt->execute([$user_id]);
        $charts['eventStatus'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("SELECT e.title, IFNULL(SUM(p.amount), 0) AS revenue FROM events e LEFT JOIN payments p ON e.id = p.event_id AND p.status='completed' WHERE e.user_id = ? GROUP BY e.id ORDER BY revenue DESC LIMIT 5");
        $stmt->execute([$user_id]);
        $charts['topEventsRevenue'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // 6. Send Combined Response
    echo json_encode([
        'success' => true,
        'user' => $user,
        'unread_count' => $unread_count,
        'eventsList' => $events_list, // For the dropdown
        'metrics' => $metrics,
        'charts' => $charts,
        'tables' => $tables
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage(), 'trace' => $e->getTraceAsString()]);
}