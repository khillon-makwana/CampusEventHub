<?php
// backend/api/auth/login.php
require_once '../cors.php';


require_once __DIR__ . '/../../vendor/autoload.php';
use App\Models\User;

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
    http_response_code(422);
    echo json_encode(['error' => 'email and password required']);
    exit;
}

$userModel = new User();
$user = $userModel->findByEmail($email);
if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

session_start();
$_SESSION['user_id'] = (int)$user['id'];

// return safe user info
$safe = [
    'id' => (int)$user['id'],
    'fullname' => $user['fullname'],
    'email' => $user['email'],
    'is_verified' => (int)$user['is_verified']
];

echo json_encode(['success' => true, 'user' => $safe]);

