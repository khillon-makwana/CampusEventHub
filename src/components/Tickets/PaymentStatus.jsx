// src/components/Tickets/PaymentStatus.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
        // Clear any existing timer
        if (pollingRef.current) {
            clearTimeout(pollingRef.current);
        }
        
        // Start new timer
        pollingRef.current = setTimeout(async () => {
            try {
                const result = await apiGet(`payment_status.php?payment_id=${paymentId}`);
                if (result.status === 'completed' && result.ticket_id) {
                    navigate(`/tickets/${result.ticket_id}?paid=1`);
                } else if (result.status === 'failed' && result.event_id) {
                    // TODO: Show error message
                    navigate(`/event/${result.event_id}`);
                } else {
                    // Still pending, poll again
                    pollStatus();
                }
            } catch (err) {
                console.error("Polling error:", err);
                pollStatus(); // Retry on error
            }
        }, 3000); // Poll every 3 seconds
    };

    // Fetch payment details on load
    useEffect(() => {
        const fetchPaymentDetails = async () => {
            try {
                const result = await apiGet(`payment_details.php?payment_id=${paymentId}`);
                if (result.success) {
                    setData(result);
                    // If STK has already been sent (e.g., page reload)
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
        
        // Cleanup timer on component unmount
        return () => {
            if (pollingRef.current) {
                clearTimeout(pollingRef.current);
            }
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
                pollStatus(); // Start polling
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
        setStkLoading(true); // Reuse loading state
        try {
            const result = await apiPost('mpesa_query_status.php', { payment_id: paymentId });
            if (result.status === 'completed' && result.ticket_id) {
                navigate(`/tickets/${result.ticket_id}?paid=1`);
            } else {
                setError('Payment still pending. Please try again in a moment.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setStkLoading(false);
        }
    };

    if (loading || !data) {
        return <Layout hideNav={true} hideFooter={true}><div className="payment-container"><div className="spinner-border text-white mx-auto" role="status"></div></div></Layout>;
    }

    const { user, payment } = data;

    return (
        <Layout user={user} hideNav={true} hideFooter={true}>
            <div className="payment-container">
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-md-8 col-lg-6">
                            <div className="card payment-card">
                                <div className="payment-header">
                                    <div className="mpesa-logo"><i className="fas fa-mobile-alt"></i></div>
                                    <h4>M-Pesa Payment</h4>
                                </div>
                                
                                <div className="payment-body">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    
                                    <div className="info-banner">
                                        <h5><i className="fas fa-info-circle me-2"></i>M-Pesa STK Push</h5>
                                        <p>Enter your M-Pesa phone number to receive a payment prompt on your device.</p>
                                    </div>
                                    
                                    <div className="details-section">
                                        <h6><i className="fas fa-receipt"></i>Payment Summary</h6>
                                        <div className="detail-row"><span className="detail-label">Event</span><span className="detail-value">{payment.event_title}</span></div>
                                        <div className="detail-row"><span className="detail-label">Amount</span><span className="detail-value amount-highlight">KSh {Number(payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                                        <div className="detail-row"><span className="detail-label">Quantity</span><span className="detail-value">{payment.quantity} ticket(s)</span></div>
                                        <div className="detail-row"><span className="detail-label">Customer</span><span className="detail-value">{payment.fullname}</span></div>
                                        <div className="detail-row"><span className="detail-label">Checkout Ref</span><span className="detail-value"><span className="transaction-code">{payment.transaction_id || 'Pending'}</span></span></div>
                                    </div>
                                    
                                    <div className="action-buttons">
                                        {!stkSent ? (
                                            <>
                                                <h6 className="text-center">Initiate Payment</h6>
                                                <form onSubmit={handleStkPush} className="mb-3" autoComplete="off">
                                                    {/* --- CENTERED INPUT --- */}
                                                    <div className="mb-3 mx-auto" style={{maxWidth: "300px"}}>
                                                        <label htmlFor="msisdn" className="form-label">M-Pesa Phone Number (2547XXXXXXX)</label>
                                                        <input type="text" className="form-control" id="msisdn" name="msisdn" 
                                                            value={phone} onChange={e => setPhone(e.target.value)}
                                                            placeholder="2547XXXXXXXX" required inputMode="numeric" pattern="2547\d{8}" />
                                                    </div>

                                                    {/* --- CENTERED BUTTONS --- */}
                                                    <div className="d-flex gap-2 mx-auto" style={{maxWidth: "300px"}}>
                                                        <button type="submit" className="btn btn-action btn-success-custom w-100" disabled={stkLoading}>
                                                            {stkLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-mobile-alt me-2"></i>}
                                                            {stkLoading ? 'Sending...' : 'Pay Now'}
                                                        </button>
                                                        <Link to={`/event/${payment.event_id}`} className="btn btn-secondary-custom btn-action w-100">
                                                            Cancel
                                                        </Link>
                                                    </div>
                                                </form>
                                            </>
                                        ) : (
                                            <div className="text-center mb-3" id="awaitingBox">
                                                <div className="mb-2"><div className="spinner-border text-success" role="status"></div></div>
                                                <div>Awaiting payment confirmation...</div>
                                                <small>Once approved on your phone, you will be redirected automatically.</small>
                                                <div className="mt-3">
                                                    <button type="button" id="refreshStatusBtn" className="btn btn-outline-success btn-sm" onClick={handleManualRefresh} disabled={stkLoading}>
                                                        <i className="fas fa-sync-alt me-1"></i> Refresh Status Now
                                                    </button>
                                                </div>
                                                <div className="text-center mt-3">
                                                    <Link to={`/event/${payment.event_id}`} className="btn btn-secondary-custom">
                                                        <i className="fas fa-arrow-left me-2"></i>Cancel & Return
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="security-notice">
                                        <small><i className="fas fa-shield-alt"></i> Transactions use official M-Pesa APIs. Do not share your PIN.</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}