<?php
// backend/api/profile_password.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    Response::error('Unauthorized.', 401);
}

// 2. ONLY ALLOW POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method Not Allowed.', 405);
}

$user_id = (int)$_SESSION['user_id'];
$data = Validator::sanitize(json_decode(file_get_contents('php://input'), true));

$current_password = $data['current_password'] ?? '';
$new_password = $data['new_password'] ?? '';
$confirm_password = $data['confirm_password'] ?? '';

// 3. VALIDATION
if (!$current_password || !$new_password || !$confirm_password) {
    Response::error('All password fields are required.', 422);
}

try {
    $pdo = Database::getConnection();

    // 4. FETCH CURRENT PASSWORD HASH
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        Response::error('User not found.', 404);
    }

    // 5. VERIFY CURRENT PASSWORD
    if (!password_verify($current_password, $user['password'])) {
        Response::error('Current password is incorrect.', 403);
    }

    if (strlen($new_password) < 6) {
        Response::error('New password must be at least 6 characters.', 422);
    }

    if ($new_password !== $confirm_password) {
        Response::error('New passwords do not match.', 422);
    }

    // 6. HASH AND UPDATE NEW PASSWORD
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    $stmt_update = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt_update->execute([$hashed_password, $user_id]);

    Response::json(['success' => true, 'message' => 'Password changed successfully!']);

} catch (PDOException $e) {
    Response::error('Database error', 500, ['message' => $e->getMessage()]);
}
