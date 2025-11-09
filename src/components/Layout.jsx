// src/components/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNav from './MobileNav';
import BackToTop from './BackToTop';

export default function Layout({ children, user }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar user={user} />
      
      <main style={{ flex: '1 0 auto' }}>
        {children}
      </main>
      
      <Footer />
      <MobileNav />
      <BackToTop />
    </div>
  );
}