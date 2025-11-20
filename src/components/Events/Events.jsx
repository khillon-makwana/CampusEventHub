import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../Layout';
import AnimatedSection from '../UI/AnimatedSection';
import EventCard from './EventCard';
import { apiGet } from '../../api';

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
            <div className="container mt-4">
                {/* Hero Section */}
                <AnimatedSection className="events-hero mb-5">
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <h1 className="display-4 fw-bold mb-3 text-dark">
                                Discover Campus Events
                            </h1>
                            <p className="lead text-muted mb-4">
                                {data && data.stats.total_events > 0
                                    ? `Explore ${data.stats.total_events} exciting events happening around you.`
                                    : 'Join the community and create unforgettable memories.'}
                            </p>
                            <Link to="/create-event" className="btn btn-primary btn-lg px-4 py-2 rounded-pill shadow-sm">
                                <i className="fas fa-plus-circle me-2"></i>Create Event
                            </Link>
                        </div>
                    </div>
                </AnimatedSection>

                {/* Search and Filter Section */}
                <AnimatedSection delay={0.2} className="filter-card mb-5">
                    <div className="card-body">
                        <h5 className="card-title mb-4 fw-bold text-dark">
                            <i className="fas fa-filter text-primary me-2"></i>Filter Events
                        </h5>
                        <form className="row g-3" id="searchForm" onSubmit={handleSearchSubmit}>
                            <div className="col-md-4">
                                <label htmlFor="search" className="form-label small fw-bold text-uppercase text-muted">Search</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-white border-end-0"><i className="fas fa-search text-muted"></i></span>
                                    <input type="text" className="form-control border-start-0 ps-0" id="search" name="search"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Title, description..." />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <label htmlFor="category" className="form-label small fw-bold text-uppercase text-muted">Category</label>
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
                                <label htmlFor="location" className="form-label small fw-bold text-uppercase text-muted">Location</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-white border-end-0"><i className="fas fa-map-marker-alt text-muted"></i></span>
                                    <input type="text" className="form-control border-start-0 ps-0" id="location" name="location"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="Location..." />
                                </div>
                            </div>
                            <div className="col-md-2 d-flex align-items-end">
                                <button type="submit" className="btn btn-primary w-100 search-btn" disabled={loading}>
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                        </form>

                        <AnimatePresence>
                            {hasActiveFilters && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4"
                                >
                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                        <small className="text-muted me-2">Active Filters:</small>
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
                                        <button onClick={clearAllFilters} className="btn btn-link btn-sm text-danger text-decoration-none">
                                            Clear All
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </AnimatedSection>

                {/* Results Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <p className="text-muted mb-0">
                        {data && data.stats.total_events > 0 ? (
                            <>Showing <strong>{data.stats.showing}</strong> of <strong>{data.stats.total_events}</strong> events</>
                        ) : "No events found"}
                    </p>
                    <div className="dropdown sort-dropdown">
                        <button className="btn btn-white border dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="fas fa-sort me-2 text-muted"></i>
                            {sortLabels[queryParams.sort] || 'Sort By'}
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                            <li><button className={`dropdown-item ${queryParams.sort === 'date_asc' ? 'active' : ''}`}
                                onClick={() => handleSortChange('date_asc')}>Date (Earliest First)</button></li>
                            <li><button className={`dropdown-item ${queryParams.sort === 'date_desc' ? 'active' : ''}`}
                                onClick={() => handleSortChange('date_desc')}>Date (Latest First)</button></li>
                            <li><button className={`dropdown-item ${queryParams.sort === 'popular' ? 'active' : ''}`}
                                onClick={() => handleSortChange('popular')}>Most Popular</button></li>
                        </ul>
                    </div>
                </div>

                {/* Events Grid */}
                {loading && (
                    <div className="text-center p-5">
                        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                    </div>
                )}

                {!loading && data && data.events.length === 0 && (
                    <AnimatedSection className="empty-state">
                        <div className="empty-state-icon"><i className="fas fa-calendar-times"></i></div>
                        <h3 className="mb-3">No Events Found</h3>
                        <p className="text-muted mb-4">
                            We couldn't find any events matching your criteria.
                        </p>
                        <button onClick={clearAllFilters} className="btn btn-outline-primary">
                            Clear Filters
                        </button>
                    </AnimatedSection>
                )}

                {!loading && data && data.events.length > 0 && (
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-5">
                        {data.events.map((event, index) => (
                            <EventCard key={event.id} event={event} delay={index} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && data && data.pagination.total_pages > 1 && (
                    <AnimatedSection className="pagination-card mb-5">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <small className="text-muted">
                                Page {data.pagination.page} of {data.pagination.total_pages}
                            </small>
                            <PaginationComponent
                                currentPage={data.pagination.page}
                                totalPages={data.pagination.total_pages}
                                onPageChange={handlePageChange}
                            />
                            <div className="d-flex align-items-center gap-2">
                                <input type="number" className="form-control form-control-sm" style={{ width: '60px' }}
                                    min="1" max={data.pagination.total_pages}
                                    value={pageJump}
                                    onChange={e => setPageJump(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handlePageJump()}
                                    placeholder="Go" />
                            </div>
                        </div>
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