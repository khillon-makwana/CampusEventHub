import React from 'react';
import { motion } from 'framer-motion';
import './LiquidBackground.css';

const LiquidBackground = () => {
    return (
        <div className="liquid-background-container">
            <div className="liquid-blob blob-1"></div>
            <div className="liquid-blob blob-2"></div>
            <div className="liquid-blob blob-3"></div>
            <div className="liquid-overlay"></div>
        </div>
    );
};

export default LiquidBackground;
