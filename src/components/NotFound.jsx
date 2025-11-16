import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const nav = useNavigate();

  return (
    <div style={{ padding: '2rem' }}>
      <h2>404 - Page Not Found</h2>
      <button onClick={() => nav('/dashboard')}>Go to Dashboard</button>
    </div>
  );
}
