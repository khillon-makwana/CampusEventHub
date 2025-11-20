// src/components/Tickets/ViewTicket.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

        // Temporarily remove transform for capture
        const originalTransform = ticketContainer.style.transform;
        ticketContainer.style.transform = 'none';

        html2canvas(ticketContainer, {
            scale: 2,
            backgroundColor: null,
            logging: false,
            useCORS: true
        }).then(canvas => {
            // Restore transform
            ticketContainer.style.transform = originalTransform;

            if (type === 'image') {
                canvas.toBlob(function (blob) {
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

    const { user, ticket } = data;

    return (
        <Layout user={user}>
            <div className="container mt-4 view-ticket-container">

                {/* Header Actions */}
                <div className="ticket-page-header no-print">
                    <h2>Your Ticket</h2>
                    <Link to="/tickets" className="btn-back-outline">
                        <i className="fas fa-arrow-left"></i> Back to Tickets
                    </Link>
                </div>

                <AnimatePresence>
                    {showCopyNotification && (
                        <motion.div
                            className="copy-toast"
                            initial={{ opacity: 0, y: -20, x: 20 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, y: -20, x: 20 }}
                        >
                            <i className="fas fa-check-circle"></i>
                            Ticket code copied!
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Ticket Visual */}
                <motion.div
                    className="ticket-visual"
                    id="ticketContainer"
                    initial={{ opacity: 0, y: 50, rotateX: -10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                >
                    {/* Header */}
                    <div className="ticket-visual-header">
                        <span className="ticket-type-badge">General Admission</span>
                        <h1 className="ticket-event-title">{ticket.event_title}</h1>
                        <p className="mb-0 text-white-50">Present this ticket at the entrance</p>
                    </div>

                    {/* Divider */}
                    <div className="ticket-visual-divider">
                        <div className="dashed-line"></div>
                    </div>

                    {/* Body */}
                    <div className="ticket-visual-body">
                        <div className="qr-container">
                            <div className="qr-code-box">
                                <i className="fas fa-qrcode"></i>
                            </div>
                        </div>

                        <div className="ticket-code-display">
                            <div
                                className="code-text"
                                onClick={copyTicketCode}
                                title="Click to copy"
                            >
                                {ticket.ticket_code}
                            </div>
                            <span className="copy-hint">Tap code to copy</span>
                        </div>

                        <div className="ticket-details-grid">
                            <div className="detail-item">
                                <span className="detail-label"><i className="far fa-calendar"></i> Date & Time</span>
                                <span className="detail-value">{formatDate(ticket.event_date)}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label"><i className="fas fa-map-marker-alt"></i> Location</span>
                                <span className="detail-value">{ticket.location}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label"><i className="far fa-user"></i> Attendee</span>
                                <span className="detail-value">{ticket.user_name}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label"><i className="fas fa-receipt"></i> Transaction ID</span>
                                <span className="detail-value">{ticket.transaction_id || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="ticket-visual-footer">
                        <div className="ticket-id">Ticket ID: #{ticket.id}</div>
                        <span className={`status-pill ${ticket.status}`}>
                            {ticket.status}
                        </span>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    className="ticket-actions-bar no-print"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <button onClick={() => handleDownload('pdf')} className="btn-action btn-action-primary">
                        <i className="fas fa-file-pdf"></i> Download PDF
                    </button>
                    <button onClick={() => handleDownload('image')} className="btn-action btn-action-secondary">
                        <i className="fas fa-image"></i> Save Image
                    </button>
                    <button onClick={() => window.print()} className="btn-action btn-action-secondary">
                        <i className="fas fa-print"></i> Print
                    </button>
                </motion.div>

            </div>
        </Layout>
    );
}