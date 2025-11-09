// src/components/Events/CreateEvent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPostFormData } from '../../api';
import Layout from '../Layout';
import './Events.css'; // We'll create this file next

export default function CreateEvent() {
    const navigate = useNavigate();
    
    // State for form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [event_date, setEventDate] = useState('');
    const [category_ids, setCategoryIds] = useState([]);
    const [total_tickets, setTotalTickets] = useState(0);
    const [ticket_price, setTicketPrice] = useState(0);
    const [status, setStatus] = useState('draft');
    const [event_image, setEventImage] = useState(null);

    // State for categories, loading, and errors
    const [categories, setCategories] = useState([]);
    const [user, setUser] = useState(null); // For the layout
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState(null);

    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await apiGet('events_create.php');
                if (data.success) {
                    setCategories(data.categories);
                    // Assuming the API returns the user object on GET too
                    // If not, you may need a separate call to 'auth/me.php'
                    // setUser(data.user); 
                }
            } catch (err) {
                console.error(err);
                setGeneralError('Failed to load form data');
            }
        };
        fetchCategories();
    }, []);

    // Handle checkbox changes for categories
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
            setEventImage(e.target.files[0]);
        } else {
            setEventImage(null);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setGeneralError(null);

        // 1. Create FormData
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
        
        // Append category IDs as an array
        category_ids.forEach(id => {
            formData.append('category_ids[]', id);
        });

        // 2. Send FormData
        try {
            const data = await apiPostFormData('events_create.php', formData);
            if (data.success) {
                // TODO: Show a success message before redirecting
                // For now, just redirect to 'my-events'
                navigate('/my-events'); 
            }
        } catch (err) {
            if (err.status === 422 && err.errors) {
                // Validation errors
                setErrors(err.errors);
                setGeneralError('Please correct the errors below.');
            } else {
                // Other errors (500, network, etc.)
                setGeneralError(err.message || 'An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout user={user}>
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card form-card animate-fade-in">
                            <div className="card-header form-card-header text-white">
                                <h4 className="mb-0">Create New Event</h4>
                            </div>
                            <div className="card-body form-card-body">
                                
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
                                        <div className={`border rounded p-3 ${errors.category_ids ? 'is-invalid' : ''}`} style={{ borderColor: errors.category_ids ? '#dc3545' : 'var(--border-color)' }}>
                                            {categories.length === 0 && <p className="text-muted small">Loading categories...</p>}
                                            {categories.map(cat => (
                                                <div className="form-check" key={cat.id}>
                                                    <input className="form-check-input" type="checkbox" name="category_ids[]" value={cat.id}
                                                        onChange={handleCategoryChange} />
                                                    <label className="form-check-label">{cat.name}</label>
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
                                            <label className="form-label">Status</label>
                                            <select name="status" className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                                                <option value="draft">Draft</option>
                                                <option value="upcoming">Upcoming</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="ticket_price" className="form-label">Ticket Price (Ksh)</label>
                                        <input type="number" step="0.01" min="0" name="ticket_price" id="ticket_price" className={`form-control ${errors.ticket_price ? 'is-invalid' : ''}`}
                                            value={ticket_price} onChange={e => setTicketPrice(e.target.value)} required />
                                        {errors.ticket_price && <div className="invalid-feedback error-message">{errors.ticket_price}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Event Image</label>
                                        <input type="file" name="event_image" className={`form-control ${errors.event_image ? 'is-invalid' : ''}`}
                                            onChange={handleFileChange} accept="image/jpeg,image/png,image/gif,image/webp" />
                                        <div className="form-text">Max file size: 5MB. Allowed types: JPG, PNG, GIF, WebP</div>
                                        {errors.event_image && <div className="invalid-feedback error-message d-block">{errors.event_image}</div>}
                                    </div>

                                    <div className="d-flex justify-content-end">
                                        <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/my-events')} disabled={loading}>
                                            Cancel
                                        </button>
                                        <button type="submit" name="create_event" className="btn btn-primary" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Creating...
                                                </>
                                            ) : 'Create Event'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}