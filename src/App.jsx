// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
import ManageRsvps from './components/Events/ManageRsvps';
import Profile from './components/Profile/Profile';
import MyTickets from './components/Tickets/MyTickets';
import ViewTicket from './components/Tickets/ViewTicket';
import ManageTickets from './components/Events/ManageTickets';
import Notifications from './components/Notifications/Notifications';
import NotificationSettings from './components/Notifications/NotificationSettings';
import PurchaseTicket from './components/Tickets/PurchaseTicket';
import PaymentStatus from './components/Tickets/PaymentStatus';
import LandingPage from './components/Landing/LandingPage';
import Analytics from './components/Events/Analytics';

// Page Transition Wrapper
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-100"
    >
      {children}
    </motion.div>
  );
};

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><PageTransition><Events /></PageTransition></ProtectedRoute>} />
        <Route path="/create-event" element={<ProtectedRoute><PageTransition><CreateEvent /></PageTransition></ProtectedRoute>} />
        <Route path="/edit-event/:id" element={<ProtectedRoute><PageTransition><EditEvent /></PageTransition></ProtectedRoute>} />
        <Route path="/event/:id" element={<ProtectedRoute><PageTransition><EventDetails /></PageTransition></ProtectedRoute>} />
        <Route path="/my-events" element={<ProtectedRoute><PageTransition><MyEvents /></PageTransition></ProtectedRoute>} />
        <Route path="/manage-rsvps/:id" element={<ProtectedRoute><PageTransition><ManageRsvps /></PageTransition></ProtectedRoute>} />
        <Route path="/manage-tickets/:id" element={<ProtectedRoute><PageTransition><ManageTickets /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute><PageTransition><MyTickets /></PageTransition></ProtectedRoute>} />
        <Route path="/tickets/:id" element={<ProtectedRoute><PageTransition><ViewTicket /></PageTransition></ProtectedRoute>} />

        <Route
          path="/purchase/:eventId"
          element={<ProtectedRoute><PageTransition><PurchaseTicket /></PageTransition></ProtectedRoute>}
        />
        <Route
          path="/payment-status/:paymentId"
          element={<ProtectedRoute><PageTransition><PaymentStatus /></PageTransition></ProtectedRoute>}
        />
        <Route
          path="/notifications"
          element={<ProtectedRoute><PageTransition><Notifications /></PageTransition></ProtectedRoute>}
        />
        <Route
          path="/notification-settings"
          element={<ProtectedRoute><PageTransition><NotificationSettings /></PageTransition></ProtectedRoute>}
        />
        <Route
          path="/analytics"
          element={<ProtectedRoute><PageTransition><Analytics /></PageTransition></ProtectedRoute>}
        />
        <Route
          path="/analytics/:id"
          element={<ProtectedRoute><PageTransition><Analytics /></PageTransition></ProtectedRoute>}
        />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;