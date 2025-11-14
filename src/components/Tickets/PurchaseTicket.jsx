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
                    setTotal(result.event.ticket_price * 1); // Set initial total
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
        setLoading(true); // Use setLoading for the whole page
        setError(null);
        try {
            const result = await apiPost('purchase_ticket.php', {
                event_id: eventId,
                quantity: quantity
            });
            if (result.success && result.payment_id) {
                // Redirect to the payment processing page
                navigate(`/payment-status/${result.payment_id}`);
            } else {
                throw new Error(result.error || 'Failed to create payment');
            }
        } catch (err) {
            setError(err.message);
            setLoading(false); // Only set loading false on error
        }
    };

    // Loading State
    if (loading && !data) {
        return (
            <div className="ticket-purchase-wrapper d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}} role="status"></div>
            </div>
        );
    }
    
    // Error State
    if (error && !data) {
        return (
            <div className="ticket-purchase-wrapper d-flex align-items-center justify-content-center">
                <div className="container"><div className="alert alert-danger">{error}</div></div>
            </div>
        );
    }
    
    if (!data) return null;
    
    const { user, event, unread_count } = data;
    const maxTickets = Math.min(10, event.available_tickets || 0);
    const eventImageUrl = event.image ? `http://localhost/CampusEventHub/${event.image}` : null;

    // Animation Variants
    const colVariants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100, damping: 20, delay: 0.1 } }
    };
    const formVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100, damping: 20, delay: 0.3 } }
    };
    
    return (
        // We hide the standard nav/footer for a focused checkout experience
        <Layout user={user} unread_count={unread_count} hideNav={true} hideFooter={true}>
            <div className="container-fluid p-0">
                <div className="row g-0 ticket-purchase-wrapper">
                    
                    {/* --- Left Column (Details) --- */}
                    <motion.div 
                        className="col-lg-7 purchase-details-col"
                        variants={colVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Use a Link for SPA navigation */}
                        <Link to={`/event/${eventId}`} className="btn btn-cancel mb-4" style={{width: 'auto', alignSelf: 'flex-start'}}>
                            <i className="fas fa-arrow-left me-2"></i>
                            Back to Event
                        </Link>

                        <div className="event-image-header">
                            {eventImageUrl ? (
                                <img src={eventImageUrl} alt={event.title} />
                            ) : (
                                <div className="event-image-header-placeholder">
                                    <i className="fas fa-calendar-alt"></i>
                                </div>
                            )}
                        </div>
                        
                        <h1 className="event-title-header">{event.title}</h1>
                        <p className="event-organizer">by {event.organizer_name}</p>

                        <div className="info-grid mt-3">
                            <div className="info-item">
                                <span className="info-label">Date & Time</span>
                                <span className="info-value">
                                    <i className="far fa-calendar"></i>
                                    {formatDate(event.event_date)} at {formatTime(event.event_date)}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Location</span>
                                <span className="info-value">
                                    <i className="fas fa-map-marker-alt"></i>
                                    {event.location}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* --- Right Column (Form) --- */}
                    <motion.div 
                        className="col-lg-5 purchase-form-col"
                        variants={formVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="checkout-card">
                            {error && <div className="alert alert-danger">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="quantity-selector">
                                    <label htmlFor="quantity">Select Quantity</label>
                                    <select className="form-select" id="quantity" name="quantity" value={quantity} onChange={handleQuantityChange} required>
                                        {maxTickets <= 0 && <option value="0" disabled>No tickets available</option>}
                                        {[...Array(maxTickets).keys()].map(i => (
                                            <option key={i + 1} value={i + 1}>
                                                {i + 1} ticket{i > 0 ? 's' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="total-box">
                                    <label>Total Amount</label>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={total} // This makes it animate when `total` changes
                                            className="total-price"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.1 }}
                                        >
                                            KSh {Number(total).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                
                                <div className="d-grid gap-3">
                                    <motion.button 
                                        type="submit" 
                                        name="purchase_tickets" 
                                        className="btn btn-primary btn-purchase" 
                                        disabled={loading || maxTickets <= 0}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-lock me-2"></i>}
                                        {loading ? 'Processing...' : 'Proceed to Payment'}
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                        {/* "Back" link for mobile */}
                        <div className="d-lg-none text-center mt-3">
                             <Link to={`/event/${eventId}`} className="btn-cancel">
                                <i className="fas fa-arrow-left me-2"></i>
                                Back to Event
                            </Link>
                        </div>
                    </motion.div>

                </div>
            </div>
        </Layout>
    );
}