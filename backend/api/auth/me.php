<?php
// backend/api/auth/me.php
require_once '../cors.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\User;

// Start session
session_start();

// Set JSON header immediately
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['user' => null]);
    exit;
}

try {
    $userModel = new User();
    $user = $userModel->findById((int)$_SESSION['user_id']);
    
    if (!$user) {
        echo json_encode(['user' => null]);
        exit;
    }
    
    // Return user data (safe fields only)
    echo json_encode([
        'user' => [
            'id' => (int)$user['id'],
            'fullname' => $user['fullname'],
            'email' => $user['email'],
            'is_verified' => (int)$user['is_verified'],
            'created_at' => $user['created_at']
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
