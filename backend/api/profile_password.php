<?php
// backend/api/profile_password.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized.']);
    exit;
}

// 2. ONLY ALLOW POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed.']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

$current_password = $data['current_password'] ?? '';
$new_password = $data['new_password'] ?? '';
$confirm_password = $data['confirm_password'] ?? '';

// 3. VALIDATION
if (!$current_password || !$new_password || !$confirm_password) {
    http_response_code(422);
    echo json_encode(['error' => 'All password fields are required.']);
    exit;
}

try {
    $pdo = Database::getConnection();

    // 4. FETCH CURRENT PASSWORD HASH
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found.']);
        exit;
    }

    // 5. VERIFY CURRENT PASSWORD
    if (!password_verify($current_password, $user['password'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Current password is incorrect.']);
        exit;
    }

    if (strlen($new_password) < 6) {
        http_response_code(422);
        echo json_encode(['error' => 'New password must be at least 6 characters.']);
        exit;
    }

    if ($new_password !== $confirm_password) {
        http_response_code(422);
        echo json_encode(['error' => 'New passwords do not match.']);
        exit;
    }

    // 6. HASH AND UPDATE NEW PASSWORD
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    $stmt_update = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt_update->execute([$hashed_password, $user_id]);

    echo json_encode(['success' => true, 'message' => 'Password changed successfully!']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
