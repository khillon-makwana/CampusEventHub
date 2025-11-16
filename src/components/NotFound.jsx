import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const nav = useNavigate();

  return (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    padding: '2rem',
    textAlign: 'center'
  }}>
    <h1 style={{ fontSize: '6rem', margin: '0', color: '#e74c3c', fontWeight: '300' }}>404</h1>
    <h2 style={{ margin: '1rem 0', color: '#2c3e50' }}>Page Not Found</h2>
    <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
    <button 
      onClick={() => nav('/dashboard')}
      style={{
        background: '#3498db',
        color: 'white',
        border: 'none',
        padding: '12px 30px',
        borderRadius: '25px',
        fontSize: '1rem',
        cursor: 'pointer'
      }}
    >
      Go to Dashboard
    </button>
  </div>
);
}
