<?php
// backend/api/nav.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;
use App\Services\Mailer;
use App\Services\NotificationManager;

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    // Send a "guest" state, success is false
    echo json_encode(['success' => false, 'user' => null, 'unreadCount' => 0]);
    exit;
}

$user_id = (int)$_SESSION['user_id'];

try {
    $pdo = Database::getConnection();

    // 1. Get User
    $userModel = new User();
    $user = $userModel->findById($user_id);

    // 2. Get REAL Unread Count
    $notificationManager = new NotificationManager(new Mailer());
    $unread_count = $notificationManager->getUnreadCount($user_id);

    // 3. Send Response
    echo json_encode([
        'success' => true,
        'user' => $user,
        'unreadCount' => $unread_count // Use camelCase for JavaScript
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}