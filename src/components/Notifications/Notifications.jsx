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

    // Animation Variants
    const listVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05, // Stagger items
            },
        },
    };
    const itemVariants = {
        hidden: { opacity: 0, x: -30 },
        visible: { opacity: 1, x: 0 },
    };

    if (loading && !data) {
        return <Layout><div className="container text-center py-5"><div className="spinner-border text-primary" role="status"></div></div></Layout>;
    }
    
    if (error) {
        return <Layout user={data?.user} unread_count={data?.unread_count}><div className="container py-5"><div className="alert alert-danger">{error}</div></div></Layout>;
    }
    
    if (!data) return <Layout />;

    const { user, notifications, pagination, unread_count } = data;

    return (
        <Layout user={user} unread_count={unread_count}>
            <motion.div 
                className="container mt-4 notifications-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <motion.div 
                    className="notification-header text-white mb-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
                >
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h1 className="h3 mb-2">Your Notifications</h1>
                            <p className="mb-0 opacity-75">Stay updated with your event activities</p>
                        </div>
                        <div className="col-md-4 text-md-end">
                            {unread_count > 0 && (
                                <span className="badge bg-warning badge-glow px-3 py-2">
                                    <i className="fas fa-bell me-1"></i>
                                    {unread_count} unread
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Action Bar */}
                <motion.div 
                    className="action-bar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="btn-group">
                        <button onClick={() => handleAction('mark_all_read')} className="btn btn-success btn-modern">
                            <i className="fas fa-check-double me-2"></i>Mark All Read
                        </button>
                        <button onClick={() => handleAction('clear_all')} className="btn btn-outline-danger">
                            <i className="fas fa-trash me-2"></i>Clear All
                        </button>
                    </div>
                    <Link to="/notification-settings" className="btn btn-outline-primary">
                        <i className="fas fa-cog me-2"></i>Settings
                    </Link>
                </motion.div>

                {error && <div className="alert alert-danger">{error}</div>}

                {/* Notifications Card */}
                <motion.div 
                    className="card glass-card border-0 overflow-hidden"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="card-body p-0">
                        {notifications.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon"><i className="fas fa-bell-slash"></i></div>
                                <h3 className="mb-3">All Caught Up!</h3>
                                <p className="text-muted mb-4">You don't have any notifications at the moment.</p>
                                <Link to="/events" className="btn btn-modern">
                                    <i className="fas fa-calendar-plus me-2"></i>Discover Events
                                </Link>
                            </div>
                        ) : (
                            <motion.div 
                                className="list-group list-group-flush p-3"
                                variants={listVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {notifications.map((n) => (
                                    <motion.div 
                                        key={n.id} 
                                        variants={itemVariants}
                                        className={`list-group-item list-group-item-action notification-item p-0 border-0 ${!n.is_read ? 'unread' : ''}`}
                                    >
                                        <div className="d-flex align-items-start p-3">
                                            <div className="flex-shrink-0 me-3">
                                                <div className={`notification-icon ${n.notification_type || 'default'}`}>
                                                    <i className={`fas ${getIconClass(n.notification_type)}`}></i>
                                                </div>
                                            </div>
                                            <div className="notification-content">
                                                <div className="notification-header">
                                                    <h6 className={`notification-title ${!n.is_read ? 'text-primary' : ''}`}>
                                                        {n.title}
                                                    </h6>
                                                    <div className="d-flex align-items-center">
                                                        {!n.is_read && <span className="badge bg-primary me-2">New</span>}
                                                        <small className="notification-time">{timeAgo(n.created_at)}</small>
                                                    </div>
                                                </div>
                                                <p className="notification-message mb-2">{n.message}</p>
                                                {n.event_id && (
                                                    <div className="mt-3 notification-actions">
                                                        <Link to={`/event/${n.event_id}`} className="btn btn-sm btn-modern me-2">
                                                            <i className="fas fa-eye me-1"></i>View Event
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
                
                <Pagination pagination={pagination} setSearchParams={setSearchParams} />
            </motion.div>
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
            className="mt-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
        >
            <ul className="pagination pagination-modern justify-content-center">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageClick(page - 1)}>
                        <i className="fas fa-chevron-left me-1"></i>Previous
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
                        Next<i className="fas fa-chevron-right ms-1"></i>
                    </button>
                </li>
            </ul>
        </motion.nav>
    );
};