// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { apiGet } from "../../api";
import Layout from '../Layout';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import './Dashboard.css';

// --- Reusable Animated Section Wrapper ---
const AnimatedSection = ({ children, className = '' }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <motion.section
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
        >
            {children}
        </motion.section>
    );
};

// --- Reusable Stat Item Component ---
const StatItem = ({ value, label, delay = 0 }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            className="stat-item"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: delay * 0.15 }}
        >
            <span className="stat-number">{value}</span>
            <span className="stat-label">{label}</span>
        </motion.div>
    );
};

// --- Reusable Event Card Component ---
const EventCard = ({ event, isOwner, delay = 0 }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    };

    const getTimeStatus = (eventDate) => {
        const diff = new Date(eventDate).getTime() - new Date().getTime();
        const hours = diff / (1000 * 60 * 60);
        if (hours < 0) return { text: 'Live Now', class: 'live' };
        if (hours < 24) return { text: 'Soon', class: 'soon' };
        return { text: 'Upcoming', class: 'upcoming' };
    };

    const timeStatus = getTimeStatus(event.event_date);
    const eventImageUrl = event.image ? `http://localhost/CampusEventHub/${event.image}` : null;

    return (
        <motion.div
            ref={ref}
            className="event-card-wrapper"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: delay * 0.1 }}
            whileHover="hover" // This triggers the "hover" variant on children
        >
            <motion.div
                className="event-card"
                // 3D Tilt Effect on Hover
                whileHover={{ 
                    transform: 'perspective(1000px) rotateY(3deg) rotateX(-5deg) scale(1.02)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <div className="event-image">
                    {eventImageUrl ? (
                        <motion.img 
                            src={eventImageUrl} 
                            alt={event.title} 
                            variants={{ hover: { scale: 1.1 } }} // Image zoom
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        />
                    ) : (
                        <div className="event-image-placeholder">
                            <i className="fas fa-calendar-alt"></i>
                        </div>
                    )}
                    <span className={`event-status ${timeStatus.class}`}>
                        {timeStatus.text}
                    </span>
                    {isOwner && <span className="event-owner-badge">Your Event</span>}
                </div>
                
                <div className="event-content">
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-description">
                        {event.description?.substring(0, 100)}...
                    </p>
                    
                    <div className="event-meta">
                        <div className="meta-item">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{event.location}</span>
                        </div>
                        <div className="meta-item">
                            <i className="fas fa-calendar"></i>
                            <span>{formatDate(event.event_date)}</span>
                        </div>
                        <div className="meta-item">
                            <i className="fas fa-users"></i>
                            <span>{event.attendee_count || 0} attending</span>
                        </div>
                    </div>
                    
                    <div className="event-actions">
                        <Link to={`/event/${event.id}`} className="btn btn-sm btn-primary">
                            View Details
                        </Link>
                        {isOwner && (
                            <Link to={`/edit-event/${event.id}`} className="btn btn-sm btn-outline-secondary">
                                Edit
                            </Link>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};


// --- Main Dashboard Component ---
export default function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const data = await apiGet('dashboard.php');
            if (data.success) {
                setDashboardData(data);
            } else {
                throw new Error(data.error || 'Failed to load data');
            }
        } catch (err) {
            setError('Failed to load dashboard data. ' + err.message);
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="dashboard-loading">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading your dashboard...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="dashboard-error">
                    <div className="alert alert-danger">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                    <button className="btn btn-primary" onClick={fetchDashboardData}>
                        Retry
                    </button>
                </div>
            </Layout>
        );
    }

    if (!dashboardData) {
        return (
            <Layout>
                <div className="dashboard-error">
                    <p>No data available</p>
                </div>
            </Layout>
        );
    }

    // This data structure matches your original file
    const { user, userEvents, recommendedEvents, stats, unread_count } = dashboardData;

    return (
        <Layout user={user} unread_count={unread_count}>
            <div className="dashboard-container">

                {/* Welcome Banner */}
                <AnimatedSection className="welcome-banner">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h1 className="welcome-title">
                                Welcome back, <span className="text-primary">{user.fullname}</span>! 👋
                            </h1>
                            <p className="welcome-subtitle">
                                Ready to discover amazing events or create your own?
                            </p>
                        </div>
                        <div className="col-md-4 text-md-end">
                            <div className="quick-stats">
                                <StatItem value={stats?.total_events || 0} label="Total Events" delay={0.2} />
                                <StatItem value={stats?.upcoming_events || 0} label="Upcoming" delay={0.3} />
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Quick Actions */}
                <AnimatedSection className="quick-actions-section">
                    <div className="action-buttons">
                        <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                            <Link to="/create-event" className="action-btn btn-primary">
                                <i className="fas fa-plus-circle me-2"></i>
                                Create New Event
                            </Link>
                        </motion.div>
                        <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                            <Link to="/events" className="action-btn btn-outline">
                                <i className="fas fa-calendar-alt me-2"></i>
                                Browse Events
                            </Link>
                        </motion.div>
                        <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                            <Link to="/my-events" className="action-btn btn-outline">
                                <i className="fas fa-list me-2"></i>
                                My Events
                            </Link>
                        </motion.div>
                    </div>
                </AnimatedSection>

                {/* User's Events */}
                <AnimatedSection className="events-section">
                    <div className="section-header">
                        <h2>Your Events</h2>
                        <Link to="/my-events" className="view-all-link">
                            View All <i className="fas fa-arrow-right ms-1"></i>
                        </Link>
                    </div>
                    
                    {userEvents && userEvents.length > 0 ? (
                        <div className="events-grid">
                            {userEvents.map((event, index) => (
                                <EventCard key={event.id} event={event} isOwner={true} delay={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-calendar-plus empty-icon"></i>
                            <h3>No events yet</h3>
                            <p>Create your first event and start connecting with people!</p>
                            <Link to="/create-event" className="btn btn-primary">
                                Create Your First Event
                            </Link>
                        </div>
                    )}
                </AnimatedSection>

                {/* Recommended Events */}
                <AnimatedSection className="events-section bg-light">
                    <div className="section-header">
                        <h2>Recommended For You</h2>
                        <Link to="/events" className="view-all-link">
                            View All <i className="fas fa-arrow-right ms-1"></i>
                        </Link>
                    </div>
                    
                    {recommendedEvents && recommendedEvents.length > 0 ? (
                        <div className="events-grid">
                            {recommendedEvents.map((event, index) => (
                                <EventCard key={event.id} event={event} isOwner={false} delay={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-search empty-icon"></i>
                            <h3>No events found</h3>
                            <p>Check back later for new events in your area.</p>
                        </div>
                    )}
                </AnimatedSection>
            </div>
        </Layout>
    );
}