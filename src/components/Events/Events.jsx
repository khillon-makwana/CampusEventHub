// src/components/Events/Events.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiGet } from '../../api';
import Layout from '../Layout'; 

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

// Helper for time remaining
const formatTimeRemaining = (dateString) => {
    const eventDate = new Date(dateString).getTime();
    const now = new Date().getTime();
    const diff = eventDate - now;

    if (diff < 0) {
        return { text: 'Live', class: 'success fw-bold', icon: 'play-circle' };
    }
    const diffMinutes = Math.ceil(diff / (1000 * 60));
    if (diffMinutes < 60) {
        return { text: `${diffMinutes}m`, class: 'danger fw-bold', icon: 'clock' };
    }
    const diffHours = Math.ceil(diffMinutes / 60);
    if (diffHours < 24) {
        return { text: `${diffHours}h`, class: 'warning', icon: 'clock' };
    }
    const diffDays = Math.ceil(diffHours / 24);
    return { text: `${diffDays}d`, class: 'muted', icon: 'clock' };
};

// Main Component
export default function Events() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // State for data, loading, and errors
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for form inputs (controlled components)
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [category, setCategory] = useState(searchParams.get('category') || '');
    const [location, setLocation] = useState(searchParams.get('location') || '');
    const [pageJump, setPageJump] = useState('');

    // Read filters from URL
    const queryParams = useMemo(() => ({
        page: searchParams.get('page') || '1',
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        location: searchParams.get('location') || '',
        sort: searchParams.get('sort') || 'date_asc',
    }), [searchParams]);

    // Data fetching effect
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
    }, [queryParams]); // Re-fetch when queryParams change

    // --- Event Handlers ---

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

    const handleCardClick = (e, eventId) => {
        if (e.target.tagName === 'A' || e.target.closest('a') || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return;
        }
        navigate(`/event/${eventId}`);
    };

    // --- Render Logic ---

    if (error) {
        return (
            // *** FIX: Pass user data ***
            <Layout user={data?.user}> 
                <div className="container mt-4 text-center">
                    <div className="alert alert-danger">Error: {error}</div>
                </div>
            </Layout>
        );
    }

    if (loading && !data) {
        return (
            // *** FIX: Pass user data ***
            <Layout user={data?.user}>
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
        // *** FIX: Pass user data ***
        <Layout user={data?.user}> 
            <div className="container mt-4">
                {/* Hero Section */}
                <div className="events-hero">
                    <div className="row justify-content-center">
                        <div className="col-lg-8 text-center">
                            <h1 className="display-5 fw-bold mb-3">Discover Amazing Events</h1>
                            <p className="lead text-muted mb-4">
                                Find and join incredible events happening around you. From workshops to concerts, there's always something exciting to experience.
                            </p>
                            {/* Quick Stats */}
                            {data && (
                                <div className="row justify-content-center g-4">
                                    <div className="col-md-3 col-6"><div className="stats-card">
                                        <div className="stats-number">{data.stats.total_events}</div>
                                        <div className="stats-label">Total Events</div>
                                    </div></div>
                                    <div className="col-md-3 col-6"><div className="stats-card">
                                        <div className="stats-number">{data.stats.showing}</div>
                                        <div className="stats-label">Showing</div>
                                    </div></div>
                                    <div className="col-md-3 col-6"><div className="stats-card">
                                        <div className="stats-number">{data.stats.total_categories}</div>
                                        <div className="stats-label">Categories</div>
                                    </div></div>
                                    <div className="col-md-3 col-6"><div className="stats-card">
                                        <div className="stats-number">{data.stats.total_pages}</div>
                                        <div className="stats-label">Pages</div>
                                    </div></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="d-flex justify-content-between align-items-center mb-4">
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
                </div>

                {/* Search and Filter Section */}
                <div className="filter-card">
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
                        {/* Active Filters Display */}
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
                </div>

                {/* Results Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <p className="text-muted mb-0">
                            {data && data.stats.total_events > 0 ? (
                                <>Showing <strong>{data.stats.showing}</strong> of <strong>{data.stats.total_events}</strong> events {hasActiveFilters && "matching your criteria"}</>
                            ) : (
                                "No events found"
                            )}
                        </p>
                    </div>
                    {/* Enhanced Sort Options */}
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
                </div>

                {/* Events Grid */}
                {loading && <div className="text-center p-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}
                
                {!loading && data && data.events.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon"><i className="fas fa-calendar-times"></i></div>
                        <h3 className="mb-3">No Events Found</h3>
                        <p className="text-muted mb-4">
                            {hasActiveFilters
                                ? <>We couldn't find any events matching your search criteria. Try adjusting your filters or <button onClick={clearAllFilters} className="btn btn-link p-0">clear all filters</button> to see more events.</>
                                : "There are no upcoming events at the moment. Be the first to create an event and get the party started!"}
                        </p>
                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                            <Link to="/create-event" className="btn btn-primary btn-lg"><i className="fas fa-plus-circle me-2"></i>Create Your First Event</Link>
                            <Link to="/dashboard" className="btn btn-outline-primary btn-lg"><i className="fas fa-home me-2"></i>Back to Dashboard</Link>
                        </div>
                    </div>
                )}

                {!loading && data && data.events.length > 0 && (
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 event-grid">
                        {data.events.map((event, index) => {
                            const timeRemaining = formatTimeRemaining(event.event_date);
                            const categories = event.category_names ? event.category_names.split(', ').slice(0, 2) : [];
                            const remainingCategories = event.category_names ? event.category_names.split(', ').length - 2 : 0;
                            
                            return (
                                <div key={event.id} className="col event-item" style={{ "--index": index, animationDelay: `${index * 0.1}s` }}>
                                    <div className="card h-100 event-card" onClick={(e) => handleCardClick(e, event.id)} style={{ cursor: 'pointer' }}>
                                        {/* Event Image */}
                                        <div className="position-relative overflow-hidden">
                                            {event.image ? (
                                                <img src={event.image} className="card-img-top event-image" alt={event.title} />
                                            ) : (
                                                <div className="card-img-top bg-gradient-primary d-flex align-items-center justify-content-center text-white" style={{ height: '200px' }}>
                                                    <div className="text-center"><i className="fas fa-calendar-alt fa-3x mb-2 opacity-75"></i><p className="mb-0 small fw-bold">EVENT</p></div>
                                                </div>
                                            )}
                                            <span className={`event-status-badge badge bg-${event.status === 'ongoing' ? 'primary' : 'success'}`}>
                                                <i className={`fas fa-${event.status === 'ongoing' ? 'play-circle' : 'clock'} me-1`}></i>
                                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                            </span>
                                        </div>

                                        <div className="card-body d-flex flex-column">
                                            <h5 className="card-title fw-bold text-dark mb-2 line-clamp-2" style={{ minHeight: '3rem' }}>{event.title}</h5>
                                            <p className="card-text text-muted flex-grow-1 mb-3 line-clamp-2">
                                                {event.description?.replace(/<[^>]+>/g, '').substring(0, 100)}...
                                            </p>
                                            <div className="event-meta small text-muted mb-3">
                                                <div className="d-flex align-items-center mb-2"><i className="fas fa-map-marker-alt"></i><span className="text-truncate">{event.location}</span></div>
                                                <div className="d-flex align-items-center mb-2"><i className="fas fa-calendar-alt"></i><span>{formatDate(event.event_date)}</span></div>
                                                <div className="d-flex align-items-center mb-2"><i className="fas fa-user"></i><span className="text-truncate">By {event.organizer_name}</span></div>
                                                {event.ticket_price > 0 && (
                                                    <div className="d-flex align-items-center mb-2"><i className="fas fa-ticket-alt"></i><span>Price: KSh {Number(event.ticket_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
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
                                                <div className="d-flex align-items-center"><i className="fas fa-users"></i>
                                                    <span>
                                                        {event.attendee_count} attending
                                                        {event.total_tickets > 0 && ` • ${event.available_tickets} tickets left`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                                <div className="btn-group">
                                                    <Link to={`/event/${event.id}`} className="btn btn-sm btn-outline-primary"><i className="fas fa-eye me-1"></i>View</Link>
                                                    {/* Edit button logic can be added here later */}
                                                </div>
                                                <small className={`text-${timeRemaining.class}`}>
                                                    <i className={`fas fa-${timeRemaining.icon} me-1`}></i>{timeRemaining.text}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Enhanced Pagination */}
                {data && data.pagination.total_pages > 1 && (
                    <div className="pagination-card">
                        <nav aria-label="Event pagination">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <small className="text-muted">
                                        Page <strong>{data.pagination.page}</strong> of <strong>{data.pagination.total_pages}</strong>
                                        • <strong>{data.pagination.total_events}</strong> total events
                                    </small>
                                </div>
                                <PaginationComponent
                                    currentPage={data.pagination.page}
                                    totalPages={data.pagination.total_pages}
                                    onPageChange={handlePageChange}
                                />
                                <div className="d-flex align-items-center gap-2">
                                    <small className="text-muted">Go to page:</small>
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
                    </div>
                )}
            </div>

            <style>{`
                /* Events Page Specific Styles */
                .events-hero {
                    background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
                    border-radius: 20px;
                    padding: 3rem 2rem;
                    margin-bottom: 2rem;
                    text-align: center;
                    animation: fadeInUp 0.8s ease-out;
                }
                .filter-card {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* var(--shadow-medium) */
                    border: none;
                    margin-bottom: 2rem;
                    animation: slideInDown 0.6s ease-out;
                }
                .filter-card .card-body {
                    padding: 2rem;
                }
                .stats-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    text-align: center;
                    animation: fadeInUp 0.8s ease-out 0.2s both;
                }
                .stats-number {
                    font-size: 2.5rem;
                    font-weight: bold;
                    line-height: 1;
                    margin-bottom: 0.5rem;
                }
                .stats-label {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }
                .event-grid {
                    opacity: 1; /* Managed by event-item animation */
                }
                .event-card {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); /* var(--shadow-soft) */
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    border: none;
                    height: 100%;
                    position: relative;
                }
                .event-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* var(--shadow-large) */
                }
                .event-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* var(--gradient-primary) */
                    transform: scaleX(0);
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    transform-origin: left;
                    z-index: 2;
                }
                .event-card:hover::before {
                    transform: scaleX(1);
                }
                .event-image {
                    height: 200px;
                    width: 100%;
                    object-fit: cover;
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                .event-card:hover .event-image {
                    transform: scale(1.1);
                }
                .event-status-badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    z-index: 3;
                    font-size: 0.75rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: 50px;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    animation: pulse 2s infinite;
                }
                .event-meta {
                    font-size: 0.875rem;
                }
                .event-meta i {
                    width: 16px;
                    text-align: center;
                    margin-right: 0.5rem;
                    color: #4F46E5; /* var(--primary-color) */
                }
                .category-tag {
                    display: inline-block;
                    background: rgba(79, 70, 229, 0.1);
                    color: #4F46E5; /* var(--primary-color) */
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    margin: 0.1rem;
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                .category-tag:hover {
                    background: #4F46E5; /* var(--primary-color) */
                    color: white;
                    transform: scale(1.05);
                }
                .pagination-card {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    padding: 2rem;
                    margin-top: 3rem;
                    animation: fadeInUp 0.8s ease-out;
                }
                .page-link {
                    border: none;
                    border-radius: 12px !important; /* Overwrite bootstrap */
                    margin: 0 0.25rem;
                    color: #6b7280;
                    font-weight: 500;
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                .page-link:hover {
                    background: #4F46E5; /* var(--primary-color) */
                    color: white;
                    transform: translateY(-2px);
                }
                .page-item.active .page-link {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* var(--gradient-primary) */
                    border: none;
                    transform: scale(1.1);
                    color: white;
                }
                .page-item.disabled .page-link {
                    background: #f3f4f6;
                    color: #9ca3af;
                }
                .sort-dropdown .dropdown-toggle {
                    border-radius: 12px;
                    padding: 0.5rem 1rem;
                    border: 2px solid #e5e7eb;
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                .sort-dropdown .dropdown-toggle:hover {
                    border-color: #4F46E5; /* var(--primary-color) */
                    transform: translateY(-2px);
                }
                .search-btn {
                    border-radius: 12px;
                    padding: 0.65rem 1.5rem; /* Adjusted padding to match form-control height */
                    transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                .search-btn:hover {
                    transform: translateY(-3px) scale(1.05);
                }
                .empty-state {
                    padding: 4rem 2rem;
                    text-align: center;
                    animation: fadeInUp 0.8s ease-out;
                }
                .empty-state-icon {
                    font-size: 4rem;
                    color: #d1d5db;
                    margin-bottom: 1.5rem;
                    animation: float 3s ease-in-out infinite;
                }
                .filter-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                .filter-tag {
                    background: rgba(79, 70, 229, 0.1);
                    color: #4F46E5; /* var(--primary-color) */
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                }
                .filter-tag:hover {
                    background: #4F46E5; /* var(--primary-color) */
                    color: white;
                    transform: scale(1.05);
                }
                .filter-tag .remove {
                    cursor: pointer;
                    font-weight: bold;
                    margin-left: 0.25rem;
                }
                .loading-skeleton {
                    animation: pulse 2s infinite;
                }
                @keyframes staggerFadeIn {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .event-item {
                    animation: staggerFadeIn 0.6s ease-out forwards;
                    opacity: 0;
                }
                /* Animations */
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                /* Utility */
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .btn-create { /* From your old CSS */
                    transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                .btn-create:hover {
                    transform: translateY(-3px) scale(1.05);
                }
                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .events-hero { padding: 2rem 1rem; }
                    .stats-card { margin-bottom: 1rem; }
                }
            `}</style>
        </Layout>
    );
}

// Re-usable Pagination Component
function PaginationComponent({ currentPage, totalPages, onPageChange }) {
    const pages = [];
    const pageLimit = 2; // Show 2 pages before and after current

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