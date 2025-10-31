import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    // Check if passwords match
    if (password !== confirmPassword) {
      setMsg('Passwords do not match');
      return;
    }

    try {
      const res = await fetch("http://localhost/CampusEventHub/backend/api/auth/reset_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setMsg('Password updated! Redirecting to login...');
        setTimeout(() => nav('/login'), 1500);
      } else {
        setMsg(data.error || 'Error resetting password');
      }
    } catch (err) {
      console.error(err);
      setMsg('Something went wrong');
    }
  }

  if (!token) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }} className="bg-light">
          <div className="container py-5">
            <div className="row justify-content-center">
              <div className="col-11 col-md-6 col-lg-5 col-xl-4">
                <div className="p-5 rounded-4 shadow-lg text-white text-center animate__animated animate__fadeIn"
                     style={{ background: 'linear-gradient(160deg, #84898cff, #2c3e50)' }}>
                  <h2 className="mb-3 fw-bold">Invalid Link</h2>
                  <p className="mb-4">This password reset link is invalid or has expired.</p>
                  <a href="/forgot-password" className="btn btn-primary w-100">Request New Link</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                
                <h2 className="mb-4 text-center fw-bold">Reset Password</h2>
                
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
                      className="form-control"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      minLength="6"
                      required
                    />
                    <small className="text-white-50 d-block mt-1">
                      Must be at least 6 characters
                    </small>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      minLength="6"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100 mb-3">
                    Set New Password
                  </button>

                  {/* Back to login link */}
                  <div className="text-center">
                    <a 
                      href="/login" 
                      className="text-white text-decoration-none"
                      style={{ fontSize: '0.95rem', opacity: 0.9 }}
                    >
                      ← Back to Login
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