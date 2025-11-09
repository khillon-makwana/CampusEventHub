<?php
// backend/api/auth/reset_password.php
require_once '../cors.php';


require_once __DIR__ . '/../../vendor/autoload.php';
use App\Models\PasswordReset;
use App\Models\User;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // If user clicks link in email, you may redirect to frontend reset page
    $token = $_GET['token'] ?? '';
    if (!$token) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing token']);
        exit;
    }
    // redirect to frontend page (example)
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
    $dotenv->load();
    $frontend = str_replace('/backend', '', rtrim($_ENV['APP_URL'], '/'));
    header('Location: ' . $frontend . '/reset-password?token=' . urlencode($token));
    exit;
}

// POST - actually set new password
$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$newPassword = $data['password'] ?? '';

if (!$token || !$newPassword) {
    http_response_code(422);
    echo json_encode(['error' => 'token and password required']);
    exit;
}

$prModel = new PasswordReset();
$record = $prModel->findByToken($token);
if (!$record) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

if (strtotime($record['expires_at']) < time()) {
    $prModel->deleteById((int)$record['id']);
    http_response_code(400);
    echo json_encode(['error' => 'Token expired']);
    exit;
}

// find user by email
$userModel = new User();
$user = $userModel->findByEmail($record['email']);
if (!$user) {
    $prModel->deleteById((int)$record['id']);
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
$userModel->updatePassword((int)$user['id'], $passwordHash);
$prModel->deleteById((int)$record['id']);

echo json_encode(['success' => true, 'message' => 'Password updated']);

