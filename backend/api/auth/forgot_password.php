<?php
// backend/api/auth/forgot_password.php
require_once '../cors.php';


require_once __DIR__ . '/../../vendor/autoload.php';
use App\Models\User;
use App\Models\PasswordReset;
use App\Services\Mailer;

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['error' => 'Valid email required']);
    exit;
}

$userModel = new User();
$user = $userModel->findByEmail($email);
if (!$user) {
    // don't reveal if email exists: respond with success
    echo json_encode(['success' => true, 'message' => 'If that email exists you will receive reset instructions']);
    exit;
}

$token = bin2hex(random_bytes(24));
$expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiry

$prModel = new PasswordReset();
$prModel->create($email, $token, $expiresAt);

// send email
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();
$baseUrl = rtrim($_ENV['APP_URL'], '/');
$frontend = "http://localhost:5173"; // your React dev server
$resetLink = $frontend . "/reset-password?token=" . urlencode($token);


$mailer = new Mailer();
$subject = "Reset your EventHub password";
$body = "<p>Hi,</p><p>Click the link below to reset your password (valid 1 hour):</p>"
      . "<p><a href=\"$resetLink\">Reset password</a></p>"
      . "<p>If the link doesn't work copy-paste this: $resetLink</p>";

$mailer->send($email, $user['fullname'], $subject, $body);

echo json_encode(['success' => true, 'message' => 'If that email exists you will receive reset instructions']);

