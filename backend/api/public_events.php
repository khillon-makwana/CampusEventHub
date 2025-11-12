<?php
// backend/api/public_events.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

try {
    $pdo = Database::getConnection();

    // Fetch the next 6 upcoming events
    $stmt = $pdo->prepare("
        SELECT e.id, e.title, e.location, e.event_date, e.image,
               u.fullname as organizer_name
        FROM events e 
        LEFT JOIN users u ON e.user_id = u.id 
        WHERE e.status IN ('upcoming', 'ongoing')
        GROUP BY e.id 
        ORDER BY e.event_date ASC
        LIMIT 6
    ");
    $stmt->execute();
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'events' => $events]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}