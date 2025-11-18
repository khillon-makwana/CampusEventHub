// src/components/Profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './Profile.css'; // Import the new CSS

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
                <div className="container mt-5 profile-container text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="container mt-5 profile-container">
                <div className="profile-header">
                    <h2>👤 My Profile</h2>
                    <p>Manage your account settings and preferences</p>
                </div>

                {/* Profile Update Form */}
                <form onSubmit={handleProfileSubmit} className="card profile-card p-4 mb-4">
                    <h5>📝 Profile Information</h5>
                    
                    {profileSuccess && <div className="alert alert-success profile-alert"><strong>✓ Success!</strong> {profileSuccess}</div>}
                    {profileError && <div className="alert alert-danger profile-alert"><strong>✗ Error!</strong> {profileError}</div>}

                    <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <input type="text" name="fullname" className="form-control" 
                            value={fullname} onChange={e => setFullname(e.target.value)} required />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-control" value={user?.email || ''} readOnly />
                    </div>

                    <div className="mb-3">
                        <label className="form-label d-block">Email Verification Status</label>
                        {user?.is_verified ? (
                            <span className="badge bg-success status-indicator verified">✓ Verified</span>
                        ) : (
                            <span className="badge bg-danger status-indicator unverified">✗ Not Verified</span>
                        )}
                    </div>

                    <div className="member-since mb-4">
                        <strong>🗓️ Member Since:</strong> {user ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '...'}
                    </div>

                    <button type="submit" name="update_profile" className="btn btn-primary w-100" disabled={profileLoading}>
                        {profileLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : '💾'}
                        {profileLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>

                {/* Password Change Form */}
                <form onSubmit={handlePasswordSubmit} className="card profile-card p-4 password-section">
                    <h5>🔒 Change Password</h5>

                    {pwSuccess && <div className="alert alert-success profile-alert"><strong>✓ Success!</strong> {pwSuccess}</div>}
                    {pwError && <div className="alert alert-danger profile-alert"><strong>✗ Error!</strong> {pwError}</div>}

                    <div className="mb-3">
                        <label className="form-label">Current Password</label>
                        <input type="password" name="current_password" className="form-control" 
                            value={pwData.current_password} onChange={handlePwChange} required />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <input type="password" name="new_password" className="form-control" 
                            value={pwData.new_password} onChange={handlePwChange} required />
                        <small className="text-muted">Must be at least 6 characters</small>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Confirm New Password</label>
                        <input type="password" name="confirm_password" className="form-control" 
                            value={pwData.confirm_password} onChange={handlePwChange} required />
                    </div>

                    <button type="submit" name="change_password" className="btn btn-primary w-100" disabled={pwLoading}>
                        {pwLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : '🔑'}
                        {pwLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}