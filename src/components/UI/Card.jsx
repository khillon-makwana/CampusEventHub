import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

const Card = ({
    children,
    className = '',
    hover = false,
    glass = false,
    holographic = false,
    onClick
}) => {
    // Use the new global utility classes
    const baseClass = glass || holographic ? 'glass-panel' : 'bg-white shadow-sm border';
    const hoverClass = hover ? 'cursor-pointer' : '';

    // Combine classes
    const classes = `
        rounded-4 p-4
        ${baseClass} 
        ${hoverClass}
        ${className}
    `;

    const variants = hover ? {
        hover: {
            y: -8,
            boxShadow: 'var(--shadow-neon)',
            borderColor: 'rgba(124, 58, 237, 0.5)',
            transition: { type: 'spring', stiffness: 300 }
        }
    } : {};

    return (
        <motion.div
            className={classes}
            whileHover={hover ? "hover" : undefined}
            variants={variants}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
};

export default Card;
