// src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import './Auth.css'; // Import the new CSS

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  // Using the original native fetch logic
  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost/CampusEventHub/backend/api/auth/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send cookies/session
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
      if (err instanceof SyntaxError) {
        setMsg("An unexpected error occurred. Please try again.");
      } else {
        setMsg(err.message || 'Something went wrong');
      }
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
              
              <div className="auth-card">
                <div className="auth-logo">EventHub</div>
                <h2 className="auth-header">Welcome Back</h2>
                
                {msg && (
                  <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-danger'}`}>
                    {msg}
                  </div>
                )}
                
                <form onSubmit={submit}>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
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
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control auth-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="text-end mb-3">
                    <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.9rem' }}>
                      Forgot password?
                    </Link>
                  </div>

                  <button 
                    type="submit" 
                    className="btn auth-button w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Logging in...
                      </>
                    ) : 'Login'}
                  </button>

                  <div className="text-center">
                    <span className="text-muted" style={{ fontSize: '0.95rem' }}>
                      Don't have an account?{' '}
                    </span>
                    <Link to="/register" className="auth-link fw-bold" style={{ fontSize: '0.95rem' }}>
                      Register here
                    </Link>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer (Matches Landing Page) */}
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
                  {/* We don't link to protected routes from here */}
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
    </div>
  );
}