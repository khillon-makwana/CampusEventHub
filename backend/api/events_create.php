<?php
// backend/api/events_create.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User; // <-- 1. IMPORT USER MODEL

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Please log in.']);
    exit;
}

$pdo = Database::getConnection();
$user_id = (int)$_SESSION['user_id'];

// 2. HANDLE 'GET' REQUEST (Fetch Categories AND User)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // --- 2a. GET USER (This was missing) ---
        $userModel = new User();
        $user = $userModel->findById($user_id);
        
        // --- 2b. GET CATEGORIES ---
        $stmt = $pdo->query("SELECT id, name FROM attendee_category ORDER BY name");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // --- 2c. SEND BOTH ---
        echo json_encode([
            'success' => true, 
            'categories' => $categories,
            'user' => $user // <-- ADDED USER
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
    }
    exit;
}

// 3. HANDLE 'POST' REQUEST (Create Event)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // This is multipart/form-data, so we use $_POST and $_FILES
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $event_date = $_POST['event_date'] ?? '';
    $category_ids = $_POST['category_ids'] ?? []; // This will be an array
    $total_tickets = (int)($_POST['total_tickets'] ?? 0);
    $status = $_POST['status'] ?? 'draft';
    $ticket_price = floatval($_POST['ticket_price'] ?? 0);

    $form_errors = [];

    // 4. VALIDATION
    if (empty($title)) $form_errors['title'] = "Event title is required";
    if (empty($description)) $form_errors['description'] = "Event description is required";
    if (empty($location)) $form_errors['location'] = "Event location is required";
    if (empty($event_date)) $form_errors['event_date'] = "Event date is required";
    if (empty($category_ids)) $form_errors['category_ids'] = "Please select at least one category";
    if ($total_tickets < 0) $form_errors['total_tickets'] = "Total tickets cannot be negative";
    if ($ticket_price < 0) $form_errors['ticket_price'] = "Ticket price cannot be negative";
    if (!is_array($category_ids)) $form_errors['category_ids'] = "Invalid category format.";

    // 5. IMAGE UPLOAD
    $image_path = null;
    if (isset($_FILES['event_image']) && $_FILES['event_image']['error'] === UPLOAD_ERR_OK) {
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $max_size = 5 * 1024 * 1024; // 5MB
        $file_type = $_FILES['event_image']['type'];
        $file_size = $_FILES['event_image']['size'];

        if (!in_array($file_type, $allowed_types)) {
            $form_errors['event_image'] = "Only JPG, PNG, GIF, and WebP images are allowed";
        } elseif ($file_size > $max_size) {
            $form_errors['event_image'] = "Image size must be less than 5MB";
        } else {
            // Path relative to the project root (htdocs/CampusEventHub)
            $upload_dir_relative = 'uploads/events/';
            $upload_dir_absolute = __DIR__ . '/../../' . $upload_dir_relative;

            if (!is_dir($upload_dir_absolute)) {
                mkdir($upload_dir_absolute, 0755, true);
            }

            $file_extension = pathinfo($_FILES['event_image']['name'], PATHINFO_EXTENSION);
            $filename = uniqid('event_') . '_' . time() . '.' . $file_extension;
            
            $image_path = $upload_dir_relative . $filename; // Path to save in DB
            $destination_path = $upload_dir_absolute . $filename; // Path to move file to

            if (!move_uploaded_file($_FILES['event_image']['tmp_name'], $destination_path)) {
                $form_errors['event_image'] = "Failed to upload image";
                $image_path = null;
            }
        }
    }

    // 6. RETURN VALIDATION ERRORS
    if (!empty($form_errors)) {
        http_response_code(422); // Unprocessable Entity
        echo json_encode(['success' => false, 'errors' => $form_errors]);
        exit;
    }

    // 7. DATABASE INSERTION
    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO events 
                (user_id, title, description, location, event_date, image, total_tickets, available_tickets, ticket_price, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user_id,
            $title,
            $description,
            $location,
            $event_date,
            $image_path,
            $total_tickets,
            $total_tickets, // Available tickets defaults to total
            $ticket_price,
            $status
        ]);

        $event_id = $pdo->lastInsertId();

        // Insert categories
        $stmt = $pdo->prepare("INSERT INTO event_categories (event_id, category_id) VALUES (?, ?)");
        foreach ($category_ids as $cat_id) {
            $stmt->execute([$event_id, (int)$cat_id]);
        }

        $pdo->commit();

        echo json_encode(['success' => true, 'message' => 'Event created successfully!', 'event_id' => $event_id]);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error', 'message' => $e->getMessage()]);
    }
    exit;
}

// Fallback for invalid request method
http_response_code(405); // Method Not Allowed
echo json_encode(['error' => 'Invalid request method.']);