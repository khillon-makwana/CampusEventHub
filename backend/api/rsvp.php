<?php

header('Content-Type: application/json');
require_once __DIR__ . '/../vendor/autoload.php';
use App\Config\Database;

$db = Database::getConnection();

// Handle GET (list RSVPs for an event)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (empty($_GET['event_id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing event_id"]);
        exit;
    }

    $stmt = $db->prepare("SELECT * FROM rsvps WHERE event_id = ? ORDER BY created_at DESC");
    $stmt->execute([$_GET['event_id']]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// Handle POST (create RSVP)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data['event_id']) || empty($data['full_name']) || empty($data['email'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing fields"]);
        exit;
    }

    $stmt = $db->prepare("INSERT INTO rsvps (event_id, full_name, email) VALUES (?, ?, ?)");
    $ok = $stmt->execute([$data['event_id'], $data['full_name'], $data['email']]);

    if ($ok) {
        echo json_encode(["message" => "RSVP successful"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to save RSVP"]);
    }
}
