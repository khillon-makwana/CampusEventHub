// src/components/Layout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet } from '../api'; // Import apiGet
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNav from './MobileNav';
import BackToTop from './BackToTop';
import './Layout.css';

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
            <div className="layout-wrapper" style={{ display: 'grid', placeItems: 'center' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className="layout-wrapper">
            
            <Navbar user={user} unreadCount={unreadCount} />
            
            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname}
                    className="main-content"
                    variants={pageVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                >
                    {/* --- FIX: Removed React.cloneElement --- */}
                    {/* The child page will fetch its own data */}
                    {children}
                </motion.main>
            </AnimatePresence>
            
            {!hideFooter && <Footer />}
            
            <MobileNav unreadCount={unreadCount} />
            
            <BackToTop />
        </div>
    );
}