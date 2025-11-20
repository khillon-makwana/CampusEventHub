// src/components/MobileNav.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Navbar.css'; // Uses the same CSS as Navbar for the badge

export default function MobileNav({ unreadCount }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <motion.div
      className="d-lg-none mobile-nav fixed-bottom py-2"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="container">
        <ul className="nav justify-content-around mb-0 align-items-center">
          <li className="nav-item">
            <Link
              to="/dashboard"
              className={`mobile-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <div className="icon-wrapper">
                <i className="fas fa-home"></i>
              </div>
              <small>Home</small>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/events"
              className={`mobile-nav-item ${isActive('/events') ? 'active' : ''}`}
            >
              <div className="icon-wrapper">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <small>Events</small>
            </Link>
          </li>

          {/* Center Action Button (Create Event or similar) - Optional, using My Events for now */}
          <li className="nav-item">
            <Link
              to="/my-events"
              className={`mobile-nav-item center-item ${isActive('/my-events') ? 'active' : ''}`}
            >
              <div className="icon-wrapper-large">
                <i className="fas fa-plus"></i>
              </div>
            </Link>
          </li>

          <li className="nav-item">
            <Link
              to="/notifications"
              className={`mobile-nav-item position-relative ${isActive('/notifications') ? 'active' : ''}`}
            >
              <div className="icon-wrapper">
                <i className="fas fa-bell"></i>
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge"
                      style={{ fontSize: '0.5rem', padding: '0.25em 0.4em' }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <small>Alerts</small>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/profile"
              className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
            >
              <div className="icon-wrapper">
                <i className="fas fa-user"></i>
              </div>
              <small>Profile</small>
            </Link>
          </li>
        </ul>
      </div>

      <style>{`
        .mobile-nav {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-top: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.05);
          padding-bottom: env(safe-area-inset-bottom, 10px) !important; /* Handle iPhone notch */
          z-index: 1000;
        }
        
        .mobile-nav-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0.5rem 0;
          border-radius: 12px;
          color: var(--slate-500);
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          width: 60px;
          position: relative;
        }

        .icon-wrapper {
            font-size: 1.2rem;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .mobile-nav-item:hover {
            color: var(--primary-600);
        }

        .mobile-nav-item.active {
          color: var(--primary-600);
        }

        .mobile-nav-item.active .icon-wrapper {
            transform: translateY(-2px);
        }

        .mobile-nav-item small {
            font-size: 0.7rem;
            font-weight: 500;
            opacity: 0.8;
        }

        .mobile-nav-item.active small {
            font-weight: 700;
            opacity: 1;
        }

        /* Center Item Styling */
        .center-item {
            margin-top: -25px;
        }

        .icon-wrapper-large {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--primary-600), var(--secondary-500));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
            border: 4px solid rgba(255, 255, 255, 0.8);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .center-item:active .icon-wrapper-large {
            transform: scale(0.9);
        }
      `}</style>
    </motion.div>
  );
}