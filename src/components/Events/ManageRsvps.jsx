// src/components/Events/ManageRsvps.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiGet, apiPost } from '../../api';
import Layout from '../Layout';
import { Modal, Button, Form } from 'react-bootstrap';
import './ManageRsvps.css';

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
                navigate('/my-events');
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
                const res = await fetch(`http://localhost/CampusEventHub/backend/api/rsvp_actions.php?rsvp_id=${rsvpId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const result = await res.json();

                if (result.success) {
                    fetchData();
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
            const result = await apiPost(`rsvp_actions.php?rsvp_id=${selectedRsvp.id}`, {
                status: editStatus,
                category_id: editCategory
            });
            if (result.success) {
                closeEditModal();
                fetchData();
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
                <div className="container page-wrapper text-center py-5" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout user={data?.user}>
                <div className="container page-wrapper pt-5">
                    <div className="alert alert-danger shadow-sm rounded-3">{error}</div>
                </div>
            </Layout>
        );
    }

    if (!data) return null;
    const { user, event, summary, all_categories, attendees } = data;

    return (
        <Layout user={user}>
            <div className="container page-wrapper pt-4">
                <AnimatedSection className="page-header">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <i className="fas fa-users me-2 text-primary"></i> Manage RSVPs
                    </motion.h2>
                    <motion.div
                        className="event-title"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {event.title}
                    </motion.div>
                </AnimatedSection>

                {attendees.length === 0 ? (
                    <AnimatedSection delay={0.4} className="table-wrapper">
                        <div className="empty-state">
                            <div className="empty-state-icon"><i className="fas fa-user-slash"></i></div>
                            <h4 className="text-white mb-3">No RSVPs Yet</h4>
                            <p className="text-white-50">No attendees have RSVP'd to this event yet.</p>
                        </div>
                    </AnimatedSection>
                ) : (
                    <>
                        {/* Summary Section */}
                        <AnimatedSection delay={0.4} className="summary-container">
                            <div className="summary-card">
                                <div className="row g-3">
                                    <div className="col-md-3 col-sm-6"><SummaryItem title="Total RSVPs" count={summary.total} icon="fa-users" type="total" /></div>
                                    <div className="col-md-3 col-sm-6"><SummaryItem title="Going (Tickets)" count={summary.going} icon="fa-check" type="going" /></div>
                                    <div className="col-md-3 col-sm-6"><SummaryItem title="Interested" count={summary.interested} icon="fa-star" type="interested" /></div>
                                    <div className="col-md-3 col-sm-6"><SummaryItem title="Not Going" count={summary.not_going} icon="fa-times" type="not-going" /></div>
                                </div>
                            </div>
                        </AnimatedSection>

                        {/* RSVPs Table */}
                        <AnimatedSection delay={0.5} className="table-wrapper">
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                                <h5 className="mb-0 text-white"><i className="fas fa-list me-2 text-primary"></i>Attendee List</h5>
                                <div className="position-relative" style={{ width: '100%', maxWidth: '300px' }}>
                                    <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-white-50"></i>
                                    <input
                                        type="text"
                                        className="form-control rsvp-search-bar"
                                        placeholder="Search attendees..."
                                        value={searchText}
                                        onChange={e => setSearchText(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table id="rsvpTable" className="table table-hover align-middle">
                                    <thead>
                                        <tr>
                                            <th onClick={() => requestSort('fullname')} style={{ cursor: 'pointer' }}>Full Name{getSortIcon('fullname')}</th>
                                            <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>Email{getSortIcon('email')}</th>
                                            <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>Status{getSortIcon('status')}</th>
                                            <th onClick={() => requestSort('registered_at')} style={{ cursor: 'pointer' }}>Registered{getSortIcon('registered_at')}</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {processedAttendees.map((attendee, index) => (
                                                <AttendeeRow
                                                    key={attendee.id}
                                                    attendee={attendee}
                                                    index={index}
                                                    onEdit={() => openEditModal(attendee)}
                                                    onRemove={() => handleRemoveAttendee(attendee.id)}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </AnimatedSection>
                    </>
                )}

                <AnimatedSection delay={0.6} className="d-flex justify-content-center mt-4">
                    <Link to="/my-events" className="btn btn-outline-light rounded-pill px-4">
                        <i className="fas fa-arrow-left me-2"></i> Back to My Events
                    </Link>
                </AnimatedSection>
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
    <motion.div
        className={`summary-item ${type}`}
        whileHover={{ y: -5, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
    >
        <span className={`icon fas ${icon}`}></span>
        <h5>{title}</h5>
        <p className="count">{count}</p>
    </motion.div>
);

const AttendeeRow = ({ attendee, index, onEdit, onRemove }) => {
    const statusLower = attendee.status.toLowerCase().replace(' ', '_');
    const statusClass = `status-${statusLower}`;

    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
        >
            <td>
                <div className="d-flex align-items-center">
                    <div className="avatar-circle bg-primary bg-opacity-25 text-primary me-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}>
                        {attendee.fullname.charAt(0).toUpperCase()}
                    </div>
                    <strong>{attendee.fullname}</strong>
                </div>
            </td>
            <td className="text-white-50">{attendee.email}</td>
            <td><span className={`status-badge ${statusClass}`}>{attendee.status}</span></td>
            <td className="text-white-50 small">{formatDate(attendee.registered_at)}</td>
            <td>
                <div className="btn-group">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-sm btn-outline-warning border-0" onClick={onEdit} title="Edit">
                        <i className="fas fa-edit"></i>
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="btn btn-sm btn-outline-danger border-0" onClick={onRemove} title="Remove">
                        <i className="fas fa-trash"></i>
                    </motion.button>
                </div>
            </td>
        </motion.tr>
    );
};

const EditRsvpModal = ({ show, handleClose, handleSave, rsvp, categories, status, setStatus, category, setCategory, loading }) => {
    if (!rsvp) return null;

    return (
        <Modal show={show} onHide={handleClose} centered contentClassName="bg-dark border border-secondary text-white">
            <Modal.Header className="card-header-custom border-secondary" closeButton closeVariant="white">
                <Modal.Title as="h5"><i className="fas fa-edit me-2 text-primary"></i> Edit RSVP</Modal.Title>
            </Modal.Header>
            <Modal.Body className="card-body-custom">
                <div className="attendee-info">
                    <h6 className="text-white-50 mb-3 text-uppercase small fw-bold">Attendee Information</h6>
                    <div className="d-flex align-items-center mb-2">
                        <div className="avatar-circle bg-primary bg-opacity-25 text-primary me-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                            {rsvp.fullname.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="fw-bold">{rsvp.fullname}</div>
                            <div className="text-white-50 small">{rsvp.email}</div>
                        </div>
                    </div>
                </div>

                <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <Form.Group className="mb-3">
                        <Form.Label className="form-label text-white-50 small">RSVP Status</Form.Label>
                        <Form.Select className="form-select bg-dark text-white border-secondary" value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="going">Going</option>
                            <option value="interested">Interested</option>
                            <option value="not going">Not Going</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="form-label text-white-50 small">Attendee Category</Form.Label>
                        <Form.Select className="form-select bg-dark text-white border-secondary" value={category} onChange={e => setCategory(e.target.value)}>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <div className="d-flex justify-content-end gap-2">
                        <Button variant="outline-light" onClick={handleClose} disabled={loading}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={loading} className="px-4">
                            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-save me-2"></i>}
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};