// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost } from '../api';
import './Navbar.css'; // Import the new CSS

// --- Reusable NavLink Component ---
const NavLink = ({ to, path, icon, children }) => {
    const isActive = to === path;
    return (
        <li className="nav-item">
            <Link to={to} className={`nav-link nav-link-custom ${isActive ? 'active' : ''}`}>
                <motion.div
                    className="d-flex align-items-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                    <i className={`fas ${icon} me-2`}></i>
                    {children}
                </motion.div>
                {isActive && (
                    <motion.span
                        className="active-indicator"
                        layoutId="active-nav-indicator"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                )}
            </Link>
        </li>
    );
};

// --- Reusable Avatar Component ---
const Avatar = ({ user }) => {
    const initials = user?.fullname
        ? user.fullname
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
        : 'G';
    
    return (
        <div className="user-avatar">
            {initials}
        </div>
    );
};

// --- Main Navbar Component ---
export default function Navbar({ user, unreadCount }) { // FIX: Use unreadCount
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    
    const currentPath = location.pathname;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.pageYOffset > 50); // Changed to 50px
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await apiPost('auth/logout.php', {});
            navigate('/');
        } catch (err) {
            console.error('Logout failed:', err);
            navigate('/login');
        }
    };

    // Animation for the header sliding in
    const headerVariants = {
        hidden: { y: -100, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 20 } }
    };

    return (
        <motion.header 
            className={`main-header w-100 ${scrolled ? 'scrolled' : ''}`}
            variants={headerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="container-fluid px-4 py-3">
                <div className="d-flex justify-content-between align-items-center">
                    
                    {/* Logo on the left */}
                    <motion.div whileHover={{ scale: 1.05 }}>
                        <Link to="/dashboard" className="text-decoration-none brand-logo">
                            <i className="fas fa-calendar-star me-2"></i>EventHub
                        </Link>
                    </motion.div>

                    {/* Navigation centered */}
                    <nav className="d-none d-md-block mx-auto">
                        <ul className="nav mb-0 justify-content-center">
                            <NavLink to="/dashboard" path={currentPath} icon="fa-home">HOME</NavLink>
                            <NavLink to="/events" path={currentPath} icon="fa-calendar-alt">EVENTS</NavLink>
                            <NavLink to="/my-events" path={currentPath} icon="fa-list">MY EVENTS</NavLink>
                            <NavLink to="/profile" path={currentPath} icon="fa-user">MY PROFILE</NavLink>
                            <NavLink to="/tickets" path={currentPath} icon="fa-ticket-alt">TICKETS</NavLink>
                            <NavLink to="/analytics" path={currentPath} icon="fa-chart-pie">ANALYTICS</NavLink>
                        </ul>
                    </nav>

                    {/* User info and sign out on the right */}
                    <motion.div 
                        className="user-section"
                        whileHover={{ scale: 1.02 }}
                    >
                        {/* Notifications Icon */}
                        <Link to="/notifications" className="notification-bell">
                            <i className="fas fa-bell fa-lg"></i>
                            <AnimatePresence>
                                {unreadCount > 0 && ( // FIX: Use unreadCount
                                    <motion.span 
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                    >
                                        {unreadCount} {/* FIX: Use unreadCount */}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>

                        <div className="user-info">
                            <Avatar user={user} />
                            <span className="user-name d-none d-lg-block">{user?.fullname || 'Guest'}</span>
                        </div>
                        <motion.button 
                            onClick={handleLogout} 
                            className="btn sign-out-btn"
                            whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)" }}
                            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        >
                            <i className="fas fa-sign-out-alt me-2"></i>Sign Out
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </motion.header>
    );
}