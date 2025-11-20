<?php
// backend/api/profile.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;
use App\Helpers\Response;
use App\Helpers\Validator;

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    Response::error('Unauthorized. Please log in.', 401);
}

$user_id = (int)$_SESSION['user_id'];
$pdo = Database::getConnection();
$userModel = new User();

// 2. HANDLE 'GET' REQUEST (Fetch user data)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // findById() in your model already selects safe fields
        $user = $userModel->findById($user_id); 
        if (!$user) {
            Response::error('User not found.', 404);
        }
        Response::json(['success' => true, 'user' => $user]);

    } catch (PDOException $e) {
        Response::error('Database error', 500, $e->getMessage());
    }
}

// 3. HANDLE 'POST' REQUEST (Update Fullname)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $inputs = Validator::sanitize($data ?? []);
    $fullname = $inputs['fullname'] ?? '';

    if (empty($fullname)) {
        Response::error('Full name cannot be empty.', 422);
    }

    try {
        $stmt = $pdo->prepare("UPDATE users SET fullname = ? WHERE id = ?");
        $stmt->execute([$fullname, $user_id]);

        // Fetch the updated user data to send back
        $user = $userModel->findById($user_id);
        
        Response::json([
            'success' => true, 
            'message' => 'Profile updated successfully!',
            'user' => $user // Send back new user data
        ]);

    } catch (PDOException $e) {
        Response::error('Database error', 500, $e->getMessage());
    }
}

// Fallback for invalid request method
Response::error('Invalid request method.', 405);
