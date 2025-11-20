<?php
// backend/api/events_create.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;
use App\Helpers\Response;
use App\Helpers\Validator;

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    Response::error('Unauthorized. Please log in.', 401);
}

$pdo = Database::getConnection();
$user_id = (int)$_SESSION['user_id'];

// 2. HANDLE 'GET' REQUEST (Fetch Categories AND User)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // --- 2a. GET USER ---
        $userModel = new User();
        $user = $userModel->findById($user_id);
        
        // --- 2b. GET CATEGORIES ---
        $stmt = $pdo->query("SELECT id, name FROM attendee_category ORDER BY name");
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // --- 2c. SEND BOTH ---
        Response::json([
            'success' => true, 
            'categories' => $categories,
            'user' => $user
        ]);

    } catch (PDOException $e) {
        Response::error('Database error', 500, $e->getMessage());
    }
}

// 3. HANDLE 'POST' REQUEST (Create Event)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Sanitize inputs (except arrays like category_ids)
    $inputs = Validator::sanitize($_POST);

    $title = $inputs['title'] ?? '';
    $description = $inputs['description'] ?? '';
    $location = $inputs['location'] ?? '';
    $event_date = $inputs['event_date'] ?? '';
    $category_ids = $_POST['category_ids'] ?? []; // Don't sanitize array structure
    $total_tickets = (int)($inputs['total_tickets'] ?? 0);
    $status = $inputs['status'] ?? 'draft';
    $ticket_price = floatval($inputs['ticket_price'] ?? 0);

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
        Response::json(['success' => false, 'errors' => $form_errors], 422);
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
// --- NEW NOTIFICATION BLOCK ---
        if ($status === 'upcoming') { // Only notify if it's published
            try {
                $mailer = new \App\Services\Mailer();
                $notificationManager = new \App\Services\NotificationManager($mailer);
                $notificationManager->notifyNewEventByCategory($event_id);
            } catch (Exception $e) {
                // Log notification error but don't fail the request
                error_log("Failed to send new event notifications: " . $e->getMessage());
            }
        }
        // --- END NEW BLOCK ---
        
        Response::json(['success' => true, 'message' => 'Event created successfully!', 'event_id' => $event_id]);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        Response::error('Database error', 500, $e->getMessage());
    }
}

// Fallback for invalid request method
Response::error('Invalid request method.', 405);