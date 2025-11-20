import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGet } from '../../api';
import Button from '../UI/Button';
import Card from '../UI/Card';
import EventCard from '../Events/EventCard';
import AnimatedSection from '../UI/AnimatedSection';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
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
            <nav className="landing-nav container-custom d-flex justify-content-between align-items-center py-4">
                <Link to="/" className="brand-logo">
                    <i className="fas fa-calendar-star me-2"></i>EventHub
                </Link>
                <div className="d-flex gap-3">
                    <Button variant="ghost" onClick={() => navigate('/login')}>Log In</Button>
                    <Button variant="primary" onClick={() => navigate('/register')}>Sign Up</Button>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section className="hero-section position-relative overflow-hidden">
                <div className="container-custom position-relative z-2">
                    <div className="row align-items-center min-vh-75">
                        <div className="col-lg-6 text-center text-lg-start">
                            <AnimatedSection>
                                <span className="badge bg-white text-primary shadow-sm rounded-pill px-3 py-2 mb-4 fw-bold">
                                    🚀 The #1 Campus Event Platform
                                </span>
                                <h1 className="hero-title display-3 fw-bold mb-4">
                                    Connect, Discover, <br />
                                    <span className="text-gradient"> & Experience.</span>
                                </h1>
                                <p className="hero-subtitle lead text-muted mb-5">
                                    The central hub for all events on campus. From tech talks to the biggest parties,
                                    find your next great experience right here.
                                </p>
                                <div className="d-flex gap-3 justify-content-center justify-content-lg-start">
                                    <Button variant="primary" size="lg" onClick={() => navigate('/register')} icon={<i className="fas fa-rocket"></i>}>
                                        Get Started
                                    </Button>
                                    <Button variant="outline" size="lg" onClick={() => navigate('/events')} icon={<i className="fas fa-search"></i>}>
                                        Browse Events
                                    </Button>
                                </div>
                            </AnimatedSection>
                        </div>
                        <div className="col-lg-6 mt-5 mt-lg-0">
                            <AnimatedSection delay={0.2}>
                                <div className="hero-image-wrapper position-relative">
                                    <div className="hero-blob blob-1"></div>
                                    <div className="hero-blob blob-2"></div>
                                    <Card glass className="p-3 rotate-card position-relative z-2">
                                        <img
                                            src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                                            alt="Campus Life"
                                            className="img-fluid rounded-4 shadow-lg"
                                        />
                                    </Card>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Features Section --- */}
            <section className="features-section section-padding bg-white">
                <div className="container-custom text-center">
                    <AnimatedSection>
                        <h2 className="section-heading mb-5">Why CampusEventHub?</h2>
                    </AnimatedSection>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <AnimatedSection delay={0.2} className="h-100">
                                <Card className="h-100 text-center p-4" hover>
                                    <div className="feature-icon-wrapper mb-4">
                                        <i className="fas fa-search fa-2x text-primary"></i>
                                    </div>
                                    <h3 className="h4 fw-bold mb-3">Discover Events</h3>
                                    <p className="text-muted">Browse a live feed of all university-wide events, from club meetings to career fairs.</p>
                                </Card>
                            </AnimatedSection>
                        </div>
                        <div className="col-md-4">
                            <AnimatedSection delay={0.3} className="h-100">
                                <Card className="h-100 text-center p-4" hover>
                                    <div className="feature-icon-wrapper mb-4">
                                        <i className="fas fa-plus-circle fa-2x text-secondary"></i>
                                    </div>
                                    <h3 className="h4 fw-bold mb-3">Create Your Own</h3>
                                    <p className="text-muted">Organizing a study group or a party? Post it in seconds and manage your RSVPs.</p>
                                </Card>
                            </AnimatedSection>
                        </div>
                        <div className="col-md-4">
                            <AnimatedSection delay={0.4} className="h-100">
                                <Card className="h-100 text-center p-4" hover>
                                    <div className="feature-icon-wrapper mb-4">
                                        <i className="fas fa-ticket-alt fa-2x text-success"></i>
                                    </div>
                                    <h3 className="h4 fw-bold mb-3">Get Tickets</h3>
                                    <p className="text-muted">Securely buy tickets for paid events with our seamless M-Pesa integration.</p>
                                </Card>
                            </AnimatedSection>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Featured Events Section --- */}
            <section className="featured-events-section section-padding bg-light">
                <div className="container-custom">
                    <div className="d-flex justify-content-between align-items-end mb-5">
                        <AnimatedSection>
                            <h2 className="section-heading mb-0">Explore What's Happening</h2>
                            <p className="text-muted mt-2">Don't miss out on the latest campus buzz.</p>
                        </AnimatedSection>
                        <AnimatedSection delay={0.1}>
                            <Button variant="ghost" onClick={() => navigate('/events')} icon={<i className="fas fa-arrow-right"></i>}>
                                View All
                            </Button>
                        </AnimatedSection>
                    </div>

                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading events...</span>
                            </div>
                        </div>
                    )}

                    {!loading && featuredEvents.length === 0 && (
                        <AnimatedSection delay={0.2}>
                            <div className="text-center py-5">
                                <i className="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                                <p className="text-muted lead">No upcoming events right now. Check back soon!</p>
                            </div>
                        </AnimatedSection>
                    )}

                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                        {featuredEvents.map((event, index) => (
                            <div className="col" key={event.id}>
                                <EventCard event={event} delay={0.1 + (index * 0.1)} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Final CTA Section --- */}
            <section className="cta-section section-padding text-center position-relative overflow-hidden">
                <div className="cta-bg-gradient"></div>
                <div className="container-custom position-relative z-2">
                    <AnimatedSection>
                        <h2 className="display-4 fw-bold text-white mb-4">Ready to Dive In?</h2>
                        <p className="lead text-white-50 mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                            Join thousands of students who are already connecting and creating memories.
                        </p>
                        <Button variant="secondary" size="lg" onClick={() => navigate('/register')} className="px-5 py-3 shadow-lg">
                            Create Your Free Account
                        </Button>
                    </AnimatedSection>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="landing-footer bg-white pt-5 pb-4 border-top">
                <div className="container-custom">
                    <div className="row gy-4">
                        <div className="col-md-4">
                            <Link to="/" className="brand-logo mb-3 d-inline-block">
                                <i className="fas fa-calendar-star me-2"></i>EventHub
                            </Link>
                            <p className="text-muted">
                                Your ultimate gateway to campus life. Discover, create, and experience events like never before.
                            </p>
                        </div>
                        <div className="col-md-4 offset-md-4 text-md-end">
                            <h6 className="fw-bold text-uppercase mb-3">Connect With Us</h6>
                            <div className="d-flex gap-3 justify-content-md-end">
                                <a href="#" className="text-muted hover-primary"><i className="fab fa-twitter fa-lg"></i></a>
                                <a href="#" className="text-muted hover-primary"><i className="fab fa-instagram fa-lg"></i></a>
                                <a href="#" className="text-muted hover-primary"><i className="fab fa-facebook fa-lg"></i></a>
                            </div>
                            <p className="text-muted mt-4 small">
                                &copy; {new Date().getFullYear()} CampusEventHub. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;