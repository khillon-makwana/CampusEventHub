// src/components/Events/Events.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { apiGet } from '../../api';
import Layout from '../Layout';
import './Events.css'; // Import the new CSS

// --- Reusable Animated Section Wrapper ---
const AnimatedSection = ({ children, className = '', delay = 0.1 }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    return (
        <motion.section
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: delay }}
        >
            {children}
        </motion.section>
    );
};

// --- Reusable Stat Item Component ---
const StatCard = ({ number, label, delay = 0 }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true });
    return (
        <motion.div 
            className="col-md-3 col-6"
            ref={ref}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: delay * 0.1 }}
        >
            <div className="stats-card">
                <div className="stats-number">{number}</div>
                <div className="stats-label">{label}</div>
            </div>
        </motion.div>
    );
};

// --- Reusable Event Card Component ---
const EventCard = ({ event, delay = 0 }) => {
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
            whileHover="hover"
        >
            <motion.div
                className="card h-100 event-card"
                onClick={(e) => handleCardClick(e, event.id)}
                style={{ cursor: 'pointer' }}
                whileHover={{ 
                    transform: 'perspective(1000px) rotateY(3deg) rotateX(-5deg) scale(1.02)',
                    boxShadow: 'var(--shadow-large)'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <div className="position-relative overflow-hidden event-image">
                    {eventImageUrl ? (
                        <motion.img src={eventImageUrl} className="card-img-top" alt={event.title} variants={{ hover: { scale: 1.1 } }} />
                    ) : (
                        <div className="card-img-top event-image-placeholder">
                            <div className="text-center"><i className="fas fa-calendar-alt"></i><p className="mb-0 small fw-bold">EVENT</p></div>
                        </div>
                    )}
                    <span className={`event-status-badge badge bg-${event.status === 'ongoing' ? 'primary' : 'success'}`}>
                        <i className={`fas fa-${event.status === 'ongoing' ? 'play-circle' : 'clock'} me-1`}></i>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                </div>

                <div className="card-body d-flex flex-column event-content">
                    <h5 className="card-title fw-bold text-dark mb-2 event-title">{event.title}</h5>
                    <p className="card-text text-muted flex-grow-1 mb-3 event-description">
                        {event.description?.replace(/<[^>]+>/g, '').substring(0, 100)}...
                    </p>
                    <div className="event-meta small text-muted mb-3">
                        <div className="meta-item"><i className="fas fa-map-marker-alt"></i><span className="text-truncate">{event.location}</span></div>
                        <div className="meta-item"><i className="fas fa-calendar-alt"></i><span>{formatDate(event.event_date)}</span></div>
                        <div className="meta-item"><i className="fas fa-user"></i><span className="text-truncate">By {event.organizer_name}</span></div>
                        {event.ticket_price > 0 && (
                            <div className="meta-item"><i className="fas fa-ticket-alt"></i><span>Price: KSh {Number(event.ticket_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        )}
                        {categories.length > 0 && (
                            <div className="meta-item">
                                <i className="fas fa-tags"></i>
                                <div className="d-flex flex-wrap gap-1">
                                    {categories.map(cat => <span key={cat} className="category-tag">{cat}</span>)}
                                    {remainingCategories > 0 && <span className="category-tag">+{remainingCategories} more</span>}
                                </div>
                            </div>
                        )}
                        <div className="meta-item"><i className="fas fa-users"></i>
                            <span>
                                {event.attendee_count} attending
                                {event.total_tickets > 0 && ` • ${event.available_tickets} tickets left`}
                            </span>
                        </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top event-actions">
                        <div className="btn-group">
                            <Link to={`/event/${event.id}`} className="btn btn-sm btn-primary"><i className="fas fa-eye me-1"></i>View</Link>
                        </div>
                        <small className={`text-${timeRemaining.class}`}>
                            <i className={`fas fa-${timeRemaining.icon} me-1`}></i>{timeRemaining.text}
                        </small>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

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

// --- Main Events Component ---
export default function Events() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [pageJump, setPageJump] = useState('');

    const queryParams = useMemo(() => ({
        page: searchParams.get('page') || '1',
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        location: searchParams.get('location') || '',
        sort: searchParams.get('sort') || 'date_asc',
    }), [searchParams]);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                const queryString = new URLSearchParams(queryParams).toString();
                const result = await apiGet(`events.php?${queryString}`);
                setData(result);
            } catch (err) {
                setError(err.message || 'Failed to fetch events');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [queryParams]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchParams(prev => {
            prev.set('search', search);
            prev.set('category', category);
            prev.set('location', location);
            prev.set('page', '1'); 
            return prev;
        });
    };

    const removeFilter = (filterName) => {
        setSearchParams(prev => {
            prev.delete(filterName);
            prev.set('page', '1');
            return prev;
        });
        if (filterName === 'search') setSearch('');
        if (filterName === 'category') setCategory('');
        if (filterName === 'location') setLocation('');
    };

    const clearAllFilters = () => {
        setSearchParams({ page: '1', sort: queryParams.sort });
        setSearch('');
        setCategory('');
        setLocation('');
    };

    const handleSortChange = (sortValue) => {
        setSearchParams(prev => {
            prev.set('sort', sortValue);
            prev.set('page', '1');
            return prev;
        });
    };

    const handlePageChange = (newPage) => {
        if (!data || newPage < 1 || newPage > data.pagination.total_pages) return;
        setSearchParams(prev => {
            prev.set('page', newPage);
            return prev;
        });
        window.scrollTo(0, 0); 
    };

    const handlePageJump = () => {
        const page = parseInt(pageJump, 10);
        if (page >= 1 && page <= data.pagination.total_pages) {
            handlePageChange(page);
            setPageJump('');
        } else {
            alert(`Please enter a valid page number between 1 and ${data.pagination.total_pages}`);
        }
    };

    if (error) {
        return (
            <Layout user={data?.user} unread_count={data?.unread_count}> 
                <div className="container mt-4 text-center">
                    <div className="alert alert-danger">Error: {error}</div>
                </div>
            </Layout>
        );
    }

    if (loading && !data) {
        return (
            <Layout user={data?.user} unread_count={data?.unread_count}>
                <div className="container mt-4 text-center" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
                    <div>
                        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h3 className="mt-3">Loading Events...</h3>
                    </div>
                </div>
            </Layout>
        );
    }

    const sortLabels = {
        'date_asc': 'Date (Earliest First)',
        'date_desc': 'Date (Latest First)',
        'popular': 'Most Popular'
    };

    const hasActiveFilters = queryParams.search || queryParams.category || queryParams.location;

    return (
        <Layout user={data?.user} unread_count={data?.unread_count}> 
            <div className="events-page-container">
                
                {/* Hero Section */}
                <AnimatedSection className="events-hero">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 text-center">
                            <h1 className="display-5 fw-bold mb-3">Discover Amazing Events</h1>
                            <p className="lead text-muted mb-4">
                                Find and join incredible events happening around you. From workshops to concerts, there's always something exciting to experience.
                            </p>
                            {data && (
                                <div className="row justify-content-center g-4">
                                    <StatCard number={data.stats.total_events} label="Total Events" delay={0.2} />
                                    <StatCard number={data.stats.showing} label="Showing" delay={0.3} />
                                    <StatCard number={data.stats.total_categories} label="Categories" delay={0.4} />
                                    <StatCard number={data.stats.total_pages} label="Pages" delay={0.5} />
                                </div>
                            )}
                        </div>
                    </div>
                </AnimatedSection>

                {/* Header Actions */}
                <AnimatedSection delay={0.2} className="d-flex justify-content-between align-items-center">
                    <div>
                        <h2 className="h3 mb-1">All Events</h2>
                        <p className="text-muted mb-0">
                            {data && data.stats.total_events > 0
                                ? `Discover ${data.stats.total_events} amazing events waiting for you`
                                : 'No events found matching your criteria'}
                        </p>
                    </div>
                    <Link to="/create-event" className="btn btn-primary btn-create">
                        <i className="fas fa-plus-circle me-2"></i>Create Event
                    </Link>
                </AnimatedSection>

                {/* Search and Filter Section */}
                <AnimatedSection delay={0.3} className="filter-card">
                    <div className="card-body">
                        <h5 className="card-title mb-4">
                            <i className="fas fa-search text-primary me-2"></i>Find Your Perfect Event
                        </h5>
                        <form className="row g-3" id="searchForm" onSubmit={handleSearchSubmit}>
                            <div className="col-md-4">
                                <label htmlFor="search" className="form-label"><i className="fas fa-search me-1"></i>Search Events</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0"><i className="fas fa-search text-muted"></i></span>
                                    <input type="text" className="form-control border-start-0" id="search" name="search"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search by title, description, or location..." />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="category" className="form-label"><i className="fas fa-tags me-1"></i>Category</label>
                                <select className="form-select" id="category" name="category"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}>
                                    <option value="">All Categories</option>
                                    {data?.categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="location" className="form-label"><i className="fas fa-map-marker-alt me-1"></i>Location</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0"><i className="fas fa-map-pin text-muted"></i></span>
                                    <input type="text" className="form-control border-start-0" id="location" name="location"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="Filter by location..." />
                                </div>
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <div className="d-grid w-100">
                                    <button type="submit" className="btn btn-primary search-btn" disabled={loading}>
                                        {loading ? (
                                            <><i className="fas fa-spinner fa-spin me-2"></i>Searching...</>
                                        ) : (
                                            <><i className="fas fa-search me-2"></i> Search</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                        {hasActiveFilters && (
                            <div className="mt-4">
                                <h6 className="mb-2">Active Filters:</h6>
                                <div className="filter-tags">
                                    {queryParams.search && (
                                        <span className="filter-tag">
                                            Search: "{queryParams.search}"
                                            <span className="remove" onClick={() => removeFilter('search')}>&times;</span>
                                        </span>
                                    )}
                                    {queryParams.category && (
                                        <span className="filter-tag">
                                            Category: {queryParams.category}
                                            <span className="remove" onClick={() => removeFilter('category')}>&times;</span>
                                        </span>
                                    )}
                                    {queryParams.location && (
                                        <span className="filter-tag">
                                            Location: {queryParams.location}
                                            <span className="remove" onClick={() => removeFilter('location')}>&times;</span>
                                        </span>
                                    )}
                                    <button onClick={clearAllFilters} className="filter-tag text-decoration-none border-0" style={{ background: '#ef4444', color: 'white' }}>
                                        <i className="fas fa-times me-1"></i>Clear All
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </AnimatedSection>

                {/* Results Header */}
                <AnimatedSection delay={0.4} className="results-header">
                    <div>
                        <p className="text-muted mb-0">
                            {data && data.stats.total_events > 0 ? (
                                <>Showing <strong>{data.stats.showing}</strong> of <strong>{data.stats.total_events}</strong> events {hasActiveFilters && "matching criteria"}</>
                            ) : (
                                "No events found"
                            )}
                        </p>
                    </div>
                    <div className="dropdown sort-dropdown">
                        <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="fas fa-sort me-2"></i>
                            {sortLabels[queryParams.sort] || 'Sort By'}
                        </button>
                        <ul className="dropdown-menu">
                            <li><button className={`dropdown-item d-flex align-items-center ${queryParams.sort === 'date_asc' ? 'active' : ''}`}
                                onClick={() => handleSortChange('date_asc')}>
                                <i className="fas fa-sort-amount-down-alt me-2"></i> Date (Earliest First)
                            </button></li>
                            <li><button className={`dropdown-item d-flex align-items-center ${queryParams.sort === 'date_desc' ? 'active' : ''}`}
                                onClick={() => handleSortChange('date_desc')}>
                                <i className="fas fa-sort-amount-down me-2"></i> Date (Latest First)
                            </button></li>
                            <li><button className={`dropdown-item d-flex align-items-center ${queryParams.sort === 'popular' ? 'active' : ''}`}
                                onClick={() => handleSortChange('popular')}>
                                <i className="fas fa-fire me-2"></i> Most Popular
                            </button></li>
                        </ul>
                    </div>
                </AnimatedSection>

                {/* Events Grid */}
                {loading && <div className="text-center p-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}
                
                {!loading && data && data.events.length === 0 && (
                    <AnimatedSection className="empty-state">
                        <div className="empty-state-icon"><i className="fas fa-calendar-times"></i></div>
                        <h3 className="mb-3">No Events Found</h3>
                        <p className="text-muted mb-4">
                            {hasActiveFilters
                                ? <>We couldn't find any events matching your search criteria. Try adjusting your filters or <button onClick={clearAllFilters} className="btn btn-link p-0">clear all filters</button>.</>
                                : "No upcoming events right now. Why not create one?"}
                        </p>
                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                            <Link to="/create-event" className="btn btn-primary btn-lg"><i className="fas fa-plus-circle me-2"></i>Create An Event</Link>
                        </div>
                    </AnimatedSection>
                )}

                {!loading && data && data.events.length > 0 && (
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4 event-grid">
                        {data.events.map((event, index) => (
                            <EventCard key={event.id} event={event} delay={index} />
                        ))}
                    </div>
                )}

                {/* Enhanced Pagination */}
                {!loading && data && data.pagination.total_pages > 1 && (
                    <AnimatedSection className="pagination-card">
                        <nav aria-label="Event pagination">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <small className="text-muted">
                                        Page <strong>{data.pagination.page}</strong> of <strong>{data.pagination.total_pages}</strong>
                                    </small>
                                </div>
                                <PaginationComponent
                                    currentPage={data.pagination.page}
                                    totalPages={data.pagination.total_pages}
                                    onPageChange={handlePageChange}
                                />
                                <div className="d-flex align-items-center gap-2">
                                    <small className="text-muted">Go to:</small>
                                    <input type="number" className="form-control form-control-sm" style={{ width: '70px' }}
                                        min="1" max={data.pagination.total_pages}
                                        value={pageJump}
                                        onChange={e => setPageJump(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handlePageJump()}
                                        placeholder={data.pagination.page} />
                                    <button className="btn btn-sm btn-outline-primary" onClick={handlePageJump}>Go</button>
                                </div>
                            </div>
                        </nav>
                    </AnimatedSection>
                )}
            </div>
        </Layout>
    );
}

// Re-usable Pagination Component
function PaginationComponent({ currentPage, totalPages, onPageChange }) {
    const pages = [];
    const pageLimit = 2;
    currentPage = parseInt(currentPage, 10);
    totalPages = parseInt(totalPages, 10);

    // Prev
    pages.push(
        <li key="prev" className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(currentPage - 1)} aria-label="Previous">
                <i className="fas fa-chevron-left"></i>
            </button>
        </li>
    );

    // First page
    if (currentPage > pageLimit + 1) {
        pages.push(
            <li key={1} className="page-item">
                <button className="page-link" onClick={() => onPageChange(1)}>1</button>
            </li>
        );
        if (currentPage > pageLimit + 2) {
            pages.push(<li key="start-ellipsis" className="page-item disabled"><span className="page-link">...</span></li>);
        }
    }

    // Page numbers
    for (let i = Math.max(1, currentPage - pageLimit); i <= Math.min(totalPages, currentPage + pageLimit); i++) {
        pages.push(
            <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
                <button className="page-link" onClick={() => onPageChange(i)}>{i}</button>
            </li>
        );
    }

    // Last page
    if (currentPage < totalPages - pageLimit) {
        if (currentPage < totalPages - pageLimit - 1) {
            pages.push(<li key="end-ellipsis" className="page-item disabled"><span className="page-link">...</span></li>);
        }
        pages.push(
            <li key={totalPages} className="page-item">
                <button className="page-link" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
            </li>
        );
    }

    // Next
    pages.push(
        <li key="next" className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(currentPage + 1)} aria-label="Next">
                <i className="fas fa-chevron-right"></i>
            </button>
        </li>
    );

    return <ul className="pagination mb-0">{pages}</ul>;
}