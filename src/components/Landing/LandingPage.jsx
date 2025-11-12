// src/components/Landing/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer'; // Import useInView
import { apiGet } from '../../api';
import './LandingPage.css';

// Helper to format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// Reusable component for scroll animations
const AnimatedSection = ({ children, delay = 0, className = '' }) => {
    const { ref, inView } = useInView({
        triggerOnce: true, // Animation only triggers once when it enters view
        threshold: 0.1,    // Percentage of element visible to trigger
    });

    return (
        <div 
            ref={ref} 
            className={`animate-on-scroll ${inView ? 'is-visible' : ''} ${className}`}
            style={{ transitionDelay: `${delay}s` }}
        >
            {children}
        </div>
    );
};

// Event Card Sub-Component
const EventCard = ({ event, delay }) => (
    <AnimatedSection delay={delay} className="h-100">
        <Link to={`/event/${event.id}`} className="event-card-wrapper text-decoration-none d-block">
            <div className="event-card">
                <div className="event-image-container">
                    <img 
                        src={event.image ? `http://localhost/CampusEventHub/${event.image}` : "https://via.placeholder.com/600x400?text=CampusEventHub"} 
                        className="event-image" 
                        alt={event.title} 
                    />
                </div>
                <div className="event-card-body">
                    <div>
                        <h5 className="event-card-title">{event.title}</h5>
                        <p className="event-card-meta">
                            <i className="fas fa-calendar-alt me-2"></i>{formatDate(event.event_date)}
                        </p>
                        <p className="event-card-meta">
                            <i className="fas fa-map-marker-alt me-2"></i>{event.location}
                        </p>
                    </div>
                    <p className="event-card-meta mt-2">
                        <i className="fas fa-user me-2"></i>Organized by {event.organizer_name}
                    </p>
                </div>
            </div>
        </Link>
    </AnimatedSection>
);

export default function LandingPage() {
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicEvents = async () => {
            try {
                const data = await apiGet('public_events.php');
                if (data.success) {
                    setFeaturedEvents(data.events);
                }
            } catch (err) {
                console.error("Failed to fetch public events:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicEvents();
    }, []);

    return (
        <div className="landing-page">
            {/* --- Navigation --- */}
            <nav className="landing-nav d-flex justify-content-between align-items-center">
                <Link to="/" className="landing-logo">EventHub</Link>
                <div className="d-flex gap-2">
                    <Link to="/login" className="btn btn-nav btn-nav-login">Log In</Link>
                    <Link to="/register" className="btn btn-nav btn-nav-signup">Sign Up</Link>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Connect, Discover, & Experience</h1>
                    <p className="hero-subtitle">
                        The central hub for all events on campus. From tech talks to the biggest parties,
                        find your next great experience right here.
                    </p>
                    <Link to="/register" className="btn-hero">
                        <i className="fas fa-rocket me-2"></i>Get Started
                    </Link>
                </div>
            </section>

            {/* --- Features Section --- */}
            <section className="features-section">
                <div className="container text-center">
                    <AnimatedSection delay={0.1}>
                        <h2 className="section-heading">Why CampusEventHub?</h2>
                    </AnimatedSection>
                    <div className="row mt-5">
                        <div className="col-lg-4 col-md-6 mb-4">
                            <AnimatedSection delay={0.2} className="h-100">
                                <div className="feature-card">
                                    <div className="feature-icon"><i className="fas fa-search"></i></div>
                                    <h3>Discover Events</h3>
                                    <p className="text-muted">Browse a live feed of all university-wide events, from club meetings to career fairs.</p>
                                </div>
                            </AnimatedSection>
                        </div>
                        <div className="col-lg-4 col-md-6 mb-4">
                            <AnimatedSection delay={0.3} className="h-100">
                                <div className="feature-card">
                                    <div className="feature-icon"><i className="fas fa-plus-circle"></i></div>
                                    <h3>Create Your Own</h3>
                                    <p className="text-muted">Organizing a study group or a party? Post it in seconds and manage your RSVPs.</p>
                                </div>
                            </AnimatedSection>
                        </div>
                        <div className="col-lg-4 col-md-12 mb-4">
                            <AnimatedSection delay={0.4} className="h-100">
                                <div className="feature-card">
                                    <div className="feature-icon"><i className="fas fa-ticket-alt"></i></div>
                                    <h3>Get Tickets</h3>
                                    <p className="text-muted">Securely buy tickets for paid events with our seamless M-Pesa integration.</p>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Featured Events Section --- */}
            <section className="featured-events-section">
                <div className="container">
                    <AnimatedSection delay={0.1}>
                        <h2 className="section-heading text-center">Explore What's Happening</h2>
                    </AnimatedSection>
                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading events...</span>
                            </div>
                        </div>
                    )}
                    {!loading && featuredEvents.length === 0 && (
                        <AnimatedSection delay={0.2}>
                            <p className="text-center text-muted lead py-5">No upcoming events right now. Check back soon!</p>
                        </AnimatedSection>
                    )}
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mt-5">
                        {featuredEvents.map((event, index) => (
                            <div className="col" key={event.id}>
                                <EventCard event={event} delay={0.1 + (index * 0.1)} />
                            </div>
                        ))}
                    </div>
                    {/* View All Events Button */}
                    {!loading && featuredEvents.length > 0 && (
                        <AnimatedSection delay={0.5} className="text-center mt-5">
                            <Link to="/events" className="btn btn-nav btn-nav-login">
                                <i className="fas fa-calendar-alt me-2"></i>View All Events
                            </Link>
                        </AnimatedSection>
                    )}
                </div>
            </section>

            {/* --- Final CTA Section --- */}
            <section className="cta-section">
                <div className="container cta-content">
                    <AnimatedSection delay={0.1}>
                        <h2 className="cta-title">Don't Miss Out!</h2>
                    </AnimatedSection>
                    <AnimatedSection delay={0.3}>
                        <p className="cta-subtitle">Sign up today and connect with your campus community through unforgettable events.</p>
                    </AnimatedSection>
                    <AnimatedSection delay={0.5}>
                        <Link to="/register" className="btn-hero">
                            Create Your Free Account
                        </Link>
                    </AnimatedSection>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="row py-4">
                        <div className="col-md-4 text-center text-md-start mb-4 mb-md-0">
                            <Link to="/" className="footer-logo">EventHub</Link>
                            <p className="mb-0">Your gateway to campus life.</p>
                        </div>
                        <div className="col-md-4 text-center mb-4 mb-md-0">
                            <h6 className="text-uppercase fw-bold mb-3">Quick Links</h6>
                            <Link to="/login" className="footer-link">Log In</Link>
                            <Link to="/register" className="footer-link">Sign Up</Link>
                            <Link to="/events" className="footer-link">Browse Events</Link>
                            <Link to="/profile" className="footer-link">My Profile</Link>
                        </div>
                        <div className="col-md-4 text-center text-md-end">
                            <h6 className="text-uppercase fw-bold mb-3">Connect With Us</h6>
                            <div className="social-icons">
                                <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
                                <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
                                <a href="#" className="social-icon"><i className="fab fa-facebook"></i></a>
                                <a href="#" className="social-icon"><i className="fab fa-linkedin"></i></a>
                            </div>
                            <p className="mt-4 mb-0">&copy; {new Date().getFullYear()} CampusEventHub.</p>
                            <p className="mb-0">All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}