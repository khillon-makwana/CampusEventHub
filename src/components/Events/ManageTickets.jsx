// src/components/Events/ManageTickets.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './ManageTickets.css';

// Helper to format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export default function ManageTickets() {
    const { id: eventId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // Tracks ticket ID
    const [downloading, setDownloading] = useState(false);

    // Fetch data
    const fetchData = async () => {
        try {
            const result = await apiGet(`manage_tickets.php?event_id=${eventId}`);
            if (result.success) {
                setData(result);
            } else {
                throw new Error(result.error || 'Failed to load ticket data');
            }
        } catch (err) {
            setError(err.message);
            if (err.message.includes('authorized')) {
                navigate('/my-events');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [eventId]);

    // Handle ticket status changes
    const handleTicketAction = async (ticketId, action, confirmMessage) => {
        if (window.confirm(confirmMessage)) {
            setActionLoading(ticketId);
            try {
                const result = await apiPost('events_actions.php', { ticket_id: ticketId, action });
                if (result.success) {
                    fetchData(); // Refetch all data
                } else {
                    throw new Error(result.error || 'Action failed');
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            } finally {
                setActionLoading(null);
            }
        }
    };

    // Handle report downloads
    const handleDownload = (format) => {
        setDownloading(true);
        const form = document.createElement('form');
        form.method = 'POST';
        // IMPORTANT: Use the full path for the form action
        form.action = `http://localhost/CampusEventHub/backend/api/export_tickets.php`;
        form.style.display = 'none';
        
        const eventIdInput = document.createElement('input');
        eventIdInput.name = 'event_id';
        eventIdInput.value = eventId;
        
        const formatInput = document.createElement('input');
        formatInput.name = 'format';
        formatInput.value = format;
        
        form.appendChild(eventIdInput);
        form.appendChild(formatInput);
        document.body.appendChild(form);
        
        form.submit();
        
        setTimeout(() => {
            setDownloading(false);
            document.body.removeChild(form);
        }, 2000);
    };

    if (loading) {
        return <Layout><div className="container text-center py-5"><div className="spinner-border text-primary" role="status"></div></div></Layout>;
    }
    if (error) {
        return <Layout><div className="container py-5"><div className="alert alert-danger">{error}</div></div></Layout>;
    }
    if (!data) return <Layout />;

    const { user, event, ticket_stats, payment_stats, total_revenue, tickets } = data;
    const { total_tickets, active_tickets, used_tickets, cancelled_tickets } = ticket_stats;
    const { total_payments, completed_payments, pending_payments, failed_payments, cancelled_payments } = payment_stats || {};

    return (
        <Layout user={user}>
            {downloading && (
                <div className="download-overlay active">
                    <div className="download-spinner">
                        <i className="fas fa-spinner"></i>
                        <p className="mt-3">Preparing your download...</p>
                    </div>
                </div>
            )}
            <div className="container mt-4 mb-5">
                <div className="ticket-management-header">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h1 className="h3 mb-2" style={{ color: '#667eea', fontWeight: 700 }}><i className="fas fa-chart-bar me-2"></i>Ticket Management</h1>
                            <h2 className="h4 mb-3" style={{ color: '#764ba2', fontWeight: 600 }}>{event.title}</h2>
                            <p className="text-muted mb-0">
                                <i className="fas fa-calendar-alt me-2"></i>{formatDate(event.event_date)}
                                <span className="mx-2">|</span>
                                <i className="fas fa-ticket-alt me-2"></i>KSh {Number(event.ticket_price).toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </p>
                        </div>
                        <div className="col-md-4 text-md-end mt-3 mt-md-0">
                            <Link to="/my-events" className="btn btn-outline-primary me-2" style={{ borderRadius: '12px' }}>
                                <i className="fas fa-arrow-left me-2"></i>Back to Events
                            </Link>
                            <Link to={`/event/${event.id}`} className="btn btn-primary" style={{ borderRadius: '12px', background: 'var(--primary-gradient)', border: 'none' }}>
                                <i className="fas fa-eye me-2"></i>View Event
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card stat-card revenue-card">
                            <div className="card-body p-4">
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <h6 className="text-white-50 mb-2" style={{ letterSpacing: '1px' }}>TOTAL REVENUE</h6>
                                        <h2 className="mb-2" style={{ fontWeight: 700, fontSize: '2.5rem' }}>KSh {Number(total_revenue).toLocaleString('en-US', {minimumFractionDigits: 2})}</h2>
                                        <p className="mb-0 opacity-75" style={{ fontSize: '1.1rem' }}>
                                            {total_tickets - cancelled_tickets} tickets sold × KSh {Number(event.ticket_price).toLocaleString('en-US', {minimumFractionDigits: 2})} each
                                        </p>
                                    </div>
                                    <div className="col-md-4 text-md-end d-none d-md-block">
                                        <i className="fas fa-chart-line fa-4x opacity-50 pulse-animation"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <h5 className="mb-3" style={{color: '#764ba2', fontWeight: 600}}>Ticket Statistics</h5>
                <div className="row mb-4">
                    <StatCard count={total_tickets} title="Total Tickets" icon="fa-ticket-alt" color="primary-gradient" />
                    <StatCard count={active_tickets} title="Active Tickets" icon="fa-check-circle" color="success-gradient" />
                    <StatCard count={used_tickets} title="Used Tickets" icon="fa-user-check" color="warning-gradient" />
                    <StatCard count={cancelled_tickets} title="Cancelled" icon="fa-times-circle" color="danger-gradient" />
                </div>
                
                {payment_stats && (
                    <>
                        <h5 className="mb-3" style={{color: '#764ba2', fontWeight: 600}}>Payment Statistics</h5>
                        <div className="row mb-4">
                            <StatCard count={total_payments} title="Total Payments" icon="fa-credit-card" color="info-gradient" />
                            <StatCard count={completed_payments} title="Completed" icon="fa-check" color="success-gradient" />
                            <StatCard count={pending_payments} title="Pending" icon="fa-clock" color="warning-gradient" />
                            <StatCard count={failed_payments || 0} title="Failed/Cancelled" icon="fa-ban" color="danger-gradient" />
                        </div>
                    </>
                )}


                {/* Tickets List */}
                <div className="card ticket-table-wrapper mb-4">
                    <div className="card-header bg-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0" style={{ color: '#667eea', fontWeight: 600 }}><i className="fas fa-list me-2"></i>Ticket Details</h5>
                        <span className="badge" style={{ background: 'var(--primary-gradient)', fontSize: '0.9rem' }}>{tickets.length} tickets</span>
                    </div>
                    <div className="card-body p-0">
                        {tickets.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon"><i className="fas fa-ticket-alt"></i></div>
                                <h4 style={{ color: '#667eea', fontWeight: 600 }}>No Tickets Sold Yet</h4>
                                <p className="text-muted mb-4">Tickets will appear here once attendees start purchasing.</p>
                                <Link to={`/event/${event.id}`} className="btn btn-primary btn-lg" style={{ borderRadius: '12px', background: 'var(--primary-gradient)', border: 'none' }}>
                                    <i className="fas fa-share me-2"></i>Share Your Event
                                </Link>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Ticket Code</th>
                                            <th>Attendee</th>
                                            <th>Ticket Status</th>
                                            <th>Amount</th>
                                            <th>Purchase Date</th>
                                            <th>Payment Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickets.map(ticket => (
                                            <TicketRow 
                                                key={ticket.id} 
                                                ticket={ticket} 
                                                eventPrice={event.ticket_price}
                                                onAction={handleTicketAction} 
                                                loading={actionLoading === ticket.id} 
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Download Section */}
                <div className="download-section">
                    <h5 className="mb-2" style={{ color: '#667eea', fontWeight: 600 }}><i className="fas fa-download me-2"></i>Download Reports</h5>
                    <p className="text-muted mb-3">Export your ticket data for analysis and record-keeping.</p>
                    <div className="row">
                        <div className="col-md-4 mb-3 mb-md-0">
                            <button onClick={() => handleDownload('csv')} className="download-btn download-btn-csv w-100" disabled={downloading}>
                                <i className="fas fa-file-csv"></i><span>Download as CSV</span>
                            </button>
                        </div>
                        <div className="col-md-4 mb-3 mb-md-0">
                            <button onClick={() => handleDownload('excel')} className="download-btn download-btn-excel w-100" disabled={downloading}>
                                <i className="fas fa-file-excel"></i><span>Download as Excel</span>
                            </button>
                        </div>
                        <div className="col-md-4">
                            <button onClick={() => handleDownload('pdf')} className="download-btn download-btn-pdf w-100" disabled={downloading}>
                                <i className="fas fa-file-pdf"></i><span>Download as PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// --- Sub-Components ---

const StatCard = ({ count, title, icon, color }) => (
    <div className="col-md-3 mb-3">
        <div className={`card stat-card text-white ${color}`}>
            <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="text-white-50 mb-1" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>{title}</h6>
                        <h3 className="mb-0" style={{ fontWeight: 700 }}>{count || 0}</h3>
                    </div>
                    <i className={`fas ${icon} fa-3x opacity-50`}></i>
                </div>
            </div>
        </div>
    </div>
);

const TicketRow = ({ ticket, eventPrice, onAction, loading }) => (
    <tr>
        <td><span className="ticket-code">{ticket.ticket_code}</span></td>
        <td>
            <div>
                <strong>{ticket.fullname || 'Guest'}</strong><br />
                <small className="text-muted">{ticket.email || 'N/A'}</small>
            </div>
        </td>
        <td>
            <span className={`badge bg-${ticket.status === 'active' ? 'success' : (ticket.status === 'used' ? 'warning' : 'danger')}`}>
                {ticket.status}
            </span>
        </td>
        <td><strong>KSh {Number(eventPrice).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong></td>
        <td>{formatDate(ticket.purchase_date)}</td>
        <td>
            <span className={`badge bg-${ticket.payment_status === 'completed' ? 'success' : (ticket.payment_status === 'pending' ? 'warning' : 'danger')}`}>
                {ticket.payment_status || 'N/A'}
            </span>
        </td>
        <td>
            <div className="btn-group btn-group-sm">
                <button className="btn btn-outline-primary" onClick={() => navigate(`/tickets/${ticket.id}`)} title="View Ticket" disabled={loading}>
                    <i className="fas fa-eye"></i>
                </button>
                {ticket.status === 'active' && (
                    <button className="btn btn-outline-success" onClick={() => onAction(ticket.id, 'mark_ticket_used', 'Mark as Used?')} title="Mark as Used" disabled={loading}>
                        <i className="fas fa-check"></i>
                    </button>
                )}
                {ticket.status === 'used' && (
                    <button className="btn btn-outline-warning" onClick={() => onAction(ticket.id, 'mark_ticket_active', 'Mark as Active?')} title="Mark as Active" disabled={loading}>
                        <i className="fas fa-redo"></i>
                    </button>
                )}
                {ticket.status === 'active' && (
                    <button className="btn btn-outline-danger" onClick={() => onAction(ticket.id, 'cancel_ticket', 'Cancel Ticket?')} title="Cancel Ticket" disabled={loading}>
                        <i className="fas fa-times"></i>
                    </button>
                )}
            </div>
        </td>
    </tr>
);