<?php
// backend/api/cors.php

// Remove any output buffering
if (ob_get_level()) ob_end_clean();

// IMPORTANT: Set JSON content type for all API responses
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
// The .htaccess also handles this, but this PHP check is a good fallback
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content
    exit(0);
}
