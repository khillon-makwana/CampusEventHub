import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    icon, 
    className = '', 
    onClick, 
    type = 'button',
    disabled = false,
    isLoading = false
}) => {
    const baseClass = 'btn-ui';
    const classes = `${baseClass} ${baseClass}-${variant} ${baseClass}-${size} ${className}`;

    return (
        <motion.button
            className={classes}
            onClick={onClick}
            type={type}
            disabled={disabled || isLoading}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
            {isLoading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : icon ? (
                <span className="btn-icon">{icon}</span>
            ) : null}
            {children}
        </motion.button>
    );
};

export default Button;
