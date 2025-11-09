// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { apiGet } from "../../api";
import Layout from '../Layout';
import './Dashboard.css';

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
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-loading">
          <div className="spinner-border text-primary" role="status">
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

  const { user, userEvents, recommendedEvents, stats } = dashboardData;

  return (
    <Layout user={user}>
      <div className="dashboard-container">
        {/* Welcome Banner */}
        <section className="welcome-banner">
          <div className="container">
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
                  <div className="stat-item">
                    <span className="stat-number">{stats?.total_events || 0}</span>
                    <span className="stat-label">Total Events</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{stats?.upcoming_events || 0}</span>
                    <span className="stat-label">Upcoming</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <div className="container">
            <div className="action-buttons">
              <a href="/create-event" className="action-btn btn-primary">
                <i className="fas fa-plus-circle me-2"></i>
                Create New Event
              </a>
              <a href="/events" className="action-btn btn-outline">
                <i className="fas fa-calendar-alt me-2"></i>
                Browse Events
              </a>
              <a href="/my-events" className="action-btn btn-outline">
                <i className="fas fa-list me-2"></i>
                My Events
              </a>
            </div>
          </div>
        </section>

        {/* User's Events */}
        <section className="events-section">
          <div className="container">
            <div className="section-header">
              <h2>Your Events</h2>
              <a href="/my-events" className="view-all-link">
                View All <i className="fas fa-arrow-right ms-1"></i>
              </a>
            </div>
            
            {userEvents && userEvents.length > 0 ? (
              <div className="events-grid">
                {userEvents.map(event => (
                  <EventCard key={event.id} event={event} isOwner={true} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-calendar-plus empty-icon"></i>
                <h3>No events yet</h3>
                <p>Create your first event and start connecting with people!</p>
                <a href="/create-event" className="btn btn-primary">
                  Create Your First Event
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Recommended Events */}
        <section className="events-section bg-light">
          <div className="container">
            <div className="section-header">
              <h2>Recommended For You</h2>
              <a href="/events" className="view-all-link">
                View All <i className="fas fa-arrow-right ms-1"></i>
              </a>
            </div>
            
            {recommendedEvents && recommendedEvents.length > 0 ? (
              <div className="events-grid">
                {recommendedEvents.map(event => (
                  <EventCard key={event.id} event={event} isOwner={false} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-search empty-icon"></i>
                <h3>No events found</h3>
                <p>Check back later for new events in your area.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

// Event Card Component
function EventCard({ event, isOwner }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getTimeStatus = (eventDate) => {
    const now = new Date();
    const eventTime = new Date(eventDate);
    const diff = eventTime - now;
    const hours = diff / (1000 * 60 * 60);

    if (hours < 0) return { text: 'Live Now', class: 'live' };
    if (hours < 24) return { text: 'Soon', class: 'soon' };
    return { text: 'Upcoming', class: 'upcoming' };
  };

  const timeStatus = getTimeStatus(event.event_date);

  return (
    <div className="event-card">
      <div className="event-image">
        {event.image ? (
          <img src={event.image} alt={event.title} />
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
          <a href={`/event/${event.id}`} className="btn btn-sm btn-primary">
            View Details
          </a>
          {isOwner && (
            <a href={`/edit-event/${event.id}`} className="btn btn-sm btn-outline-secondary">
              Edit
            </a>
          )}
        </div>
      </div>
    </div>
  );
}