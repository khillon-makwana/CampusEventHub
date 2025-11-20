// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost } from '../api';
import './Navbar.css';

// --- Reusable NavLink Component ---
const NavLink = ({ to, path, icon, children }) => {
    const isActive = to === path;
    return (
        <li className="nav-item mx-1">
            <Link to={to} className={`nav-link nav-link-custom ${isActive ? 'active' : ''}`}>
                <motion.div
                    className="d-flex align-items-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <i className={`fas ${icon} me-1`}></i>
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
            .toUpperCase()
        : 'G';

    return (
        <div className="user-avatar">
            {initials}
        </div>
    );
};

// --- Main Navbar Component ---
export default function Navbar({ user, unreadCount }) {
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const currentPath = location.pathname;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.pageYOffset > 20);
        };

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
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

    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    // Animation for the header sliding in
    const headerVariants = {
        hidden: { y: -100, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 20 } }
    };

    const dropdownVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.95, display: 'none' },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            display: 'block',
            transition: { type: 'spring', stiffness: 300, damping: 25 }
        },
        exit: {
            opacity: 0,
            y: 10,
            scale: 0.95,
            transition: { duration: 0.2 },
            transitionEnd: { display: 'none' }
        }
    };

    return (
        <motion.header
            className={`main-header w-100 ${scrolled ? 'scrolled' : ''}`}
            variants={headerVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="container-fluid px-4 py-2">
                <div className="d-flex justify-content-between align-items-center">

                    {/* Logo on the left */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link to="/dashboard" className="brand-logo">
                            <i className="fas fa-calendar-star"></i>EventHub
                        </Link>
                    </motion.div>

                    {/* Navigation centered */}
                    <nav className="d-none d-lg-block mx-auto">
                        <ul className="nav mb-0 justify-content-center align-items-center">
                            <NavLink to="/dashboard" path={currentPath} icon="fa-home">Home</NavLink>
                            <NavLink to="/events" path={currentPath} icon="fa-calendar-alt">Events</NavLink>
                            <NavLink to="/my-events" path={currentPath} icon="fa-list">My Events</NavLink>
                            <NavLink to="/tickets" path={currentPath} icon="fa-ticket-alt">Tickets</NavLink>
                            <NavLink to="/analytics" path={currentPath} icon="fa-chart-pie">Analytics</NavLink>
                        </ul>
                    </nav>

                    {/* User info and actions on the right */}
                    <div className="d-flex align-items-center gap-3">
                        {/* Notifications Icon */}
                        <Link to="/notifications" className="notification-bell" title="Notifications">
                            <i className="fas fa-bell fa-lg"></i>
                            <AnimatePresence>
                                {unreadCount > 0 && (
                                    <motion.span
                                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill notification-badge"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                    >
                                        {unreadCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>

                        {/* User Dropdown */}
                        <div className="position-relative" ref={dropdownRef}>
                            <motion.div
                                className="user-section"
                                onClick={toggleDropdown}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                role="button"
                            >
                                <div className="user-info">
                                    <Avatar user={user} />
                                    <span className="user-name d-none d-xl-block">{user?.fullname || 'Guest'}</span>
                                    <i className={`fas fa-chevron-down ms-1 text-muted small transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} style={{ transition: 'transform 0.3s' }}></i>
                                </div>
                            </motion.div>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        className="dropdown-menu show position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 overflow-hidden"
                                        style={{ minWidth: '200px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}
                                        variants={dropdownVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        <div className="px-4 py-3 border-bottom bg-light bg-opacity-50">
                                            <p className="mb-0 fw-bold text-dark">{user?.fullname || 'Guest'}</p>
                                            <small className="text-muted">{user?.email || 'user@example.com'}</small>
                                        </div>
                                        <div className="py-2">
                                            <Link to="/profile" className="dropdown-item px-4 py-2 d-flex align-items-center gap-2" onClick={() => setDropdownOpen(false)}>
                                                <i className="fas fa-user text-primary opacity-75" style={{ width: '20px' }}></i> Profile
                                            </Link>
                                            <Link to="/my-events" className="dropdown-item px-4 py-2 d-flex align-items-center gap-2" onClick={() => setDropdownOpen(false)}>
                                                <i className="fas fa-calendar-check text-primary opacity-75" style={{ width: '20px' }}></i> My Events
                                            </Link>
                                            <Link to="/tickets" className="dropdown-item px-4 py-2 d-flex align-items-center gap-2" onClick={() => setDropdownOpen(false)}>
                                                <i className="fas fa-ticket-alt text-primary opacity-75" style={{ width: '20px' }}></i> My Tickets
                                            </Link>
                                            <Link to="/notification-settings" className="dropdown-item px-4 py-2 d-flex align-items-center gap-2" onClick={() => setDropdownOpen(false)}>
                                                <i className="fas fa-cog text-primary opacity-75" style={{ width: '20px' }}></i> Settings
                                            </Link>
                                            <div className="dropdown-divider my-2"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="dropdown-item px-4 py-2 d-flex align-items-center gap-2 text-danger"
                                            >
                                                <i className="fas fa-sign-out-alt" style={{ width: '20px' }}></i> Sign Out
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}