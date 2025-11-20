<?php
// backend/api/notifications_actions.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;

session_start();

if (!isset($_SESSION['user_id'])) {
    Response::error('Unauthorized', 401);
}

$user_id = (int)$_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);
$inputs = Validator::sanitize($data ?? []);
$action = $inputs['action'] ?? '';

try {
    $pdo = Database::getConnection();
    $message = '';
    
    switch ($action) {
        case 'mark_all_read':
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $message = 'All notifications marked as read';
            break;
        case 'clear_all':
            $stmt = $pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $message = 'All notifications cleared';
            break;
        default:
            Response::error('Invalid action', 400);
    }
    
    Response::json(['success' => true, 'message' => $message]);

} catch (PDOException $e) {
    Response::error('Error performing action: ' . $e->getMessage(), 500);
}
?>