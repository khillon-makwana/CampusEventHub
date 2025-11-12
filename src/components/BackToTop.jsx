// src/components/BackToTop.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BackToTop.css'; // Import the new CSS file

export default function BackToTop() {
    const [visible, setVisible] = useState(false);

    // This logic remains the same
    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.pageYOffset > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Animation variants for Framer Motion
    const buttonVariants = {
        hidden: { 
            opacity: 0, 
            y: 50, // Start 50px down
            scale: 0.8 
        },
        visible: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 300, damping: 20 }
        },
        exit: { 
            opacity: 0, 
            y: 50,
            scale: 0.8,
            transition: { duration: 0.2 }
        }
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    className="back-to-top"
                    onClick={scrollToTop}
                    aria-label="Back to top"
                    
                    // Framer Motion animation props
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    
                    // Framer Motion interaction props
                    whileHover={{ 
                        scale: 1.1, 
                        y: -5,
                        rotate: 180,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' // Your hover gradient
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                    <i className="fas fa-chevron-up"></i>
                </motion.button>
            )}
        </AnimatePresence>
    );
}