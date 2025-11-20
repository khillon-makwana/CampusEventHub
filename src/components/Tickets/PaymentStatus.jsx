// src/components/Tickets/PaymentStatus.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './PaymentStatus.css';

export default function PaymentStatus() {
    const { paymentId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [phone, setPhone] = useState('2547');
    const [stkSent, setStkSent] = useState(false);
    const [stkLoading, setStkLoading] = useState(false);

    const pollingRef = useRef(null);

    // Function to poll for status
    const pollStatus = () => {
        if (pollingRef.current) clearTimeout(pollingRef.current);

        pollingRef.current = setTimeout(async () => {
            try {
                const result = await apiGet(`payment_status.php?payment_id=${paymentId}`);
                if (result.status === 'completed' && result.ticket_id) {
                    navigate(`/tickets/${result.ticket_id}?paid=1`);
                } else if (result.status === 'failed' && result.event_id) {
                    setError('Payment failed or was cancelled. Please try again.');
                    setStkSent(false); // Reset to allow retry
                } else {
                    pollStatus();
                }
            } catch (err) {
                console.error("Polling error:", err);
                pollStatus();
            }
        }, 3000);
    };

    // Fetch payment details on load
    useEffect(() => {
        const fetchPaymentDetails = async () => {
            try {
                const result = await apiGet(`payment_details.php?payment_id=${paymentId}`);
                if (result.success) {
                    setData(result);
                    if (result.payment.transaction_id && !result.payment.transaction_id.startsWith('PENDING_')) {
                        setStkSent(true);
                        pollStatus();
                    }
                } else {
                    throw new Error(result.error || 'Failed to load payment');
                }
            } catch (err) {
                setError(err.message);
                if (err.message.includes('not found')) {
                    navigate('/tickets');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchPaymentDetails();

        return () => {
            if (pollingRef.current) clearTimeout(pollingRef.current);
        };
    }, [paymentId, navigate]);

    // Handle STK Push form submission
    const handleStkPush = async (e) => {
        e.preventDefault();
        setStkLoading(true);
        setError(null);
        try {
            const result = await apiPost('mpesa_stk_push.php', {
                payment_id: paymentId,
                phone: phone
            });
            if (result.success) {
                setStkSent(true);
                pollStatus();
            } else {
                throw new Error(result.error || 'Failed to send STK push');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setStkLoading(false);
        }
    };

    // Handle manual refresh
    const handleManualRefresh = async () => {
        setStkLoading(true);
        try {
            const result = await apiPost('mpesa_query_status.php', { payment_id: paymentId });
            if (result.status === 'completed' && result.ticket_id) {
                navigate(`/tickets/${result.ticket_id}?paid=1`);
            } else {
                // Just show a toast or small message instead of full error
                alert('Payment still pending. Please check your phone.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setStkLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <Layout hideNav={true} hideFooter={true}>
                <div className="payment-status-wrapper">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            </Layout>
        );
    }

    const { user, payment } = data;

    return (
        <Layout user={user} hideNav={true} hideFooter={true}>
            <div className="payment-status-wrapper">
                <motion.div
                    className="payment-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                >
                    <div className="payment-header">
                        <div className="mpesa-icon-large">
                            <i className="fas fa-mobile-alt"></i>
                        </div>
                        <h4>M-Pesa Payment</h4>
                    </div>

                    <div className="payment-body">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    className="alert alert-danger mb-4"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="info-banner">
                            <i className="fas fa-info-circle"></i>
                            <div>
                                <h5>Secure Payment</h5>
                                <p>Enter your M-Pesa number to receive a payment prompt.</p>
                            </div>
                        </div>

                        <div className="details-list">
                            <div className="detail-row">
                                <span className="detail-label">Event</span>
                                <span className="detail-value">{payment.event_title}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Quantity</span>
                                <span className="detail-value">{payment.quantity} ticket(s)</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Total Amount</span>
                                <span className="detail-value amount-highlight">
                                    KSh {Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {!stkSent ? (
                                <motion.form
                                    key="form"
                                    onSubmit={handleStkPush}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <div className="phone-input-group">
                                        <label htmlFor="phone">M-Pesa Number</label>
                                        <input
                                            type="text"
                                            id="phone"
                                            className="phone-input"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="2547XXXXXXXX"
                                            required
                                            pattern="2547\d{8}"
                                            title="Format: 2547XXXXXXXX"
                                        />
                                    </div>

                                    <button type="submit" className="btn-pay" disabled={stkLoading}>
                                        {stkLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="fas fa-lock"></i>}
                                        {stkLoading ? 'Sending Request...' : 'Pay Now'}
                                    </button>

                                    <Link to={`/event/${payment.event_id}`} className="btn-cancel-link">
                                        Cancel Transaction
                                    </Link>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="awaiting"
                                    className="awaiting-box"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <div className="awaiting-spinner"></div>
                                    <h5 className="awaiting-text">Check your phone</h5>
                                    <p className="awaiting-subtext">Enter your M-Pesa PIN to complete the payment.</p>

                                    <button
                                        type="button"
                                        className="btn-refresh"
                                        onClick={handleManualRefresh}
                                        disabled={stkLoading}
                                    >
                                        <i className="fas fa-sync-alt me-2"></i>
                                        {stkLoading ? 'Checking...' : 'I have paid'}
                                    </button>

                                    <div className="mt-3">
                                        <Link to={`/event/${payment.event_id}`} className="btn-cancel-link text-sm">
                                            Cancel
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="security-note">
                            <i className="fas fa-shield-alt me-1"></i>
                            Secured by M-Pesa Daraja API
                        </div>
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
}