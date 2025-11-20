import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const AuthFooter = () => {
    return (
        <footer className="auth-footer">
            <div className="container">
                <div className="row py-4 align-items-center">
                    <div className="col-md-6 text-center text-md-start mb-4 mb-md-0">
                        <Link to="/" className="footer-logo">EventHub</Link>
                        <p className="mb-0 opacity-75">Your gateway to campus life.</p>
                    </div>
                    <div className="col-md-6 text-center text-md-end">
                        <div className="social-icons mb-3">
                            <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
                            <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
                            <a href="#" className="social-icon"><i className="fab fa-facebook"></i></a>
                        </div>
                        <p className="mb-0 small opacity-75">&copy; {new Date().getFullYear()} CampusEventHub. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default AuthFooter;
