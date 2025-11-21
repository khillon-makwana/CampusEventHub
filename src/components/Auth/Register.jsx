// src/components/Auth/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthFooter from './AuthFooter';
import './Auth.css';

export default function Register() {
  const [fullname, setFullname] = useState('');
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
      const res = await fetch("http://localhost/CampusEventHub/backend/api/auth/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      if (data.success) {
        setMsg('Registered successfully! Redirecting to login...');
        setTimeout(() => nav('/login'), 1500);
      } else {
        setMsg(data.error || 'Registration failed');
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
                <h2 className="auth-header">Create Account</h2>

                {msg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`alert ${msg.includes('successfully') ? 'alert-success' : 'alert-danger'}`}
                  >
                    {msg}
                  </motion.div>
                )}

                <form onSubmit={submit}>
                  <div className="mb-4">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control auth-input"
                      value={fullname}
                      onChange={e => setFullname(e.target.value)}
                      placeholder="John Doe"
                      required
                      disabled={loading}
                    />
                  </div>
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
                      placeholder="Min. 6 characters"
                      required
                      disabled={loading}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    className="btn auth-button w-100 mt-2 mb-4"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating Account...
                      </>
                    ) : 'Sign Up'}
                  </motion.button>

                  <div className="text-center">
                    <span className="text-white-50" style={{ fontSize: '0.95rem' }}>
                      Already have an account?{' '}
                    </span>
                    <Link to="/login" className="auth-link fw-bold" style={{ fontSize: '0.95rem' }}>
                      Sign in
                    </Link>
                  </div>
                </form>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      <AuthFooter />
    </div >
  );
}