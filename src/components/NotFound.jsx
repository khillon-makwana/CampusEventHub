// src/components/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { motion } from 'framer-motion';
import './NotFound.css';

export default function NotFound() {
  return (
    <Layout>
      <div className="not-found-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <h1 className="error-code">404</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="error-title">Page Not Found</h2>
          <p className="error-message">
            Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <Link to="/" className="btn-home">
            <i className="fas fa-home"></i> Go to Home
          </Link>
        </motion.div>
      </div>
    </Layout>
  );
}
