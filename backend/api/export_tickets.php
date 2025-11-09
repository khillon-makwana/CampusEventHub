<?php
// backend/api/export_tickets.php
// Note: This script is called directly, not via fetch()
require_once __DIR__ . '/../vendor/autoload.php';
use App\Config\Database;

session_start();

if (!isset($_SESSION['user_id'])) {
    die("Access denied. Please log in.");
}

$event_id = (int)($_POST['event_id'] ?? $_GET['event_id'] ?? 0);
$format = $_POST['format'] ?? $_GET['format'] ?? 'csv';
$user_id = (int)$_SESSION['user_id'];

try {
    $pdo = Database::getConnection();

    // Verify event ownership
    $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ? AND user_id = ?");
    $stmt->execute([$event_id, $user_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        die("Access denied or event not found.");
    }

    // Get all tickets with user and payment information
    $stmt = $pdo->prepare("
        SELECT 
            t.ticket_code,
            t.status as ticket_status,
            t.purchase_date,
            u.fullname,
            u.email,
            p.transaction_id,
            p.mpesa_receipt_number,
            p.status as payment_status,
            ? as ticket_price
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN payment_tickets pt ON t.id = pt.ticket_id
        LEFT JOIN payments p ON pt.payment_id = p.id
        WHERE t.event_id = ?
        ORDER BY t.purchase_date DESC
    ");
    $stmt->execute([$event['ticket_price'], $event_id]);
    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Generate filename
    $filename = 'tickets_' . preg_replace('/[^a-z0-9]/i', '_', $event['title']) . '_' . date('Y-m-d');

    switch ($format) {
        case 'csv':
            generateCSV($tickets, $event, $filename);
            break;
        case 'excel':
            generateExcel($tickets, $event, $filename);
            break;
        case 'pdf':
            generatePDF($tickets, $event, $filename);
            break;
        default:
            die("Invalid format specified.");
    }

} catch (PDOException $e) {
    die("Error: " . $e->getMessage());
}

function generateCSV($tickets, $event, $filename) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '.csv"');
    
    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
    
    fputcsv($output, ['Event Report']);
    fputcsv($output, ['Event Name:', $event['title']]);
    fputcsv($output, ['Event Date:', date('F j, Y g:i A', strtotime($event['event_date']))]);
    fputcsv($output, ['Generated:', date('F j, Y g:i A')]);
    fputcsv($output, []);
    
    fputcsv($output, [
        'Ticket Code', 'Attendee Name', 'Email', 'Ticket Status', 'Ticket Price',
        'Purchase Date', 'Payment Status', 'Transaction ID', 'M-Pesa Receipt'
    ]);
    
    foreach ($tickets as $ticket) {
        fputcsv($output, [
            $ticket['ticket_code'],
            $ticket['fullname'] ?? 'Guest',
            $ticket['email'] ?? 'N/A',
            ucfirst($ticket['ticket_status']),
            'KSh ' . number_format($ticket['ticket_price'], 2),
            date('M j, Y g:i A', strtotime($ticket['purchase_date'])),
            ucfirst($ticket['payment_status'] ?? 'N/A'),
            $ticket['transaction_id'] ?? 'N/A',
            $ticket['mpesa_receipt_number'] ?? 'N/A'
        ]);
    }
    
    fputcsv($output, []);
    fputcsv($output, ['Summary']);
    $active = count(array_filter($tickets, fn($t) => $t['ticket_status'] == 'active'));
    $used = count(array_filter($tickets, fn($t) => $t['ticket_status'] == 'used'));
    $cancelled = count(array_filter($tickets, fn($t) => $t['ticket_status'] == 'cancelled'));
    
    fputcsv($output, ['Total Tickets:', count($tickets)]);
    fputcsv($output, ['Active Tickets:', $active]);
    fputcsv($output, ['Used Tickets:', $used]);
    fputcsv($output, ['Cancelled Tickets:', $cancelled]);
    fputcsv($output, ['Total Revenue:', 'KSh ' . number_format((count($tickets) - $cancelled) * $event['ticket_price'], 2)]);
    
    fclose($output);
    exit;
}

function generateExcel($tickets, $event, $filename) {
    header('Content-Type: application/vnd.ms-excel; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '.xls"');
    
    echo '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><style>
        table { border-collapse: collapse; width: 100%; }
        th { background-color: #667eea; color: white; font-weight: bold; padding: 10px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .header { background-color: #764ba2; color: white; padding: 15px; margin-bottom: 20px; }
        .summary { background-color: #f8f9fa; padding: 15px; margin-top: 20px; font-weight: bold; }
        </style></head><body>';
    
    echo '<div class="header"><h1>Ticket Report</h1>
          <p><strong>Event:</strong> ' . htmlspecialchars($event['title']) . '</p>
          <p><strong>Date:</strong> ' . date('F j, Y g:i A', strtotime($event['event_date'])) . '</p>
          <p><strong>Generated:</strong> ' . date('F j, Y g:i A') . '</p></div>';
    
    echo '<table><thead><tr>
        <th>Ticket Code</th><th>Attendee Name</th><th>Email</th><th>Ticket Status</th>
        <th>Price</th><th>Purchase Date</th><th>Payment Status</th><th>Transaction ID</th><th>M-Pesa Receipt</th>
        </tr></thead><tbody>';
    
    foreach ($tickets as $ticket) {
        echo '<tr>
            <td>' . htmlspecialchars($ticket['ticket_code']) . '</td>
            <td>' . htmlspecialchars($ticket['fullname'] ?? 'Guest') . '</td>
            <td>' . htmlspecialchars($ticket['email'] ?? 'N/A') . '</td>
            <td>' . ucfirst($ticket['ticket_status']) . '</td>
            <td>KSh ' . number_format($ticket['ticket_price'], 2) . '</td>
            <td>' . date('M j, Y g:i A', strtotime($ticket['purchase_date'])) . '</td>
            <td>' . ucfirst($ticket['payment_status'] ?? 'N/A') . '</td>
            <td>' . htmlspecialchars($ticket['transaction_id'] ?? 'N/A') . '</td>
            <td>' . htmlspecialchars($ticket['mpesa_receipt_number'] ?? 'N/A') . '</td>
            </tr>';
    }
    
    echo '</tbody></table>';
    
    $active = count(array_filter($tickets, fn($t) => $t['ticket_status'] == 'active'));
    $used = count(array_filter($tickets, fn($t) => $t['ticket_status'] == 'used'));
    $cancelled = count(array_filter($tickets, fn($t) => $t['ticket_status'] == 'cancelled'));
    
    echo '<div class="summary"><h2>Summary</h2>
          <p>Total Tickets: ' . count($tickets) . '</p>
          <p>Active Tickets: ' . $active . '</p>
          <p>Used Tickets: ' . $used . '</p>
          <p>Cancelled Tickets: ' . $cancelled . '</p>
          <p>Total Revenue: KSh ' . number_format((count($tickets) - $cancelled) * $event['ticket_price'], 2) . '</p>
          </div>';
    
    echo '</body></html>';
    exit;
}

function generatePDF($tickets, $event, $filename) {
    // This simple HTML-to-PDF is kept as-is
    header('Content-Type: text/html; charset=utf-8');
    
    echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' . htmlspecialchars($event['title']) . ' - Ticket Report</title><style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; margin-bottom: 30px; border-radius: 10px; }
        .header h1 { margin: 0 0 15px 0; } .header p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #667eea; color: white; padding: 12px; text-align: left; font-weight: bold; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .summary { background-color: #f8f9fa; padding: 20px; margin-top: 30px; border-radius: 10px; border-left: 5px solid #667eea; }
        .summary h2 { margin-top: 0; color: #667eea; }
        .badge { padding: 5px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .badge-active { background-color: #28a745; color: white; }
        .badge-used { background-color: #ffc107; color: #000; }
        .badge-cancelled { background-color: #dc3545; color: white; }
        @media print { .no-print { display: none; } }
        </style></head><body>';
    
    echo '<div class="no-print" style="text-align: right; margin-bottom: 20px;">
          <button onclick="window.print()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
          <i class="fas fa-print me-2"></i> Download as PDF
          </button></div>';
    
    echo '<div class="header"><h1>Ticket Report</h1>
          <p><strong>Event:</strong> ' . htmlspecialchars($event['title']) . '</p>
          <p><strong>Date:</strong> ' . date('F j, Y g:i A', strtotime($event['event_date'])) . '</p>
          <p><strong>Generated:</strong> ' . date('F j, Y g:i A') . '</p></div>';
    
    echo '<table><thead><tr>
        <th>Ticket Code</th><th>Attendee</th><th>Email</th><th>Status</th>
        <th>Price</th><th>Purchase Date</th><th>Payment Status</th><th>Transaction ID</th>
        </tr></thead><tbody>';
    
    foreach ($tickets as $ticket) {
        $statusClass = $ticket['ticket_status'] == 'active' ? 'badge-active' : ($ticket['ticket_status'] == 'used' ? 'badge-used' : 'badge-cancelled');
        echo '<tr>
            <td><strong>' . htmlspecialchars($ticket['ticket_code']) . '</strong></td>
            <td>' . htmlspecialchars($ticket['fullname'] ?? 'Guest') . '</td>
            <td>' . htmlspecialchars($ticket['email'] ?? 'N/A') . '</td>
            <td><span class="badge ' . $statusClass . '">' . ucfirst($ticket['ticket_status']) . '</span></td>
            <td>KSh ' . number_format($ticket['ticket_price'], 2) . '</td>
            <td>' . date('M j, Y g:i A', strtotime($ticket['purchase_date'])) . '</td>
            <td>' . ucfirst($ticket['payment_status'] ?? 'N/A') . '</td>
            <td><small>' . htmlspecialchars($ticket['transaction_id'] ?? 'N/A') . '</small></td>
            </tr>';
    }
    
    echo '</tbody></table>';
    
    $active = count(array_filter($tickets, fn($t) => $t['ticket_status'] == 'active'));
    $used = count(array_filter($tickets, fn($t) => $t['ticket_status'] == 'used'));
    $cancelled = count(array_filter($tickets, fn($t) => $t['ticket_status'] == 'cancelled'));
    
    echo '<div class="summary"><h2>Summary Statistics</h2>
          <p><strong>Total Tickets:</strong> ' . count($tickets) . '</p>
          <p><strong>Active Tickets:</strong> ' . $active . '</p>
          <p><strong>Used Tickets:</strong> ' . $used . '</p>
          <p><strong>Cancelled Tickets:</strong> ' . $cancelled . '</p>
          <p style="font-size: 18px; color: #667eea;"><strong>Total Revenue:</strong> KSh ' . number_format((count($tickets) - $cancelled) * $event['ticket_price'], 2) . '</p>
          </div>';
    
    echo '</body></html>';
    exit;
}
