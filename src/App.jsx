// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import VerifyEmail from './components/Auth/VerifyEmail';
import Dashboard from './components/Dashboard/Dashboard';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

import Events from './components/Events/Events'; 
import CreateEvent from './components/Events/CreateEvent';
import EditEvent from './components/Events/EditEvent';
import MyEvents from './components/Events/MyEvents'; 
import EventDetails from './components/Events/EventDetails'; 
//import ManageRsvps from './components/Events/ManageRsvps'; 
//import Profile from './components/Profile/Profile'; 
import MyTickets from './components/Tickets/MyTickets';
import ViewTicket from './components/Tickets/ViewTicket';
//import ManageTickets from './components/Events/ManageTickets';

// --- IMPORT NEW PAYMENT FLOW COMPONENTS ---
import PurchaseTicket from './components/Tickets/PurchaseTicket';
import PaymentStatus from './components/Tickets/PaymentStatus';


function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/create-event" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
        <Route path="/edit-event/:id" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
        <Route path="/event/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
        <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
        {/*<Route path="/manage-rsvps/:id" element={<ProtectedRoute><ManageRsvps /></ProtectedRoute>} /> */}
        {/* <Route path="/manage-tickets/:id" element={<ProtectedRoute><ManageTickets /></ProtectedRoute>} /> */}
        {/* <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /> */}
        <Route path="/tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
        <Route path="/tickets/:id" element={<ProtectedRoute><ViewTicket /></ProtectedRoute>} />
        {/* <Route path="/notifications" element={<ProtectedRoute><ComingSoon page="Notifications" /></ProtectedRoute>} /> */}

        {/* --- NEW PAYMENT FLOW ROUTES --- */}
        <Route 
          path="/purchase/:eventId" 
          element={<ProtectedRoute><PurchaseTicket /></ProtectedRoute>} 
        />
        <Route 
          path="/payment-status/:paymentId" 
          element={<ProtectedRoute><PaymentStatus /></ProtectedRoute>} 
        /> 
        {/* --- END NEW ROUTES --- */}

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

// Temporary placeholder component
function ComingSoon({ page }) {
  return (
    <div style={{ padding: '4rem 0', textAlign: 'center' }}>
      <div className="container">
        <i className="fas fa-tools fa-4x text-primary mb-4"></i>
        <h2>{page} Page</h2>
        <p className="lead">Coming soon! This page is under construction.</p>
        <a href="/dashboard" className="btn btn-primary mt-3">
          <i className="fas fa-home me-2"></i>Back to Dashboard
        </a>
      </div>
    </div>
  );
}

export default App;