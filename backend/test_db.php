<?php
require_once __DIR__ . '/vendor/autoload.php';
use App\Config\Database;

try {
    $db = Database::getConnection();
    echo "âœ… Database connection successful!";
} catch (Exception $e) {
    echo "âŒ Connection failed: " . $e->getMessage();
}

