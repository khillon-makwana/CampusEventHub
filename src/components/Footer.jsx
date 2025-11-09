// src/components/Footer.jsx
import React from 'react';

export default function Footer() {
  return (
    <footer className="main-footer text-white py-5">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-4 text-center text-lg-start mb-3 mb-lg-0">
            <h3 className="h4 mb-2 footer-logo">EventHub</h3>
            <p className="text-secondary mb-0" style={{ fontSize: '0.9rem' }}>
              Connecting people through unforgettable experiences.
            </p>
          </div>

          <div className="col-lg-4 text-center mb-3 mb-lg-0">
            <div className="footer-links">
              <a href="/dashboard" className="footer-link">Home</a>
              <a href="/events" className="footer-link">Events</a>
              <a href="/my-events" className="footer-link">My Events</a>
              <a href="/profile" className="footer-link">Profile</a>
            </div>
          </div>

          <div className="col-lg-4 text-center text-lg-end">
            <div className="mb-3">
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
            <p className="text-secondary mb-0" style={{ fontSize: '0.85rem' }}>
              &copy; {new Date().getFullYear()} EventHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* *** FIX: Changed <style jsx> to <style> *** */}
      <style>{`
        .main-footer {
          background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
          position: relative;
          overflow: hidden;
        }
        .main-footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .footer-logo {
          font-family: 'Pacifico', cursive;
          font-size: 1.8rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .footer-links {
          display: flex;
          gap: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .footer-link {
          color: #cbd5e0 !important;
          text-decoration: none;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          position: relative;
        }
        .footer-link::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          transform: translateX(-50%);
        }
        .footer-link:hover {
          color: white !important;
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }
        .footer-link:hover::before {
          width: 80%;
        }
        .social-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e0;
          transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          text-decoration: none;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .social-icon:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transform: translateY(-3px) rotate(8deg);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          border-color: transparent;
        }
      `}</style>
    </footer>
  );
}