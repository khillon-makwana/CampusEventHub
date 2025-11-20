<?php
// backend/api/events_edit.php
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

// 2. GET EVENT ID
$event_id = (int)($_GET['id'] ?? 0);
if ($event_id <= 0) {
    Response::error('Invalid event ID.', 400);
}

// 3. FETCH ORIGINAL EVENT (Security Check)
try {
    $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ? AND user_id = ?");
    $stmt->execute([$event_id, $user_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        Response::error('Event not found or you do not have permission to edit it.', 404);
    }
} catch (PDOException $e) {
    Response::error('Database error', 500, $e->getMessage());
}


// 4. HANDLE 'GET' REQUEST (Fetch data for form)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get event's current categories
        $stmt_cats = $pdo->prepare("SELECT category_id FROM event_categories WHERE event_id = ?");
        $stmt_cats->execute([$event_id]);
        $selected_categories = $stmt_cats->fetchAll(PDO::FETCH_COLUMN); // Returns [1, 3, 5]

        // Get all available categories
        $stmt_all_cats = $pdo->query("SELECT id, name FROM attendee_category ORDER BY name");
        $all_categories = $stmt_all_cats->fetchAll(PDO::FETCH_ASSOC);

        // Get user data for layout
        $userModel = new User();
        $user = $userModel->findById($user_id);

        Response::json([
            'success' => true,
            'user' => $user,
            'event' => $event,
            'selected_categories' => $selected_categories,
            'all_categories' => $all_categories
        ]);
        
    } catch (PDOException $e) {
        Response::error('Database error', 500, $e->getMessage());
    }
}

// 5. HANDLE 'POST' REQUEST (Update Event)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Sanitize inputs
    $inputs = Validator::sanitize($_POST);

    $title = $inputs['title'] ?? '';
    $description = $inputs['description'] ?? '';
    $location = $inputs['location'] ?? '';
    $event_date = $inputs['event_date'] ?? '';
    $category_ids = $_POST['category_ids'] ?? [];
    $total_tickets = (int)($inputs['total_tickets'] ?? 0);
    $status = $inputs['status'] ?? 'draft';
    $remove_image = isset($inputs['remove_image']) && $inputs['remove_image'] == 'true';
    $ticket_price = (float)($inputs['ticket_price'] ?? 0);

    $form_errors = [];

    // 6. VALIDATION
    if (empty($title)) $form_errors['title'] = "Event title is required";
    if (empty($description)) $form_errors['description'] = "Event description is required";
    if (empty($location)) $form_errors['location'] = "Event location is required";
    if (empty($event_date)) $form_errors['event_date'] = "Event date is required";
    if (empty($category_ids)) $form_errors['category_ids'] = "Please select at least one category";
    if ($total_tickets < 0) $form_errors['total_tickets'] = "Total tickets cannot be negative";
    if ($ticket_price < 0) $form_errors['ticket_price'] = "Ticket price cannot be negative";
    if (!is_array($category_ids)) $form_errors['category_ids'] = "Invalid category format.";

    // 7. IMAGE UPLOAD
    $image_path = $event['image']; // Start with the existing image path

    // A. Check for image removal
    if ($remove_image && $image_path) {
        $old_image_full_path = __DIR__ . '/../../' . $image_path;
        if (file_exists($old_image_full_path)) {
            unlink($old_image_full_path);
        }
        $image_path = null;
    }

    // B. Check for new image upload
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
            // Delete old image if it exists
            if ($image_path) {
                $old_image_full_path = __DIR__ . '/../../' . $image_path;
                if (file_exists($old_image_full_path)) {
                    unlink($old_image_full_path);
                }
            }

            // Create new image path
            $upload_dir_relative = 'uploads/events/';
            $upload_dir_absolute = __DIR__ . '/../../' . $upload_dir_relative;
            if (!is_dir($upload_dir_absolute)) mkdir($upload_dir_absolute, 0755, true);

            $file_extension = pathinfo($_FILES['event_image']['name'], PATHINFO_EXTENSION);
            $filename = uniqid('event_') . '_' . time() . '.' . $file_extension;
            
            $image_path = $upload_dir_relative . $filename; // New path for DB
            $destination_path = $upload_dir_absolute . $filename;

            if (!move_uploaded_file($_FILES['event_image']['tmp_name'], $destination_path)) {
                $form_errors['event_image'] = "Failed to upload image";
                $image_path = $event['image']; // Revert to old path on failure
            }
        }
    }

    // 8. RETURN VALIDATION ERRORS
    if (!empty($form_errors)) {
        Response::json(['success' => false, 'errors' => $form_errors], 422);
    }

    // 9. DATABASE UPDATE
    try {
        $pdo->beginTransaction();

        // Calculate new available tickets based on the *difference*
        $current_available = (int)$event['available_tickets'];
        $ticket_difference = $total_tickets - (int)$event['total_tickets'];
        $new_available = max(0, $current_available + $ticket_difference);

        // Update event
        $stmt_update = $pdo->prepare("
            UPDATE events 
            SET title = ?, description = ?, location = ?, event_date = ?, 
                image = ?, total_tickets = ?, available_tickets = ?, 
                ticket_price = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ?
        ");
        $stmt_update->execute([
            $title, $description, $location, $event_date,
            $image_path, $total_tickets, $new_available,
            $ticket_price, $status,
            $event_id, $user_id
        ]);

        // Update categories (Delete old, Insert new)
        $stmt_del_cats = $pdo->prepare("DELETE FROM event_categories WHERE event_id = ?");
        $stmt_del_cats->execute([$event_id]);

        $stmt_ins_cats = $pdo->prepare("INSERT INTO event_categories (event_id, category_id) VALUES (?, ?)");
        foreach ($category_ids as $cat_id) {
            $stmt_ins_cats->execute([$event_id, (int)$cat_id]);
        }

        $pdo->commit();

        Response::json(['success' => true, 'message' => 'Event updated successfully!']);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        Response::error('Database error', 500, $e->getMessage());
    }
}
