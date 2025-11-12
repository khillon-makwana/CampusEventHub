// src/components/Auth/ResetPassword.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiPost } from '../../api'; // Import apiPost
import './Auth.css'; // Import the shared CSS

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false); // Added loading state
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (password !== confirmPassword) {
      setMsg('Passwords do not match');
      return;
    }
    
    setLoading(true); // Set loading

    try {
      // Use apiPost from your api.js file
      const data = await apiPost('auth/reset_password.php', { token, password });

      if (data.success) {
        setMsg('Password updated! Redirecting to login...');
        setTimeout(() => nav('/login'), 1500);
      }
      // apiPost will throw an error if !res.ok, so no 'else' is needed
    } catch (err) {
      console.error(err);
      if (err instanceof SyntaxError) {
        setMsg("An unexpected error occurred. Please try again.");
      } else {
        setMsg(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false); // Unset loading
    }
  }

  // This renders if the token is missing from the URL
  if (!token) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-main">
          <div className="container py-5">
            <div className="row justify-content-center">
              <div className="col-11 col-md-6 col-lg-5 col-xl-4">
                <div className="auth-card text-center">
                  <div className="auth-logo">EventHub</div>
                  <h2 className="auth-header">Invalid Link</h2>
                  <p className="text-muted mb-4">This password reset link is invalid or has expired.</p>
                  <Link to="/forgot-password" className="btn auth-button w-100">
                    Request New Link
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AuthFooter /> {/* Use the shared footer */}
      </div>
    );
  }

  // This renders if the token IS present
  return (
    <div className="auth-page-wrapper">
      <div className="auth-main">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-11 col-md-6 col-lg-5 col-xl-4">
              
              <div className="auth-card">
                <div className="auth-logo">EventHub</div>
                <h2 className="auth-header">Set New Password</h2>
                
                {msg && (
                  <div className={`alert ${msg.includes('updated') || msg.includes('Redirecting') ? 'alert-success' : 'alert-danger'}`}>
                    {msg}
                  </div>
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
                    <small className="text-muted d-block mt-1">
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

                  <button type="submit" className="btn auth-button w-100 mb-3" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : 'Set New Password'}
                  </button>

                  <div className="text-center">
                    <Link to="/login" className="auth-link" style={{ fontSize: '0.95rem' }}>
                      ← Back to Login
                    </Link>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      </div>
      <AuthFooter /> {/* Use the shared footer */}
    </div>
  );
}

// Reusable Footer Component
const AuthFooter = () => (
  <footer className="auth-footer">
    <div className="container">
      <div className="row py-4">
        <div className="col-md-4 text-center text-md-start mb-4 mb-md-0">
          <Link to="/" className="footer-logo">EventHub</Link>
          <p className="mb-0">Your gateway to campus life.</p>
        </div>
        <div className="col-md-4 text-center mb-4 mb-md-0">
          <h6 className="text-uppercase fw-bold mb-3">Quick Links</h6>
          <Link to="/login" className="footer-link">Log In</Link>
          <Link to="/register" className="footer-link">Sign Up</Link>
        </div>
        <div className="col-md-4 text-center text-md-end">
          <h6 className="text-uppercase fw-bold mb-3">Connect With Us</h6>
          <div className="social-icons">
            <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
            <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
            <a href="#" className="social-icon"><i className="fab fa-facebook"></i></a>
            <a href="#" className="social-icon"><i className="fab fa-linkedin"></i></a>
          </div>
          <p className="mt-4 mb-0">&copy; {new Date().getFullYear()} CampusEventHub.</p>
          <p className="mb-0">All rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>
);