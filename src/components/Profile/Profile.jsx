// src/components/Profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './Profile.css';

// Animated Section Wrapper
const AnimatedSection = ({ children, className = '', delay = 0.1 }) => (
    <motion.div
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20, delay }}
    >
        {children}
    </motion.div>
);

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Profile Form State
    const [fullname, setFullname] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');

    // Password Form State
    const [pwData, setPwData] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwError, setPwError] = useState('');

    // Fetch user data on load
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await apiGet('profile.php');
                if (data.success) {
                    setUser(data.user);
                    setFullname(data.user.fullname);
                } else {
                    setProfileError('Could not load user data.');
                }
            } catch (err) {
                setProfileError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    // Handle profile form (fullname) submission
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileSuccess('');
        setProfileError('');
        try {
            const data = await apiPost('profile.php', { fullname });
            if (data.success) {
                setUser(data.user); // Update user in layout
                setFullname(data.user.fullname);
                setProfileSuccess(data.message);
                setTimeout(() => setProfileSuccess(''), 3000);
            }
        } catch (err) {
            setProfileError(err.message);
        } finally {
            setProfileLoading(false);
        }
    };

    // Handle password form submission
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPwLoading(true);
        setPwSuccess('');
        setPwError('');
        try {
            const data = await apiPost('profile_password.php', pwData);
            if (data.success) {
                setPwSuccess(data.message);
                setPwData({ current_password: '', new_password: '', confirm_password: '' }); // Clear fields
                setTimeout(() => setPwSuccess(''), 3000);
            }
        } catch (err) {
            setPwError(err.message);
        } finally {
            setPwLoading(false);
        }
    };

    // Handle password form input changes
    const handlePwChange = (e) => {
        setPwData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (loading) {
        return (
            <Layout user={user}>
                <div className="container mt-5 text-center" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="container mt-5 profile-container">
                <AnimatedSection className="profile-header">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="mb-3"
                    >
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-25 text-primary" style={{ width: '80px', height: '80px', fontSize: '2.5rem' }}>
                            {user?.fullname?.charAt(0).toUpperCase() || <i className="fas fa-user"></i>}
                        </div>
                    </motion.div>
                    <h2>My Profile</h2>
                    <p>Manage your account settings and preferences</p>
                </AnimatedSection>

                <div className="row">
                    <div className="col-lg-6">
                        {/* Profile Update Form */}
                        <AnimatedSection delay={0.2} className="profile-card">
                            <h5><i className="fas fa-user-edit"></i> Profile Information</h5>

                            <AnimatePresence>
                                {profileSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="alert alert-success profile-alert"
                                    >
                                        <i className="fas fa-check-circle"></i> {profileSuccess}
                                    </motion.div>
                                )}
                                {profileError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="alert alert-danger profile-alert"
                                    >
                                        <i className="fas fa-exclamation-circle"></i> {profileError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleProfileSubmit}>
                                <div className="mb-4">
                                    <label className="form-label">Full Name</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-transparent border-end-0 text-secondary" style={{ borderColor: 'var(--glass-border)' }}><i className="fas fa-user"></i></span>
                                        <input type="text" name="fullname" className="form-control border-start-0 ps-0"
                                            value={fullname} onChange={e => setFullname(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">Email Address</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-transparent border-end-0 text-secondary" style={{ borderColor: 'var(--glass-border)' }}><i className="fas fa-envelope"></i></span>
                                        <input type="email" className="form-control border-start-0 ps-0" value={user?.email || ''} readOnly />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label d-block">Verification Status</label>
                                    {user?.is_verified ? (
                                        <div className="status-indicator verified">
                                            <i className="fas fa-check-circle"></i> Verified Account
                                        </div>
                                    ) : (
                                        <div className="status-indicator unverified">
                                            <i className="fas fa-times-circle"></i> Not Verified
                                        </div>
                                    )}
                                </div>

                                <div className="member-since mb-4">
                                    <i className="fas fa-calendar-alt"></i>
                                    <div>
                                        <small className="d-block text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>Member Since</small>
                                        <strong>{user ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}</strong>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-profile-primary" disabled={profileLoading}>
                                    {profileLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="fas fa-save"></i>}
                                    {profileLoading ? 'Updating...' : 'Save Changes'}
                                </button>
                            </form>
                        </AnimatedSection>
                    </div>

                    <div className="col-lg-6">
                        {/* Password Change Form */}
                        <AnimatedSection delay={0.3} className="profile-card">
                            <h5><i className="fas fa-lock"></i> Change Password</h5>

                            <AnimatePresence>
                                {pwSuccess && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="alert alert-success profile-alert"
                                    >
                                        <i className="fas fa-check-circle"></i> {pwSuccess}
                                    </motion.div>
                                )}
                                {pwError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="alert alert-danger profile-alert"
                                    >
                                        <i className="fas fa-exclamation-circle"></i> {pwError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handlePasswordSubmit}>
                                <div className="mb-4">
                                    <label className="form-label">Current Password</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-transparent border-end-0 text-secondary" style={{ borderColor: 'var(--glass-border)' }}><i className="fas fa-key"></i></span>
                                        <input type="password" name="current_password" className="form-control border-start-0 ps-0"
                                            value={pwData.current_password} onChange={handlePwChange} required />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">New Password</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-transparent border-end-0 text-secondary" style={{ borderColor: 'var(--glass-border)' }}><i className="fas fa-lock"></i></span>
                                        <input type="password" name="new_password" className="form-control border-start-0 ps-0"
                                            value={pwData.new_password} onChange={handlePwChange} required />
                                    </div>
                                    <small className="text-muted mt-1 d-block"><i className="fas fa-info-circle me-1"></i> Must be at least 6 characters</small>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label">Confirm New Password</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-transparent border-end-0 text-secondary" style={{ borderColor: 'var(--glass-border)' }}><i className="fas fa-check-double"></i></span>
                                        <input type="password" name="confirm_password" className="form-control border-start-0 ps-0"
                                            value={pwData.confirm_password} onChange={handlePwChange} required />
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-profile-primary" disabled={pwLoading}>
                                    {pwLoading ? <span className="spinner-border spinner-border-sm"></span> : <i className="fas fa-shield-alt"></i>}
                                    {pwLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </AnimatedSection>
                    </div>
                </div>
            </div>
        </Layout>
    );
}