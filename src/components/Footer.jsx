// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './Footer.css';

export default function Footer() {
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 10,
            },
        },
    };

    return (
        <footer className="main-footer" ref={ref}>
            <div className="footer-glow"></div>

            <div className="container position-relative">
                <motion.div
                    className="row g-5"
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                >
                    {/* Brand Column */}
                    <motion.div className="col-lg-4 col-md-6" variants={itemVariants}>
                        <div className="footer-brand">
                            <Link to="/dashboard" className="footer-logo">
                                <i className="fas fa-calendar-star"></i>
                                EventHub
                            </Link>
                            <p className="footer-desc">
                                Discover, create, and join extraordinary events in your campus community.
                                Making memories has never been easier.
                            </p>
                            <div className="social-links">
                                <a href="#" className="social-icon" aria-label="Instagram">
                                    <i className="fab fa-instagram"></i>
                                </a>
                                <a href="#" className="social-icon" aria-label="Twitter">
                                    <i className="fab fa-twitter"></i>
                                </a>
                                <a href="#" className="social-icon" aria-label="LinkedIn">
                                    <i className="fab fa-linkedin-in"></i>
                                </a>
                                <a href="#" className="social-icon" aria-label="Discord">
                                    <i className="fab fa-discord"></i>
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div className="col-lg-2 col-md-6" variants={itemVariants}>
                        <h5 className="footer-heading">Discover</h5>
                        <ul className="footer-links">
                            <li><Link to="/events" className="footer-link">Browse Events</Link></li>
                            <li><Link to="/dashboard" className="footer-link">Featured</Link></li>
                            <li><Link to="/analytics" className="footer-link">Trending</Link></li>
                            <li><Link to="/tickets" className="footer-link">Get Tickets</Link></li>
                        </ul>
                    </motion.div>

                    {/* Account Links */}
                    <motion.div className="col-lg-2 col-md-6" variants={itemVariants}>
                        <h5 className="footer-heading">Account</h5>
                        <ul className="footer-links">
                            <li><Link to="/profile" className="footer-link">My Profile</Link></li>
                            <li><Link to="/my-events" className="footer-link">Organized Events</Link></li>
                            <li><Link to="/tickets" className="footer-link">My Tickets</Link></li>
                            <li><Link to="/notifications" className="footer-link">Notifications</Link></li>
                        </ul>
                    </motion.div>

                    {/* Newsletter */}
                    <motion.div className="col-lg-4 col-md-6" variants={itemVariants}>
                        <h5 className="footer-heading">Stay Updated</h5>
                        <p className="mb-4 text-white-50">
                            Subscribe to our newsletter to get the latest event updates and exclusive offers.
                        </p>
                        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <div className="input-group">
                                <input
                                    type="email"
                                    className="newsletter-input"
                                    placeholder="Enter your email"
                                    required
                                />
                                <button type="submit" className="newsletter-btn">
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>

                {/* Footer Bottom */}
                <motion.div
                    className="footer-bottom"
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <div className="row align-items-center">
                        <div className="col-md-6 text-center text-md-start">
                            <p className="mb-0">
                                &copy; {new Date().getFullYear()} CampusEventHub. All rights reserved.
                            </p>
                        </div>
                        <div className="col-md-6">
                            <div className="footer-bottom-links">
                                <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                                <Link to="/terms" className="footer-link">Terms of Service</Link>
                                <Link to="/cookies" className="footer-link">Cookie Settings</Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
}