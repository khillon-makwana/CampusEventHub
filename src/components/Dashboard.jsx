import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const nav = useNavigate();

  function logout() {
    // You can also clear cookies/session here
    nav('/login');
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to the Dashboard!</h1>
      <p>This is the main area after login.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
