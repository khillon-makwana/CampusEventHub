<?php
// backend/api/notifications.php
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
$page = (int)($_GET['page'] ?? 1);
$limit = 15;
$offset = ($page - 1) * $limit;

try {
    $pdo = Database::getConnection();
    
    // Mark notifications as read when page is loaded (only on first page)
    if ($page == 1) {
        $stmt_read = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
        $stmt_read->execute([$user_id]);
    }

    // Get User
    $userModel = new User();
    $user = $userModel->findById($user_id);
    
    // Get total count
    $stmt_total = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ?");
    $stmt_total->execute([$user_id]);
    $total_notifications = (int)$stmt_total->fetchColumn();
    $total_pages = (int)ceil($total_notifications / $limit);
    
    // Get notifications
    $stmt = $pdo->prepare("
        SELECT n.*, e.title as event_title, e.id as event_id, e.event_date
        FROM notifications n 
        LEFT JOIN events e ON n.event_id = e.id 
        WHERE n.user_id = ? 
        ORDER BY n.created_at DESC 
        LIMIT ? OFFSET ?
    ");
    $stmt->bindValue(1, $user_id, PDO::PARAM_INT);
    $stmt->bindValue(2, $limit, PDO::PARAM_INT);
    $stmt->bindValue(3, $offset, PDO::PARAM_INT);
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get new unread count (will be 0 if page 1)
    $notificationManager = new NotificationManager(new Mailer());
    $unread_count = $notificationManager->getUnreadCount($user_id);

    echo json_encode([
        'success' => true,
        'user' => $user,
        'notifications' => $notifications,
        'pagination' => [
            'page' => $page,
            'total_pages' => $total_pages,
            'total_notifications' => $total_notifications
        ],
        'unread_count' => $unread_count
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error loading notifications: ' . $e->getMessage()]);
}