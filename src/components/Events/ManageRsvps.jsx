// src/components/Events/ManageRsvps.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../../api'; // Using apiPost for Edit
import Layout from '../Layout';
import './ManageRsvps.css'; // Import the new CSS
import { Modal, Button, Form } from 'react-bootstrap'; // Import React-Bootstrap

// Helper to format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export default function ManageRsvps() {
    const { id: eventId } = useParams();
    const navigate = useNavigate();

    // Page state
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Table state
    const [searchText, setSearchText] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'registered_at', direction: 'desc' });

    // Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRsvp, setSelectedRsvp] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    // Fetch all data
    const fetchData = async () => {
        try {
            const result = await apiGet(`manage_rsvps.php?event_id=${eventId}`);
            if (result.success) {
                setData(result);
            } else {
                throw new Error(result.error || 'Failed to load data');
            }
        } catch (err) {
            setError(err.message);
            if (err.message.includes('authorized')) {
                navigate('/my-events'); // Redirect if not authorized
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [eventId]);

    // Handle removing an attendee
    const handleRemoveAttendee = async (rsvpId) => {
        if (window.confirm('Are you sure you want to remove this attendee? This will also delete their feedback and free up their ticket (if applicable).')) {
            try {
                // Use DELETE method on the new actions endpoint
                const res = await fetch(`http://localhost/CampusEventHub/backend/api/rsvp_actions.php?rsvp_id=${rsvpId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const result = await res.json();
                
                if (result.success) {
                    fetchData(); // Refetch all data to update table and summary
                } else {
                    throw new Error(result.error || 'Failed to remove attendee');
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    // --- Modal Handlers ---
    const openEditModal = (rsvp) => {
        setSelectedRsvp(rsvp);
        setEditStatus(rsvp.status);
        setEditCategory(rsvp.category_id);
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedRsvp(null);
        setEditLoading(false);
    };

    const handleEditSave = async () => {
        setEditLoading(true);
        try {
            // Use POST (as a PUT) on the new actions endpoint
            const result = await apiPost(`rsvp_actions.php?rsvp_id=${selectedRsvp.id}`, {
                status: editStatus,
                category_id: editCategory
            });
            if (result.success) {
                closeEditModal();
                fetchData(); // Refetch data
            } else {
                throw new Error(result.error || 'Failed to update RSVP');
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
            setEditLoading(false);
        }
    };

    // Memoized, filtered, and sorted attendees
    const processedAttendees = useMemo(() => {
        if (!data?.attendees) return [];
        let filtered = data.attendees.filter(a => 
            a.fullname.toLowerCase().includes(searchText.toLowerCase()) ||
            a.email.toLowerCase().includes(searchText.toLowerCase())
        );
        filtered.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return filtered;
    }, [data, searchText, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return ' ';
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };


    if (loading) {
        return (
            <Layout user={data?.user}>
                <div className="container page-wrapper text-center py-5">
                    <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                </div>
            </Layout>
        );
    }
    
    if (error) {
        return (
            <Layout user={data?.user}>
                <div className="container page-wrapper"><div className="alert alert-danger">{error}</div></div>
            </Layout>
        );
    }

    if (!data) return null;
    const { user, event, summary, all_categories, attendees } = data;

    return (
        <Layout user={user}>
            <div className="container page-wrapper">
                <div className="page-header">
                    <h2><i className="fas fa-users me-2"></i> Manage RSVPs</h2>
                    <div className="event-title">{event.title}</div>
                </div>

                {attendees.length === 0 ? (
                    <div className="table-wrapper">
                        <div className="empty-state">
                            <div className="empty-state-icon"><i className="fas fa-user-slash"></i></div>
                            <div className="alert alert-info d-inline-block">
                                <strong>No RSVPs Yet</strong><br />
                                No attendees have RSVP'd to this event.
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Summary Section */}
                        <div className="summary-container">
                            <div className="summary-card">
                                <div className="row g-3">
                                    <div className="col-md-3 col-sm-6"><SummaryItem title="Total RSVPs" count={summary.total} icon="fa-users" type="total" /></div>
                                    <div className="col-md-3 col-sm-6"><SummaryItem title="Going (Tickets)" count={summary.going} icon="fa-check" type="going" /></div>
                                    <div className="col-md-3 col-sm-6"><SummaryItem title="Interested" count={summary.interested} icon="fa-star" type="interested" /></div>
                                    <div className="col-md-3 col-sm-6"><SummaryItem title="Not Going" count={summary.not_going} icon="fa-times" type="not-going" /></div>
                                </div>
                            </div>
                        </div>

                        {/* RSVPs Table */}
                        <div className="table-wrapper">
                            <div className="d-flex justify-content-between mb-3">
                                <h5>Attendee List</h5>
                                <input 
                                    type="text"
                                    className="form-control rsvp-search-bar"
                                    placeholder="Search attendees..."
                                    style={{maxWidth: '300px'}}
                                    value={searchText}
                                    onChange={e => setSearchText(e.target.value)}
                                />
                            </div>

                            <div className="table-responsive">
                                <table id="rsvpTable" className="table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th onClick={() => requestSort('fullname')} style={{cursor: 'pointer'}}><i className="fas fa-user me-2"></i> Full Name{getSortIcon('fullname')}</th>
                                            <th onClick={() => requestSort('email')} style={{cursor: 'pointer'}}><i className="fas fa-envelope me-2"></i> Email{getSortIcon('email')}</th>
                                            <th onClick={() => requestSort('status')} style={{cursor: 'pointer'}}><i className="fas fa-info-circle me-2"></i> Status{getSortIcon('status')}</th>
                                            <th onClick={() => requestSort('registered_at')} style={{cursor: 'pointer'}}><i className="fas fa-calendar-check me-2"></i> Registered{getSortIcon('registered_at')}</th>
                                            <th><i className="fas fa-cog me-2"></i> Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedAttendees.map(attendee => (
                                            <AttendeeRow 
                                                key={attendee.id} 
                                                attendee={attendee} 
                                                onEdit={() => openEditModal(attendee)}
                                                onRemove={() => handleRemoveAttendee(attendee.id)} 
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                <div className="back-button-wrapper">
                    <Link to="/my-events" className="btn btn-secondary btn-lg">
                        <i className="fas fa-arrow-left me-2"></i> Back to My Events
                    </Link>
                </div>
            </div>

            {/* Edit RSVP Modal */}
            <EditRsvpModal 
                show={showEditModal}
                handleClose={closeEditModal}
                handleSave={handleEditSave}
                rsvp={selectedRsvp}
                categories={all_categories}
                status={editStatus}
                setStatus={setEditStatus}
                category={editCategory}
                setCategory={setEditCategory}
                loading={editLoading}
            />
        </Layout>
    );
}

// --- Sub-Components ---

const SummaryItem = ({ title, count, icon, type }) => (
    <div className={`summary-item ${type}`}>
        <span className={`icon fas ${icon}`}></span>
        <h5>{title}</h5>
        <p className="count">{count}</p>
    </div>
);

const AttendeeRow = ({ attendee, onEdit, onRemove }) => {
    const statusLower = attendee.status.toLowerCase().replace(' ', '_');
    const statusClass = `status-${statusLower}`;

    return (
        <tr>
            <td><strong>{attendee.fullname}</strong></td>
            <td>{attendee.email}</td>
            <td><span className={`status-badge ${statusClass}`}>{attendee.status}</span></td>
            <td>{formatDate(attendee.registered_at)}</td>
            <td>
                <button className="btn btn-sm btn-warning me-2" onClick={onEdit}>
                    <i className="fas fa-edit me-1"></i> Edit
                </button>
                <button className="btn btn-sm btn-danger" onClick={onRemove}>
                    <i className="fas fa-trash me-1"></i> Remove
                </button>
            </td>
        </tr>
    );
};

const EditRsvpModal = ({ show, handleClose, handleSave, rsvp, categories, status, setStatus, category, setCategory, loading }) => {
    if (!rsvp) return null;

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header className="card-header-custom" closeButton closeVariant="white">
                <Modal.Title as="h3"><i className="fas fa-edit me-2"></i> Edit RSVP</Modal.Title>
            </Modal.Header>
            <Modal.Body className="card-body-custom">
                <div className="attendee-info">
                    <h5><i className="fas fa-user me-2"></i> Attendee Information</h5>
                    <div className="info-row"><span className="icon"><i className="fas fa-user-circle"></i></span><strong>Name:</strong>&nbsp;{rsvp.fullname}</div>
                    <div className="info-row"><span className="icon"><i className="fas fa-envelope"></i></span><strong>Email:</strong>&nbsp;{rsvp.email}</div>
                </div>

                <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <Form.Group className="mb-3">
                        <Form.Label className="form-label"><i className="fas fa-info-circle me-2"></i> RSVP Status</Form.Label>
                        <Form.Select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="going">Going</option>
                            <option value="interested">Interested</option>
                            <option value="not going">Not Going</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="form-label"><i className="fas fa-tags me-2"></i> Attendee Category</Form.Label>
                        <Form.Select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={loading} style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none'}}>
                            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-save me-2"></i>}
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};