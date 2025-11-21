import React, { useState, useEffect } from 'react';
import { apiGet } from "../../api";
import Layout from '../Layout';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Dashboard.css';
import AnimatedSection from '../UI/AnimatedSection';
import EventCard from '../Events/EventCard';

// --- Reusable Stat Item Component ---
const StatItem = ({ value, label, delay = 0 }) => {
    return (
        <motion.div
            className="stat-item"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: delay }}
        >
            <span className="stat-number">{value}</span>
            <span className="stat-label">{label}</span>
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
                <div className="dashboard-error">
                    <div className="alert alert-danger">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                    <button className="btn btn-primary" onClick={fetchDashboardData}>
                        <i className="fas fa-sync-alt me-2"></i> Retry
                    </button>
                </div>
            </Layout>
        );
    }

    if (!dashboardData) return <Layout />;

    const { user, userEvents, recommendedEvents, stats, unread_count } = dashboardData;

    return (
        <Layout user={user} unread_count={unread_count}>
            <div className="container mt-4 dashboard-container">

                {/* Welcome Banner */}
                <AnimatedSection className="welcome-banner">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <motion.h1
                                className="welcome-title"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                Welcome back, {user.fullname.split(' ')[0]}! 👋
                            </motion.h1>
                            <motion.p
                                className="welcome-subtitle"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Ready to discover amazing events or create your own? Here's what's happening.
                            </motion.p>
                        </div>
                        <div className="col-md-4 mt-4 mt-md-0">
                            <div className="quick-stats">
                                <StatItem value={stats?.total_events || 0} label="My Events" delay={0.4} />
                                <StatItem value={stats?.upcoming_events || 0} label="Upcoming" delay={0.5} />
                            </div>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Quick Actions */}
                <AnimatedSection className="quick-actions-section" delay={0.2}>
                    <div className="action-buttons">
                        <Link to="/create-event" className="action-btn action-btn-primary">
                            <i className="fas fa-plus-circle"></i>
                            Create New Event
                        </Link>
                        <Link to="/events" className="action-btn action-btn-outline">
                            <i className="fas fa-compass"></i>
                            Browse Events
                        </Link>
                        <Link to="/my-events" className="action-btn action-btn-outline">
                            <i className="fas fa-list-alt"></i>
                            Manage Events
                        </Link>
                    </div>
                </AnimatedSection>

                {/* User's Events */}
                <AnimatedSection className="events-section" delay={0.3}>
                    <div className="section-header">
                        <h2><i className="fas fa-calendar-check"></i> Your Events</h2>
                        <Link to="/my-events" className="view-all-link">
                            View All <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>

                    {userEvents && userEvents.length > 0 ? (
                        <div className="events-grid">
                            {userEvents.slice(0, 3).map((event, index) => (
                                <EventCard key={event.id} event={event} delay={index}>
                                    <Link to={`/edit-event/${event.id}`} className="btn btn-card-edit">
                                        <i className="fas fa-edit"></i>
                                    </Link>
                                    <Link to={`/event/${event.id}`} className="btn btn-card-view">
                                        View <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </EventCard>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon"><i className="fas fa-calendar-plus"></i></div>
                            <h3>No events yet</h3>
                            <p>Create your first event and start connecting with people!</p>
                            <Link to="/create-event" className="btn btn-primary">
                                Create Your First Event
                            </Link>
                        </div>
                    )}
                </AnimatedSection>

                {/* Recommended Events */}
                <AnimatedSection className="events-section" delay={0.4}>
                    <div className="section-header">
                        <h2><i className="fas fa-star"></i> Recommended For You</h2>
                        <Link to="/events" className="view-all-link">
                            Explore More <i className="fas fa-arrow-right"></i>
                        </Link>
                    </div>

                    {recommendedEvents && recommendedEvents.length > 0 ? (
                        <div className="events-grid">
                            {recommendedEvents.slice(0, 3).map((event, index) => (
                                <EventCard key={event.id} event={event} delay={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon"><i className="fas fa-search"></i></div>
                            <h3>No recommendations yet</h3>
                            <p>Check back later for new events in your area.</p>
                        </div>
                    )}
                </AnimatedSection>
            </div>
        </Layout>
    );
}