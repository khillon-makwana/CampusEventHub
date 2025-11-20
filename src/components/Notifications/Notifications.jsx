// src/components/Notifications/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './Notifications.css';

// Time Ago Helper
const timeAgo = (dateString) => {
    const time_ago = new Date().getTime() - new Date(dateString).getTime();
    if (time_ago < 3600000) { // 1 hour
        return Math.ceil(time_ago / 60000) + 'm ago';
    } else if (time_ago < 86400000) { // 24 hours
        return Math.ceil(time_ago / 3600000) + 'h ago';
    } else {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

// Icon Helper
const getIconClass = (type) => {
    const icons = {
        'event_reminder': 'fa-clock',
        'new_event': 'fa-calendar-plus',
        'event_update': 'fa-edit',
        'rsvp_confirmation': 'fa-check-circle',
        'event_cancelled': 'fa-times-circle',
    };
    return icons[type] || 'fa-bell';
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

export default function Notifications() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const page = searchParams.get('page') || '1';

    const fetchData = async () => {
        try {
            const result = await apiGet(`notifications.php?page=${page}`);
            if (result.success) {
                setData(result);
            } else {
                throw new Error(result.error || 'Failed to load');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [page]);

    const handleAction = async (action) => {
        if (action === 'clear_all' && !window.confirm('Are you sure you want to clear all notifications?')) {
            return;
        }
        try {
            const result = await apiPost('notifications_actions.php', { action });
            if (result.success) {
                fetchData(); // Refresh list
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading && !data) {
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
            <Layout user={data?.user} unread_count={data?.unread_count}>
                <div className="container py-5">
                    <div className="alert alert-danger shadow-sm rounded-3">{error}</div>
                </div>
            </Layout>
        );
    }

    if (!data) return <Layout />;

    const { user, notifications, pagination, unread_count } = data;

    return (
        <Layout user={user} unread_count={unread_count}>
            <div className="container mt-4 notifications-container">
                {/* Header */}
                <AnimatedSection className="notification-header">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h1>Your Notifications</h1>
                            <p className="mb-0">Stay updated with your event activities</p>
                        </div>
                        <div className="col-md-4 text-md-end mt-3 mt-md-0">
                            {unread_count > 0 && (
                                <motion.span
                                    className="badge badge-glow px-3 py-2 rounded-pill"
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                >
                                    <i className="fas fa-bell me-2"></i>
                                    {unread_count} unread
                                </motion.span>
                            )}
                        </div>
                    </div>
                </AnimatedSection>

                {/* Action Bar */}
                <AnimatedSection delay={0.2} className="action-bar">
                    <div className="d-flex gap-2">
                        <button onClick={() => handleAction('mark_all_read')} className="btn btn-modern btn-modern-primary">
                            <i className="fas fa-check-double"></i> Mark All Read
                        </button>
                        <button onClick={() => handleAction('clear_all')} className="btn btn-modern btn-modern-danger">
                            <i className="fas fa-trash-alt"></i> Clear All
                        </button>
                    </div>
                    <Link to="/notification-settings" className="btn btn-modern btn-modern-outline">
                        <i className="fas fa-cog"></i> Settings
                    </Link>
                </AnimatedSection>

                {/* Notifications List */}
                <AnimatedSection delay={0.3} className="notifications-list-card">
                    {notifications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><i className="fas fa-bell-slash"></i></div>
                            <h3>All Caught Up!</h3>
                            <p>You don't have any notifications at the moment.</p>
                            <Link to="/events" className="btn btn-modern btn-modern-primary mt-3">
                                <i className="fas fa-calendar-plus"></i> Discover Events
                            </Link>
                        </div>
                    ) : (
                        <div className="list-group list-group-flush">
                            <AnimatePresence>
                                {notifications.map((n, index) => (
                                    <motion.div
                                        key={n.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                                    >
                                        <div className={`notification-icon ${n.notification_type || 'default'}`}>
                                            <i className={`fas ${getIconClass(n.notification_type)}`}></i>
                                        </div>
                                        <div className="notification-content">
                                            <div className="notification-title-row">
                                                <h6 className="notification-title">{n.title}</h6>
                                                <small className="notification-time">{timeAgo(n.created_at)}</small>
                                            </div>
                                            <p className="notification-message">{n.message}</p>
                                            {n.event_id && (
                                                <div className="notification-actions">
                                                    <Link to={`/event/${n.event_id}`} className="btn-sm-action">
                                                        <i className="fas fa-eye me-1"></i> View Event
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </AnimatedSection>

                <Pagination pagination={pagination} setSearchParams={setSearchParams} />
            </div>
        </Layout>
    );
}

// Reusable Pagination Component
const Pagination = ({ pagination, setSearchParams }) => {
    if (pagination.total_pages <= 1) return null;

    const page = parseInt(pagination.page, 10);
    const total_pages = parseInt(pagination.total_pages, 10);

    const handlePageClick = (newPage) => {
        if (newPage < 1 || newPage > total_pages) return;
        setSearchParams({ page: newPage });
    };

    let pages = [];
    if (page > 2) pages.push(1);
    if (page > 3) pages.push('...');
    if (page > 1) pages.push(page - 1);
    pages.push(page);
    if (page < total_pages) pages.push(page + 1);
    if (page < total_pages - 2) pages.push('...');
    if (page < total_pages - 1) pages.push(total_pages);

    return (
        <motion.nav
            aria-label="Notification pagination"
            className="d-flex justify-content-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
        >
            <ul className="pagination pagination-modern">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageClick(page - 1)}>
                        <i className="fas fa-chevron-left me-1"></i> Prev
                    </button>
                </li>

                {pages.map((p, index) => (
                    <li key={index} className={`page-item ${p === page ? 'active' : ''} ${p === '...' ? 'disabled' : ''}`}>
                        {p === '...' ? (
                            <span className="page-link">...</span>
                        ) : (
                            <button className="page-link" onClick={() => handlePageClick(p)}>{p}</button>
                        )}
                    </li>
                ))}

                <li className={`page-item ${page >= total_pages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageClick(page + 1)}>
                        Next <i className="fas fa-chevron-right ms-1"></i>
                    </button>
                </li>
            </ul>
        </motion.nav>
    );
};