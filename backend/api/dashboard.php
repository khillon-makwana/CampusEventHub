<?php
// backend/api/dashboard.php

// CORS must be first - before any output
require_once __DIR__ . '/cors.php';

require_once __DIR__ . '/../vendor/autoload.php';

use App\Models\User;
use App\Models\Event;
use App\Helpers\Response;
use App\Helpers\Validator;

session_start();

if (!isset($_SESSION['user_id'])) {
    Response::error('Unauthorized', 401);
}

try {
    $userModel = new User();
    $eventModel = new Event();
    
    $user = $userModel->findById((int)$_SESSION['user_id']);
    
    if (!$user) {
        Response::error('User not found', 404);
    }

    // Get user's upcoming events
    $userEvents = $eventModel->getUserUpcomingEvents((int)$_SESSION['user_id']);
    
    // Get recommended events
    $recommendedEvents = $eventModel->getRecommendedEvents((int)$_SESSION['user_id']);
    
    // Get event statistics
    $eventStats = $eventModel->getUserEventStats((int)$_SESSION['user_id']);

    Response::json([
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
    ]);

} catch (Exception $e) {
    Response::error('Server error: ' . $e->getMessage(), 500);
}
