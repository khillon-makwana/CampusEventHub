<?php
// backend/api/auth/me.php
require_once '../cors.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\User;
use App\Helpers\Response;

// Start session
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    Response::json(['user' => null]);
}

try {
    $userModel = new User();
    $user = $userModel->findById((int)$_SESSION['user_id']);
    
    if (!$user) {
        Response::json(['user' => null]);
    }
    
    // Return user data (safe fields only)
    Response::json([
        'user' => [
            'id' => (int)$user['id'],
            'fullname' => $user['fullname'],
            'email' => $user['email'],
            'is_verified' => (int)$user['is_verified'],
            'created_at' => $user['created_at']
        ]
    ]);
} catch (Exception $e) {
    Response::error('Server error', 500, $e->getMessage());
}
