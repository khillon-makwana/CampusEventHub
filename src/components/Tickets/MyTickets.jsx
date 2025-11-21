// src/components/Tickets/MyTickets.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './MyTickets.css';

// Helper to format date
const formatTicketDate = (dateString) => {
    const date = new Date(dateString);
    return {
        month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        day: date.toLocaleString('en-US', { day: '2-digit' }),
    };
};

// Animated Section Wrapper
const AnimatedSection = ({ children, className = '', delay = 0.1 }) => (
    <motion.div
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20, delay }}
    >
        {children}
    </motion.div>
);

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

    // --- Delete Logic ---
    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} ticket(s)? This action cannot be undone.`)) {
            try {
                const result = await apiPost('my_tickets.php', { ticket_ids: selectedIds });
                if (result.success) {
                    setSelectedIds([]);
                    fetchData();
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
                    fetchData();
                } else {
                    throw new Error(result.error || 'Failed to delete all tickets');
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="container text-center py-5" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="container py-5">
                    <div className="alert alert-danger shadow-sm rounded-3">{error}</div>
                </div>
            </Layout>
        );
    }

    if (!data) return <Layout />;

    const { user, tickets, pending_payment, unread_count } = data;
    const allSelected = tickets.length > 0 && selectedIds.length === tickets.length;
    const someSelected = selectedIds.length > 0 && !allSelected;

    return (
        <Layout user={user} unread_count={unread_count}>
            <div className="container mt-4 my-tickets-container">
                {/* Header */}
                <AnimatedSection className="tickets-header">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2><i className="fas fa-ticket-alt"></i> My Tickets</h2>
                            <p className="text-white-50">Manage your upcoming events and tickets</p>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Pending Payment Alert */}
                {pending_payment && (
                    <AnimatedSection delay={0.2} className="pending-payment-alert">
                        <i className="fas fa-exclamation-circle"></i>
                        <div className="pending-payment-content">
                            <h5>Pending Payment</h5>
                            <p>
                                You have a pending payment of <strong>KSh {Number(pending_payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                                for <strong>{pending_payment.event_title}</strong>.
                                <Link to={`/process-payment/${pending_payment.id}`} className="alert-link">
                                    Complete Payment <i className="fas fa-arrow-right"></i>
                                </Link>
                            </p>
                        </div>
                    </AnimatedSection>
                )}

                {/* Ticket List */}
                {tickets.length === 0 ? (
                    <AnimatedSection delay={0.3} className="empty-state">
                        <div className="empty-state-icon"><i className="fas fa-ticket-alt"></i></div>
                        <h3 className="text-white">No Tickets Yet</h3>
                        <p className="text-white-50">You haven't purchased any tickets yet. Start exploring amazing events!</p>
                        <Link to="/events" className="btn-browse-events">
                            <i className="fas fa-calendar-plus"></i> Browse Events
                        </Link>
                    </AnimatedSection>
                ) : (
                    <div className="ticket-list">
                        <AnimatePresence>
                            {tickets.map((ticket, index) => (
                                <TicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                    isSelected={selectedIds.includes(ticket.id)}
                                    onSelect={handleSelectOne}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Floating Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        className="floating-actions-bar"
                        initial={{ y: 100, opacity: 0, x: '-50%' }}
                        animate={{ y: 0, opacity: 1, x: '-50%' }}
                        exit={{ y: 100, opacity: 0, x: '-50%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
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
                        <div className="action-buttons-group">
                            <button type="button" className="btn-float-action btn-float-outline" onClick={handleDeleteAll}>
                                <i className="fas fa-trash-alt"></i> Delete All
                            </button>
                            <button type="button" className="btn-float-action btn-float-danger" onClick={handleDeleteSelected}>
                                <i className="fas fa-trash"></i> Delete Selected
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
}

// Ticket Card Component
const TicketCard = ({ ticket, isSelected, onSelect, index }) => {
    const { month, day } = formatTicketDate(ticket.event_date);

    return (
        <motion.div
            className="ticket-card-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.1 }}
        >
            <div className={`ticket-card ${isSelected ? 'selected' : ''}`}>
                {/* Stub */}
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

                {/* Body */}
                <div className="ticket-body">
                    <div className="ticket-header-row">
                        <h3 className="ticket-title">{ticket.event_title}</h3>
                        <div className="form-check ticket-checkbox">
                            <input
                                type="checkbox"
                                value={ticket.id}
                                className="form-check-input"
                                checked={isSelected}
                                onChange={(e) => onSelect(e, ticket.id)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                    <div className="ticket-info">
                        <span><i className="fas fa-map-marker-alt"></i> {ticket.location}</span>
                        <span><i className="fas fa-receipt"></i> {ticket.transaction_id || 'N/A'}</span>
                    </div>
                    <div className="ticket-code-wrapper">
                        <span className="ticket-code-label">Code:</span>
                        <span className="ticket-code">{ticket.ticket_code}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="ticket-actions">
                    <Link to={`/tickets/${ticket.id}`} className="btn-view-ticket">
                        <i className="fas fa-eye"></i> View Ticket
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};