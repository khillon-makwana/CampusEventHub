import React, { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

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
                
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <i className="fas fa-key" style={{ fontSize: '3rem', opacity: 0.9 }}></i>
                  </div>
                  <h2 className="fw-bold">Forgot Password?</h2>
                  <p className="text-white-50 mb-0" style={{ fontSize: '0.95rem' }}>
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </div>
                
                {msg && (
                  <div className={`alert ${isSubmitted ? 'alert-info' : 'alert-danger'}`}>
                    {msg}
                  </div>
                )}
                
                {!isSubmitted ? (
                  <form onSubmit={submit}>
                    <div className="mb-4">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mb-3">
                      Send Reset Link
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
                ) : (
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="fas fa-envelope-circle-check" style={{ fontSize: '4rem', opacity: 0.9 }}></i>
                    </div>
                    <p className="mb-4">
                      Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                    </p>
                    <a href="/login" className="btn btn-primary w-100">
                      Return to Login
                    </a>
                  </div>
                )}

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