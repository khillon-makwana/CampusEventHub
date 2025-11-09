// src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
        credentials: "include", // ✅ Send cookies/session
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        setMsg('Login successful! Redirecting...');
        // Wait a moment for session to be set
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* Main Content - takes remaining space */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }} className="bg-light">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-11 col-md-6 col-lg-5 col-xl-4">
              <div className="p-5 rounded-4 shadow-lg text-white animate__animated animate__fadeIn"
                   style={{ background: 'linear-gradient(160deg, #84898cff, #2c3e50)' }}>
                
                <h2 className="mb-4 text-center fw-bold">Welcome to EventHub</h2>
                
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
                      className="form-control"
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
                      className="form-control"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Forgot password link */}
                  <div className="text-end mb-3">
                    <a 
                      href="/forgot-password" 
                      className="text-white text-decoration-none" 
                      style={{ fontSize: '0.9rem', opacity: 0.9 }}
                    >
                      Forgot password?
                    </a>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Logging in...
                      </>
                    ) : 'Login'}
                  </button>

                  {/* New user register link */}
                  <div className="text-center">
                    <span className="text-white-50" style={{ fontSize: '0.95rem' }}>
                      Don't have an account?{' '}
                    </span>
                    <a 
                      href="/register" 
                      className="text-white fw-bold text-decoration-none"
                      style={{ fontSize: '0.95rem' }}
                    >
                      Register here
                    </a>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - stays at bottom */}
      <footer className="bg-dark text-white py-5" style={{ width: '100%' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-4 text-center text-lg-start mb-3 mb-lg-0">
              <h3 className="h4 fw-bold">EventHub</h3>
              <p className="text-secondary mb-0" style={{ fontSize: '0.9rem' }}>
                Connecting people through unforgettable experiences.
              </p>
            </div>
            
            <div className="col-lg-4 text-center mb-3 mb-lg-0">
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <a href="/" className="text-white text-decoration-none">Home</a>
                <a href="/all-events" className="text-white text-decoration-none">Events</a>
                <a href="/my-events" className="text-white text-decoration-none">My Events</a>
                <a href="/profile" className="text-white text-decoration-none">Profile</a>
              </div>
            </div>
            
            <div className="col-lg-4 text-center text-lg-end">
              <div className="mb-3">
                <a href="#" className="text-white me-3 fs-5"><i className="fab fa-instagram"></i></a>
                <a href="#" className="text-white me-3 fs-5"><i className="fab fa-whatsapp"></i></a>
                <a href="#" className="text-white me-3 fs-5"><i className="fab fa-linkedin"></i></a>
                <a href="#" className="text-white fs-5"><i className="fab fa-twitter"></i></a>
              </div>
              <p className="text-secondary mb-0" style={{ fontSize: '0.85rem' }}>
                &copy; {new Date().getFullYear()} EventHub. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}