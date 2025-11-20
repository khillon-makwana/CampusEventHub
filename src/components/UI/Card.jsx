import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

const Card = ({
    children,
    className = '',
    hover = false,
    glass = false,
    padding = 'md',
    onClick
}) => {
    const baseClass = 'card-ui';
    const classes = `
        ${baseClass} 
        ${glass ? 'card-ui-glass' : 'card-ui-surface'} 
        card-ui-p-${padding}
        ${className}
    `;

    const variants = hover ? {
        hover: {
            y: -5,
            boxShadow: 'var(--shadow-xl)',
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
