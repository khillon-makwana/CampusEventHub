// src/components/Events/MyEvents.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './MyEvents.css';

// Helper to format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

// --- Reusable Animated Section Wrapper ---
const AnimatedSection = ({ children, className = '', delay = 0.1 }) => {
    const { ref, inView } = useInView({ once: true, amount: 0.2 });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay }}
        >
            {children}
        </motion.div>
    );
};

// --- Main MyEvents Component ---
export default function MyEvents() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const filter = searchParams.get('filter') || 'all';

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const result = await apiGet('my_events.php');
            if (result.success) {
                setData(result);
            } else {
                throw new Error(result.error || 'Failed to load data');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredEvents = useMemo(() => {
        if (!data?.events) return [];
        if (filter === 'all') return data.events;
        return data.events.filter(event => event.status === filter);
    }, [data, filter]);

    const handleQuickAction = async (eventId, action, confirmMessage) => {
        if (window.confirm(confirmMessage)) {
            setActionLoading(eventId);
            try {
                const result = await apiPost('events_actions.php', { id: eventId, action });
                if (result.success) {
                    setData(prevData => {
                        const newEvents = prevData.events.map(event =>
                            event.id == result.event_id ? { ...event, status: result.new_status } : event
                        );
                        const newStats = { total: 0, upcoming: 0, ongoing: 0, completed: 0, draft: 0, cancelled: 0 };
                        newEvents.forEach(event => {
                            newStats.total++;
                            if (newStats[event.status] !== undefined) {
                                newStats[event.status]++;
                            }
                        });
                        return { ...prevData, events: newEvents, stats: newStats };
                    });
                } else {
                    throw new Error(result.error || 'Action failed');
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
                fetchData(false);
            } finally {
                setActionLoading(null);
            }
        }
    };

    if (loading) {
        return (
            <Layout user={data?.user} unread_count={data?.unread_count}>
                <div className="container mt-4 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <div className="container mt-4">
                    <div className="alert alert-danger shadow-sm rounded-3">{error}</div>
                </div>
            </Layout>
        );
    }

    if (!data) return null;

    const { user, stats, events } = data;
    const filterTabs = [
        { key: 'all', name: 'All Events', count: stats.total, icon: 'fa-layer-group' },
        { key: 'upcoming', name: 'Upcoming', count: stats.upcoming, icon: 'fa-clock' },
        { key: 'ongoing', name: 'Ongoing', count: stats.ongoing, icon: 'fa-play-circle' },
        { key: 'draft', name: 'Drafts', count: stats.draft, icon: 'fa-edit' },
        { key: 'completed', name: 'Completed', count: stats.completed, icon: 'fa-check-circle' },
        { key: 'cancelled', name: 'Cancelled', count: stats.cancelled, icon: 'fa-times-circle' },
    ];

    return (
        <Layout user={user} unread_count={data?.unread_count}>
            <div className="my-events-container">
                {/* Hero Section */}
                <AnimatedSection className="my-events-hero">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 text-center">
                            <h1 className="display-5 fw-bold mb-3 text-dark">My Events Dashboard</h1>
                            <p className="lead text-muted mb-4">
                                Create, manage, and track your events with ease.
                            </p>
                            <div className="stats-grid">
                                {Object.entries(stats).map(([key, value], index) => (
                                    <motion.div
                                        key={key}
                                        className="stat-card"
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: index * 0.1 }}
                                    >
                                        <div className="stat-number">{value}</div>
                                        <div className="stat-label">{key.replace('_', ' ')}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Header Actions */}
                <AnimatedSection delay={0.2} className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div>
                        <h2 className="h3 mb-1 fw-bold text-dark">Manage Events</h2>
                        <p className="text-muted mb-0">
                            {stats.total > 0 ? `You have ${stats.total} total events.` : "Start by creating your first event."}
                        </p>
                    </div>
                    <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Link to="/create-event" className="btn btn-form-primary d-flex align-items-center gap-2">
                            <i className="fas fa-plus-circle"></i>Create New Event
                        </Link>
                    </motion.div>
                </AnimatedSection>

                {/* Quick Action Card (Only if no events) */}
                {events.length === 0 && (
                    <AnimatedSection delay={0.3} className="quick-action-card">
                        <h3 className="mb-3 fw-bold">Ready to Launch?</h3>
                        <p className="mb-4 opacity-90 fs-5">Create your first event and start building your community today.</p>
                        <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                            <Link to="/create-event" className="action-btn">
                                <i className="fas fa-rocket me-2"></i>Launch Event
                            </Link>
                        </motion.div>
                    </AnimatedSection>
                )}

                {/* Filter Tabs */}
                {events.length > 0 && (
                    <AnimatedSection delay={0.4} className="filter-tabs">
                        {filterTabs.map(tab => (
                            <Link key={tab.key} to={`?filter=${tab.key}`} className={`filter-tab ${filter === tab.key ? 'active' : ''}`}>
                                <i className={`fas ${tab.icon}`}></i>{tab.name}
                                <span className="badge bg-light text-dark ms-1 rounded-pill border">{tab.count}</span>
                                {filter === tab.key && (
                                    <motion.span
                                        className="filter-tab-indicator"
                                        layoutId="filter-indicator"
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </AnimatedSection>
                )}

                {/* Events Grid */}
                <AnimatePresence mode="wait">
                    {events.length > 0 && filteredEvents.length === 0 ? (
                        <AnimatedSection className="col-12" key="empty">
                            <div className="empty-state">
                                <div className="empty-state-icon"><i className="fas fa-search"></i></div>
                                <h3 className="mb-3 fw-bold text-dark">No Events Found</h3>
                                <p className="text-muted mb-4">
                                    No events match the "{filter}" filter.
                                </p>
                                <Link to="?filter=all" className="btn btn-outline-primary rounded-pill px-4">View All Events</Link>
                            </div>
                        </AnimatedSection>
                    ) : (
                        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4" key="grid">
                            {filteredEvents.map((event, index) => (
                                <MyEventCard
                                    key={event.id}
                                    event={event}
                                    index={index}
                                    onQuickAction={handleQuickAction}
                                    isLoading={actionLoading === event.id}
                                />
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
}

// --- Sub-Component for the Event Card (with Motion) ---
function MyEventCard({ event, index, onQuickAction, isLoading }) {
    const navigate = useNavigate();

    const handleCardClick = (e) => {
        if (e.target.tagName === 'A' || e.target.closest('a') || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
        }
        navigate(`/event/${event.id}`);
    };

    const getStatusIcon = (status) => {
        const icons = {
            upcoming: 'fa-clock',
            ongoing: 'fa-broadcast-tower',
            draft: 'fa-pencil-alt',
            completed: 'fa-check-circle',
            cancelled: 'fa-ban'
        };
        return icons[status] || 'fa-calendar';
    };

    const categories = event.category_names ? event.category_names.split(', ').slice(0, 2) : [];
    const remainingCategories = event.category_names ? event.category_names.split(', ').length - 2 : 0;
    const eventImageUrl = event.image ? `http://localhost/CampusEventHub/${event.image}` : null;

    return (
        <motion.div
            className="col"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.05 }}
        >
            <div
                className="event-card h-100"
                onClick={handleCardClick}
                style={{ cursor: 'pointer' }}
            >
                <div className="event-card-border"></div>

                <div className="event-image-container">
                    {eventImageUrl ? (
                        <img src={eventImageUrl} className="event-image" alt={event.title} />
                    ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted">
                            <div className="text-center">
                                <i className="fas fa-image fa-3x mb-2 opacity-25"></i>
                                <p className="small mb-0">No Image</p>
                            </div>
                        </div>
                    )}
                    <div className={`event-status-badge status-${event.status}`}>
                        <i className={`fas ${getStatusIcon(event.status)} me-1`}></i>
                        {event.status}
                    </div>
                </div>

                <div className="event-card-body">
                    <h5 className="card-title text-truncate">{event.title}</h5>

                    <div className="event-meta mb-3">
                        <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-map-marker-alt"></i>
                            <span className="text-truncate">{event.location}</span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                            <i className="fas fa-calendar-alt"></i>
                            <span>{formatDate(event.event_date)}</span>
                        </div>
                        {event.ticket_price > 0 ? (
                            <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-tag"></i>
                                <span className="text-success fw-bold">KSh {Number(event.ticket_price).toLocaleString()}</span>
                            </div>
                        ) : (
                            <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-tag"></i>
                                <span className="text-success fw-bold">Free</span>
                            </div>
                        )}
                    </div>

                    {categories.length > 0 && (
                        <div className="mb-3">
                            {categories.map(cat => <span key={cat} className="category-tag">{cat}</span>)}
                            {remainingCategories > 0 && <span className="category-tag">+{remainingCategories}</span>}
                        </div>
                    )}

                    <div className="d-flex align-items-center justify-content-between mt-auto pt-3 border-top border-light">
                        <div className="text-muted small">
                            <i className="fas fa-users me-1 text-primary"></i>
                            <strong>{event.attendee_count}</strong> Going
                        </div>
                        {event.total_tickets > 0 && (
                            <div className="text-muted small">
                                <i className="fas fa-ticket-alt me-1 text-warning"></i>
                                <strong>{event.available_tickets}</strong> Left
                            </div>
                        )}
                    </div>

                    <div className="action-buttons-grid">
                        <Link to={`/event/${event.id}`} className="btn btn-card-view">
                            <i className="fas fa-eye"></i> View
                        </Link>
                        <Link to={`/edit-event/${event.id}`} className="btn btn-card-edit">
                            <i className="fas fa-edit"></i> Edit
                        </Link>

                        {/* Management Buttons */}
                        {(event.status === 'upcoming' || event.status === 'ongoing' || event.status === 'completed') && (
                            <>
                                <Link to={`/manage-rsvps/${event.id}`} className="btn btn-card-secondary" title="Manage RSVPs">
                                    <i className="fas fa-users"></i> RSVPs
                                </Link>
                                {event.ticket_price > 0 && (
                                    <Link to={`/manage-tickets/${event.id}`} className="btn btn-card-secondary" title="Manage Tickets">
                                        <i className="fas fa-ticket-alt"></i> Tickets
                                    </Link>
                                )}
                            </>
                        )}

                        {event.status === 'upcoming' && (
                            <>
                                <button className="btn btn-card-success" disabled={isLoading}
                                    onClick={(e) => { e.stopPropagation(); onQuickAction(event.id, 'mark_ongoing', 'Start this event?'); }}>
                                    {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-play"></i> Start</>}
                                </button>
                                <button className="btn btn-card-danger" disabled={isLoading}
                                    onClick={(e) => { e.stopPropagation(); onQuickAction(event.id, 'cancel', 'Cancel this event?'); }}>
                                    {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-times"></i> Cancel</>}
                                </button>
                            </>
                        )}
                        {event.status === 'ongoing' && (
                            <button className="btn btn-card-info" disabled={isLoading}
                                onClick={(e) => { e.stopPropagation(); onQuickAction(event.id, 'mark_completed', 'Complete this event?'); }}>
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-check"></i> Done</>}
                            </button>
                        )}
                        {event.status === 'draft' && (
                            <button className="btn btn-card-success" disabled={isLoading}
                                onClick={(e) => { e.stopPropagation(); onQuickAction(event.id, 'publish', 'Publish this event?'); }}>
                                {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-rocket"></i> Post</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}