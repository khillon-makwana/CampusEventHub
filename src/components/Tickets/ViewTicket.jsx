// src/components/Tickets/ViewTicket.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../../api';
import Layout from '../Layout';
import './ViewTicket.css';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

// Info item component
const InfoItem = ({ icon, label, value, children }) => (
    <div className="info-item">
        <div className="info-label">
            <i className={`fas ${icon}`}></i>
            {label}
        </div>
        <div className="info-value">{value || children}</div>
    </div>
);

export default function ViewTicket() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCopyNotification, setShowCopyNotification] = useState(false);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const result = await apiGet(`view_ticket.php?ticket_id=${id}`);
                if (result.success) {
                    setData(result);
                } else {
                    throw new Error(result.error || 'Failed to load ticket');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [id]);

    const copyTicketCode = () => {
        if (!data?.ticket) return;
        navigator.clipboard.writeText(data.ticket.ticket_code).then(() => {
            setShowCopyNotification(true);
            setTimeout(() => setShowCopyNotification(false), 3000);
        });
    };

    const handleDownload = (type) => {
        const ticketContainer = document.getElementById('ticketContainer');
        if (!ticketContainer) return;

        html2canvas(ticketContainer, {
            scale: 2,
            backgroundColor: '#f8f9fa',
            logging: false,
            useCORS: true
        }).then(canvas => {
            if (type === 'image') {
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `ticket-${data.ticket.ticket_code}.png`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                });
            } else if (type === 'pdf') {
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 210;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                const yOffset = (297 - imgHeight) / 2;
                pdf.addImage(imgData, 'PNG', 0, yOffset > 0 ? yOffset : 0, imgWidth, imgHeight);
                pdf.save(`ticket-${data.ticket.ticket_code}.pdf`);
            }
        });
    };

    if (loading) {
        return (
            <Layout>
                <div className="container text-center py-5">
                    <div className="spinner-border text-primary" role="status">
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
                    <div className="alert alert-danger" role="alert">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                </div>
            </Layout>
        );
    }

    if (!data) return <Layout />;

    const { user, ticket } = data;

    return (
        <Layout user={user}>
            <div className="container">
                <div className="d-flex justify-content-between align-items-center mb-4 no-print" style={{ marginTop: '2rem' }}>
                    <h2 style={{ color: '#333', fontWeight: 600, margin: 0 }}>Your Event Ticket</h2>
                    <Link to="/tickets" className="btn btn-secondary-custom">
                        <i className="fas fa-arrow-left"></i>
                        Back to Tickets
                    </Link>
                </div>
                
                {showCopyNotification && (
                    <div className="copy-notification" style={{ display: 'flex' }}>
                        <i className="fas fa-check-circle"></i>
                        <span>Ticket code copied to clipboard!</span>
                    </div>
                )}

                <div className="ticket-wrapper">
                    <div className="ticket-container" id="ticketContainer">
                        <div className="ticket-pattern"></div>
                        
                        <div className="ticket-header">
                            <h1>
                                <i className="fas fa-ticket-alt" style={{ marginRight: '0.5rem' }}></i>
                                EVENT TICKET
                            </h1>
                            <p className="event-title">{ticket.event_title}</p>
                        </div>

                        <div className="ticket-divider">
                            <div className="ticket-divider-line"></div>
                        </div>

                        <div className="ticket-body">
                            <div className="qr-section">
                                <div className="qr-placeholder">
                                    <i className="fas fa-qrcode"></i>
                                </div>
                            </div>
                            
                            <div 
                                className="ticket-code" 
                                id="ticketCode" 
                                onClick={copyTicketCode}
                                title="Click to copy ticket code"
                            >
                                {ticket.ticket_code}
                            </div>

                            <div className="ticket-info">
                                <div className="info-row">
                                    <InfoItem 
                                        icon="fa-calendar" 
                                        label="Event" 
                                        value={ticket.event_title} 
                                    />
                                    <InfoItem 
                                        icon="fa-clock" 
                                        label="Date & Time" 
                                        value={formatDate(ticket.event_date)} 
                                    />
                                </div>
                                <div className="info-row">
                                    <InfoItem 
                                        icon="fa-map-marker-alt" 
                                        label="Location" 
                                        value={ticket.location} 
                                    />
                                    <InfoItem 
                                        icon="fa-user" 
                                        label="Ticket Holder" 
                                        value={ticket.user_name} 
                                    />
                                </div>
                            </div>
                            
                            {ticket.amount > 0 && (
                                <div className="ticket-info">
                                    <div className="info-row">
                                        <InfoItem 
                                            icon="fa-money-bill-wave" 
                                            label="Amount Paid" 
                                            value={`KSh ${Number(ticket.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
                                        />
                                        <InfoItem 
                                            icon="fa-receipt" 
                                            label="Transaction ID" 
                                            value={ticket.transaction_id || 'N/A'} 
                                        />
                                    </div>
                                    <div className="info-row">
                                        <InfoItem 
                                            icon="fa-mobile-alt" 
                                            label="M-Pesa Receipt" 
                                            value={ticket.mpesa_receipt_number || 'N/A'} 
                                        />
                                        <InfoItem 
                                            icon="fa-calendar-check" 
                                            label="Purchase Date" 
                                            value={formatDate(ticket.purchase_date)} 
                                        />
                                    </div>
                                    <div className="info-row">
                                        <InfoItem icon="fa-check-circle" label="Payment Status">
                                            <span className={`status-badge status-${ticket.payment_status}`}>
                                                {ticket.payment_status}
                                            </span>
                                        </InfoItem>
                                        {ticket.quantity > 1 && (
                                            <InfoItem 
                                                icon="fa-ticket-alt" 
                                                label="Tickets in Order" 
                                                value={`${ticket.quantity} tickets`} 
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="ticket-footer">
                            <p style={{ margin: '0 0 8px 0' }}>
                                <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                                Please present this ticket at the event entrance
                            </p>
                            <p style={{ margin: 0 }}>
                                Ticket ID: #{ticket.id} | {' '}
                                <span className={`status-badge status-${ticket.status}`}>
                                    {ticket.status}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="action-buttons no-print" style={{ marginTop: '2rem' }}>
                    <button 
                        onClick={() => handleDownload('pdf')} 
                        className="btn btn-primary-custom"
                    >
                        <i className="fas fa-file-pdf"></i>
                        Download as PDF
                    </button>
                    <button 
                        onClick={() => handleDownload('image')} 
                        className="btn btn-primary-custom"
                    >
                        <i className="fas fa-image"></i>
                        Download as Image
                    </button>
                    <button 
                        onClick={() => window.print()} 
                        className="btn btn-secondary-custom"
                    >
                        <i className="fas fa-print"></i>
                        Print Ticket
                    </button>
                </div>
                
                <div className="alert-custom no-print" style={{ marginTop: '2rem', marginBottom: '3rem' }}>
                    <h5 style={{ margin: '0 0 15px 0' }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '0.5rem' }}></i>
                        Important Information
                    </h5>
                    <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                        <li>Please bring a valid ID matching the ticket holder name</li>
                        <li>This ticket is non-transferable and non-refundable</li>
                        <li>Keep this ticket safe - it's your entry pass to the event</li>
                        <li>For any issues, contact the event organizer</li>
                        {ticket.status === 'active' && (
                            <li>
                                <strong>This ticket is ACTIVE and valid for entry</strong>
                            </li>
                        )}
                        {ticket.status === 'used' && (
                            <li>
                                <strong>This ticket has been USED and is no longer valid</strong>
                            </li>
                        )}
                        {ticket.status === 'cancelled' && (
                            <li>
                                <strong>This ticket has been CANCELLED and is not valid for entry</strong>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </Layout>
    );
}