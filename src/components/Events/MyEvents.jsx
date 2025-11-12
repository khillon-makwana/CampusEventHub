// src/components/Events/MyEvents.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './MyEvents.css'; // Import the new CSS

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
                <div className="container mt-4 text-center" style={{ minHeight: '60vh' }}>
                    <div className="spinner-border text-primary" role="status">
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
                    <div className="alert alert-danger">Error: {error}</div>
                </div>
            </Layout>
        );
    }

    if (!data) return null;

    const { user, stats, events } = data;
    const filterTabs = [
        { key: 'all', name: 'All', count: stats.total, icon: 'fa-layer-group' },
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
                            <h1 className="display-5 fw-bold mb-3">My Events</h1>
                            <p className="lead text-muted mb-4">
                                Manage and track all your events in one place. Create, edit, and monitor your event's performance.
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
                                        <div className="stat-label text-capitalize">{key.replace('_', ' ')}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Header Actions */}
                <AnimatedSection delay={0.2} className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="h3 mb-1">Manage Your Events</h2>
                        <p className="text-muted mb-0">
                            {stats.total > 0 ? `You have ${stats.total} events.` : "Ready to create your first amazing event?"}
                        </p>
                    </div>
                    <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Link to="/create-event" className="btn btn-primary btn-create">
                            <i className="fas fa-plus-circle me-2"></i>Create New Event
                        </Link>
                    </motion.div>
                </AnimatedSection>

                {/* Quick Action Card or Empty State */}
                {events.length === 0 ? (
                    <AnimatedSection delay={0.3} className="quick-action-card">
                        <h3 className="mb-3">Ready to Create Your First Event?</h3>
                        <p className="mb-4 opacity-90">Start your event creation journey and share amazing experiences.</p>
                        <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                            <Link to="/create-event" className="action-btn">
                                <i className="fas fa-rocket me-2"></i>Launch Your First Event
                            </Link>
                        </motion.div>
                    </AnimatedSection>
                ) : (
                    <AnimatedSection delay={0.3} className="quick-action-card">
                        <h3 className="mb-3">Event Management Hub</h3>
                        <p className="mb-4 opacity-90">Quickly access your events or create new ones.</p>
                        <div className="d-flex gap-3 flex-wrap justify-content-center">
                            <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                                <Link to="/create-event" className="action-btn"><i className="fas fa-plus-circle me-2"></i>Create New Event</Link>
                            </motion.div>
                            <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                                <Link to="/dashboard" className="action-btn"><i className="fas fa-home me-2"></i>Back to Dashboard</Link>
                            </motion.div>
                        </div>
                    </AnimatedSection>
                )}

                {/* Filter Tabs */}
                {events.length > 0 && (
                    <AnimatedSection delay={0.4} className="filter-tabs">
                        {filterTabs.map(tab => (
                            <Link key={tab.key} to={`?filter=${tab.key}`} className={`filter-tab ${filter === tab.key ? 'active' : ''}`}>
                                <i className={`fas ${tab.icon} me-2`}></i>{tab.name} ({tab.count})
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
                <AnimatePresence>
                    {events.length > 0 && filteredEvents.length === 0 && (
                        <AnimatedSection className="col-12">
                            <div className="empty-state">
                                <div className="empty-state-icon"><i className="fas fa-filter"></i></div>
                                <h3 className="mb-3">No Events Found</h3>
                                <p className="text-muted mb-4">
                                    No events match the selected filter. Try <Link to="?filter=all">viewing all events</Link>.
                                </p>
                            </div>
                        </AnimatedSection>
                    )}
                </AnimatePresence>
                
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 event-grid">
                    <AnimatePresence>
                        {filteredEvents.map((event, index) => (
                            <MyEventCard 
                                key={event.id} 
                                event={event} 
                                index={index} 
                                onQuickAction={handleQuickAction}
                                isLoading={actionLoading === event.id} 
                            />
                        ))}
                    </AnimatePresence>
                </div>
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
            ongoing: 'fa-play-circle',
            draft: 'fa-edit',
            completed: 'fa-check-circle',
            cancelled: 'fa-times-circle'
        };
        return icons[status] || 'fa-calendar';
    };

    const categories = event.category_names ? event.category_names.split(', ').slice(0, 2) : [];
    const remainingCategories = event.category_names ? event.category_names.split(', ').length - 2 : 0;
    const eventImageUrl = event.image ? `http://localhost/CampusEventHub/${event.image}` : null;

    // Variants for hover animations
    const cardVariants = {
        rest: { 
            transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)',
            boxShadow: 'var(--shadow-medium)'
        },
        hover: { 
            transform: 'perspective(1000px) rotateY(2deg) rotateX(-4deg) scale(1.03)', 
            boxShadow: 'var(--shadow-large)'
        }
    };
    const borderVariants = {
        rest: { scaleX: 0 },
        hover: { scaleX: 1 }
    };
    const imageVariants = {
        rest: { scale: 1 },
        hover: { scale: 1.1 }
    };
    const actionsVariants = {
        rest: { opacity: 0, y: 10 },
        hover: { opacity: 1, y: 0, transition: { delay: 0.1 } }
    };

    return (
        <motion.div 
            className="col event-item" 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.1 }}
        >
            <motion.div 
                className="card h-100 event-card" 
                onClick={handleCardClick} 
                style={{cursor: 'pointer'}}
                variants={cardVariants}
                initial="rest"
                whileHover="hover"
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <motion.div className="event-card-border" variants={borderVariants} transition={{...{ type: 'spring', stiffness: 400, damping: 30 }, delay: 0.1}} />
                
                <div className="position-relative event-image-container">
                    {eventImageUrl ? (
                        <motion.img src={eventImageUrl} className="card-img-top event-image" alt={event.title} variants={imageVariants} />
                    ) : (
                        <div className="card-img-top bg-gradient-primary d-flex align-items-center justify-content-center text-white position-relative" style={{ height: '200px', background: 'var(--gradient-primary)' }}>
                            <div className="text-center">
                                <i className="fas fa-calendar-alt fa-3x mb-2 opacity-75"></i>
                                <p className="mb-0 small fw-bold">{event.title}</p>
                            </div>
                        </div>
                    )}
                    <motion.span 
                        className={`event-status-badge status-${event.status}`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                        <i className={`fas ${getStatusIcon(event.status)} me-1`}></i>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </motion.span>
                </div>

                <div className="card-body d-flex flex-column event-card-body">
                    <h5 className="card-title fw-bold text-dark mb-2 line-clamp-2" style={{minHeight: '3rem'}}>{event.title}</h5>
                    <p className="card-text text-muted flex-grow-1 mb-3 line-clamp-3">
                        {event.description?.replace(/<[^>]+>/g, '').substring(0, 120)}...
                    </p>

                    <div className="event-meta small text-muted mb-3">
                        <div className="d-flex align-items-center mb-2"><i className="fas fa-map-marker-alt"></i><span className="text-truncate">{event.location}</span></div>
                        <div className="d-flex align-items-center mb-2"><i className="fas fa-calendar-alt"></i><span>{formatDate(event.event_date)}</span></div>
                        {event.ticket_price > 0 && (
                            <div className="d-flex align-items-center mb-2"><i className="fas fa-ticket-alt"></i><span> Price: KSh {Number(event.ticket_price).toLocaleString('en-US', {minimumFractionDigits: 2})}</span></div>
                        )}
                        {categories.length > 0 && (
                            <div className="d-flex align-items-start mb-2 flex-wrap">
                                <i className="fas fa-tags" style={{marginTop: '0.25rem'}}></i>
                                <div className="d-flex flex-wrap gap-1">
                                    {categories.map(cat => <span key={cat} className="category-tag">{cat}</span>)}
                                    {remainingCategories > 0 && <span className="category-tag">+{remainingCategories} more</span>}
                                </div>
                            </div>
                        )}
                        <div className="d-flex align-items-center">
                            <div className="attendee-count"><i className="fas fa-users"></i><span>{event.attendee_count} attendees</span></div>
                            {event.total_tickets > 0 && (
                                <div className="attendee-count ms-3"><i className="fas fa-ticket-alt"></i><span>{event.available_tickets} left</span></div>
                            )}
                        </div>
                    </div>

                    <motion.div className="event-actions" variants={actionsVariants}>
                        <div className="action-buttons-grid">
                            <Link to={`/event/${event.id}`} className="btn btn-card-view"><i className="fas fa-eye me-1"></i>View</Link>
                            <Link to={`/edit-event/${event.id}`} className="btn btn-card-edit"><i className="fas fa-edit me-1"></i>Edit</Link>
                            <Link to={`/manage-rsvps/${event.id}`} className="btn btn-card-success"><i className="fas fa-users me-1"></i>RSVPs</Link>
                            <Link to={`/manage-tickets/${event.id}`} className="btn btn-card-warning"><i className="fas fa-ticket-alt me-1"></i>Tickets</Link>
                        
                            {event.status === 'upcoming' && (
                                <>
                                    <button className="btn btn-card-warning" disabled={isLoading}
                                        onClick={() => onQuickAction(event.id, 'mark_ongoing', 'Mark this event as ongoing?')}>
                                        {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-play-circle me-1"></i>Start</>}
                                    </button>
                                    <button className="btn btn-card-danger" disabled={isLoading}
                                        onClick={() => onQuickAction(event.id, 'cancel', 'Are you sure you want to cancel this event?')}>
                                        {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-times me-1"></i>Cancel</>}
                                    </button>
                                </>
                            )}
                            {event.status === 'ongoing' && (
                                <button className="btn btn-card-info" disabled={isLoading}
                                    onClick={() => onQuickAction(event.id, 'mark_completed', 'Mark this event as completed?')}>
                                    {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-check-circle me-1"></i>Complete</>}
                                </button>
                            )}
                            {event.status === 'draft' && (
                                <button className="btn btn-card-success" disabled={isLoading}
                                    onClick={() => onQuickAction(event.id, 'publish', 'Are you ready to publish this event?')}>
                                    {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-rocket me-1"></i>Publish</>}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
}