// src/components/MobileNav.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';

export default function MobileNav() {
  const location = useLocation();
  const unreadCount = 0; // TODO: Fetch from notifications API

  const isActive = (path) => location.pathname === path;

  return (
    <div className="d-md-none mobile-nav fixed-bottom py-2">
      <div className="container">
        <ul className="nav justify-content-around mb-0">
          <li className="nav-item">
            <a 
              href="/dashboard" 
              className={`mobile-nav-item text-center ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <i className="fas fa-home fa-lg d-block mb-1"></i>
              <small>Home</small>
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="/events" 
              className={`mobile-nav-item text-center ${isActive('/events') ? 'active' : ''}`}
            >
              <i className="fas fa-calendar-alt fa-lg d-block mb-1"></i>
              <small>Events</small>
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="/my-events" 
              className={`mobile-nav-item text-center ${isActive('/my-events') ? 'active' : ''}`}
            >
              <i className="fas fa-list fa-lg d-block mb-1"></i>
              <small>My Events</small>
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="/notifications" 
              className={`mobile-nav-item text-center position-relative ${isActive('/notifications') ? 'active' : ''}`}
            >
              <i className="fas fa-bell fa-lg d-block mb-1"></i>
              <small>Notifications</small>
              {unreadCount > 0 && (
                <span 
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge" 
                  style={{ fontSize: '0.6rem' }}
                >
                  {unreadCount}
                </span>
              )}
            </a>
          </li>
          <li className="nav-item">
            <a 
              href="/profile" 
              className={`mobile-nav-item text-center ${isActive('/profile') ? 'active' : ''}`}
            >
              <i className="fas fa-user fa-lg d-block mb-1"></i>
              <small>Profile</small>
            </a>
          </li>
        </ul>
      </div>

      {/* *** FIX: Changed <style jsx> to <style> *** */}
      <style>{`
        .mobile-nav {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(229, 231, 235, 0.8);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
        }
        .mobile-nav-item {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          padding: 0.75rem 0;
          border-radius: 12px;
          color: #374151;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        .mobile-nav-item:hover,
        .mobile-nav-item.active {
          color: #4F46E5;
          background: rgba(79, 70, 229, 0.05);
          transform: translateY(-2px);
        }
        .mobile-nav-item.active {
          font-weight: 600;
        }
        .notification-badge {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}