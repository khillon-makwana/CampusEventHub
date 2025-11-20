import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Helper for time remaining
const formatTimeRemaining = (dateString) => {
    const diff = new Date(dateString).getTime() - new Date().getTime();
    if (diff < 0) { return { text: 'Live', class: 'success fw-bold', icon: 'play-circle' }; }
    const diffMinutes = Math.ceil(diff / (1000 * 60));
    if (diffMinutes < 60) { return { text: `${diffMinutes}m`, class: 'danger fw-bold', icon: 'clock' }; }
    const diffHours = Math.ceil(diffMinutes / 60);
    if (diffHours < 24) { return { text: `${diffHours}h`, class: 'warning', icon: 'clock' }; }
    const diffDays = Math.ceil(diffHours / 24);
    return { text: `${diffDays}d`, class: 'muted', icon: 'clock' };
};

const EventCard = ({ event, delay = 0, isOwner = false }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    };

    const handleCardClick = (e, eventId) => {
        if (e.target.tagName === 'A' || e.target.closest('a') || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
        }
        navigate(`/event/${eventId}`);
    };

    const timeRemaining = formatTimeRemaining(event.event_date);
    const categories = event.category_names ? event.category_names.split(', ').slice(0, 2) : [];
    const remainingCategories = event.category_names ? event.category_names.split(', ').length - 2 : 0;
    const eventImageUrl = event.image ? `http://localhost/CampusEventHub/${event.image}` : null;

    return (
        <motion.div
            ref={ref}
            className="col event-item"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: delay * 0.1 }}
        >
            <motion.div
                className="card h-100 event-card"
                onClick={(e) => handleCardClick(e, event.id)}
                style={{ cursor: 'pointer' }}
                whileHover={{
                    y: -10,
                    boxShadow: 'var(--shadow-large)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <div className="position-relative overflow-hidden event-image">
                    {eventImageUrl ? (
                        <motion.img
                            src={eventImageUrl}
                            className="card-img-top"
                            alt={event.title}
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        />
                    ) : (
                        <div className="card-img-top event-image-placeholder">
                            <div className="text-center">
                                <i className="fas fa-calendar-alt mb-2"></i>
                                <p className="mb-0 small fw-bold">EVENT</p>
                            </div>
                        </div>
                    )}
                    <span className={`event-status-badge badge bg-${event.status === 'ongoing' ? 'primary' : 'success'}`}>
                        <i className={`fas fa-${event.status === 'ongoing' ? 'play-circle' : 'clock'} me-1`}></i>
                        {event.status ? (event.status.charAt(0).toUpperCase() + event.status.slice(1)) : 'Upcoming'}
                    </span>
                </div>

                <div className="card-body d-flex flex-column event-content">
                    <h5 className="card-title event-title">{event.title}</h5>
                    <p className="card-text event-description">
                        {event.description?.replace(/<[^>]+>/g, '').substring(0, 100)}...
                    </p>

                    <div className="event-meta">
                        <div className="meta-item">
                            <i className="fas fa-map-marker-alt"></i>
                            <span className="text-truncate">{event.location}</span>
                        </div>
                        <div className="meta-item">
                            <i className="fas fa-calendar-alt"></i>
                            <span>{formatDate(event.event_date)}</span>
                        </div>
                        {event.ticket_price > 0 && (
                            <div className="meta-item">
                                <i className="fas fa-ticket-alt"></i>
                                <span>KSh {Number(event.ticket_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        {categories.length > 0 && (
                            <div className="meta-item mt-2">
                                <i className="fas fa-tags" style={{ opacity: 0 }}></i> {/* Spacer icon */}
                                <div className="d-flex flex-wrap gap-1" style={{ marginLeft: '-24px' }}>
                                    {categories.map(cat => <span key={cat} className="category-tag">{cat}</span>)}
                                    {remainingCategories > 0 && <span className="category-tag">+{remainingCategories}</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="event-actions">
                        <div className="d-flex gap-2">
                            <Link to={`/event/${event.id}`} className="btn btn-sm btn-primary">
                                View Details
                            </Link>
                            {isOwner && (
                                <Link to={`/edit-event/${event.id}`} className="btn btn-sm btn-outline-secondary">
                                    <i className="fas fa-edit"></i>
                                </Link>
                            )}
                        </div>
                        <small className={`text-${timeRemaining.class} d-flex align-items-center`}>
                            <i className={`fas fa-${timeRemaining.icon} me-1`}></i>
                            {timeRemaining.text}
                        </small>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default EventCard;
