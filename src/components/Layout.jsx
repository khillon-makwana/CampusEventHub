// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '../api';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNav from './MobileNav';
import BackToTop from './BackToTop';
import './Layout.css';

// Animation variants for the page content
const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.99
    },
    in: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 20,
            mass: 0.5,
            duration: 0.4
        }
    },
    out: {
        opacity: 0,
        y: -10,
        scale: 0.99,
        transition: {
            duration: 0.2,
            ease: "easeInOut"
        }
    }
};

export default function Layout({ children, hideNav, hideFooter }) {
    const location = useLocation();

    // --- State ---
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const fetchNavData = async () => {
            try {
                const data = await apiGet('nav.php');
                if (data.success) {
                    setUser(data.user);
                    setUnreadCount(data.unreadCount);
                } else {
                    setUser(null);
                    setUnreadCount(0);
                }
            } catch (error) {
                setUser(null);
                setUnreadCount(0);
            } finally {
                setAuthLoading(false);
            }
        };

        if (!hideNav) {
            fetchNavData();
        } else {
            setAuthLoading(false);
        }
    }, [location.pathname, hideNav]);

    if (authLoading) {
        return (
            <div className="layout-loading">
                <div className="spinner-premium mb-3"></div>
                <p className="text-white-50 small letter-spacing-2">LOADING EXPERIENCE</p>
            </div>
        );
    }

    return (
        <div className="layout-wrapper">

            {!hideNav && <Navbar user={user} unreadCount={unreadCount} />}

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

            {!hideNav && <MobileNav unreadCount={unreadCount} />}

            <BackToTop />
        </div>
    );
}