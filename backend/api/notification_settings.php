<?php
// backend/api/notification_settings.php
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
    Response::error('Unauthorized', 401);
}

$user_id = (int)$_SESSION['user_id'];
$pdo = Database::getConnection();

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $userModel = new User();
        $user = $userModel->findById($user_id);
        
        $stmt = $pdo->prepare("SELECT * FROM user_notification_preferences WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $preferences = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$preferences) {
            $preferences = [
                'email_new_events' => 1,
                'email_event_reminders' => 1,
                'email_rsvp_confirmation' => 1,
                'email_event_updates' => 1
            ];
        }
        
        // Also get unread count for layout
        $notificationManager = new NotificationManager(new Mailer());
        $unread_count = $notificationManager->getUnreadCount($user_id);
        
        Response::json([
            'success' => true, 
            'user' => $user, 
            'preferences' => $preferences, 
            'unread_count' => $unread_count
        ]);

    } catch (PDOException $e) {
        Response::error('Error loading preferences: ' . $e->getMessage(), 500);
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $inputs = Validator::sanitize($data ?? []);
    
    $new_preferences = [
        'email_new_events' => isset($inputs['email_new_events']) ? (int)$inputs['email_new_events'] : 0,
        'email_event_reminders' => isset($inputs['email_event_reminders']) ? (int)$inputs['email_event_reminders'] : 0,
        'email_rsvp_confirmation' => isset($inputs['email_rsvp_confirmation']) ? (int)$inputs['email_rsvp_confirmation'] : 0,
        'email_event_updates' => isset($inputs['email_event_updates']) ? (int)$inputs['email_event_updates'] : 0
    ];

    try {
        $stmt = $pdo->prepare("
            INSERT INTO user_notification_preferences 
            (user_id, email_new_events, email_event_reminders, email_rsvp_confirmation, email_event_updates) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            email_new_events = VALUES(email_new_events),
            email_event_reminders = VALUES(email_event_reminders),
            email_rsvp_confirmation = VALUES(email_rsvp_confirmation),
            email_event_updates = VALUES(email_event_updates),
            updated_at = CURRENT_TIMESTAMP
        ");
        
        $stmt->execute([
            $user_id,
            $new_preferences['email_new_events'],
            $new_preferences['email_event_reminders'],
            $new_preferences['email_rsvp_confirmation'],
            $new_preferences['email_event_updates']
        ]);
        
        Response::json(['success' => true, 'message' => 'Preferences updated!', 'preferences' => $new_preferences]);
        
    } catch (PDOException $e) {
        Response::error('Error updating preferences: ' . $e->getMessage(), 500);
    }
}

// Fallback for invalid request method
Response::error('Invalid request method.', 405);
?>