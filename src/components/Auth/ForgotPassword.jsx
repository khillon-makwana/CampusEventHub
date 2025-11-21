
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthFooter from './AuthFooter';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost/CampusEventHub/backend/api/auth/forgot_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setMsg('If that email exists, you will receive reset instructions.');
        setIsSubmitted(true);
      } else {
        setMsg(data.error || 'Error');
      }
    } catch (err) {
      console.error(err);
      setMsg('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      {/* Main Content */}
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
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <i className="fas fa-key" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                  </div>
                  <h2 className="auth-header mb-2">Forgot Password?</h2>
                  <p className="text-white-50" style={{ fontSize: '0.95rem' }}>
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </div>

                {msg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`alert ${isSubmitted ? 'alert-info' : 'alert-danger'}`}
                  >
                    {msg}
                  </motion.div>
                )}

                {!isSubmitted ? (
                  <form onSubmit={submit}>
                    <div className="mb-4">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control auth-input"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email"
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
                          Sending...
                        </>
                      ) : 'Send Reset Link'}
                    </motion.button>

                    <div className="text-center">
                      <Link to="/login" className="auth-link" style={{ fontSize: '0.95rem' }}>
                        ← Back to Login
                      </Link>
                    </div>
                  </form>
                ) : (
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="fas fa-envelope-circle-check" style={{ fontSize: '4rem', color: 'var(--success, #10b981)' }}></i>
                    </div>
                    <p className="mb-4 text-white-50">
                      Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                    </p>
                    <Link to="/login" className="btn auth-button w-100">
                      Return to Login
                    </Link>
                  </div>
                )}

              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}
