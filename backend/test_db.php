<?php
require_once __DIR__ . '/vendor/autoload.php';
use App\Config\Database;

try {
    $db = Database::getConnection();
    echo "✅ Database connection successful!";
} catch (Exception $e) {
    echo "❌ Connection failed: " . $e->getMessage();
}
