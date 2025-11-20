// src/components/Events/EventDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './EventDetails.css';

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

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
    }
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
    }, [id]);

    // --- Action Handlers ---

    // Handles RSVP, Interest, Un-RSVP
    const handleRsvpAction = async (action) => {
        setActionLoading(true);
        try {
            const data = await apiPost('events_actions.php', {
                action: action,
                event_id: id
            });

            setPageData(prev => ({ ...prev, attendance_status: data.new_status }));
            fetchData(); // Full refetch to get updated attendee counts, etc.

        } catch (err) {
            if (err.status === 402 && err.data?.payment_required) {
                navigate(`/purchase/${err.data.event_id}`);
            } else {
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
                    id: id
                });
                if (data.success) {
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
                <div className="container mt-4 text-center" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <div className="container mt-4">
                    <div className="alert alert-danger shadow-sm rounded-3">{error}</div>
                </div>
            </Layout>
        );
    }

    if (!pageData) return null;

    const { user, event, is_owner, attendance_status, user_feedback, all_feedback, similar_events } = pageData;

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
            <motion.div
                className="container mt-4 events-page-container"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Back Button */}
                <motion.div className="mb-4" variants={itemVariants}>
                    <Link to="/events" className="back-btn">
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Events</span>
                    </Link>
                </motion.div>

                <div className="row g-4">
                    <div className="col-lg-8">
                        {/* Hero Image & Title */}
                        <motion.div className="event-hero-wrapper mb-4 shadow-lg" variants={itemVariants}>
                            {event.image ? (
                                <img src={`http://localhost/CampusEventHub/${event.image}`} className="event-hero-image" alt={event.title} />
                            ) : (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'var(--gradient-cosmic)' }}>
                                    <i className="fas fa-calendar-star text-white" style={{ fontSize: '6rem', opacity: 0.5 }}></i>
                                </div>
                            )}
                            <div className="event-hero-overlay">
                                <motion.h1
                                    className="text-white fw-bold mb-2"
                                    style={{ fontSize: '2.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    {event.title}
                                </motion.h1>
                                <div className="d-flex align-items-center gap-3 text-white-50">
                                    <span><i className="fas fa-map-marker-alt me-2"></i>{event.location}</span>
                                    <span>|</span>
                                    <span><i className="fas fa-calendar-alt me-2"></i>{formatDate(event.event_date)}</span>
                                </div>
                            </div>
                            <div className="position-absolute top-0 end-0 m-3">
                                <span className={`status-badge ${event.status}`}>
                                    <i className={`fas ${getStatusIcon(event.status)}`}></i>
                                    <span>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</span>
                                </span>
                            </div>
                        </motion.div>

                        {/* Organizer & Stats */}
                        <motion.div className="glass-card p-4 mb-4" variants={itemVariants}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="avatar-glow"><i className="fas fa-user"></i></div>
                                    <div>
                                        <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Organizer</small>
                                        <strong className="fs-5">{event.organizer_name}</strong>
                                    </div>
                                </div>
                                <div className="d-flex gap-4">
                                    <div className="text-center">
                                        <div className="fw-bold fs-4 text-primary">{event.attendee_count}</div>
                                        <small className="text-muted">Attending</small>
                                    </div>
                                    <div className="vr"></div>
                                    <div className="text-center">
                                        <div className="fw-bold fs-4 text-success">
                                            {event.ticket_price > 0 ? `KSh ${Number(event.ticket_price).toLocaleString()}` : 'Free'}
                                        </div>
                                        <small className="text-muted">Price</small>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Event Details */}
                        <motion.div className="glass-card p-4 mb-4" variants={itemVariants}>
                            <h4 className="mb-4 fw-bold"><i className="fas fa-info-circle me-2 text-primary"></i> About Event</h4>

                            <div className="row g-4 mb-4">
                                <MetaCard icon="fa-ticket-alt" title="Tickets Available" value={`${event.available_tickets} / ${event.total_tickets}`} />
                                <MetaCard icon="fa-clock" title="Posted On" value={formatDateShort(event.created_at)} />
                            </div>

                            {event.category_names && (
                                <div className="mb-4">
                                    <strong className="d-block mb-3 text-muted text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Categories</strong>
                                    <div className="d-flex flex-wrap">
                                        {event.category_names.split(', ').map(cat => (
                                            <motion.span
                                                key={cat}
                                                className="category-tag"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {cat}
                                            </motion.span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <strong className="d-block mb-3 text-muted text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>Description</strong>
                                <div className="p-3 bg-light rounded-3 border border-light">
                                    <p style={{ lineHeight: 1.8, fontSize: '1.05rem', color: '#4a5568' }} dangerouslySetInnerHTML={{ __html: event.description.replace(/\n/g, '<br />') }} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Feedback Section */}
                        <motion.div className="glass-card p-4" variants={itemVariants}>
                            <div className="d-flex align-items-center justify-content-between mb-4">
                                <h5 className="mb-0 fw-bold"><i className="fas fa-comments me-2 text-primary"></i> Reviews & Feedback</h5>
                                <span className="badge bg-primary rounded-pill px-3 py-2">
                                    {all_feedback.length} Reviews
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
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="col-lg-4">
                        <motion.div className="sticky-sidebar" variants={itemVariants}>
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
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </Layout>
    );
}


// --- Sub-Components ---

const MetaCard = ({ icon, title, value }) => (
    <div className="col-md-6">
        <div className="meta-card h-100">
            <div className="d-flex align-items-center">
                <div className="meta-icon"><i className={`fas ${icon}`}></i></div>
                <div>
                    <strong className="d-block mb-1 text-dark">{title}</strong>
                    <span className="text-muted">{value}</span>
                </div>
            </div>
        </div>
    </div>
);

const FeedbackList = ({ feedbacks }) => {
    if (feedbacks.length === 0) {
        return (
            <div className="text-center py-5 bg-light rounded-3 mb-4 border border-dashed">
                <i className="fas fa-comment-slash text-muted mb-3" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                <p className="text-muted mb-0">No reviews yet. Be the first to share your thoughts!</p>
            </div>
        );
    }
    return (
        <div className="mb-4">
            {feedbacks.map((fb, index) => (
                <motion.div
                    className="feedback-item"
                    key={fb.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <div className="d-flex align-items-start gap-3">
                        <div className="avatar-glow" style={{ width: '40px', height: '40px', fontSize: '0.9rem', flexShrink: 0 }}>
                            <i className="fas fa-user"></i>
                        </div>
                        <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <strong className="text-dark">{fb.fullname}</strong>
                                <div className="star-rating-static text-warning" style={{ fontSize: '0.8rem' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`fas fa-star ${i < fb.rating ? '' : 'text-muted opacity-25'}`}></i>
                                    ))}
                                </div>
                            </div>
                            {fb.comment && <p className="mb-2 text-secondary small">{fb.comment}</p>}
                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                <i className="fas fa-clock me-1"></i> {formatDate(fb.created_at)}
                            </small>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

const FeedbackForm = ({ user, event, attendanceStatus, userFeedback, rating, setRating, comment, setComment, onSubmit, onDelete, loading }) => {
    if (attendanceStatus === 'going' && (event.status === 'ongoing' || event.status === 'completed')) {
        return (
            <div className="bg-light p-4 rounded-3 border border-light">
                <h6 className="mb-3 fw-bold"><i className="fas fa-pen me-2 text-primary"></i> {userFeedback ? 'Update Your Feedback' : 'Leave Your Feedback'}</h6>
                <form onSubmit={onSubmit}>
                    <div className="mb-3">
                        <label className="form-label small text-uppercase text-muted fw-bold">Rating</label>
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
                        <label htmlFor="comment" className="form-label small text-uppercase text-muted fw-bold">Comment (Optional)</label>
                        <textarea className="form-control" id="comment" name="comment" rows="3"
                            placeholder="Share your experience..."
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            style={{ borderRadius: '12px', borderColor: '#e2e8f0' }}></textarea>
                    </div>
                    <div className="d-flex gap-2">
                        <motion.button
                            type="submit"
                            className="btn action-btn action-btn-primary flex-grow-1"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-paper-plane me-2"></i>}
                            {userFeedback ? 'Update Review' : 'Submit Review'}
                        </motion.button>
                        {userFeedback && (
                            <motion.button
                                type="button"
                                className="btn btn-outline-danger"
                                style={{ borderRadius: '16px' }}
                                onClick={onDelete}
                                disabled={loading}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <i className="fas fa-trash"></i>
                            </motion.button>
                        )}
                    </div>
                </form>
            </div>
        );
    }
    if (user && attendanceStatus === 'going' && event.status === 'upcoming') {
        return (
            <div className="alert alert-info mt-3 d-flex align-items-center gap-3" style={{ borderRadius: '16px', border: 'none', background: 'rgba(102, 126, 234, 0.1)' }}>
                <i className="fas fa-clock text-primary fs-4"></i>
                <div>
                    <strong>Not yet available</strong>
                    <div className="small">You can leave feedback once the event starts.</div>
                </div>
            </div>
        );
    }
    if (!user) {
        return (
            <div className="text-center mt-4 p-4 bg-light rounded-3">
                <i className="fas fa-lock text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                <h6 className="text-dark">Sign in to leave feedback</h6>
                <Link to="/login" className="btn btn-sm btn-primary mt-2 px-4 rounded-pill">Sign In</Link>
            </div>
        );
    }
    if (user && attendanceStatus !== 'going') {
        return (
            <div className="alert alert-light mt-3 border d-flex align-items-center gap-3" style={{ borderRadius: '16px' }}>
                <i className="fas fa-info-circle text-muted fs-4"></i>
                <div className="small text-muted">RSVP as "going" to leave feedback.</div>
            </div>
        );
    }
    return null;
};

const SidebarActions = ({ user, event, isOwner, attendanceStatus, onRsvpAction, onOwnerAction, loading }) => {
    return (
        <motion.div className="glass-card p-4 mb-4" whileHover={{ y: -5 }}>
            <h5 className="mb-4 fw-bold"><i className="fas fa-bolt me-2 text-warning"></i> Actions</h5>

            {!user && (
                <div className="text-center p-4 bg-light rounded-3">
                    <i className="fas fa-user-lock text-muted mb-3" style={{ fontSize: '2.5rem' }}></i>
                    <h6>Sign in to RSVP</h6>
                    <p className="small text-muted mb-3">Join the community to attend events.</p>
                    <Link to="/login" className="btn action-btn action-btn-primary w-100">Sign In</Link>
                </div>
            )}

            {user && isOwner && (
                <div className="d-grid gap-3">
                    <Link to={`/edit-event/${event.id}`} className="btn action-btn action-btn-primary">
                        <i className="fas fa-edit me-2"></i>Edit Event
                    </Link>
                    {event.status === 'upcoming' && (
                        <>
                            <button className="btn btn-success rounded-pill py-3 fw-bold"
                                onClick={() => onOwnerAction('mark_ongoing', 'Start this event?')} disabled={loading}>
                                <i className="fas fa-play-circle me-2"></i>Start Event
                            </button>
                            <button className="btn btn-outline-danger rounded-pill py-3"
                                onClick={() => onOwnerAction('cancel', 'Cancel this event?')} disabled={loading}>
                                <i className="fas fa-times-circle me-2"></i>Cancel Event
                            </button>
                        </>
                    )}
                    {event.status === 'ongoing' && (
                        <button className="btn btn-success rounded-pill py-3 fw-bold"
                            onClick={() => onOwnerAction('mark_completed', 'Complete this event?')} disabled={loading}>
                            <i className="fas fa-check-circle me-2"></i>Complete Event
                        </button>
                    )}
                </div>
            )}

            {user && !isOwner && (
                <div className="d-grid gap-3">
                    {attendanceStatus ? (
                        <>
                            <div className="text-center p-3 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-25">
                                <i className="fas fa-check-circle text-success fs-1 mb-2"></i>
                                <div className="fw-bold text-success">You are {attendanceStatus}</div>
                            </div>
                            {(event.status === 'upcoming' || event.status === 'ongoing') && (
                                <button className="btn btn-outline-danger rounded-pill py-2"
                                    onClick={() => onRsvpAction('unattend')} disabled={loading}>
                                    Change RSVP
                                </button>
                            )}
                        </>
                    ) : (
                        (event.status === 'upcoming' || event.status === 'ongoing') ? (
                            (event.available_tickets > 0 || event.total_tickets == 0) ? (
                                <>
                                    <motion.button
                                        className="btn action-btn action-btn-primary"
                                        onClick={() => onRsvpAction('attend')}
                                        disabled={loading}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <i className="fas fa-calendar-check me-2"></i>Attend Event
                                    </motion.button>
                                    <button className="btn btn-outline-warning rounded-pill py-3 fw-bold"
                                        onClick={() => onRsvpAction('interested')} disabled={loading}>
                                        <i className="fas fa-star me-2"></i>Interested
                                    </button>
                                </>
                            ) : (
                                <button className="btn btn-secondary rounded-pill py-3" disabled>
                                    <i className="fas fa-ticket-alt me-2"></i>Sold Out
                                </button>
                            )
                        ) : (
                            <button className="btn btn-secondary rounded-pill py-3" disabled>
                                <i className="fas fa-history me-2"></i>Event Ended
                            </button>
                        )
                    )}
                </div>
            )}
        </motion.div>
    );
};

const ShareCard = ({ onShare }) => (
    <motion.div className="glass-card p-4 mb-4" whileHover={{ y: -5 }}>
        <h6 className="mb-3 fw-bold"><i className="fas fa-share-alt me-2 text-info"></i> Share</h6>
        <div className="d-grid gap-2">
            <button className="share-btn d-flex align-items-center justify-content-center gap-2" onClick={() => onShare('facebook')}>
                <i className="fab fa-facebook text-primary"></i> Facebook
            </button>
            <button className="share-btn d-flex align-items-center justify-content-center gap-2" onClick={() => onShare('twitter')}>
                <i className="fab fa-twitter text-info"></i> Twitter
            </button>
            <button className="share-btn d-flex align-items-center justify-content-center gap-2" onClick={() => onShare('whatsapp')}>
                <i className="fab fa-whatsapp text-success"></i> WhatsApp
            </button>
        </div>
    </motion.div>
);

const SimilarEvents = ({ events }) => {
    if (events.length === 0) return null;

    return (
        <motion.div className="glass-card p-4" whileHover={{ y: -5 }}>
            <h6 className="mb-3 fw-bold"><i className="fas fa-layer-group me-2 text-primary"></i> Similar Events</h6>
            {events.map(event => (
                <Link to={`/event/${event.id}`} className="similar-event-card d-flex align-items-center gap-3 mb-3 text-decoration-none text-dark" key={event.id}>
                    {event.image ? (
                        <img src={`http://localhost/CampusEventHub/${event.image}`}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px' }} alt={event.title} />
                    ) : (
                        <div style={{ width: '60px', height: '60px', background: 'var(--gradient-cosmic)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <i className="fas fa-calendar"></i>
                        </div>
                    )}
                    <div className="flex-grow-1 overflow-hidden">
                        <strong className="d-block text-truncate">{event.title}</strong>
                        <small className="text-muted d-block"><i className="fas fa-map-marker-alt me-1"></i> {event.location}</small>
                        <small className="text-primary fw-bold">{formatDateShort(event.event_date)}</small>
                    </div>
                </Link>
            ))}
        </motion.div>
    );
};
