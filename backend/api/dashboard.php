<?php
// backend/api/dashboard.php

// CORS must be first - before any output
require_once __DIR__ . '/cors.php';

require_once __DIR__ . '/../vendor/autoload.php';

use App\Models\User;
use App\Models\Event;

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $userModel = new User();
    $eventModel = new Event();
    
    $user = $userModel->findById((int)$_SESSION['user_id']);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Get user's upcoming events
    $userEvents = $eventModel->getUserUpcomingEvents((int)$_SESSION['user_id']);
    
    // Get recommended events
    $recommendedEvents = $eventModel->getRecommendedEvents((int)$_SESSION['user_id']);
    
    // Get event statistics
    $eventStats = $eventModel->getUserEventStats((int)$_SESSION['user_id']);

    $response = [
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'fullname' => $user['fullname'],
            'email' => $user['email'],
            'is_verified' => (int)$user['is_verified']
        ],
        'userEvents' => $userEvents,
        'recommendedEvents' => $recommendedEvents,
        'stats' => $eventStats
    ];

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
