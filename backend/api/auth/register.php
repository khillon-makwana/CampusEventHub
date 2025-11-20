<?php
// backend/api/auth/register.php
require_once '../cors.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\User;
use App\Models\EmailVerification;
use App\Services\Mailer;
use App\Helpers\Response;
use App\Helpers\Validator;
use Dotenv\Dotenv;

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    Response::error('Invalid JSON', 400);
}

// Sanitize and Validate
$inputs = Validator::sanitize($data);
$errors = Validator::validate($inputs, [
    'fullname' => 'required',
    'email' => 'required',
    'password' => 'required'
]);

if (!empty($errors)) {
    Response::error('Validation failed', 422, $errors);
}

$fullname = $inputs['fullname'];
$email = $inputs['email'];
$password = $data['password']; // Original password for hashing

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    Response::error('Invalid email', 422);
}

$userModel = new User();
$exists = $userModel->findByEmail($email);
if ($exists) {
    Response::error('Email already registered', 409);
}

// create user
$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$userId = $userModel->create($fullname, $email, $passwordHash);

if (!$userId) {
    Response::error('Could not create user', 500);
}

// create verification code
$code = random_int(100000, 999999); // 6-digit numeric code
$evModel = new EmailVerification();
$evModel->create($userId, $code);

// send verification email
$dotenv = Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();

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
    Response::json([
        'success' => true,
        'message' => 'Registered successfully. Check your email for verification.',
        'email_sent' => $sent
    ]);
} catch (Exception $e) {
    Response::json([
        'success' => true,
        'message' => 'Registered successfully, but email failed to send.',
        'email_sent' => false,
        'mail_error' => $e->getMessage()
    ]);
}


