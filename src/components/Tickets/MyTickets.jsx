// src/components/Tickets/MyTickets.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './MyTickets.css';

// Helper to format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export default function MyTickets() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    // Fetch data
    const fetchData = async () => {
        try {
            const result = await apiGet('my_tickets.php');
            if (result.success) {
                setData(result);
            } else {
                throw new Error(result.error || 'Failed to load tickets');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Checkbox Logic ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(data.tickets.map(t => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (e, id) => {
        if (e.target.checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(ticketId => ticketId !== id));
        }
    };

    // --- Delete Logic ---
    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} ticket(s)? This action cannot be undone.`)) {
            try {
                const result = await apiPost('my_tickets.php', { ticket_ids: selectedIds });
                if (result.success) {
                    setSelectedIds([]);
                    fetchData(); // Refetch
                } else {
                    throw new Error(result.error || 'Failed to delete tickets');
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm(`Are you sure you want to delete ALL ${data.tickets.length} ticket(s)? This action cannot be undone.`)) {
            try {
                const result = await apiPost('my_tickets.php', { delete_all: true });
                if (result.success) {
                    setSelectedIds([]);
                    fetchData(); // Refetch
                } else {
                    throw new Error(result.error || 'Failed to delete all tickets');
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    if (loading) {
        return <Layout><div className="container text-center py-5"><div className="spinner-border text-primary" role="status"></div></div></Layout>;
    }

    if (error) {
        return <Layout><div className="container py-5"><div className="alert alert-danger">{error}</div></div></Layout>;
    }

    if (!data) return <Layout />;

    const { user, tickets, pending_payment } = data;
    const allSelected = tickets.length > 0 && selectedIds.length === tickets.length;
    const someSelected = selectedIds.length > 0 && !allSelected;

    return (
        <Layout user={user}>
            <div className="page-header">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center">
                        <h2><i className="fas fa-ticket-alt me-3"></i>My Tickets</h2>
                    </div>
                </div>
            </div>
            
            <div className="container">
                {pending_payment && (
                    <div className="alert pending-payment-alert">
                        <h5><i className="fas fa-exclamation-triangle me-2"></i>Pending Payment</h5>
                        <p className="mb-0">
                            You have a pending payment of <strong>KSh {Number(pending_payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> 
                            for <strong>{pending_payment.event_title}</strong>.
                            {/* NOTE: You will need to create the payment processing page/logic */}
                            <Link to={`/process-payment/${pending_payment.id}`} className="alert-link">
                                Complete your payment to get your tickets.
                            </Link>
                        </p>
                    </div>
                )}

                {tickets.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-ticket-alt fa-5x mb-4"></i>
                        <h3 className="fw-bold mb-3">No Tickets Yet</h3>
                        <p className="text-muted fs-5">You haven't purchased any tickets yet. Start exploring amazing events!</p>
                        <Link to="/events" className="btn btn-browse-events">
                            <i className="fas fa-calendar-alt me-2"></i>Browse Events
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={(e) => e.preventDefault()}>
                        {/* Delete Actions Sticky Bar */}
                        <div className="delete-actions">
                            <div className="card">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="form-check">
                                                <input 
                                                    type="checkbox" 
                                                    id="selectAll" 
                                                    className="form-check-input"
                                                    checked={allSelected}
                                                    ref={el => el && (el.indeterminate = someSelected)}
                                                    onChange={handleSelectAll}
                                                />
                                                <label htmlFor="selectAll" className="form-check-label select-all-label">Select All</label>
                                            </div>
                                            <span className="selected-count" id="selectedCount">{selectedIds.length} selected</span>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-delete-selected" id="deleteSelectedBtn" 
                                                disabled={selectedIds.length === 0} onClick={handleDeleteSelected}>
                                                <i className="fas fa-trash me-2"></i>Delete Selected
                                            </button>
                                            <button type="button" className="btn btn-delete-all" id="deleteAllBtn" onClick={handleDeleteAll}>
                                                <i className="fas fa-trash-alt me-2"></i>Delete All
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            {tickets.map(ticket => (
                                <TicketCard 
                                    key={ticket.id} 
                                    ticket={ticket} 
                                    isSelected={selectedIds.includes(ticket.id)}
                                    onSelect={handleSelectOne}
                                />
                            ))}
                        </div>
                    </form>
                )}
            </div>
        </Layout>
    );
}

// --- Ticket Card Sub-Component ---
const TicketCard = ({ ticket, isSelected, onSelect }) => (
    <div className="col-lg-6 mb-4">
        <div className={`card h-100 ticket-card ${isSelected ? 'selected' : ''}`}>
            <div className="ticket-checkbox">
                <input 
                    type="checkbox" 
                    value={ticket.id} 
                    className="form-check-input ticket-select"
                    checked={isSelected}
                    onChange={(e) => onSelect(e, ticket.id)}
                />
            </div>
            
            <div className="ticket-header">
                <h5 className="ticket-title">{ticket.event_title}</h5>
                <div className="status-badges">
                    <span className={`badge badge-modern badge-${ticket.status === 'active' ? 'active' : 'used'}`}>
                        <i className="fas fa-circle me-1" style={{ fontSize: '0.5rem' }}></i>
                        {ticket.status}
                    </span>
                    <span className={`badge badge-modern badge-${ticket.payment_status === 'completed' ? 'completed' : 'pending'}`}>
                        <i className={`fas fa-${ticket.payment_status === 'completed' ? 'check' : 'clock'} me-1`}></i>
                        {ticket.payment_status}
                    </span>
                </div>
            </div>
            
            <div className="card-body">
                <div className="ticket-info">
                    <InfoRow icon="fa-calendar-alt" label="Event Date" value={formatDate(ticket.event_date)} />
                    <InfoRow icon="fa-map-marker-alt" label="Location" value={ticket.location} />
                    <InfoRow icon="fa-ticket-alt" label="Ticket Code">
                        <span className="ticket-code">{ticket.ticket_code}</span>
                    </InfoRow>
                    {ticket.amount && (
                        <InfoRow icon="fa-money-bill-wave" label="Amount Paid" value={`KSh ${Number(ticket.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}`} />
                    )}
                    <InfoRow icon="fa-receipt" label="Transaction ID" value={ticket.transaction_id || 'N/A'} />
                </div>
                <div className="text-muted mt-3" style={{ fontSize: '0.85rem' }}>
                    <i className="fas fa-clock me-2"></i>Purchased on {formatDate(ticket.purchase_date)}
                </div>
            </div>
            
            <div className="card-footer">
                <div className="d-grid">
                    <Link to={`/tickets/${ticket.id}`} className="btn btn-view-ticket">
                        <i className="fas fa-eye me-2"></i>View Full Ticket
                    </Link>
                </div>
            </div>
        </div>
    </div>
);

const InfoRow = ({ icon, label, value, children }) => (
    <div className="info-row">
        <div className="info-icon"><i className={`fas ${icon}`}></i></div>
        <div className="info-content">
            <div className="info-label">{label}</div>
            <div className="info-value">{value || children}</div>
        </div>
    </div>
);