// src/components/Events/EventDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './EventDetails.css'; // Import the new CSS

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
const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

export default function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // State for all data
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // State for feedback form
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');

    // Function to fetch all page data
    const fetchData = async () => {
        try {
            const data = await apiGet(`event_details.php?id=${id}`);
            if (data.success) {
                setPageData(data);
                if (data.user_feedback) {
                    setFeedbackRating(data.user_feedback.rating);
                    setFeedbackComment(data.user_feedback.comment);
                }
            } else {
                throw new Error(data.error || 'Failed to load event');
            }
        } catch (err) {
            setError(err.message);
            if (err.message.includes('not found')) {
                navigate('/events'); // Redirect if event not found
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on mount
    useEffect(() => {
        setLoading(true);
        fetchData();

        // Scroll reveal animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });

        const timer = setTimeout(() => {
            document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
        }, 100); 

        return () => {
            clearTimeout(timer);
            document.querySelectorAll('.scroll-reveal').forEach(el => observer.unobserve(el));
        };
    }, [id]); // Refetch if ID changes

    // --- Action Handlers ---

    // Handles RSVP, Interest, Un-RSVP
    const handleRsvpAction = async (action) => {
        setActionLoading(true);
        try {
            const data = await apiPost('events_actions.php', {
                action: action,
                event_id: id
            });
            
            // This code only runs if the request was successful (status 200)
            setPageData(prev => ({ ...prev, attendance_status: data.new_status }));
            fetchData(); // Full refetch to get updated attendee counts, etc.

        } catch (err) { 
            // Check if the error has the status code 402
            if (err.status === 402 && err.data?.payment_required) {
                // *** THIS IS THE FIX: The alert() line was removed ***
                // Immediately redirect to the purchase page
                navigate(`/purchase/${err.data.event_id}`); 
            } else {
                // This is a different, unexpected error
                alert(`Error: ${err.message || 'An unknown error occurred'}`);
            }
        } finally {
            setActionLoading(false);
        }
    };

    // Handles Owner Actions (Cancel, Start, etc.)
    const handleOwnerAction = async (action, confirmMessage) => {
        if (window.confirm(confirmMessage)) {
            setActionLoading(true);
            try {
                const data = await apiPost('events_actions.php', {
                    action: action,
                    id: id // This endpoint expects 'id' for owner actions
                });
                if (data.success) {
                    // Update event status in UI
                    setPageData(prev => ({ 
                        ...prev, 
                        event: { ...prev.event, status: data.new_status } 
                    }));
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            } finally {
                setActionLoading(false);
            }
        }
    };

    // Handles Feedback Submission
    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const data = await apiPost('events_actions.php', {
                action: 'submit_feedback',
                event_id: id,
                rating: feedbackRating,
                comment: feedbackComment
            });
            if (data.success) {
                // Refresh all data
                fetchData();
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Handles Feedback Deletion
    const handleDeleteFeedback = async () => {
        if (window.confirm('Are you sure you want to delete your feedback?')) {
            setActionLoading(true);
            try {
                const data = await apiPost('events_actions.php', {
                    action: 'delete_feedback',
                    event_id: id
                });
                if (data.success) {
                    setFeedbackRating(0);
                    setFeedbackComment('');
                    // Refresh all data
                    fetchData();
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            } finally {
                setActionLoading(false);
            }
        }
    };

    // Share button JS
    const shareEvent = (platform) => {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(pageData?.event?.title || 'Check out this event');
        let shareUrl = '';

        switch (platform) {
            case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
            case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`; break;
            case 'whatsapp': shareUrl = `https://wa.me/?text=${title}%20${url}`; break;
            case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
            default: return;
        }
        window.open(shareUrl, '_blank', 'width=600,height=400');
    };

    // --- Render Logic ---

    if (loading) {
        return (
            <Layout>
                <div className="container mt-4 text-center" style={{ minHeight: '80vh' }}>
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
                <div className="container mt-4">
                    <div className="alert alert-danger">{error}</div>
                </div>
            </Layout>
        );
    }
    
    if (!pageData) return null;

    const { user, event, is_owner, attendance_status, user_feedback, all_feedback, similar_events } = pageData;

    // Helper for status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'upcoming': return 'fa-clock';
            case 'ongoing': return 'fa-broadcast-tower';
            case 'completed': return 'fa-check-circle';
            default: return 'fa-calendar';
        }
    };

    return (
        <Layout user={user}>
            <div className="container mt-4">
                {/* Back Button */}
                <div className="mb-4">
                    <Link to="/events" className="back-btn">
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Events</span>
                    </Link>
                </div>

                <div className="row">
                    <div className="col-lg-8">
                        {/* Event Title Section */}
                        <div className="glass-card p-4 mb-4 scroll-reveal">
                            <h1 className="event-title mb-3">{event.title}</h1>
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                <span className={`status-badge ${event.status}`}>
                                    <i className={`fas ${getStatusIcon(event.status)}`}></i>
                                    <span>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
                                </span>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="avatar-glow"><i className="fas fa-user"></i></div>
                                    <div>
                                        <strong className="d-block">{event.organizer_name}</strong>
                                        <small className="text-muted">Organizer</small>
                                    </div>
                                </div>
                                <span className="badge bg-light text-dark px-3 py-2">
                                    <i className="fas fa-users me-2"></i>
                                    {event.attendee_count} attending
                                </span>
                            </div>
                        </div>

                        {/* Event Hero Image */}
                        <div className="scroll-reveal">
                            {event.image ? (
                                <div className="event-hero-wrapper">
                                    <img src={`http://localhost/CampusEventHub/${event.image}`} className="event-hero-image" alt={event.title} />
                                </div>
                            ) : (
                                <div className="event-hero-wrapper" style={{ background: 'var(--gradient-cosmic)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div className="text-center text-white">
                                        <i className="fas fa-calendar-star" style={{ fontSize: '5rem', opacity: 0.8 }}></i>
                                        <h3 className="mt-3">{event.title}</h3>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Event Details */}
                        <div className="glass-card p-4 mb-4 scroll-reveal">
                            <h4 className="mb-4"><i className="fas fa-info-circle me-2" style={{ color: '#667eea' }}></i> Event Details</h4>
                            <div className="row g-4 mb-4">
                                <MetaCard icon="fa-map-marker-alt" title="Location" value={event.location} />
                                <MetaCard icon="fa-calendar-alt" title="Date & Time" value={formatDate(event.event_date)} />
                                <MetaCard icon="fa-money-bill-wave" title="Ticket Price" value={event.ticket_price > 0 ? `KSh ${Number(event.ticket_price).toLocaleString('en-US', {minimumFractionDigits: 2})}` : 'Free'} />
                                <MetaCard icon="fa-ticket-alt" title="Tickets" value={`${event.available_tickets} / ${event.total_tickets} available`} />
                                <MetaCard icon="fa-clock" title="Created" value={formatDateShort(event.created_at)} />
                            </div>

                            {event.category_names && (
                                <div className="mb-4">
                                    <strong className="d-block mb-3"><i className="fas fa-tags me-2" style={{ color: '#667eea' }}></i> Categories</strong>
                                    {event.category_names.split(', ').map(cat => (
                                        <span key={cat} className="category-tag">{cat}</span>
                                    ))}
                                </div>
                            )}
                            
                            <div>
                                <strong className="d-block mb-3"><i className="fas fa-align-left me-2" style={{ color: '#667eea' }}></i> Description</strong>
                                <p style={{ lineHeight: 1.8, fontSize: '1.05rem' }} dangerouslySetInnerHTML={{ __html: event.description.replace(/\n/g, '<br />') }} />
                            </div>
                        </div>

                        {/* Feedback Section */}
                        <div className="glass-card p-4 scroll-reveal">
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <h5 className="mb-0"><i className="fas fa-comments me-2" style={{ color: '#667eea' }}></i> Feedback & Reviews</h5>
                                <span className="badge bg-gradient" style={{ background: 'var(--gradient-cosmic)', padding: '0.5rem 1rem', borderRadius: '50px' }}>
                                    {all_feedback.length}
                                </span>
                            </div>
                            
                            <FeedbackList feedbacks={all_feedback} />
                            <FeedbackForm 
                                user={user}
                                event={event}
                                attendanceStatus={attendance_status}
                                userFeedback={user_feedback}
                                rating={feedbackRating}
                                setRating={setFeedbackRating}
                                comment={feedbackComment}
                                setComment={setFeedbackComment}
                                onSubmit={handleFeedbackSubmit}
                                onDelete={handleDeleteFeedback}
                                loading={actionLoading}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="col-lg-4">
                        <div className="sticky-sidebar">
                            <SidebarActions 
                                user={user}
                                event={event}
                                isOwner={is_owner}
                                attendanceStatus={attendance_status}
                                onRsvpAction={handleRsvpAction}
                                onOwnerAction={handleOwnerAction}
                                loading={actionLoading}
                            />
                            <ShareCard onShare={shareEvent} />
                            <SimilarEvents events={similar_events} />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}


// --- Sub-Components for Readability ---

const MetaCard = ({ icon, title, value }) => (
    <div className="col-md-6">
        <div className="meta-card">
            <div className="d-flex align-items-center">
                <div className="meta-icon"><i className={`fas ${icon}`}></i></div>
                <div>
                    <strong className="d-block mb-1">{title}</strong>
                    <span className="text-muted">{value}</span>
                </div>
            </div>
        </div>
    </div>
);

const FeedbackList = ({ feedbacks }) => {
    if (feedbacks.length === 0) {
        return (
            <div className="text-center py-5">
                <i className="fas fa-comment-slash" style={{ fontSize: '4rem', color: '#e0e0e0', marginBottom: '1rem' }}></i>
                <p className="text-muted">No reviews yet. Be the first to leave feedback!</p>
            </div>
        );
    }
    return feedbacks.map((fb, index) => (
        <div className="feedback-item" key={fb.id} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="d-flex align-items-start gap-3">
                <div className="avatar-glow" style={{ width: '45px', height: '45px', fontSize: '1rem' }}><i className="fas fa-user"></i></div>
                <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>{fb.fullname}</strong>
                        <div className="star-rating" style={{ direction: 'ltr' }}>
                            {[...Array(5)].map((_, i) => (
                                <i key={i} className="fas fa-star" style={{ fontSize: '1rem', color: i < fb.rating ? '#ffc107' : '#e0e0e0' }}></i>
                            ))}
                        </div>
                    </div>
                    {fb.comment && <p className="mb-2">{fb.comment}</p>}
                    <small className="text-muted"><i className="fas fa-clock me-1"></i> {formatDate(fb.created_at)}</small>
                </div>
            </div>
        </div>
    ));
};

const FeedbackForm = ({ user, event, attendanceStatus, userFeedback, rating, setRating, comment, setComment, onSubmit, onDelete, loading }) => {
    if (attendanceStatus === 'going' && (event.status === 'ongoing' || event.status === 'completed')) {
        return (
            <div className="glass-card p-4 mt-4" style={{ background: 'rgba(102, 126, 234, 0.05)' }}>
                <h6 className="mb-3"><i className="fas fa-edit me-2" style={{ color: '#667eea' }}></i> {userFeedback ? 'Update Your Feedback' : 'Leave Your Feedback'}</h6>
                <form onSubmit={onSubmit}>
                    <div className="mb-4">
                        <label className="form-label fw-bold">Rating</label>
                        <div className="star-rating">
                            {[5, 4, 3, 2, 1].map(star => (
                                <React.Fragment key={star}>
                                    <input type="radio" name="rating" id={`star${star}`} value={star}
                                        checked={rating === star}
                                        onChange={e => setRating(Number(e.target.value))} required />
                                    <label htmlFor={`star${star}`}><i className="fas fa-star"></i></label>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="comment" className="form-label fw-bold">Comment (Optional)</label>
                        <textarea className="form-control" id="comment" name="comment" rows="4"
                            placeholder="Share your experience..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            style={{ borderRadius: '16px', border: '2px solid #e0e0e0' }}></textarea>
                    </div>
                    <div className="d-flex gap-2">
                        <button type="submit" className="btn action-btn action-btn-primary" disabled={loading}>
                            <i className="fas fa-paper-plane me-2"></i>
                            {loading ? 'Submitting...' : (userFeedback ? 'Update' : 'Submit')}
                        </button>
                        {userFeedback && (
                            <button type="button" className="btn btn-outline-danger"
                                style={{ borderRadius: '16px', padding: '1rem 2rem' }}
                                onClick={onDelete} disabled={loading}>
                                <i className="fas fa-trash me-2"></i>Delete
                            </button>
                        )}
                    </div>
                </form>
            </div>
        );
    }
    if (user && attendanceStatus === 'going' && event.status === 'upcoming') {
        return (
            <div className="alert alert-info mt-3" style={{ borderRadius: '16px', borderLeft: '4px solid #667eea' }}>
                <i className="fas fa-clock me-2"></i> Feedback available once the event starts.
            </div>
        );
    }
    if (!user) {
        return (
            <div className="text-center mt-4 p-4" style={{ background: 'rgba(102, 126, 234, 0.05)', borderRadius: '20px' }}>
                <i className="fas fa-sign-in-alt" style={{ fontSize: '3rem', color: '#667eea', marginBottom: '1rem' }}></i>
                <h6>Sign in to leave feedback</h6>
                <Link to="/login" className="btn action-btn action-btn-primary mt-3">Sign In</Link>
            </div>
        );
    }
    if (user && attendanceStatus !== 'going') {
        return (
            <div className="alert alert-info mt-3" style={{ borderRadius: '16px' }}>
                <i className="fas fa-info-circle me-2"></i> RSVP as "going" to leave feedback.
            </div>
        );
    }
    return null;
};

const SidebarActions = ({ user, event, isOwner, attendanceStatus, onRsvpAction, onOwnerAction, loading }) => {
    return (
        <div className="glass-card p-4 mb-4 scroll-reveal">
            <h5 className="mb-4"><i className="fas fa-bolt me-2" style={{ color: '#667eea' }}></i> Event Actions</h5>
            
            {!user && (
                <div className="text-center p-4" style={{ background: 'rgba(102, 126, 234, 0.05)', borderRadius: '20px' }}>
                    <i className="fas fa-sign-in-alt" style={{ fontSize: '3rem', color: '#667eea', marginBottom: '1rem' }}></i>
                    <h6>Sign in to RSVP</h6>
                    <Link to="/login" className="btn action-btn action-btn-primary mt-3">Sign In</Link>
                </div>
            )}

            {user && isOwner && (
                <div className="d-grid gap-3">
                    <Link to={`/edit-event/${event.id}`} className="btn action-btn action-btn-primary">
                        <i className="fas fa-edit me-2"></i>Edit Event
                    </Link>
                    {event.status === 'upcoming' && (
                        <>
                            <button className="btn btn-success" style={{ borderRadius: '16px', padding: '1rem' }}
                                onClick={() => onOwnerAction('mark_ongoing', 'Start this event?')} disabled={loading}>
                                <i className="fas fa-play-circle me-2"></i>Start Event
                            </button>
                            <button className="btn btn-outline-danger" style={{ borderRadius: '16px', padding: '1rem' }}
                                onClick={() => onOwnerAction('cancel', 'Cancel this event?')} disabled={loading}>
                                <i className="fas fa-times-circle me-2"></i>Cancel
                            </button>
                        </>
                    )}
                    {event.status === 'ongoing' && (
                        <button className="btn btn-success" style={{ borderRadius: '16px', padding: '1rem' }}
                            onClick={() => onOwnerAction('mark_completed', 'Complete this event?')} disabled={loading}>
                            <i className="fas fa-check-circle me-2"></i>Complete
                        </button>
                    )}
                </div>
            )}

            {user && !isOwner && (
                <div className="d-grid gap-3">
                    {attendanceStatus ? (
                        <>
                            <button className="btn btn-success" style={{ borderRadius: '16px', padding: '1rem', fontWeight: 600 }} disabled>
                                <i className="fas fa-check-circle me-2"></i>
                                You're {attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1)}
                            </button>
                            {(event.status === 'upcoming' || event.status === 'ongoing') && (
                                <button className="btn btn-outline-danger" style={{ borderRadius: '16px', padding: '1rem' }}
                                    onClick={() => onRsvpAction('unattend')} disabled={loading}>
                                    <i className="fas fa-times me-2"></i>Cancel Attendance
                                </button>
                            )}
                        </>
                    ) : (
                        (event.status === 'upcoming' || event.status === 'ongoing') ? (
                            (event.available_tickets > 0 || event.total_tickets == 0) ? (
                                <>
                                    <button className="btn action-btn action-btn-primary" onClick={() => onRsvpAction('attend')} disabled={loading}>
                                        <i className="fas fa-calendar-check me-2"></i>Attend Event
                                    </button>
                                    <button className="btn btn-outline-warning" style={{ borderRadius: '16px', padding: '1rem' }}
                                        onClick={() => onRsvpAction('interested')} disabled={loading}>
                                        <i className="fas fa-star me-2"></i>Interested
                                    </button>
                                </>
                            ) : (
                                <button className="btn btn-secondary" style={{ borderRadius: '16px', padding: '1rem' }} disabled>
                                    <i className="fas fa-exclamation-triangle me-2"></i>Event Full
                                </button>
                            )
                        ) : (
                            <button className="btn btn-secondary" style={{ borderRadius: '16px', padding: '1rem' }} disabled>
                                <i className="fas fa-clock me-2"></i>Event Ended
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

const ShareCard = ({ onShare }) => (
    <div className="glass-card p-4 mb-4 scroll-reveal">
        <h6 className="mb-3"><i className="fas fa-share-alt me-2" style={{ color: '#667eea' }}></i> Share Event</h6>
        <div className="d-grid gap-2">
            <button className="share-btn" onClick={() => onShare('facebook')}><i className="fab fa-facebook me-2" style={{ color: '#1877f2' }}></i>Facebook</button>
            <button className="share-btn" onClick={() => onShare('twitter')}><i className="fab fa-twitter me-2" style={{ color: '#1da1f2' }}></i>Twitter</button>
            <button className="share-btn" onClick={() => onShare('whatsapp')}><i className="fab fa-whatsapp me-2" style={{ color: '#25d366' }}></i>WhatsApp</button>
            <button className="share-btn" onClick={() => onShare('linkedin')}><i className="fab fa-linkedin me-2" style={{ color: '#0a66c2' }}></i>LinkedIn</button>
        </div>
    </div>
);

const SimilarEvents = ({ events }) => {
    if (events.length === 0) return (
        <div className="glass-card p-4 scroll-reveal">
            <h6 className="mb-3"><i className="fas fa-calendar-plus me-2" style={{ color: '#667eea' }}></i> Similar Events</h6>
            <div className="text-center py-4">
                <i className="fas fa-calendar-times" style={{ fontSize: '3rem', color: '#e0e0e0', marginBottom: '1rem' }}></i>
                <p className="text-muted small">No similar events found.</p>
            </div>
        </div>
    );

    return (
        <div className="glass-card p-4 scroll-reveal">
            <h6 className="mb-3"><i className="fas fa-calendar-plus me-2" style={{ color: '#667eea' }}></i> Similar Events</h6>
            {events.map(event => (
                <Link to={`/event/${event.id}`} className="similar-event-card" key={event.id}>
                    <div className="d-flex align-items-center gap-3">
                        {event.image ? (
                            <img src={`http://localhost/CampusEventHub/${event.image}`}
                                style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '12px' }} alt={event.title} />
                        ) : (
                            <div style={{ width: '70px', height: '70px', background: 'var(--gradient-cosmic)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                <i className="fas fa-calendar"></i>
                            </div>
                        )}
                        <div className="flex-grow-1">
                            <strong className="d-block mb-1" style={{ fontSize: '0.95rem' }}>{event.title}</strong>
                            <small className="text-muted d-block"><i className="fas fa-map-marker-alt me-1"></i> {event.location}</small>
                            <small className="text-muted"><i className="fas fa-clock me-1"></i> {formatDateShort(event.event_date)}</small>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};