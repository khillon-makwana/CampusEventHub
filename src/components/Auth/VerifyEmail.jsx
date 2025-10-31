import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');

  const status = success === '1'
    ? 'Email verified successfully!'
    : success === '0'
      ? 'Invalid or expired verification code'
      : 'Missing verification code';

  return (
    <div className="container py-5 text-center">
      <h3>{status}</h3>
      <p>
        You can now <Link to="/login">login</Link> to your account.
      </p>
    </div>
  );
}
