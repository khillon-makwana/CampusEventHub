// src/components/Events/CreateEvent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiGet, apiPostFormData } from '../../api';
import Layout from '../Layout';
import './EventForm.css'; // <-- Import the NEW shared CSS

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
    const [imagePreview, setImagePreview] = useState(null); // For image preview

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
                    setUnreadCount(data.unread_count || 0); // Get unread count
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
            // Create a URL for the preview
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
                navigate('/my-events'); // Redirect on success
            }
        } catch (err) {
            if (err.status === 422 && err.errors) {
                setErrors(err.errors);
                setGeneralError('Please correct the errors below.');
            } else {
                setGeneralError(err.message || 'An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

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
                            className="card event-form-card"
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ 
                                transform: 'perspective(1000px) scale(1.01)',
                                boxShadow: 'var(--shadow-large)' 
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <div className="card-header event-form-header text-white">
                                <h4 className="mb-0">Create New Event</h4>
                            </div>
                            <div className="card-body event-form-body">
                                
                                {generalError && (
                                    <div className="alert alert-danger">{generalError}</div>
                                )}

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="mb-3">
                                        <label className="form-label">Event Title *</label>
                                        <input type="text" name="title" className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                            value={title} onChange={e => setTitle(e.target.value)} required />
                                        {errors.title && <div className="invalid-feedback error-message">{errors.title}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Description *</label>
                                        <textarea name="description" className={`form-control ${errors.description ? 'is-invalid' : ''}`} rows="4"
                                            value={description} onChange={e => setDescription(e.target.value)} required></textarea>
                                        {errors.description && <div className="invalid-feedback error-message">{errors.description}</div>}
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Location *</label>
                                            <input type="text" name="location" className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                                                value={location} onChange={e => setLocation(e.target.value)} required />
                                            {errors.location && <div className="invalid-feedback error-message">{errors.location}</div>}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Event Date & Time *</label>
                                            <input type="datetime-local" name="event_date" className={`form-control ${errors.event_date ? 'is-invalid' : ''}`}
                                                value={event_date} onChange={e => setEventDate(e.target.value)} required />
                                            {errors.event_date && <div className="invalid-feedback error-message">{errors.event_date}</div>}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Event Categories *</label>
                                        <div className={`category-checkbox-group ${errors.category_ids ? 'is-invalid' : ''}`}>
                                            {categories.length === 0 && <p className="text-muted small">Loading categories...</p>}
                                            {categories.map(cat => (
                                                <div className="form-check" key={cat.id}>
                                                    <input className="form-check-input" type="checkbox" id={`cat-${cat.id}`} value={cat.id}
                                                        onChange={handleCategoryChange} />
                                                    <label className="form-check-label" htmlFor={`cat-${cat.id}`}>{cat.name}</label>
                                                </div>
                                            ))}
                                        </div>
                                        {errors.category_ids && <div className="invalid-feedback error-message d-block">{errors.category_ids}</div>}
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Total Tickets</label>
                                            <input type="number" name="total_tickets" className={`form-control ${errors.total_tickets ? 'is-invalid' : ''}`}
                                                value={total_tickets} onChange={e => setTotalTickets(e.target.value)} min="0" />
                                            {errors.total_tickets && <div className="invalid-feedback error-message">{errors.total_tickets}</div>}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="ticket_price" className="form-label">Ticket Price (Ksh)</label>
                                            <input type="number" step="0.01" min="0" name="ticket_price" id="ticket_price" className={`form-control ${errors.ticket_price ? 'is-invalid' : ''}`}
                                                value={ticket_price} onChange={e => setTicketPrice(e.target.value)} required />
                                            {errors.ticket_price && <div className="invalid-feedback error-message">{errors.ticket_price}</div>}
                                        </div>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="form-label">Status</label>
                                        <select name="status" className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                                            <option value="draft">Draft</option>
                                            <option value="upcoming">Upcoming</option>
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Event Image</label>
                                        <input type="file" name="event_image" className={`form-control ${errors.event_image ? 'is-invalid' : ''}`}
                                            onChange={handleFileChange} accept="image/jpeg,image/png,image/gif,image/webp" />
                                        <div className="form-text">Max file size: 5MB. Allowed types: JPG, PNG, GIF, WebP</div>
                                        {errors.event_image && <div className="invalid-feedback error-message d-block">{errors.event_image}</div>}
                                    </div>
                                    
                                    {imagePreview && (
                                        <div className="mb-3 text-center">
                                            <img src={imagePreview} alt="Event preview" style={{maxHeight: '200px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)'}} />
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-end gap-2 mt-4">
                                        <motion.button 
                                            type="button" 
                                            className="btn btn-form-secondary" 
                                            onClick={() => navigate('/my-events')} 
                                            disabled={loading}
                                            whileHover={{ y: -2 }}
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button 
                                            type="submit" 
                                            name="create_event" 
                                            className="btn btn-form-primary" 
                                            disabled={loading}
                                            whileHover={{ y: -2 }}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Creating...
                                                </>
                                            ) : (
                                                <><i className="fas fa-plus-circle me-2"></i>Create Event</>
                                            )}
                                        </motion.button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}