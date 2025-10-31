<?php
// backend/api/auth/register.php
require_once '../cors.php';


require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\User;
use App\Models\EmailVerification;
use App\Services\Mailer;

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$fullname = trim($data['fullname'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$fullname || !$email || !$password) {
    http_response_code(422);
    echo json_encode(['error' => 'fullname, email and password are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

$userModel = new User();
$exists = $userModel->findByEmail($email);
if ($exists) {
    http_response_code(409);
    echo json_encode(['error' => 'Email already registered']);
    exit;
}

// create user
$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$userId = $userModel->create($fullname, $email, $passwordHash);

if (!$userId) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not create user']);
    exit;
}

// create verification code
$code = random_int(100000, 999999); // 6-digit numeric code
$evModel = new EmailVerification();
$evModel->create($userId, $code);

// send verification email
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();
//$baseUrl = rtrim($_ENV['APP_URL'], '/');

$userModel->verify((int)$userId);      // Mark user as verified
$evModel->deleteById((int)$code);      // Optional: remove verification code if you want

// In register.php
$frontend = "http://localhost:5173"; // Vite dev server
$verifyLink = $frontend . '/verify-email?success=1';


$mailer = new Mailer();
$subject = "Verify your EventHub account";
$body = "<p>Hi " . htmlspecialchars($fullname) . ",</p>"
      . "<p>Thanks for registering. Click the link below to verify your email:</p>"
      . "<p><a href=\"$verifyLink\">Verify my email</a></p>"
      . "<p>If the link doesn't work, copy-paste this URL into your browser:<br/>$verifyLink</p>";

try {
    $sent = $mailer->send($email, $fullname, $subject, $body);
    echo json_encode([
        'success' => true,
        'message' => 'Registered successfully. Check your email for verification.',
        'email_sent' => $sent
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => true,
        'message' => 'Registered successfully, but email failed to send.',
        'email_sent' => false,
        'mail_error' => $e->getMessage()
    ]);
}

