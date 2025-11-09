<?php
// backend/api/manage_tickets.php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Models\User;

session_start();

// 1. CHECK AUTHENTICATION
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized.']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];
$event_id = (int)($_GET['event_id'] ?? 0);

if ($event_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid Event ID.']);
    exit;
}

try {
    $pdo = Database::getConnection();

    // 2. GET USER (for layout)
    $userModel = new User();
    $user = $userModel->findById($user_id);

    // 3. SECURITY CHECK: Verify user owns this event
    $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ? AND user_id = ?");
    $stmt->execute([$event_id, $user_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        http_response_code(403);
        echo json_encode(['error' => "You're not authorized to manage this event."]);
        exit;
    }
    
    // 4. GET TICKET STATS
    $stmt_tix_stats = $pdo->prepare("
        SELECT 
            COUNT(*) as total_tickets,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_tickets,
            SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) as used_tickets,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tickets
        FROM tickets 
        WHERE event_id = ?
    ");
    $stmt_tix_stats->execute([$event_id]);
    $ticket_stats = $stmt_tix_stats->fetch(PDO::FETCH_ASSOC);

    // 5. GET PAYMENT STATS
    $stmt_pay_stats = $pdo->prepare("
        SELECT 
            COUNT(*) as total_payments,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payments,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_payments
        FROM payments 
        WHERE event_id = ?
    ");
    $stmt_pay_stats->execute([$event_id]);
    $payment_stats = $stmt_pay_stats->fetch(PDO::FETCH_ASSOC);
    
    // Calculate total revenue
    $sold_tickets = (int)$ticket_stats['total_tickets'] - (int)$ticket_stats['cancelled_tickets'];
    $total_revenue = $sold_tickets * (float)$event['ticket_price'];

    // 6. GET ALL TICKETS WITH DETAILS
    $stmt_tickets = $pdo->prepare("
        SELECT 
            t.*, 
            u.fullname, 
            u.email,
            p.id as payment_id,
            p.transaction_id,
            p.mpesa_receipt_number,
            p.purchase_date,
            p.status as payment_status,
            pt.id as payment_ticket_id
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN payment_tickets pt ON t.id = pt.ticket_id
        LEFT JOIN payments p ON pt.payment_id = p.id
        WHERE t.event_id = ?
        ORDER BY t.purchase_date DESC
    ");
    $stmt_tickets->execute([$event_id]);
    $tickets = $stmt_tickets->fetchAll(PDO::FETCH_ASSOC);

    // 7. SEND RESPONSE
    echo json_encode([
        'success' => true,
        'user' => $user,
        'event' => $event,
        'ticket_stats' => $ticket_stats,
        'payment_stats' => $payment_stats,
        'total_revenue' => $total_revenue,
        'tickets' => $tickets
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error', 'message' => $e->getMessage()]);
}
