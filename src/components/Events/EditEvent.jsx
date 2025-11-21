// src/components/Events/EditEvent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiGet, apiPostFormData } from '../../api';
import Layout from '../Layout';
import './EventForm.css';

export default function EditEvent() {
    const navigate = useNavigate();
    const { id } = useParams();

    // Form data state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        event_date: '',
        total_tickets: 0,
        ticket_price: 0,
        status: 'draft',
    });
    const [category_ids, setCategoryIds] = useState([]);
    const [event_image, setEventImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [remove_image, setRemoveImage] = useState(false);
    const [existingImage, setExistingImage] = useState(null);
    const [availableTickets, setAvailableTickets] = useState(0);

    // Page state
    const [allCategories, setAllCategories] = useState([]);
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [formErrors, setFormErrors] = useState({});
    const [generalError, setGeneralError] = useState(null);

    // Format date for datetime-local input
    const formatDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    };

    // Fetch event data on mount
    useEffect(() => {
        const fetchEventData = async () => {
            try {
                const data = await apiGet(`events_edit.php?id=${id}`);
                if (data.success) {
                    const { event, selected_categories, all_categories, user, unread_count } = data;

                    setFormData({
                        title: event.title,
                        description: event.description,
                        location: event.location,
                        event_date: formatDateTimeLocal(event.event_date),
                        total_tickets: event.total_tickets,
                        ticket_price: event.ticket_price,
                        status: event.status,
                    });
                    setCategoryIds(selected_categories.map(Number));
                    setExistingImage(event.image);
                    setAvailableTickets(event.available_tickets);
                    setAllCategories(all_categories);
                    setUser(user);
                    setUnreadCount(unread_count || 0);
                }
            } catch (err) {
                console.error(err);
                setGeneralError(err.message || 'Failed to load event data.');
            } finally {
                setLoading(false);
            }
        };
        fetchEventData();
    }, [id]);

    // Handle standard form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle category checkbox changes
    const handleCategoryChange = (e) => {
        const catId = parseInt(e.target.value, 10);
        if (e.target.checked) {
            setCategoryIds(prev => [...prev, catId]);
        } else {
            setCategoryIds(prev => prev.filter(id => id !== catId));
        }
    };

    // Handle file input change
    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            setEventImage(file);
            setImagePreview(URL.createObjectURL(file));
            setRemoveImage(false);
        } else {
            setEventImage(null);
            setImagePreview(null);
        }
    };

    // Handle "remove image" checkbox
    const handleRemoveImageChange = (e) => {
        setRemoveImage(e.target.checked);
        if (e.target.checked) {
            setEventImage(null);
            setImagePreview(null);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFormErrors({});
        setGeneralError(null);

        const postData = new FormData();
        Object.keys(formData).forEach(key => {
            postData.append(key, formData[key]);
        });
        category_ids.forEach(catId => {
            postData.append('category_ids[]', catId);
        });
        if (event_image) {
            postData.append('event_image', event_image);
        }
        postData.append('remove_image', remove_image);

        try {
            const data = await apiPostFormData(`events_edit.php?id=${id}`, postData);
            if (data.success) {
                navigate('/my-events');
            }
        } catch (err) {
            if (err.status === 422 && err.errors) {
                setFormErrors(err.errors);
                setGeneralError('Please correct the errors below.');
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

    if (loading && !user) {
        return (
            <Layout user={user} unread_count={unreadCount}>
                <div className="container mt-5 text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

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
                                <h4 className="mb-1"><i className="fas fa-edit me-2"></i>Edit Event</h4>
                                <p className="mb-0 text-white-50 small">Update your event details</p>
                            </div>
                            <div className="d-none d-md-block">
                                <i className="fas fa-calendar-check fa-3x text-white opacity-25"></i>
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
                                    className={`form-control form-control-lg ${formErrors.title ? 'is-invalid' : ''}`}
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                                {formErrors.title && <div className="error-message">{formErrors.title}</div>}
                            </motion.div>

                            <motion.div className="mb-4" variants={itemVariants}>
                                <label className="form-label">Description <span className="text-danger">*</span></label>
                                <textarea
                                    name="description"
                                    className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                                    rows="5"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                                {formErrors.description && <div className="error-message">{formErrors.description}</div>}
                            </motion.div>

                            <div className="row">
                                <motion.div className="col-md-6 mb-4" variants={itemVariants}>
                                    <label className="form-label">Location <span className="text-danger">*</span></label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-dark border-secondary border-end-0 rounded-start-4"><i className="fas fa-map-marker-alt text-white-50"></i></span>
                                        <input
                                            type="text"
                                            name="location"
                                            className={`form-control border-start-0 ${formErrors.location ? 'is-invalid' : ''}`}
                                            value={formData.location}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    {formErrors.location && <div className="error-message">{formErrors.location}</div>}
                                </motion.div>

                                <motion.div className="col-md-6 mb-4" variants={itemVariants}>
                                    <label className="form-label">Date & Time <span className="text-danger">*</span></label>
                                    <input
                                        type="datetime-local"
                                        name="event_date"
                                        className={`form-control ${formErrors.event_date ? 'is-invalid' : ''}`}
                                        value={formData.event_date}
                                        onChange={handleChange}
                                        required
                                    />
                                    {formErrors.event_date && <div className="error-message">{formErrors.event_date}</div>}
                                </motion.div>
                            </div>

                            <motion.div className="mb-4" variants={itemVariants}>
                                <label className="form-label">Categories <span className="text-danger">*</span></label>
                                <div className={`category-checkbox-group ${formErrors.category_ids ? 'border-danger' : ''}`}>
                                    {allCategories.map(cat => (
                                        <div className="form-check" key={cat.id}>
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`cat-${cat.id}`}
                                                value={cat.id}
                                                checked={category_ids.includes(cat.id)}
                                                onChange={handleCategoryChange}
                                            />
                                            <label className="form-check-label" htmlFor={`cat-${cat.id}`}>{cat.name}</label>
                                        </div>
                                    ))}
                                </div>
                                {formErrors.category_ids && <div className="error-message">{formErrors.category_ids}</div>}
                            </motion.div>

                            <div className="row">
                                <motion.div className="col-md-4 mb-4" variants={itemVariants}>
                                    <label className="form-label">Total Tickets</label>
                                    <input
                                        type="number"
                                        name="total_tickets"
                                        className={`form-control ${formErrors.total_tickets ? 'is-invalid' : ''}`}
                                        value={formData.total_tickets}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                    <div className="form-text small">Available: {availableTickets}</div>
                                    {formErrors.total_tickets && <div className="error-message">{formErrors.total_tickets}</div>}
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
                                            className={`form-control border-start-0 ${formErrors.ticket_price ? 'is-invalid' : ''}`}
                                            value={formData.ticket_price}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    {formErrors.ticket_price && <div className="error-message">{formErrors.ticket_price}</div>}
                                </motion.div>

                                <motion.div className="col-md-4 mb-4" variants={itemVariants}>
                                    <label className="form-label">Status</label>
                                    <select
                                        name="status"
                                        className="form-select"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </motion.div>
                            </div>

                            <motion.div className="mb-5" variants={itemVariants}>
                                <label className="form-label">Event Image</label>
                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex flex-column flex-md-row gap-4 align-items-start">
                                        <div className="flex-grow-1 w-100">
                                            <input
                                                type="file"
                                                name="event_image"
                                                className={`form-control ${formErrors.event_image ? 'is-invalid' : ''}`}
                                                onChange={handleFileChange}
                                                accept="image/jpeg,image/png,image/gif,image/webp"
                                            />
                                            <div className="form-text mt-2"><i className="fas fa-info-circle me-1"></i> Max size: 5MB. Formats: JPG, PNG, WebP</div>
                                            {formErrors.event_image && <div className="error-message">{formErrors.event_image}</div>}
                                        </div>

                                        {/* Image Preview Area */}
                                        <div className="d-flex gap-3">
                                            {imagePreview ? (
                                                <motion.div
                                                    className="image-preview-container shadow-sm m-0"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    style={{ width: '150px', height: '100px' }}
                                                >
                                                    <img src={imagePreview} alt="New Preview" />
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                                                        style={{ width: '20px', height: '20px', padding: 0, lineHeight: 1 }}
                                                        onClick={() => {
                                                            setEventImage(null);
                                                            setImagePreview(null);
                                                        }}
                                                    >
                                                        &times;
                                                    </button>
                                                </motion.div>
                                            ) : (
                                                existingImage && !remove_image && (
                                                    <div className="position-relative">
                                                        <div className="image-preview-container shadow-sm m-0" style={{ width: '150px', height: '100px' }}>
                                                            <img src={`http://localhost/CampusEventHub/${existingImage}`} alt="Current Event" />
                                                        </div>
                                                        <div className="mt-2 form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id="remove_image"
                                                                checked={remove_image}
                                                                onChange={handleRemoveImageChange}
                                                            />
                                                            <label className="form-check-label small text-danger" htmlFor="remove_image">Remove Image</label>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
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
                                            Updating...
                                        </>
                                    ) : (
                                        <><i className="fas fa-save me-2"></i>Update Event</>
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