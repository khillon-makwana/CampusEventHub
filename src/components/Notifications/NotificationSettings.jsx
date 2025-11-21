// src/components/Notifications/NotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import './NotificationSettings.css';

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
                setTimeout(() => setSuccess(null), 3000);
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
        return (
            <Layout user={user} unread_count={unreadCount}>
                <div className="container text-center py-5" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user} unread_count={unreadCount}>
            <div className="container mt-4" style={{ maxWidth: '800px' }}>
                <AnimatedSection className="settings-card">
                    <div className="settings-header">
                        <div className="d-flex align-items-center">
                            <div className="bg-white bg-opacity-25 rounded-circle p-3 me-3">
                                <i className="fas fa-bell fa-2x"></i>
                            </div>
                            <div>
                                <h4>Notification Settings</h4>
                                <p>Customize how you receive notifications</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-body p-4">
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="alert alert-success mb-4"
                                >
                                    <i className="fas fa-check-circle me-2"></i>{success}
                                </motion.div>
                            )}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="alert alert-danger mb-4"
                                >
                                    <i className="fas fa-exclamation-circle me-2"></i>{error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p className="text-white-50 mb-4">
                            Manage how and when you receive notifications from EventHub.
                        </p>

                        {preferences && (
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <h5 className="section-title"><i className="fas fa-envelope me-2"></i>Email Notifications</h5>

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

                                <div className="d-flex justify-content-end gap-3 mt-5">
                                    <Link to="/notifications" className="btn btn-settings-secondary">
                                        Cancel
                                    </Link>
                                    <button type="submit" className="btn btn-settings-primary" disabled={saving}>
                                        {saving ? <span className="spinner-border spinner-border-sm"></span> : <i className="fas fa-save"></i>}
                                        {saving ? 'Saving...' : 'Save Preferences'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </AnimatedSection>
            </div>
        </Layout>
    );
}

// Reusable Toggle Switch Component
const SettingToggle = ({ id, name, checked, onChange, title, description }) => (
    <motion.div
        className="setting-item"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
        <label className="setting-label" htmlFor={id}>
            <strong>{title}</strong>
            <p>{description}</p>
        </label>
        <label className="switch">
            <input
                type="checkbox"
                id={id}
                name={name}
                checked={checked}
                onChange={onChange}
            />
            <span className="slider"></span>
        </label>
    </motion.div>
);