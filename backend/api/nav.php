<?php
// backend/api/nav.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;
use App\Services\Mailer;
use App\Services\NotificationManager;
use App\Helpers\Response;
use App\Helpers\Validator;

session_start();

if (!isset($_SESSION['user_id'])) {
    // Send a "guest" state, success is false
    Response::json(['success' => false, 'user' => null, 'unreadCount' => 0], 401);
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
    Response::json([
        'success' => true,
        'user' => $user,
        'unreadCount' => $unread_count // Use camelCase for JavaScript
    ]);

} catch (Exception $e) {
    Response::error('Server error: ' . $e->getMessage(), 500);
}