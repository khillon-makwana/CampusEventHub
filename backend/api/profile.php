<?php
// backend/api/profile.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Please log in.']);
    exit;
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
            http_response_code(404);
            echo json_encode(['error' => 'User not found.']);
            exit;
        }
        echo json_encode(['success' => true, 'user' => $user]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    }
    exit;
}

// 3. HANDLE 'POST' REQUEST (Update Fullname)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $fullname = trim($data['fullname'] ?? '');

    if (empty($fullname)) {
        http_response_code(422);
        echo json_encode(['error' => 'Full name cannot be empty.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE users SET fullname = ? WHERE id = ?");
        $stmt->execute([$fullname, $user_id]);

        // Fetch the updated user data to send back
        $user = $userModel->findById($user_id);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Profile updated successfully!',
            'user' => $user // Send back new user data
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    }
    exit;
}

// Fallback for invalid request method
http_response_code(405); // Method Not Allowed
echo json_encode(['error' => 'Invalid request method.']);
