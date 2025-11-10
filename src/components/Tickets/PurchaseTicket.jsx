// src/components/Tickets/PurchaseTicket.jsx
import React, { useState, useEffect } from 'react';
// *** FIX: Import Link from react-router-dom ***
import { useParams, useNavigate, Link } from 'react-router-dom';
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
        setLoading(true);
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
            setLoading(false);
        }
    };

    if (loading && !data) {
        return <Layout hideNav={true} hideFooter={true}><div className="ticket-purchase-wrapper"><div className="spinner-border text-white mx-auto" role="status"></div></div></Layout>;
    }

    if (error && !data) {
        return <Layout hideNav={true} hideFooter={true}><div className="ticket-purchase-wrapper"><div className="container"><div className="alert alert-danger">{error}</div></div></div></Layout>;
    }
    
    if (!data) return <Layout hideNav={true} hideFooter={true} />;
    
    const { user, event } = data;
    // Handle case where available_tickets might be null or 0
    const maxTickets = Math.min(10, event.available_tickets || 0);
    
    return (
        <Layout user={user} hideNav={true} hideFooter={true}>
            <div className="ticket-purchase-wrapper">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 col-md-10">
                            <div className="ticket-card">
                                <div className="ticket-header">
                                    <h4><i className="fas fa-ticket-alt me-2"></i>{event.title}</h4>
                                    <div className="subtitle">Complete your ticket purchase securely</div>
                                </div>
                                <div className="ticket-body">
                                    {error && <div className="alert alert-danger">{error}</div>}

                                    <div className="row mb-4">
                                        <div className="col-md-6 mb-3 mb-md-0">
                                            <div className="info-card">
                                                <h6><i className="fas fa-info-circle"></i>Event Details</h6>
                                                <div className="info-item"><strong><i className="far fa-calendar me-2"></i>Date:</strong><span>{formatDate(event.event_date)}</span></div>
                                                <div className="info-item"><strong><i className="far fa-clock me-2"></i>Time:</strong><span>{formatTime(event.event_date)}</span></div>
                                                <div className="info-item"><strong><i className="fas fa-map-marker-alt me-2"></i>Location:</strong><span>{event.location}</span></div>
                                                <div className="info-item"><strong><i className="fas fa-user me-2"></i>Organizer:</strong><span>{event.organizer_name}</span></div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="info-card">
                                                <h6><i className="fas fa-tags"></i>Pricing Info</h6>
                                                <div className="info-item"><strong><i className="fas fa-money-bill-wave me-2"></i>Price:</strong><span>KSh {Number(event.ticket_price).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                                                <div className="info-item"><strong><i className="fas fa-tickets-alt me-2"></i>Available:</strong>
                                                    <span>
                                                        <span className={`availability-badge ${event.available_tickets < 10 ? 'low' : ''}`}>
                                                            {event.available_tickets} tickets
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="info-item"><strong><i className="fas fa-credit-card me-2"></i>Payment:</strong><span>M-Pesa</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <form onSubmit={handleSubmit}>
                                        <div className="quantity-selector">
                                            <label htmlFor="quantity"><i className="fas fa-shopping-cart me-2"></i>Number of Tickets</label>
                                            <select className="form-select" id="quantity" name="quantity" value={quantity} onChange={handleQuantityChange} required>
                                                {/* Ensure at least one option shows even if 0 tickets */}
                                                {maxTickets <= 0 && <option value="0" disabled>No tickets available</option>}
                                                {[...Array(maxTickets).keys()].map(i => (
                                                    <option key={i + 1} value={i + 1}>
                                                        {i + 1} ticket{i > 0 ? 's' : ''} - KSh {Number(event.ticket_price * (i + 1)).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="total-box">
                                            <label>Total Amount</label>
                                            <h5>KSh {Number(total).toLocaleString('en-US', {minimumFractionDigits: 2})}</h5>
                                        </div>
                                        
                                        <div className="d-grid gap-3">
                                            <button type="submit" name="purchase_tickets" className="btn btn-primary btn-purchase" disabled={loading || maxTickets <= 0}>
                                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-lock me-2"></i>}
                                                {loading ? 'Processing...' : 'Proceed to Secure Payment'}
                                            </button>
                                            <Link to={`/event/${eventId}`} className="btn btn-cancel">
                                                <i className="fas fa-arrow-left me-2"></i>
                                                Back to Event
                                            </Link>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}