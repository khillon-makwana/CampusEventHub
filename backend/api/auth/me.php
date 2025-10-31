<?php
// backend/api/auth/me.php
require_once '../cors.php';

require_once __DIR__ . '/../../vendor/autoload.php';
use App\Models\User;

session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['user' => null]);
    exit;
}

$userModel = new User();
$user = $userModel->findById((int)$_SESSION['user_id']);
if (!$user) {
    echo json_encode(['user' => null]);
    exit;
}
echo json_encode(['user' => $user]);
