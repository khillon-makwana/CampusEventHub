// src/components/Auth/VerifyEmail.jsx
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthFooter from './AuthFooter';
import './Auth.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');

  const status = success === '1'
    ? 'Email verified successfully!'
    : success === '0'
      ? 'Invalid or expired verification code'
      : 'Missing verification code';

  const isSuccess = success === '1';

  return (
    <div className="auth-page-wrapper">
      <div className="auth-main">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-11 col-md-6 col-lg-5 col-xl-4">

              <motion.div
                className="auth-card text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="mb-4">
                  {isSuccess ? (
                    <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: 'var(--success, #10b981)' }}></i>
                  ) : (
                    <i className="fas fa-exclamation-circle" style={{ fontSize: '4rem', color: 'var(--danger, #ef4444)' }}></i>
                  )}
                </div>

                <h3 className="auth-header mb-3">{isSuccess ? 'Verified!' : 'Verification Failed'}</h3>
                <p className="text-white-50 mb-4">{status}</p>

                <Link to="/login" className="btn auth-button w-100">
                  {isSuccess ? 'Continue to Login' : 'Back to Login'}
                </Link>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}
