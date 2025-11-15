<?php
// backend/src/Services/NotificationManager.php

namespace App\Services;

use App\Config\Database;
use App\Services\Mailer;
use PDO;
use PDOException;
use Exception;

class NotificationManager {
    private $pdo;
    private $mailer;
    private $env;

    // Use dependency injection for Mailer
    public function __construct(Mailer $mailer) {
        $this->pdo = Database::getConnection();
        $this->mailer = $mailer;
        $this->env = $_ENV; // Load .env values
    }
    
    /**
     * Create a notification for a user
     */
    public function createNotification($user_id, $event_id, $title, $message, $type = 'new_event') {
        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO notifications (user_id, event_id, title, message, type, notification_type) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$user_id, $event_id, $title, $message, $type, $type]);
            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            error_log("Error creating notification: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * NEW: Notify relevant users about a new event based on their category interests
     */
    public function notifyNewEventByCategory($event_id) {
        try {
            // 1. Get event details and its categories
            $stmt_event = $this->pdo->prepare("
                SELECT e.title, GROUP_CONCAT(ec.category_id) as category_ids
                FROM events e 
                LEFT JOIN event_categories ec ON e.id = ec.event_id 
                WHERE e.id = ? 
                GROUP BY e.id
            ");
            $stmt_event->execute([$event_id]);
            $event = $stmt_event->fetch(PDO::FETCH_ASSOC);
            
            if (!$event || empty($event['category_ids'])) return false;
            
            $categoryIds = $event['category_ids'];

            // 2. Find users who have RSVP'd to events in these categories
            //    AND want to receive new event emails.
            $sql = "
                SELECT DISTINCT 
                    u.id, u.email, u.fullname 
                FROM users u
                JOIN user_notification_preferences unp ON u.id = unp.user_id
                JOIN event_attendees ea ON u.id = ea.user_id
                JOIN event_categories ec ON ea.event_id = ec.event_id
                WHERE ec.category_id IN ($categoryIds)
                AND unp.email_new_events = 1
                AND u.is_verified = 1
            ";
            
            $stmt_users = $this->pdo->prepare($sql);
            $stmt_users->execute();
            $users = $stmt_users->fetchAll(PDO::FETCH_ASSOC);
            
            $count = 0;
            foreach ($users as $user) {
                // 3. Create notification and send email
                $title = "New Event: {$event['title']}";
                $message = "A new event '{$event['title']}' has been posted in a category you follow.";
                
                $this->createNotification($user['id'], $event_id, $title, $message, 'new_event');
                $this->sendNewEventEmail($user, $event);
                $count++;
            }
            
            return $count;
            
        } catch (Exception $e) {
            error_log("Error in notifyNewEventByCategory: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Send RSVP confirmation
     */
    public function sendRSVPConfirmation($user_id, $event_id, $status = 'going') {
        try {
            // Get user and event details
            $stmt = $this->pdo->prepare("
                SELECT u.fullname, u.email, e.id, e.title, e.event_date, e.location 
                FROM users u 
                JOIN events e ON e.id = ? 
                WHERE u.id = ?
            ");
            $stmt->execute([$event_id, $user_id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$data) return false;
            
            // Check if user wants RSVP confirmations
            $stmt_prefs = $this->pdo->prepare("SELECT email_rsvp_confirmation FROM user_notification_preferences WHERE user_id = ?");
            $stmt_prefs->execute([$user_id]);
            $wants_email = $stmt_prefs->fetchColumn() ?? 1; // Default to true
            
            // Create in-app notification
            $title = "RSVP Confirmation";
            $message = "You have successfully RSVP'd as '{$status}' for '{$data['title']}'";
            $this->createNotification($user_id, $event_id, $title, $message, 'rsvp_confirmation');
            
            // Send email if enabled
            if ($wants_email) {
                $this->sendRSVPEmail($data, $status);
            }
            return true;
            
        } catch (Exception $e) {
            error_log("Error in sendRSVPConfirmation: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get unread notification count for a user
     */
    public function getUnreadCount($user_id) {
        try {
            $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
            $stmt->execute([$user_id]);
            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Error getting unread count: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Email sending methods
     */
    private function sendNewEventEmail($user, $event) {
        $site_url = $this->env['APP_URL'] ?? 'http://localhost/CampusEventHub';
        $subject = "New Event: {$event['title']} - EventHub";
        $body = "
            <h2>New Event Alert!</h2>
            <p>Hello {$user['fullname']},</p>
            <p>A new event has been posted that might interest you:</p>
            <div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                <h3>{$event['title']}</h3>
            </div>
            <p>
                <a href='{$site_url}/event/{$event['id']}' 
                   style='background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                    View Event Details
                </a>
            </p>
        ";
        
        try {
            $this->mailer->send($user['email'], $user['fullname'], $subject, $body);
        } catch (Exception $e) {
            error_log("Mailer error in sendNewEventEmail: " . $e->getMessage());
        }
    }
    
    private function sendRSVPEmail($data, $status) {
        $site_url = $this->env['APP_URL'] ?? 'http://localhost/CampusEventHub';
        $subject = "RSVP Confirmation - {$data['title']}";
        $body = "
            <h2>RSVP Confirmation</h2>
            <p>Hello {$data['fullname']},</p>
            <p>Your RSVP has been confirmed with status: <strong>{$status}</strong></p>
            <div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                <h3>{$data['title']}</h3>
                <p><strong>Date & Time:</strong> " . date('F j, Y g:i A', strtotime($data['event_date'])) . "</p>
                <p><strong>Location:</strong> {$data['location']}</p>
            </div>
            <p>
                <a href='{$site_url}/event/{$data['id']}' 
                   style='background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;'>
                    View Event Details
                </a>
            </p>
        ";
        
        try {
            $this->mailer->send($data['email'], $data['fullname'], $subject, $body);
        } catch (Exception $e) {
            error_log("Mailer error in sendRSVPEmail: " . $e->getMessage());
        }
    }
}