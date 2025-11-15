// src/components/Notifications/NotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// *** FIX: Added AnimatePresence to the import ***
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './NotificationSettings.css';

export default function NotificationSettings() {
    const [preferences, setPreferences] = useState(null);
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const data = await apiGet('notification_settings.php');
                if (data.success) {
                    setPreferences(data.preferences);
                    setUser(data.user);
                    setUnreadCount(data.unread_count || 0);
                } else {
                    throw new Error(data.error || 'Failed to load settings');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPrefs();
    }, []);

    const handleToggle = (e) => {
        const { name, checked } = e.target;
        setPreferences(prev => ({
            ...prev,
            [name]: checked ? 1 : 0
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const data = await apiPost('notification_settings.php', preferences);
            if (data.success) {
                setSuccess(data.message);
                setPreferences(data.preferences);
            } else {
                throw new Error(data.error || 'Failed to save');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Layout user={user} unread_count={unreadCount}><div className="container text-center py-5"><div className="spinner-border text-primary" role="status"></div></div></Layout>;
    }

    // Animation Variants
    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }
        }
    };

    return (
        <Layout user={user} unread_count={unreadCount}>
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-md-10 col-lg-8">
                        
                        <motion.div 
                            className="card notification-card shadow-lg"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <div className="card-header text-white">
                                <div className="d-flex align-items-center">
                                    <i className="fas fa-bell me-3 fa-2x"></i>
                                    <div>
                                        <h4 className="mb-0">Notification Settings</h4>
                                        <p className="mb-0 mt-1 opacity-75">Customize how you receive notifications</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body p-4">
                                <AnimatePresence>
                                    {success && <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="alert alert-success">{success}</motion.div>}
                                    {error && <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="alert alert-danger">{error}</motion.div>}
                                </AnimatePresence>
                                
                                <p className="text-muted mb-4">
                                    Manage how and when you receive notifications from EventHub.
                                </p>
                                
                                {preferences && (
                                    <form onSubmit={handleSubmit} id="notificationForm">
                                        <div className="mb-4">
                                            <h5 className="section-title">Email Notifications</h5>
                                            
                                            <SettingToggle
                                                id="email_new_events"
                                                name="email_new_events"
                                                checked={!!preferences.email_new_events}
                                                onChange={handleToggle}
                                                title="New Events"
                                                description="Get notified for new events in categories you follow."
                                            />
                                            <SettingToggle
                                                id="email_event_reminders"
                                                name="email_event_reminders"
                                                checked={!!preferences.email_event_reminders}
                                                onChange={handleToggle}
                                                title="Event Reminders"
                                                description="Receive reminders for events you're attending."
                                            />
                                            <SettingToggle
                                                id="email_rsvp_confirmation"
                                                name="email_rsvp_confirmation"
                                                checked={!!preferences.email_rsvp_confirmation}
                                                onChange={handleToggle}
                                                title="RSVP Confirmations"
                                                description="Get confirmation emails when you RSVP."
                                            />
                                            <SettingToggle
                                                id="email_event_updates"
                                                name="email_event_updates"
                                                checked={!!preferences.email_event_updates}
                                                onChange={handleToggle}
                                                title="Event Updates"
                                                description="Receive updates when events you're attending change."
                                            />
                                        </div>
                                        
                                        <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                                            <motion.div whileHover={{ y: -2 }}>
                                                <Link to="/notifications" className="btn btn-form-secondary me-md-2">Back to Notifications</Link>
                                            </motion.div>
                                            <motion.button 
                                                type="submit" 
                                                className="btn btn-form-primary" 
                                                id="saveBtn" 
                                                disabled={saving}
                                                whileHover={{ y: -2 }}
                                            >
                                                {saving ? (
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                ) : (
                                                    <i className="fas fa-save me-2"></i>
                                                )}
                                                <span className="save-text ms-1">{saving ? 'Saving...' : 'Save Preferences'}</span>
                                            </motion.button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// Reusable Toggle Switch Component
const SettingToggle = ({ id, name, checked, onChange, title, description }) => (
    <motion.div 
        className="form-check form-switch mb-1"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
        <label className="form-check-label" htmlFor={id}>
            <div>
                <strong>{title}</strong>
                <p className="text-muted small mb-0">{description}</p>
            </div>
        </label>
        <input 
            className="form-check-input" 
            type="checkbox" 
            id={id}
            name={name} 
            checked={checked}
            onChange={onChange}
        />
    </motion.div>
);