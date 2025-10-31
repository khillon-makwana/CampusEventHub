<?php
// backend/api/auth/verify_email.php
require_once __DIR__ . '/../../vendor/autoload.php';
require_once '../cors.php';

use App\Models\EmailVerification;
use App\Models\User;

$code = $_GET['code'] ?? '';

if (!$code) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing code']);
    exit;
}

$evModel = new EmailVerification();
$record = $evModel->findByCode($code);
if (!$record) {
    // Redirect with failure param
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
    $dotenv->load();
    $frontend = str_replace('/backend', '', rtrim($_ENV['APP_URL'], '/'));
    header('Location: ' . $frontend . '/verify-email?success=0');
    exit;
}

// Verify user and delete code
$userModel = new User();
$userModel->verify((int)$record['user_id']);
$evModel->deleteById((int)$record['id']);

// Redirect to React with success flag
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();
$frontend = str_replace('/backend', '', rtrim($_ENV['APP_URL'], '/'));
header('Location: ' . $frontend . '/verify-email?success=1');
exit;
