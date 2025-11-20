// src/components/Tickets/PurchaseTicket.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './PurchaseTicket.css';

// Helper to format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
};
const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export default function PurchaseTicket() {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [total, setTotal] = useState(0);

    // Fetch event data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await apiGet(`purchase_ticket.php?event_id=${eventId}`);
                if (result.success) {
                    setData(result);
                    setTotal(result.event.ticket_price * 1);
                } else {
                    throw new Error(result.error || 'Failed to load event');
                }
            } catch (err) {
                setError(err.message);
                if (err.message.includes('not found')) {
                    navigate('/events');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [eventId, navigate]);

    // Handle quantity change
    const handleQuantityChange = (e) => {
        const newQuantity = parseInt(e.target.value, 10);
        setQuantity(newQuantity);
        if (data?.event) {
            setTotal(data.event.ticket_price * newQuantity);
        }
    };

    // Handle purchase submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await apiPost('purchase_ticket.php', {
                event_id: eventId,
                quantity: quantity
            });
            if (result.success && result.payment_id) {
                navigate(`/payment-status/${result.payment_id}`);
            } else {
                throw new Error(result.error || 'Failed to create payment');
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Loading State
    if (loading && !data) {
        return (
            <div className="purchase-wrapper d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
            </div>
        );
    }

    // Error State
    if (error && !data) {
        return (
            <div className="purchase-wrapper d-flex align-items-center justify-content-center">
                <div className="container"><div className="alert alert-danger">{error}</div></div>
            </div>
        );
    }

    if (!data) return null;

    const { user, event, unread_count } = data;
    const maxTickets = Math.min(10, event.available_tickets || 0);
    const eventImageUrl = event.image ? `http://localhost/CampusEventHub/${event.image}` : null;

    return (
        <Layout user={user} unread_count={unread_count} hideNav={true} hideFooter={true}>
            <div className="container-fluid p-0">
                <div className="row g-0 purchase-wrapper">

                    {/* Left Column: Event Details */}
                    <motion.div
                        className="col-lg-7 purchase-details-col"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link to={`/event/${eventId}`} className="btn-back">
                            <i className="fas fa-arrow-left"></i> Back to Event
                        </Link>

                        <div className="event-image-card">
                            {eventImageUrl ? (
                                <img src={eventImageUrl} alt={event.title} />
                            ) : (
                                <div className="event-placeholder">
                                    <i className="fas fa-calendar-alt"></i>
                                </div>
                            )}
                        </div>

                        <h1 className="event-title-large">{event.title}</h1>
                        <p className="event-organizer">by {event.organizer_name}</p>

                        <div className="info-grid">
                            <div className="info-card">
                                <span className="info-label">Date & Time</span>
                                <span className="info-value">
                                    <i className="far fa-calendar"></i>
                                    {formatDate(event.event_date)}
                                </span>
                                <small className="text-muted mt-1 d-block">{formatTime(event.event_date)}</small>
                            </div>
                            <div className="info-card">
                                <span className="info-label">Location</span>
                                <span className="info-value">
                                    <i className="fas fa-map-marker-alt"></i>
                                    {event.location}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Checkout Form */}
                    <motion.div
                        className="col-lg-5 purchase-form-col"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="checkout-card">
                            <div className="checkout-header">
                                <h2>Checkout</h2>
                                <p>Complete your purchase</p>
                            </div>

                            {error && <div className="alert alert-danger mb-4">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="quantity">Select Quantity</label>
                                    <select
                                        className="quantity-select"
                                        id="quantity"
                                        name="quantity"
                                        value={quantity}
                                        onChange={handleQuantityChange}
                                        required
                                    >
                                        {maxTickets <= 0 && <option value="0" disabled>No tickets available</option>}
                                        {[...Array(maxTickets).keys()].map(i => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1} ticket{i > 0 ? 's' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="total-summary">
                                    <span className="total-label">Total Amount</span>
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={total}
                                            className="total-amount"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        >
                                            KSh {Number(total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>

                                <motion.button
                                    type="submit"
                                    className="btn-purchase"
                                    disabled={loading || maxTickets <= 0}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-lock"></i>
                                            Proceed to Payment
                                        </>
                                    )}
                                </motion.button>
                            </form>
                        </div>

                        <div className="d-lg-none text-center mt-4">
                            <Link to={`/event/${eventId}`} className="btn-back">
                                <i className="fas fa-arrow-left"></i> Cancel
                            </Link>
                        </div>
                    </motion.div>

                </div>
            </div>
        </Layout>
    );
}