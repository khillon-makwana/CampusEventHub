import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './EventCard.css';

// Helper for time remaining
const formatTimeRemaining = (dateString) => {
    const diff = new Date(dateString).getTime() - new Date().getTime();
    if (diff < 0) { return { text: 'Live', class: 'urgent', icon: 'play-circle' }; }
    const diffMinutes = Math.ceil(diff / (1000 * 60));
    if (diffMinutes < 60) { return { text: `${diffMinutes}m left`, class: 'urgent', icon: 'hourglass-half' }; }
    const diffHours = Math.ceil(diffMinutes / 60);
    if (diffHours < 24) { return { text: `${diffHours}h left`, class: 'soon', icon: 'clock' }; }
    const diffDays = Math.ceil(diffHours / 24);
    return { text: `${diffDays}d left`, class: 'normal', icon: 'calendar-day' };
};

const EventCard = ({ event, delay = 0, children }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.1 });
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit'
        });
    };

    const handleCardClick = (e) => {
        if (e.target.tagName === 'A' || e.target.closest('a') || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
        }
        navigate(`/event/${event.id}`);
    };

    const timeRemaining = formatTimeRemaining(event.event_date);
    const categories = event.category_names ? event.category_names.split(', ').slice(0, 2) : [];
    const remainingCategories = event.category_names ? event.category_names.split(', ').length - 2 : 0;
    const eventImageUrl = event.image ? `http://localhost/CampusEventHub/${event.image}` : null;

    const statusClass = event.status === 'ongoing' ? 'status-ongoing' : (event.status === 'completed' ? 'status-completed' : 'status-upcoming');

    return (
        <motion.div
            ref={ref}
            className="col event-card-wrapper"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: delay * 0.1 }}
        >
            <div
                className="event-card"
                onClick={handleCardClick}
                style={{ cursor: 'pointer' }}
            >
                <div className="event-image-container">
                    {eventImageUrl ? (
                        <img
                            src={eventImageUrl}
                            className="event-image"
                            alt={event.title}
                        />
                    ) : (
                        <div className="event-image-placeholder">
                            <div className="text-center">
                                <i className="fas fa-atom fa-3x mb-2"></i>
                                <p className="mb-0 small fw-bold letter-spacing-2">EVENT</p>
                            </div>
                        </div>
                    )}
                    <div className="event-overlay"></div>
                    <div className={`event-status-badge ${statusClass}`}>
                        <i className={`fas fa-${event.status === 'ongoing' ? 'play-circle' : 'calendar-check'}`}></i>
                        {event.status ? (event.status.charAt(0).toUpperCase() + event.status.slice(1)) : 'Upcoming'}
                    </div>
                </div>

                <div className="event-content">
                    <h5 className="event-title">{event.title}</h5>

                    {categories.length > 0 && (
                        <div className="event-categories">
                            {categories.map(cat => <span key={cat} className="category-tag">{cat}</span>)}
                            {remainingCategories > 0 && <span className="category-tag">+{remainingCategories}</span>}
                        </div>
                    )}

                    <p className="event-description">
                        {event.description?.replace(/<[^>]+>/g, '').substring(0, 80)}...
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
                        <div className="meta-item">
                            <i className="fas fa-ticket-alt"></i>
                            <span className={event.ticket_price > 0 ? "meta-price" : "text-success fw-bold"}>
                                {event.ticket_price > 0
                                    ? `KSh ${Number(event.ticket_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                    : 'Free Entry'}
                            </span>
                        </div>
                    </div>

                    <div className="event-actions">
                        <small className={`time-remaining ${timeRemaining.class}`}>
                            <i className={`fas fa-${timeRemaining.icon}`}></i>
                            {timeRemaining.text}
                        </small>

                        <div className="d-flex gap-2 flex-wrap justify-content-end">
                            {children ? children : (
                                <Link to={`/event/${event.id}`} className="btn-view-details">
                                    View
                                    <i className="fas fa-arrow-right"></i>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default EventCard;
