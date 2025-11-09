<?php
// backend/api/events.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User; // <-- Added User model

session_start(); // <-- Session started

// --- ADDED THIS BLOCK to get user data ---
$user = null;
if (isset($_SESSION['user_id'])) {
    $userModel = new User();
    $user = $userModel->findById((int)$_SESSION['user_id']);
    if (!$user) {
        $user = null; // Unset if user not found
    }
}
// --- END OF BLOCK ---

try {
    $pdo = Database::getConnection();

    // --- 1. Get Filters & Pagination ---
    $page = (int)($_GET['page'] ?? 1);
    $limit = 12;
    $offset = ($page - 1) * $limit;

    $search = $_GET['search'] ?? '';
    $category = $_GET['category'] ?? '';
    $location = $_GET['location'] ?? '';
    $sort = $_GET['sort'] ?? 'date_asc';

    // --- 2. Build Queries (FIXED TABLE NAMES) ---
    $count_query = "
        SELECT COUNT(DISTINCT e.id)
        FROM events e 
        LEFT JOIN event_categories ec ON e.id = ec.event_id
        LEFT JOIN attendee_category ac ON ec.category_id = ac.id
        WHERE e.status IN ('upcoming', 'ongoing')
    ";

    // *** FIX: Reverted to SUM(ea.quantity) and fixed table name ***
    $data_query = "
        SELECT e.*, u.fullname as organizer_name,
               COALESCE(SUM(ea.quantity), 0) as attendee_count, 
               GROUP_CONCAT(DISTINCT ac.name SEPARATOR ', ') as category_names
        FROM events e 
        LEFT JOIN users u ON e.user_id = u.id 
        LEFT JOIN event_attendees ea ON e.id = ea.event_id AND ea.status = 'going'
        LEFT JOIN event_categories ec ON e.id = ec.event_id
        LEFT JOIN attendee_category ac ON ec.category_id = ac.id
        WHERE e.status IN ('upcoming', 'ongoing')
    ";

    $params = [];
    $conditions = [];

    if (!empty($search)) {
        $conditions[] = "(e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)";
        $search_term = "%$search%";
        array_push($params, $search_term, $search_term, $search_term);
    }
    if (!empty($category)) {
        $conditions[] = "ac.name = ?";
        $params[] = $category;
    }
    if (!empty($location)) {
        $conditions[] = "e.location LIKE ?";
        $params[] = "%$location%";
    }

    if (!empty($conditions)) {
        $where_clause = " AND " . implode(" AND ", $conditions);
        $count_query .= $where_clause;
        $data_query .= $where_clause;
    }

    // --- 3. Execute Count Query & Get Pagination ---
    $stmt = $pdo->prepare($count_query);
    $stmt->execute($params);
    $total_events = (int)$stmt->fetchColumn();
    $total_pages = $total_events > 0 ? (int)ceil($total_events / $limit) : 1;

    if ($page < 1) $page = 1;
    if ($page > $total_pages) $page = $total_pages;
    $offset = ($page - 1) * $limit;

    // --- 4. Add Sorting & Pagination to Data Query ---
    $order_by = " ORDER BY ";
    switch ($sort) {
        case 'date_desc': $order_by .= "e.event_date DESC"; break;
        case 'popular': $order_by .= "attendee_count DESC"; break;
        case 'date_asc':
        default: $order_by .= "e.event_date ASC"; break;
    }

    $data_query .= " GROUP BY e.id " . $order_by . " LIMIT ? OFFSET ?";
    
    $data_params = $params;
    $data_params[] = $limit;
    $data_params[] = $offset;

    // --- 5. Execute Data Query ---
    $stmt = $pdo->prepare($data_query);
    $param_index = 1;
    foreach ($data_params as $param) {
        if ($param_index == count($data_params) - 1 || $param_index == count($data_params)) {
            $stmt->bindValue($param_index, (int)$param, PDO::PARAM_INT);
        } else {
            $stmt->bindValue($param_index, $param, PDO::PARAM_STR);
        }
        $param_index++;
    }
    
    $stmt->execute();
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- 6. Get Categories ---
    $stmt = $pdo->query("SELECT DISTINCT name FROM attendee_category ORDER BY name");
    $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // --- 7. Send JSON Response ---
    echo json_encode([
        'success' => true,
        'user' => $user, // <-- Added user object to response
        'events' => $events,
        'categories' => $categories,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total_events' => $total_events,
            'total_pages' => $total_pages
        ],
        'stats' => [
            'total_events' => $total_events,
            'showing' => count($events),
            'total_categories' => count($categories),
            'total_pages' => $total_pages
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
