// src/components/Events/EditEvent.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet, apiPostFormData } from '../../api';
import Layout from '../Layout';
import './Events.css'; // Uses the same CSS as the CreateEvent page

export default function EditEvent() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get event ID from URL

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
    const [remove_image, setRemoveImage] = useState(false);
    const [existingImage, setExistingImage] = useState(null);
    const [availableTickets, setAvailableTickets] = useState(0);

    // Page state
    const [allCategories, setAllCategories] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formErrors, setFormErrors] = useState({});
    const [generalError, setGeneralError] = useState(null);

    // Format date for datetime-local input
    const formatDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Adjust for timezone offset
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    };

    // Fetch event data on mount
    useEffect(() => {
        const fetchEventData = async () => {
            try {
                const data = await apiGet(`events_edit.php?id=${id}`);
                if (data.success) {
                    const { event, selected_categories, all_categories, user } = data;
                    
                    setFormData({
                        title: event.title,
                        description: event.description,
                        location: event.location,
                        event_date: formatDateTimeLocal(event.event_date),
                        total_tickets: event.total_tickets,
                        ticket_price: event.ticket_price,
                        status: event.status,
                    });
                    setCategoryIds(selected_categories.map(Number)); // Ensure they are numbers
                    setExistingImage(event.image);
                    setAvailableTickets(event.available_tickets);
                    setAllCategories(all_categories);
                    setUser(user);
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setGeneralError(err.message || 'Failed to load event data.');
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
            setEventImage(e.target.files[0]);
            setRemoveImage(false); // Uncheck "remove" if a new file is added
        } else {
            setEventImage(null);
        }
    };

    // Handle "remove image" checkbox
    const handleRemoveImageChange = (e) => {
        setRemoveImage(e.target.checked);
        if (e.target.checked) {
            setEventImage(null); // Clear any staged file
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFormErrors({});
        setGeneralError(null);

        const postData = new FormData();
        // Append all form data
        Object.keys(formData).forEach(key => {
            postData.append(key, formData[key]);
        });

        // Append category IDs
        category_ids.forEach(catId => {
            postData.append('category_ids[]', catId);
        });

        // Append image logic
        if (event_image) {
            postData.append('event_image', event_image);
        }
        postData.append('remove_image', remove_image);
        
        try {
            // POST to the same URL, but with id in query string
            const data = await apiPostFormData(`events_edit.php?id=${id}`, postData);
            if (data.success) {
                navigate('/my-events'); // Redirect on success
            }
        } catch (err) {
            if (err.status === 422 && err.errors) {
                setFormErrors(err.errors);
                setGeneralError('Please correct the errors below.');
            } else {
                setGeneralError(err.message || 'An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <Layout user={user}>
                <div className="container mt-4 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p>Loading event data...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout user={user}>
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card form-card animate-fade-in">
                            <div className="card-header form-card-header text-white">
                                <h4 className="mb-0">Edit Event</h4>
                            </div>
                            <div className="card-body form-card-body">
                                
                                {generalError && (
                                    <div className="alert alert-danger">{generalError}</div>
                                )}

                                <form onSubmit={handleSubmit} noValidate>
                                    <div className="mb-3">
                                        <label className="form-label">Event Title *</label>
                                        <input type="text" name="title" className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
                                            value={formData.title} onChange={handleChange} required />
                                        {formErrors.title && <div className="invalid-feedback error-message">{formErrors.title}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Description *</label>
                                        <textarea name="description" className={`form-control ${formErrors.description ? 'is-invalid' : ''}`} rows="4"
                                            value={formData.description} onChange={handleChange} required></textarea>
                                        {formErrors.description && <div className="invalid-feedback error-message">{formErrors.description}</div>}
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Location *</label>
                                            <input type="text" name="location" className={`form-control ${formErrors.location ? 'is-invalid' : ''}`}
                                                value={formData.location} onChange={handleChange} required />
                                            {formErrors.location && <div className="invalid-feedback error-message">{formErrors.location}</div>}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Event Date & Time *</label>
                                            <input type="datetime-local" name="event_date" className={`form-control ${formErrors.event_date ? 'is-invalid' : ''}`}
                                                value={formData.event_date} onChange={handleChange} required />
                                            {formErrors.event_date && <div className="invalid-feedback error-message">{formErrors.event_date}</div>}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Event Categories *</label>
                                        <div className={`border rounded p-3 ${formErrors.category_ids ? 'is-invalid' : ''}`} style={{ borderColor: formErrors.category_ids ? '#dc3545' : 'var(--border-color)' }}>
                                            {allCategories.map(cat => (
                                                <div className="form-check" key={cat.id}>
                                                    <input className="form-check-input" type="checkbox" name="category_ids[]" value={cat.id}
                                                        checked={category_ids.includes(cat.id)}
                                                        onChange={handleCategoryChange} />
                                                    <label className="form-check-label">{cat.name}</label>
                                                </div>
                                            ))}
                                        </div>
                                        {formErrors.category_ids && <div className="invalid-feedback error-message d-block">{formErrors.category_ids}</div>}
                                    </div>

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Total Tickets</label>
                                            <input type="number" name="total_tickets" className={`form-control ${formErrors.total_tickets ? 'is-invalid' : ''}`}
                                                value={formData.total_tickets} onChange={handleChange} min="0" />
                                            <div className="form-text">Currently available: {availableTickets}</div>
                                            {formErrors.total_tickets && <div className="invalid-feedback error-message">{formErrors.total_tickets}</div>}
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Ticket Price (Ksh)</label>
                                            <input type="number" step="0.01" min="0" name="ticket_price" className={`form-control ${formErrors.ticket_price ? 'is-invalid' : ''}`}
                                                value={formData.ticket_price} onChange={handleChange} required />
                                            {formErrors.ticket_price && <div className="invalid-feedback error-message">{formErrors.ticket_price}</div>}
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Status</label>
                                            <select name="status" className="form-select" value={formData.status} onChange={handleChange}>
                                                <option value="draft">Draft</option>
                                                <option value="upcoming">Upcoming</option>
                                                <option value="ongoing">Ongoing</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Event Image</label>
                                        {existingImage && (
                                            <div className="mb-2">
                                                <img src={`http://localhost/CampusEventHub/${existingImage}`} // Assuming this base URL
                                                    className="img-thumbnail" style={{ maxHeight: '150px' }} alt="Current event" />
                                                <div className="form-check mt-2">
                                                    <input className="form-check-input" type="checkbox" name="remove_image" id="remove_image"
                                                        checked={remove_image} onChange={handleRemoveImageChange} />
                                                    <label className="form-check-label" htmlFor="remove_image">Remove current image</label>
                                                </div>
                                            </div>
                                        )}
                                        <input type="file" name="event_image" className={`form-control ${formErrors.event_image ? 'is-invalid' : ''}`}
                                            onChange={handleFileChange} accept="image/jpeg,image/png,image/gif,image/webp" />
                                        <div className="form-text">Max file size: 5MB. Allowed types: JPG, PNG, GIF, WebP</div>
                                        {formErrors.event_image && <div className="invalid-feedback error-message d-block">{formErrors.event_image}</div>}
                                    </div>

                                    <div className="d-flex justify-content-end">
                                        <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/my-events')} disabled={loading}>
                                            Cancel
                                        </button>
                                        <button type="submit" name="update_event" className="btn btn-primary" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Updating...
                                                </>
                                            ) : 'Update Event'}
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