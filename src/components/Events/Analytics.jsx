// src/components/Events/Analytics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../../api';
import Layout from '../Layout';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './Analytics.css'; // Import the new CSS

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

// --- Reusable Animated Section Wrapper ---
const AnimatedSection = ({ children, className = '', delay = 0.1 }) => {
    const { ref, inView } = useInView({ once: true, amount: 0.1 });
    return (
        <motion.section
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay }}
        >
            {children}
        </motion.section>
    );
};

// --- Reusable Metric Card ---
const MetricCard = ({ title, value, icon, delay = 0 }) => {
    const { ref, inView } = useInView({ once: true, amount: 0.5 });
    return (
        <motion.div
            ref={ref}
            className="analytics-metric-card"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 150, damping: 20, delay: delay * 0.1 }}
        >
            <span className="metric-icon"><i className={`fas ${icon}`}></i></span>
            <h3>{title}</h3>
            <p>{value}</p>
        </motion.div>
    );
}

// --- Main Analytics Component ---
export default function Analytics() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const eventId = searchParams.get('event_id') || 'all';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Use 'id' param for single event, or 'all' for user-wide
                const url = `analytics.php?event_id=${eventId}`;
                const result = await apiGet(url);
                
                if (result.success) {
                    setData(result);
                } else {
                    throw new Error(result.error || 'Failed to load analytics');
                }
            } catch (err) {
                setError(err.message);
                if (err.message.includes('Unauthorized')) {
                    navigate('/my-events');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [eventId, navigate]);

    const handleFilterChange = (e) => {
        const newEventId = e.target.value;
        setSearchParams(newEventId === 'all' ? {} : { event_id: newEventId });
    };

    // --- Chart Data Memoization ---
    const chartData = useMemo(() => {
        if (!data) return null;
        
        const chartColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#11998e', '#38ef7d'];
        const { charts } = data;

        return {
            eventStatus: {
                labels: charts.eventStatus?.map(d => d.status.charAt(0).toUpperCase() + d.status.slice(1)),
                datasets: [{ data: charts.eventStatus?.map(d => d.total), backgroundColor: chartColors }]
            },
            rsvpStatus: {
                labels: charts.rsvpStatus?.map(d => d.status.charAt(0).toUpperCase() + d.status.slice(1)),
                datasets: [{ data: charts.rsvpStatus?.map(d => d.total), backgroundColor: chartColors }]
            },
            revenueOverTime: {
                labels: charts.revenueOverTime?.map(d => d.date),
                datasets: [{
                    label: 'Revenue (Ksh)', data: charts.revenueOverTime?.map(d => d.total),
                    fill: true, borderColor: '#667eea', backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4, pointBackgroundColor: '#667eea', pointRadius: 4
                }]
            },
            ticketsSoldOverTime: {
                labels: charts.ticketsSoldOverTime?.map(d => d.date),
                datasets: [{
                    label: 'Tickets Sold', data: charts.ticketsSoldOverTime?.map(d => d.total),
                    backgroundColor: '#50E3C2', borderRadius: 8
                }]
            },
            topEventsRevenue: {
                labels: charts.topEventsRevenue?.map(d => d.event_title),
                datasets: [{ label: 'Revenue (Ksh)', data: charts.topEventsRevenue?.map(d => d.revenue), backgroundColor: '#764ba2', borderRadius: 8 }]
            },
            ratingDist: {
                labels: charts.ratingDist?.map(d => `${d.rating} Star${d.rating > 1 ? 's' : ''}`),
                datasets: [{ label: 'Total Votes', data: charts.ratingDist?.map(d => d.total), backgroundColor: chartColors, borderRadius: 8 }]
            }
        };
    }, [data]);

    
    if (loading) {
        return (
            <Layout user={data?.user} unread_count={data?.unread_count}>
                <div className="container mt-4 text-center" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                </div>
            </Layout>
        );
    }
    
    if (error) {
        return (
            <Layout user={data?.user} unread_count={data?.unread_count}>
                <div className="container mt-4">
                    <div className="alert alert-danger">{error}</div>
                </div>
            </Layout>
        );
    }

    if (!data) return null;
    
    const { user, unread_count, eventsList, metrics, tables } = data;

    return (
        <Layout user={user} unread_count={unread_count}>
            <div className="analytics-container">
                
                <AnimatedSection className="analytics-header">
                    <h1 className="mb-0">📊 Analytics Dashboard</h1>
                    <p>Comprehensive insights and performance metrics for your events.</p>
                </AnimatedSection>
                
                <AnimatedSection className="filter-section" delay={0.2}>
                    <label htmlFor="eventSelect"><strong>Filter by Event:</strong></label>
                    <select id="eventSelect" className="form-select" value={eventId} onChange={handleFilterChange}>
                        <option value="all">All My Events</option>
                        {eventsList.map(e => (
                            <option key={e.id} value={e.id}>{e.title}</option>
                        ))}
                    </select>
                    <button onClick={() => window.print()}><i className="fas fa-print me-2"></i>Print Report</button>
                </AnimatedSection>
                
                <AnimatedSection className="analytics-metrics" delay={0.3}>
                    <MetricCard title="Total Revenue" value={`KSh ${metrics.totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}`} icon="fa-dollar-sign" delay={0.1} />
                    <MetricCard title="Tickets Sold" value={metrics.totalTicketsSold.toLocaleString()} icon="fa-ticket-alt" delay={0.2} />
                    <MetricCard title="Total Attendees" value={metrics.totalAttendees.toLocaleString()} icon="fa-users" delay={0.3} />
                    <MetricCard title="Average Rating" value={`${metrics.averageRating}/5`} icon="fa-star" delay={0.4} />
                    {eventId === 'all' && (
                        <>
                            <MetricCard title="Total Events" value={metrics.totalEvents.toLocaleString()} icon="fa-calendar" delay={0.5} />
                            <MetricCard title="Total Feedback" value={metrics.totalFeedback.toLocaleString()} icon="fa-comments" delay={0.6} />
                        </>
                    )}
                </AnimatedSection>

                <AnimatedSection className="analytics-charts" delay={0.4}>
                    <div className="analytics-chart-box">
                        <h4>Revenue Trend (30 Days)</h4>
                        <Line data={chartData.revenueOverTime} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                    </div>
                    <div className="analytics-chart-box">
                        <h4>Tickets Sold (30 Days)</h4>
                        <Bar data={chartData.ticketsSoldOverTime} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                    </div>

                    {eventId === 'all' && chartData.topEventsRevenue?.labels.length > 0 && (
                        <div className="analytics-chart-box">
                            <h4>Top 5 Events by Revenue</h4>
                            <Bar data={chartData.topEventsRevenue} options={{ responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }} />
                        </div>
                    )}
                    
                    {chartData.rsvpStatus?.labels.length > 0 && (
                        <div className="analytics-chart-box">
                            <h4>RSVP Status Breakdown</h4>
                            <Doughnut data={chartData.rsvpStatus} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                        </div>
                    )}

                    {eventId === 'all' && chartData.eventStatus?.labels.length > 0 && (
                        <div className="analytics-chart-box">
                            <h4>Event Status Distribution</h4>
                            <Pie data={chartData.eventStatus} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                        </div>
                    )}
                    
                    {chartData.ratingDist?.labels.length > 0 && (
                        <div className="analytics-chart-box">
                            <h4>Rating Distribution</h4>
                            <Bar data={chartData.ratingDist} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                        </div>
                    )}
                </AnimatedSection>

                {tables.recentFeedback.length > 0 && (
                    <AnimatedSection className="analytics-data-table" delay={0.5}>
                        <h4>Recent Customer Feedback</h4>
                        {tables.recentFeedback.map(fb => (
                            <div className="feedback-item" key={fb.created_at}>
                                <div className="stars">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`fas fa-star ${i < fb.rating ? '' : 'text-muted'}`} style={{color: i < fb.rating ? '#f59e0b' : ''}}></i>
                                    ))}
                                </div>
                                <p className="comment">"{fb.comment || 'No comment provided'}"</p>
                                <div className="meta">
                                    <strong>{fb.fullname}</strong> on <strong>{fb.title}</strong>
                                </div>
                            </div>
                        ))}
                    </AnimatedSection>
                )}
            </div>
        </Layout>
    );
}