// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiPost } from '../api';

export default function Navbar({ user }) {
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount] = useState(0); // TODO: Fetch from notifications API
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.pageYOffset > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await apiPost('auth/logout.php', {});
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      // Force navigation even if API fails
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className={`main-header w-100 ${scrolled ? 'scrolled' : ''}`}>
        <div className="container-fluid px-4 py-3">
          <div className="d-flex justify-content-between align-items-center">
            {/* Logo on the left */}
            <div className="brand-section">
              <a href="/dashboard" className="text-decoration-none">
                <h1 className="brand-logo mb-0">
                  <i className="fas fa-calendar-star me-2"></i>EventHub
                </h1>
              </a>
            </div>

            {/* Navigation centered */}
            <nav className="d-none d-md-block mx-auto">
              <ul className="nav mb-0 justify-content-center">
                <li className="nav-item">
                  <a 
                    href="/dashboard" 
                    className={`nav-link nav-link-custom ${isActive('/dashboard') ? 'active' : ''}`}
                  >
                    <i className="fas fa-home me-2"></i>HOME
                  </a>
                </li>
                <li className="nav-item">
                  <a 
                    href="/events" 
                    className={`nav-link nav-link-custom ${isActive('/events') ? 'active' : ''}`}
                  >
                    <i className="fas fa-calendar-alt me-2"></i>EVENTS
                  </a>
                </li>
                <li className="nav-item">
                  <a 
                    href="/my-events" 
                    className={`nav-link nav-link-custom ${isActive('/my-events') ? 'active' : ''}`}
                  >
                    <i className="fas fa-list me-2"></i>MY EVENTS
                  </a>
                </li>
                <li className="nav-item">
                  <a 
                    href="/profile" 
                    className={`nav-link nav-link-custom ${isActive('/profile') ? 'active' : ''}`}
                  >
                    <i className="fas fa-user me-2"></i>MY PROFILE
                  </a>
                </li>
                <li className="nav-item">
                  <a 
                    href="/tickets" 
                    className={`nav-link nav-link-custom ${isActive('/tickets') ? 'active' : ''}`}
                  >
                    <i className="fas fa-ticket-alt me-2"></i>TICKETS
                  </a>
                </li>
              </ul>
            </nav>

            {/* User info and sign out on the right */}
            <div className="user-section d-flex align-items-center gap-3">
              {/* Notifications Icon */}
              <a 
                href="/notifications" 
                className={`nav-link position-relative p-0 me-2 ${isActive('/notifications') ? 'active' : ''}`}
              >
                <i className="fas fa-bell fa-lg text-muted"></i>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger notification-badge">
                    {unreadCount}
                  </span>
                )}
              </a>

              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-user-circle fa-lg text-primary"></i>
                <span className="fw-medium">{user?.fullname || 'Guest'}</span>
              </div>
              <button onClick={handleLogout} className="btn sign-out-btn">
                <i className="fas fa-sign-out-alt me-2"></i>Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* *** FIX: Changed <style jsx> to <style> *** */}
      <style>{`
        .main-header {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
          border-bottom: 1px solid rgba(229, 231, 235, 0.8);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .main-header.scrolled {
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        .brand-logo {
          font-family: 'Pacifico', cursive;
          font-size: 1.8rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .brand-logo:hover {
          transform: scale(1.05);
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .nav-link-custom {
          color: #374151 !important;
          font-weight: 500;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          padding: 0.75rem 1.25rem !important;
          border-radius: 12px;
          margin: 0 0.25rem;
        }
        .nav-link-custom::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 3px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform: translateX(-50%);
          border-radius: 3px;
        }
        .nav-link-custom:hover {
          color: #4F46E5 !important;
          background: rgba(79, 70, 229, 0.05);
          transform: translateY(-2px);
        }
        .nav-link-custom:hover::before {
          width: 60%;
        }
        .nav-link-custom.active {
          color: #4F46E5 !important;
          font-weight: 600;
          background: rgba(79, 70, 229, 0.08);
        }
        .nav-link-custom.active::before {
          width: 60%;
        }
        .user-section {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          padding: 0.75rem 1rem;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.05) 100%);
          border: 1px solid rgba(79, 70, 229, 0.1);
        }
        .user-section:hover {
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .notification-badge {
          font-size: 0.65rem;
          padding: 0.25em 0.5em;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .sign-out-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 0.6rem 1.4rem;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
        }
        .sign-out-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .sign-out-btn:hover {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          color: #ffffff;
        }
        .sign-out-btn:hover::before {
          left: 100%;
        }
      `}</style>
    </>
  );
}