// src/components/BackToTop.jsx
import React, { useState, useEffect } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button 
      className={`back-to-top ${visible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <i className="fas fa-chevron-up"></i>

      {/* *** FIX: Changed <style jsx> to <style> *** */}
      <style>{`
        .back-to-top {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
          z-index: 1000;
          font-size: 1.2rem;
          cursor: pointer;
        }
        .back-to-top.visible {
          opacity: 1;
          visibility: visible;
        }
        .back-to-top:hover {
          transform: translateY(-5px) scale(1.1) rotate(180deg);
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        @media (max-width: 768px) {
          .back-to-top {
            bottom: 80px; /* Above mobile nav */
            right: 20px;
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
    </button>
  );
}