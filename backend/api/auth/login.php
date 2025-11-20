<?php
// backend/api/auth/login.php
require_once '../cors.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\User;
use App\Helpers\Response;
use App\Helpers\Validator;

// Get and sanitize input
$data = json_decode(file_get_contents('php://input'), true);
$inputs = Validator::sanitize($data ?? []);

$email = $inputs['email'] ?? '';
$password = $data['password'] ?? ''; // Don't sanitize password

if (!$email || !$password) {
    Response::error('email and password required', 422);
}

$userModel = new User();
$user = $userModel->findByEmail($email);

if (!$user || !password_verify($password, $user['password'])) {
    Response::error('Invalid credentials', 401);
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

Response::json(['success' => true, 'user' => $safe]);

