// src/components/Events/Analytics.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiGet } from '../../api';
import Layout from '../Layout';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './Analytics.css';

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

// Chart Options
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { color: '#e2e8f0', font: { family: "'Inter', sans-serif" } }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
        }
    },
    scales: {
        x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
        },
        y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
        }
    }
};

// --- Reusable Animated Section Wrapper ---
const AnimatedSection = ({ children, className = '', delay = 0.1 }) => {
    const { ref, inView } = useInView({ once: true, amount: 0.1 });
    return (
        <motion.section
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 20 }}
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
            initial={{ opacity: 0, scale: 0.9 }}
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

        const chartColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'];
        const { charts } = data;

        return {
            eventStatus: {
                labels: charts.eventStatus?.map(d => d.status.charAt(0).toUpperCase() + d.status.slice(1)),
                datasets: [{
                    data: charts.eventStatus?.map(d => d.total),
                    backgroundColor: chartColors,
                    borderWidth: 0
                }]
            },
            rsvpStatus: {
                labels: charts.rsvpStatus?.map(d => d.status.charAt(0).toUpperCase() + d.status.slice(1)),
                datasets: [{
                    data: charts.rsvpStatus?.map(d => d.total),
                    backgroundColor: chartColors,
                    borderWidth: 0
                }]
            },
            revenueOverTime: {
                labels: charts.revenueOverTime?.map(d => d.date),
                datasets: [{
                    label: 'Revenue (Ksh)',
                    data: charts.revenueOverTime?.map(d => d.total),
                    fill: true,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 4,
                    borderWidth: 2
                }]
            },
            ticketsSoldOverTime: {
                labels: charts.ticketsSoldOverTime?.map(d => d.date),
                datasets: [{
                    label: 'Tickets Sold',
                    data: charts.ticketsSoldOverTime?.map(d => d.total),
                    backgroundColor: '#10b981',
                    borderRadius: 6
                }]
            },
            topEventsRevenue: {
                labels: charts.topEventsRevenue?.map(d => d.event_title),
                datasets: [{
                    label: 'Revenue (Ksh)',
                    data: charts.topEventsRevenue?.map(d => d.revenue),
                    backgroundColor: '#8b5cf6',
                    borderRadius: 6
                }]
            },
            ratingDist: {
                labels: charts.ratingDist?.map(d => `${d.rating} Star${d.rating > 1 ? 's' : ''}`),
                datasets: [{
                    label: 'Total Votes',
                    data: charts.ratingDist?.map(d => d.total),
                    backgroundColor: chartColors,
                    borderRadius: 6
                }]
            }
        };
    }, [data]);


    if (loading) {
        return (
            <Layout>
                <div className="container text-center py-5" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="container py-5">
                    <div className="alert alert-danger shadow-sm rounded-3">{error}</div>
                </div>
            </Layout>
        );
    }

    if (!data) return <Layout />;

    const { user, unread_count, eventsList, metrics, tables } = data;

    return (
        <Layout user={user} unread_count={unread_count}>
            <div className="container mt-4 analytics-container">

                <AnimatedSection className="analytics-header no-print">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Analytics Dashboard
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Comprehensive insights and performance metrics for your events.
                    </motion.p>
                </AnimatedSection>

                <AnimatedSection className="filter-section no-print" delay={0.2}>
                    <label htmlFor="eventSelect">Filter by Event:</label>
                    <select id="eventSelect" className="form-select" value={eventId} onChange={handleFilterChange}>
                        <option value="all">All My Events</option>
                        {eventsList.map(e => (
                            <option key={e.id} value={e.id}>{e.title}</option>
                        ))}
                    </select>
                    <button className="btn-print" onClick={() => window.print()}>
                        <i className="fas fa-print"></i> Print Report
                    </button>
                </AnimatedSection>

                <AnimatedSection className="analytics-metrics" delay={0.3}>
                    <MetricCard title="Total Revenue" value={`KSh ${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon="fa-dollar-sign" delay={0.1} />
                    <MetricCard title="Tickets Sold" value={metrics.totalTicketsSold.toLocaleString()} icon="fa-ticket-alt" delay={0.2} />
                    <MetricCard title="Total Attendees" value={metrics.totalAttendees.toLocaleString()} icon="fa-users" delay={0.3} />
                    <MetricCard title="Average Rating" value={`${Number(metrics.averageRating).toFixed(1)}/5`} icon="fa-star" delay={0.4} />
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
                        <div style={{ height: '300px' }}>
                            <Line data={chartData.revenueOverTime} options={commonOptions} />
                        </div>
                    </div>
                    <div className="analytics-chart-box">
                        <h4>Tickets Sold (30 Days)</h4>
                        <div style={{ height: '300px' }}>
                            <Bar data={chartData.ticketsSoldOverTime} options={commonOptions} />
                        </div>
                    </div>

                    {eventId === 'all' && chartData.topEventsRevenue?.labels.length > 0 && (
                        <div className="analytics-chart-box">
                            <h4>Top 5 Events by Revenue</h4>
                            <div style={{ height: '300px' }}>
                                <Bar data={chartData.topEventsRevenue} options={{ ...commonOptions, indexAxis: 'y' }} />
                            </div>
                        </div>
                    )}

                    {chartData.rsvpStatus?.labels.length > 0 && (
                        <div className="analytics-chart-box">
                            <h4>RSVP Status Breakdown</h4>
                            <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                <Doughnut data={chartData.rsvpStatus} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'right', labels: { color: '#9ca3af' } } } }} />
                            </div>
                        </div>
                    )}

                    {eventId === 'all' && chartData.eventStatus?.labels.length > 0 && (
                        <div className="analytics-chart-box">
                            <h4>Event Status Distribution</h4>
                            <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                <Pie data={chartData.eventStatus} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'right', labels: { color: '#9ca3af' } } } }} />
                            </div>
                        </div>
                    )}

                    {chartData.ratingDist?.labels.length > 0 && (
                        <div className="analytics-chart-box">
                            <h4>Rating Distribution</h4>
                            <div style={{ height: '300px' }}>
                                <Bar data={chartData.ratingDist} options={commonOptions} />
                            </div>
                        </div>
                    )}
                </AnimatedSection>

                {tables.recentFeedback.length > 0 && (
                    <AnimatedSection className="analytics-data-table" delay={0.5}>
                        <h4>Recent Customer Feedback</h4>
                        <div className="feedback-list">
                            {tables.recentFeedback.map(fb => (
                                <div className="feedback-item" key={fb.created_at}>
                                    <div className="feedback-header">
                                        <div className="feedback-stars">
                                            {[...Array(5)].map((_, i) => (
                                                <i key={i} className={`fas fa-star ${i < fb.rating ? '' : 'text-muted'}`} style={{ opacity: i < fb.rating ? 1 : 0.3 }}></i>
                                            ))}
                                        </div>
                                        <span className="feedback-event">{fb.title}</span>
                                    </div>
                                    <p className="feedback-comment">"{fb.comment || 'No comment provided'}"</p>
                                    <div className="feedback-meta">
                                        <i className="fas fa-user"></i> {fb.fullname}
                                        <span className="mx-2">•</span>
                                        <i className="far fa-clock"></i> {new Date(fb.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AnimatedSection>
                )}
            </div>
        </Layout>
    );
}