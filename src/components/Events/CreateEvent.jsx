// src/components/Events/CreateEvent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiGet, apiPostFormData } from '../../api';
import Layout from '../Layout';
import './EventForm.css';

export default function CreateEvent() {
    const navigate = useNavigate();

    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [event_date, setEventDate] = useState('');
    const [category_ids, setCategoryIds] = useState([]);
    const [total_tickets, setTotalTickets] = useState(0);
    const [ticket_price, setTicketPrice] = useState(0);
    const [status, setStatus] = useState('draft');
    const [event_image, setEventImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Page state
    const [categories, setCategories] = useState([]);
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState(null);

    // Fetch categories and user data on component mount
    useEffect(() => {
        const fetchPageData = async () => {
            try {
                const data = await apiGet('events_create.php');
                if (data.success) {
                    setCategories(data.categories);
                    setUser(data.user);
                    setUnreadCount(data.unread_count || 0);
                }
            } catch (err) {
                console.error(err);
                setGeneralError('Failed to load form data');
            }
        };
        fetchPageData();
    }, []);

    // Handle checkbox changes
    const handleCategoryChange = (e) => {
        const catId = parseInt(e.target.value, 10);
        if (e.target.checked) {
            setCategoryIds(prev => [...prev, catId]);
        } else {
            setCategoryIds(prev => prev.filter(id => id !== catId));
        }
    };

    // Handle file input and create preview
    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            setEventImage(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setEventImage(null);
            setImagePreview(null);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setGeneralError(null);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('location', location);
        formData.append('event_date', event_date);
        formData.append('total_tickets', total_tickets);
        formData.append('ticket_price', ticket_price);
        formData.append('status', status);

        if (event_image) {
            formData.append('event_image', event_image);
        }
        category_ids.forEach(id => {
            formData.append('category_ids[]', id);
        });

        try {
            const data = await apiPostFormData('events_create.php', formData);
            if (data.success) {
                navigate('/my-events');
            }
        } catch (err) {
            if (err.status === 422 && err.errors) {
                setErrors(err.errors);
                setGeneralError('Please correct the errors below.');
                // Scroll to top to see error
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                setGeneralError(err.message || 'An unexpected error occurred.');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } finally {
            setLoading(false);
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <Layout user={user} unread_count={unreadCount}>
            <div className="container mt-5 mb-5" style={{ maxWidth: '900px' }}>
                <motion.div
                    className="event-form-card"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="event-form-header">
                        <div className="d-flex align-items-center justify-content-between position-relative z-1">
                            <div>
                                <h4 className="mb-1"><i className="fas fa-magic me-2"></i>Create New Event</h4>
                                <p className="mb-0 text-white-50 small">Share your amazing event with the world</p>
                            </div>
                            <div className="d-none d-md-block">
                                <i className="fas fa-calendar-plus fa-3x text-white opacity-25"></i>
                            </div>
                        </div>
                    </div>

                    <div className="event-form-body">
                        {generalError && (
                            <motion.div
                                className="alert alert-danger border-0 shadow-sm rounded-3 mb-4"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                            >
                                <i className="fas fa-exclamation-circle me-2"></i> {generalError}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            <motion.div className="mb-4" variants={itemVariants}>
                                <label className="form-label">Event Title <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    name="title"
                                    className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
                                    placeholder="e.g., Annual Tech Symposium 2024"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                                {errors.title && <div className="error-message">{errors.title}</div>}
                            </motion.div>

                            <motion.div className="mb-4" variants={itemVariants}>
                                <label className="form-label">Description <span className="text-danger">*</span></label>
                                <textarea
                                    name="description"
                                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                    rows="5"
                                    placeholder="Tell people what your event is about..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                ></textarea>
                                {errors.description && <div className="error-message">{errors.description}</div>}
                            </motion.div>

                            <div className="row">
                                <motion.div className="col-md-6 mb-4" variants={itemVariants}>
                                    <label className="form-label">Location <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-dark border-secondary border-end-0 rounded-start-4"><i className="fas fa-map-marker-alt text-white-50"></i></span>
                                        <input
                                            type="text"
                                            name="location"
                                            className={`form-control border-start-0 ${errors.location ? 'is-invalid' : ''}`}
                                            placeholder="Venue or Online Link"
                                            value={location}
                                            onChange={e => setLocation(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {errors.location && <div className="error-message">{errors.location}</div>}
                                </motion.div>

                                <motion.div className="col-md-6 mb-4" variants={itemVariants}>
                                    <label className="form-label">Date & Time <span className="text-danger">*</span></label>
                                    <input
                                        type="datetime-local"
                                        name="event_date"
                                        className={`form-control ${errors.event_date ? 'is-invalid' : ''}`}
                                        value={event_date}
                                        onChange={e => setEventDate(e.target.value)}
                                        required
                                    />
                                    {errors.event_date && <div className="error-message">{errors.event_date}</div>}
                                </motion.div>
                            </div>

                            <motion.div className="mb-4" variants={itemVariants}>
                                <label className="form-label">Categories <span className="text-danger">*</span></label>
                                <div className={`category-checkbox-group ${errors.category_ids ? 'border-danger' : ''}`}>
                                    {categories.length === 0 && <div className="text-center py-3"><span className="spinner-border spinner-border-sm text-primary"></span> Loading...</div>}
                                    {categories.map(cat => (
                                        <div className="form-check" key={cat.id}>
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`cat-${cat.id}`}
                                                value={cat.id}
                                                onChange={handleCategoryChange}
                                            />
                                            <label className="form-check-label" htmlFor={`cat-${cat.id}`}>{cat.name}</label>
                                        </div>
                                    ))}
                                </div>
                                {errors.category_ids && <div className="error-message">{errors.category_ids}</div>}
                            </motion.div>

                            <div className="row">
                                <motion.div className="col-md-4 mb-4" variants={itemVariants}>
                                    <label className="form-label">Total Tickets</label>
                                    <input
                                        type="number"
                                        name="total_tickets"
                                        className={`form-control ${errors.total_tickets ? 'is-invalid' : ''}`}
                                        value={total_tickets}
                                        onChange={e => setTotalTickets(e.target.value)}
                                        min="0"
                                    />
                                    <div className="form-text small">Leave 0 for unlimited</div>
                                    {errors.total_tickets && <div className="error-message">{errors.total_tickets}</div>}
                                </motion.div>

                                <motion.div className="col-md-4 mb-4" variants={itemVariants}>
                                    <label className="form-label">Price (KSh) <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-dark border-secondary border-end-0 rounded-start-4 text-white-50">KSh</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            name="ticket_price"
                                            className={`form-control border-start-0 ${errors.ticket_price ? 'is-invalid' : ''}`}
                                            value={ticket_price}
                                            onChange={e => setTicketPrice(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-text small">0 for free events</div>
                                    {errors.ticket_price && <div className="error-message">{errors.ticket_price}</div>}
                                </motion.div>

                                <motion.div className="col-md-4 mb-4" variants={itemVariants}>
                                    <label className="form-label">Status</label>
                                    <select
                                        name="status"
                                        className="form-select"
                                        value={status}
                                        onChange={e => setStatus(e.target.value)}
                                    >
                                        <option value="draft">Draft (Hidden)</option>
                                        <option value="upcoming">Upcoming (Public)</option>
                                    </select>
                                </motion.div>
                            </div>

                            <motion.div className="mb-5" variants={itemVariants}>
                                <label className="form-label">Event Image</label>
                                <div className="d-flex flex-column flex-md-row gap-4 align-items-start">
                                    <div className="flex-grow-1 w-100">
                                        <input
                                            type="file"
                                            name="event_image"
                                            className={`form-control ${errors.event_image ? 'is-invalid' : ''}`}
                                            onChange={handleFileChange}
                                            accept="image/jpeg,image/png,image/gif,image/webp"
                                        />
                                        <div className="form-text mt-2"><i className="fas fa-info-circle me-1"></i> Max size: 5MB. Formats: JPG, PNG, WebP</div>
                                        {errors.event_image && <div className="error-message">{errors.event_image}</div>}
                                    </div>
                                    {imagePreview && (
                                        <motion.div
                                            className="image-preview-container shadow-sm"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={{ width: '200px', height: '140px', flexShrink: 0 }}
                                        >
                                            <img src={imagePreview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                                                style={{ width: '24px', height: '24px', padding: 0, lineHeight: 1 }}
                                                onClick={() => {
                                                    setEventImage(null);
                                                    setImagePreview(null);
                                                }}
                                            >
                                                &times;
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>

                            <motion.div className="d-flex justify-content-end gap-3 pt-3 border-top" variants={itemVariants}>
                                <motion.button
                                    type="button"
                                    className="btn btn-form-secondary"
                                    onClick={() => navigate('/my-events')}
                                    disabled={loading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    className="btn btn-form-primary"
                                    disabled={loading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        <><i className="fas fa-rocket me-2"></i>Publish Event</>
                                    )}
                                </motion.button>
                            </motion.div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
}