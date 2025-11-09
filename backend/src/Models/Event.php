<?php
namespace App\Models;

use App\Config\Database;
use PDO;

class Event {
    private $db;
    
    public function __construct(){
        $this->db = Database::getConnection();
    }

    public function getUserUpcomingEvents(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT e.*, u.fullname as organizer_name,
                   COUNT(ea.id) as attendee_count
            FROM events e 
            LEFT JOIN users u ON e.user_id = u.id 
            LEFT JOIN event_attendees ea ON e.id = ea.event_id 
            WHERE e.user_id = ? AND e.event_date >= CURDATE()
            GROUP BY e.id 
            ORDER BY e.event_date ASC 
            LIMIT 6
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRecommendedEvents(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT e.*, u.fullname as organizer_name,
                   COUNT(ea.id) as attendee_count
            FROM events e 
            LEFT JOIN users u ON e.user_id = u.id 
            LEFT JOIN event_attendees ea ON e.id = ea.event_id 
            WHERE e.user_id != ? AND e.event_date >= CURDATE()
            GROUP BY e.id 
            ORDER BY e.event_date ASC 
            LIMIT 6
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getUserEventStats(int $userId): array {
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) as total_events,
                SUM(CASE WHEN event_date >= CURDATE() THEN 1 ELSE 0 END) as upcoming_events,
                SUM(CASE WHEN event_date < CURDATE() THEN 1 ELSE 0 END) as past_events
            FROM events 
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): array|false {
        $stmt = $this->db->prepare("
            SELECT e.*, u.fullname as organizer_name,
                   COUNT(ea.id) as attendee_count
            FROM events e 
            LEFT JOIN users u ON e.user_id = u.id 
            LEFT JOIN event_attendees ea ON e.id = ea.event_id 
            WHERE e.id = ?
            GROUP BY e.id
        ");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
