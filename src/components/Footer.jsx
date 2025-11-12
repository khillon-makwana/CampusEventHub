// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './Footer.css'; // Import the new CSS file

// Animation: Variants for the container to stagger children
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2, // Each child will animate 0.2s after the previous one
        },
    },
};

// Animation: Variant for the items (fade in and slide up)
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

export default function Footer() {
    // This hook triggers when the footer scrolls into view
    const { ref, inView } = useInView({
        triggerOnce: true, // Only animate once
        threshold: 0.1,    // Trigger when 10% is visible
    });

    return (
        <motion.footer
            ref={ref}
            className="main-footer text-white py-5"
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
        >
            <div className="container">
                <div className="row align-items-center">
                    <motion.div 
                        className="col-lg-4 text-center text-lg-start mb-3 mb-lg-0"
                        variants={itemVariants}
                    >
                        <h3 className="h4 mb-2 footer-logo">EventHub</h3>
                        <p className="footer-slogan mb-0">
                            Connecting people through unforgettable experiences.
                        </p>
                    </motion.div>

                    <motion.div 
                        className="col-lg-4 text-center mb-3 mb-lg-0"
                        variants={itemVariants}
                    >
                        <div className="footer-links">
                            {/* Changed <a> to <Link> for React Router */}
                            <Link to="/dashboard" className="footer-link">Home</Link>
                            <Link to="/events" className="footer-link">Events</Link>
                            <Link to="/my-events" className="footer-link">My Events</Link>
                            <Link to="/profile" className="footer-link">Profile</Link>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="col-lg-4 text-center text-lg-end"
                        variants={itemVariants}
                    >
                        <div className="mb-3">
                            {/* Social links are external, so they remain <a> tags */}
                            <a href="#" className="social-icon me-2">
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a href="#" className="social-icon me-2">
                                <i className="fab fa-whatsapp"></i>
                            </a>
                            <a href="#" className="social-icon me-2">
                                <i className="fab fa-linkedin"></i>
                            </a>
                            <a href="#" className="social-icon">
                                <i className="fab fa-twitter"></i>
                            </a>
                        </div>
                        <p className="footer-copyright mb-0">
                            &copy; {new Date().getFullYear()} EventHub. All rights reserved.
                        </p>
                    </motion.div>
                </div>
            </div>
        </motion.footer>
    );
}