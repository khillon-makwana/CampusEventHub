// src/components/Tickets/MyTickets.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import { motion, AnimatePresence } from 'framer-motion';
import './MyTickets.css';

// Helper to format date (for the new card)
const formatTicketDate = (dateString) => {
    const date = new Date(dateString);
    return {
        month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        day: date.toLocaleString('en-US', { day: '2-digit' }),
    };
};

// Helper to format date (from your original code, for the alert)
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

    // --- Delete Logic (Using window.confirm) ---
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
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="page-header-light">
                    <div className="container">
                        <h2><i className="fas fa-ticket-alt me-3"></i>My Tickets</h2>
                    </div>
                </div>
                
                <div className="container page-content">
                    <div className="row justify-content-center">
                        <div className="col-lg-10 col-xl-8">
                            {pending_payment && (
                                <div className="alert pending-payment-alert">
                                    <h5><i className="fas fa-exclamation-triangle me-2"></i>Pending Payment</h5>
                                    <p className="mb-0">
                                        You have a pending payment of <strong>KSh {Number(pending_payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</strong> 
                                        for <strong>{pending_payment.event_title}</strong>.
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
                                    <motion.div
                                        className="ticket-list"
                                        variants={{
                                            visible: { transition: { staggerChildren: 0.07 } },
                                            hidden: {},
                                        }}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {tickets.map(ticket => (
                                            <TicketCard 
                                                key={ticket.id} 
                                                ticket={ticket} 
                                                isSelected={selectedIds.includes(ticket.id)}
                                                onSelect={handleSelectOne}
                                            />
                                        ))}
                                    </motion.div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
            
            {/* --- Floating Action Bar --- */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        className="floating-actions-bar"
                        initial={{ y: 150, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 150, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
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
                                <label htmlFor="selectAll" className="form-check-label">
                                    {selectedIds.length} Selected
                                </label>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <button type="button" className="btn btn-outline-danger" onClick={handleDeleteAll}>
                                <i className="fas fa-trash-alt me-2"></i>Delete All ({tickets.length})
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleDeleteSelected}>
                                <i className="fas fa-trash me-2"></i>Delete Selected
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
}

// --- New Ticket Card Sub-Component ---
const TicketCard = ({ ticket, isSelected, onSelect }) => {
    const { month, day } = formatTicketDate(ticket.event_date);

    // Animation variants for Framer Motion
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring' } }
    };
    
    return (
        <motion.div className="ticket-card-wrapper" variants={cardVariants}>
            <div className={`ticket-card ${isSelected ? 'selected' : ''}`}>
                
                {/* === PART 1: THE STUB === */}
                <div className="ticket-stub">
                    <div className="ticket-date">
                        <span className="month">{month}</span>
                        <span className="day">{day}</span>
                    </div>
                    <div className="ticket-status">
                        <span className={`status-dot status-${ticket.status}`}></span>
                        {ticket.status}
                    </div>
                </div>
                
                {/* === PART 2: THE BODY === */}
                <div className="ticket-body">
                    <div className="ticket-header">
                        <h5 className="ticket-title">{ticket.event_title}</h5>
                        <div className="form-check ticket-checkbox">
                            <input 
                                type="checkbox" 
                                value={ticket.id} 
                                className="form-check-input"
                                checked={isSelected}
                                onChange={(e) => onSelect(e, ticket.id)}
                                onClick={(e) => e.stopPropagation()} // Stop click from bubbling
                            />
                        </div>
                    </div>
                    <div className="ticket-info">
                        <span><i className="fas fa-map-marker-alt me-2"></i>{ticket.location}</span>
                        <span><i className="fas fa-receipt me-2"></i>{ticket.transaction_id || 'N/A'}</span>
                    </div>
                    <div className="ticket-code-wrapper">
                        <span className="ticket-code-label">Ticket Code:</span>
                        <span className="ticket-code">{ticket.ticket_code}</span>
                    </div>
                </div>
                
                {/* === PART 3: THE ACTIONS === */}
                <div className="ticket-actions">
                    <Link to={`/tickets/${ticket.id}`} className="btn-view-ticket">
                        <i className="fas fa-eye me-2"></i>View
                    </Link>
                </div>

            </div>
        </motion.div>
    );
};