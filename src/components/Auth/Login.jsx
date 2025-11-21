// src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthFooter from './AuthFooter';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost/CampusEventHub/backend/api/auth/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      if (data.success) {
        setMsg('Login successful! Redirecting...');
        setTimeout(() => nav('/dashboard'), 500);
      } else {
        setMsg(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setMsg(err.message || 'Something went wrong');
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
                <div className="auth-logo">EventHub</div>
                <h2 className="auth-header">Welcome Back</h2>

                {msg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-danger'}`}
                  >
                    {msg}
                  </motion.div>
                )}

                <form onSubmit={submit}>
                  <div className="mb-4">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control auth-input"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control auth-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="text-end mb-4">
                    <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.9rem' }}>
                      Forgot password?
                    </Link>
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
                        Logging in...
                      </>
                    ) : 'Sign In'}
                  </motion.button>

                  <div className="text-center">
                    <span className="text-white-50" style={{ fontSize: '0.95rem' }}>
                      Don't have an account?{' '}
                    </span>
                    <Link to="/register" className="auth-link fw-bold" style={{ fontSize: '0.95rem' }}>
                      Create account
                    </Link>
                  </div>
                </form>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}