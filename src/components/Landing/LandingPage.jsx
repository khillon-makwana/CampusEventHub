
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { apiGet } from '../../api';
import Button from '../UI/Button';
import Card from '../UI/Card';
import EventCard from '../Events/EventCard';
import AnimatedSection from '../UI/AnimatedSection';
import LiquidBackground from '../UI/LiquidBackground';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 300], [0, 100]);
    const y2 = useTransform(scrollY, [0, 300], [0, -100]);

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
            <LiquidBackground />

            {/* --- Navigation --- */}
            <nav className="landing-nav container-custom d-flex justify-content-between align-items-center py-4 position-relative z-3">
                <Link to="/" className="brand-logo text-white text-decoration-none d-flex align-items-center gap-2">
                    <i className="fas fa-atom fa-lg text-secondary-400"></i>
                    <span className="fw-bold h4 mb-0 tracking-tight">EventHub</span>
                </Link>
                <div className="d-flex gap-3">
                    <Button variant="ghost" onClick={() => navigate('/login')} className="text-white">Log In</Button>
                    <Button variant="primary" glow magnetic onClick={() => navigate('/register')}>Sign Up</Button>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section className="hero-section position-relative">
                <div className="container-custom position-relative z-2 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="badge glass-panel text-secondary-400 rounded-pill px-4 py-2 mb-4 fw-bold border-secondary-500">
                            ✨ The Future of Campus Life
                        </span>
                        <h1 className="hero-title display-1 fw-bold mb-4 text-white">
                            Experience the <br />
                            <span className="text-gradient text-glow">Extraordinary</span>
                        </h1>
                        <p className="hero-subtitle lead text-white-50 mb-5 mx-auto">
                            Discover a universe of events. From tech talks to cosmic parties,
                            your next great memory starts here.
                        </p>
                        <div className="d-flex gap-3 justify-content-center">
                            <Button variant="primary" size="lg" glow magnetic onClick={() => navigate('/register')} icon={<i className="fas fa-rocket"></i>}>
                                Launch App
                            </Button>
                            <Button variant="outline" size="lg" magnetic onClick={() => navigate('/events')} icon={<i className="fas fa-search"></i>} className="text-white border-white">
                                Explore Events
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- Features Section --- */}
            <section className="features-section section-padding">
                <div className="container-custom text-center">
                    <AnimatedSection>
                        <h2 className="section-heading mb-5 text-white">Why Choose EventHub?</h2>
                    </AnimatedSection>
                    <div className="row g-4">
                        <div className="col-md-4">
                            <AnimatedSection delay={0.2} className="h-100">
                                <Card glass holographic hover className="h-100 text-center p-5">
                                    <div className="feature-icon-wrapper mb-4">
                                        <i className="fas fa-search fa-2x text-secondary-400"></i>
                                    </div>
                                    <h3 className="h4 fw-bold mb-3 text-white">Discover</h3>
                                    <p className="text-white-50">Browse a live feed of university-wide events in real-time.</p>
                                </Card>
                            </AnimatedSection>
                        </div>
                        <div className="col-md-4">
                            <AnimatedSection delay={0.3} className="h-100">
                                <Card glass holographic hover className="h-100 text-center p-5">
                                    <div className="feature-icon-wrapper mb-4">
                                        <i className="fas fa-plus-circle fa-2x text-primary-400"></i>
                                    </div>
                                    <h3 className="h4 fw-bold mb-3 text-white">Create</h3>
                                    <p className="text-white-50">Host your own events and manage RSVPs with powerful tools.</p>
                                </Card>
                            </AnimatedSection>
                        </div>
                        <div className="col-md-4">
                            <AnimatedSection delay={0.4} className="h-100">
                                <Card glass holographic hover className="h-100 text-center p-5">
                                    <div className="feature-icon-wrapper mb-4">
                                        <i className="fas fa-ticket-alt fa-2x text-accent-pink"></i>
                                    </div>
                                    <h3 className="h4 fw-bold mb-3 text-white">Connect</h3>
                                    <p className="text-white-50">Secure tickets instantly and connect with fellow students.</p>
                                </Card>
                            </AnimatedSection>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Featured Events Section --- */}
            <section className="featured-events-section section-padding">
                <div className="container-custom">
                    <div className="d-flex justify-content-between align-items-end mb-5">
                        <AnimatedSection>
                            <h2 className="section-heading mb-0 text-white">Trending Now</h2>
                            <p className="text-white-50 mt-2">Don't miss out on the latest buzz.</p>
                        </AnimatedSection>
                        <AnimatedSection delay={0.1}>
                            <Button variant="ghost" onClick={() => navigate('/events')} icon={<i className="fas fa-arrow-right"></i>} className="text-secondary-400">
                                View All
                            </Button>
                        </AnimatedSection>
                    </div>

                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary-500" role="status">
                                <span className="visually-hidden">Loading events...</span>
                            </div>
                        </div>
                    )}

                    {!loading && featuredEvents.length === 0 && (
                        <AnimatedSection delay={0.2}>
                            <div className="text-center py-5">
                                <i className="fas fa-meteor fa-3x text-white-50 mb-3"></i>
                                <p className="text-white-50 lead">No upcoming events found. Be the first to create one!</p>
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
            <section className="cta-section section-padding text-center">
                <div className="cta-bg-gradient"></div>
                <div className="container-custom position-relative z-2">
                    <AnimatedSection>
                        <h2 className="display-4 fw-bold text-white mb-4">Ready for Blastoff?</h2>
                        <p className="lead text-white-50 mb-5 mx-auto" style={{ maxWidth: '600px' }}>
                            Join the community today and start your journey.
                        </p>
                        <Button variant="primary" size="lg" glow magnetic onClick={() => navigate('/register')} className="px-5 py-3">
                            Create Free Account
                        </Button>
                    </AnimatedSection>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="landing-footer pt-5 pb-4">
                <div className="container-custom">
                    <div className="row gy-4">
                        <div className="col-md-4">
                            <Link to="/" className="brand-logo mb-3 d-inline-block text-white text-decoration-none">
                                <i className="fas fa-atom me-2 text-secondary-400"></i>EventHub
                            </Link>
                            <p className="text-white-50 small">
                                The next generation event platform for students.
                            </p>
                        </div>
                        <div className="col-md-4 offset-md-4 text-md-end">
                            <h6 className="fw-bold text-white text-uppercase mb-3">Socials</h6>
                            <div className="d-flex gap-3 justify-content-md-end">
                                <a href="#" className="text-white-50 hover-primary"><i className="fab fa-twitter fa-lg"></i></a>
                                <a href="#" className="text-white-50 hover-primary"><i className="fab fa-instagram fa-lg"></i></a>
                                <a href="#" className="text-white-50 hover-primary"><i className="fab fa-discord fa-lg"></i></a>
                            </div>
                            <p className="text-white-50 mt-4 small">
                                &copy; {new Date().getFullYear()} CampusEventHub.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
