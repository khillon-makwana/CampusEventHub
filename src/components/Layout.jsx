// src/components/Layout.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNav from './MobileNav';
import BackToTop from './BackToTop';
import './Layout.css'; // Import the new CSS

// Animation variants for the page content
const pageVariants = {
    initial: {
        opacity: 0,
        y: 20 // Start 20px down
    },
    in: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 20,
            duration: 0.5
        }
    },
    out: {
        opacity: 0,
        y: -20, // Exit by moving up
        transition: {
            duration: 0.2
        }
    }
};

export default function Layout({ children, user, unread_count, hideNav, hideFooter }) {
    const location = useLocation();

    return (
        <div className="layout-wrapper">
            
            {/* Pass user and unread_count to the Navbar */}
            {!hideNav && <Navbar user={user} unread_count={unread_count} />}
            
            {/* AnimatePresence handles the exit animation of the old page */}
            {/* The `key` (location.pathname) tells it *which* page is changing */}
            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname}
                    className="main-content"
                    variants={pageVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                >
                    {children}
                </motion.main>
            </AnimatePresence>
            
            {!hideFooter && <Footer />}
            
            {/* Pass unread_count to the MobileNav */}
            {!hideNav && <MobileNav unread_count={unread_count} />}
            
            <BackToTop />
        </div>
    );
}