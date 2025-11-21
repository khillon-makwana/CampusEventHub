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
    isLoading = false,
    magnetic = false,
    glow = false
}) => {
    const baseClass = 'btn-custom'; // Updated to match index.css
    const variantClass = variant === 'primary' && glow ? 'btn-primary-glow' : `btn-${variant}`;
    const classes = `${baseClass} ${variantClass} ${className}`;

    const ref = React.useRef(null);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!magnetic || disabled) return;
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current.getBoundingClientRect();
        const x = (clientX - (left + width / 2)) * 0.2; // Magnetic pull strength
        const y = (clientY - (top + height / 2)) * 0.2;
        setPosition({ x, y });
    };

    const handleMouseLeave = () => {
        if (!magnetic) return;
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.button
            ref={ref}
            className={classes}
            onClick={onClick}
            type={type}
            disabled={disabled || isLoading}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            animate={magnetic ? { x: position.x, y: position.y } : {}}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
        >
            {isLoading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : icon ? (
                <span className="me-2">{icon}</span>
            ) : null}
            {children}
        </motion.button>
    );
};

export default Button;
