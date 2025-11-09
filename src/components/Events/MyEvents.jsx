// src/components/Events/MyEvents.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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

export default function MyEvents() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // Tracks which card is loading
    
    const filter = searchParams.get('filter') || 'all';

    // Function to fetch or refetch data
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

    // Fetch data on component mount
    useEffect(() => {
        fetchData();
    }, []);

    // Memoized array of events based on the filter
    const filteredEvents = useMemo(() => {
        if (!data?.events) return [];
        if (filter === 'all') return data.events;
        return data.events.filter(event => event.status === filter);
    }, [data, filter]);

    // Handle a status update from a child card
    const handleQuickAction = async (eventId, action, confirmMessage) => {
        if (window.confirm(confirmMessage)) {
            setActionLoading(eventId); // Set loading state for this card
            try {
                // Use the 'events_actions.php' endpoint
                const result = await apiPost('events_actions.php', { id: eventId, action });
                if (result.success) {
                    // Optimistically update the UI first
                    setData(prevData => {
                        const newEvents = prevData.events.map(event => 
                            event.id == result.event_id ? { ...event, status: result.new_status } : event
                        );
                        
                        // Recalculate stats
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
                fetchData(false); // Refetch data on error to be safe
            } finally {
                setActionLoading(null); // Clear loading state
            }
        }
    };

    if (loading) {
        return (
            <Layout user={data?.user}>
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
            <Layout user={data?.user}>
                <div className="container mt-4">
                    <div className="alert alert-danger">Error: {error}</div>
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
        <Layout user={user}>
            <div className="container mt-4">
                {/* Hero Section */}
                <div className="my-events-hero">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 text-center">
                            <h1 className="display-5 fw-bold mb-3">My Events</h1>
                            <p className="lead text-muted mb-4">
                                Manage and track all your events in one place. Create, edit, and monitor your event's performance.
                            </p>
                            <div className="stats-grid">
                                <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total Events</div></div>
                                <div className="stat-card"><div className="stat-number">{stats.upcoming}</div><div className="stat-label">Upcoming</div></div>
                                <div className="stat-card"><div className="stat-number">{stats.ongoing}</div><div className="stat-label">Ongoing</div></div>
                                <div className="stat-card"><div className="stat-number">{stats.draft}</div><div className="stat-label">Drafts</div></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="h3 mb-1">Manage Your Events</h2>
                        <p className="text-muted mb-0">
                            {stats.total > 0
                                ? `You have ${stats.total} events.`
                                : "Ready to create your first amazing event?"}
                        </p>
                    </div>
                    <Link to="/create-event" className="btn btn-primary btn-create">
                        <i className="fas fa-plus-circle me-2"></i>Create New Event
                    </Link>
                </div>

                {/* Quick Action Card */}
                {events.length === 0 ? (
                    <div className="quick-action-card">
                        <h3 className="mb-3">Ready to Create Your First Event?</h3>
                        <p className="mb-4 opacity-90">Start your event creation journey and share amazing experiences.</p>
                        <Link to="/create-event" className="action-btn">
                            <i className="fas fa-rocket me-2"></i>Launch Your First Event
                        </Link>
                    </div>
                ) : (
                    <div className="quick-action-card">
                        <h3 className="mb-3">Event Management Hub</h3>
                        <p className="mb-4 opacity-90">Quickly access your events or create new ones.</p>
                        <div className="d-flex gap-3 flex-wrap justify-content-center">
                            <Link to="/create-event" className="action-btn"><i className="fas fa-plus-circle me-2"></i>Create New Event</Link>
                            <Link to="/dashboard" className="action-btn"><i className="fas fa-home me-2"></i>Back to Dashboard</Link>
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                {events.length > 0 && (
                    <div className="filter-tabs">
                        {filterTabs.map(tab => (
                            <Link key={tab.key} to={`?filter=${tab.key}`} className={`filter-tab ${filter === tab.key ? 'active' : ''}`}>
                                <i className={`fas ${tab.icon} me-2`}></i>{tab.name} ({tab.count})
                            </Link>
                        ))}
                    </div>
                )}

                {/* Events Grid */}
                {events.length > 0 && filteredEvents.length === 0 && (
                    <div className="col-12">
                        <div className="empty-state">
                            <div className="empty-state-icon"><i className="fas fa-filter"></i></div>
                            <h3 className="mb-3">No Events Found</h3>
                            <p className="text-muted mb-4">
                                No events match the selected filter. Try <Link to="?filter=all">viewing all events</Link>.
                            </p>
                        </div>
                    </div>
                )}
                
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 event-grid">
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
            </div>
        </Layout>
    );
}

// --- Sub-Component for the Event Card ---
function MyEventCard({ event, index, onQuickAction, isLoading }) {
    const navigate = useNavigate();

    const handleCardClick = (e) => {
        // Don't navigate if a button, link, or their icon was clicked
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

    return (
        <div className="col event-item" style={{ "--index": index, animationDelay: `${index * 0.1}s` }}>
            <div className="card h-100 event-card" onClick={handleCardClick} style={{cursor: 'pointer'}}>
                {/* Event Image */}
                <div className="position-relative overflow-hidden">
                    {eventImageUrl ? (
                        <img src={eventImageUrl} className="card-img-top event-image" alt={event.title} />
                    ) : (
                        <div className="card-img-top bg-gradient-primary d-flex align-items-center justify-content-center text-white position-relative" style={{ height: '200px', background: 'var(--gradient-primary)' }}>
                            <div className="text-center">
                                <i className="fas fa-calendar-alt fa-3x mb-2 opacity-75"></i>
                                <p className="mb-0 small fw-bold">{event.title}</p>
                            </div>
                        </div>
                    )}
                    <span className={`event-status-badge status-${event.status}`}>
                        <i className={`fas ${getStatusIcon(event.status)} me-1`}></i>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                </div>

                <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold text-dark mb-2 line-clamp-2" style={{minHeight: '3rem'}}>{event.title}</h5>
                    <p className="card-text text-muted flex-grow-1 mb-3 line-clamp-3">
                        {event.description?.replace(/<[^>]+>/g, '').substring(0, 120)}...
                    </p>

                    {/* Event Metadata */}
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

                    {/* Action Buttons: ALL BUTTONS are now inside this single grid */}
                    <div className="event-actions">
                        <div className="action-buttons-grid">
                            <Link to={`/event/${event.id}`} className="btn btn-card-view"><i className="fas fa-eye me-1"></i>View</Link>
                            <Link to={`/edit-event/${event.id}`} className="btn btn-card-edit"><i className="fas fa-edit me-1"></i>Edit</Link>
                            <Link to={`/manage-rsvps/${event.id}`} className="btn btn-card-success"><i className="fas fa-users me-1"></i>RSVPs</Link>
                            <Link to={`/manage-tickets/${event.id}`} className="btn btn-card-warning"><i className="fas fa-ticket-alt me-1"></i>Tickets</Link>
                        
                            {/* --- Quick Status Actions are now inside the grid --- */}
                            {event.status === 'upcoming' && (
                                <>
                                    <button className="btn btn-card-warning" disabled={isLoading}
                                        onClick={() => onQuickAction(event.id, 'mark_ongoing', 'Mark this event as ongoing?')}>
                                        {isLoading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-play-circle me-1"></i>Start Event</>}
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
                    </div>
                </div>
            </div>
        </div>
    );
}