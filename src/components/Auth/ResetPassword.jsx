// src/components/Auth/ResetPassword.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiPost } from '../../api';
import AuthFooter from './AuthFooter';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (password !== confirmPassword) {
      setMsg('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const data = await apiPost('auth/reset_password.php', { token, password });

      if (data.success) {
        setMsg('Password updated! Redirecting to login...');
        setTimeout(() => nav('/login'), 1500);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof SyntaxError) {
        setMsg("An unexpected error occurred. Please try again.");
      } else {
        setMsg(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
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
                  transition={{ duration: 0.5 }}
                >
                  <div className="auth-logo">EventHub</div>
                  <h2 className="auth-header">Invalid Link</h2>
                  <p className="text-muted mb-4">This password reset link is invalid or has expired.</p>
                  <Link to="/forgot-password" className="btn auth-button w-100">
                    Request New Link
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

  return (
    <div className="auth-page-wrapper">
      <div className="auth-main">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-11 col-md-6 col-lg-5 col-xl-4">

              <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="auth-logo">EventHub</div>
                <h2 className="auth-header">Set New Password</h2>

                {msg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`alert ${msg.includes('updated') || msg.includes('Redirecting') ? 'alert-success' : 'alert-danger'} `}
                  >
                    {msg}
                  </motion.div>
                )}

                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control auth-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      minLength="6"
                      required
                      disabled={loading}
                    />
                    <small className="text-muted d-block mt-1 ms-1">
                      Must be at least 6 characters
                    </small>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control auth-input"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      minLength="6"
                      required
                      disabled={loading}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    className="btn auth-button w-100 mb-4"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : 'Set New Password'}
                  </motion.button>

                  <div className="text-center">
                    <Link to="/login" className="auth-link" style={{ fontSize: '0.95rem' }}>
                      ← Back to Login
                    </Link>
                  </div>
                </form>

              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <AuthFooter />
    </div>
  );
}
