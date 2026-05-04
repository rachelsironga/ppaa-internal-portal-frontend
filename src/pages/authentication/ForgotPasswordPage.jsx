import { useState } from "react";
import { Link } from "react-router-dom"
import './page-auth.css'
import { AuthWrapper } from "./AuthWrapper";
import api from "../../api";
import Swal from "sweetalert2";

export const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email || !email.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Email Required',
                text: 'Please enter your email address',
            });
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid Email',
                text: 'Please enter a valid email address',
            });
            return;
        }

        setLoading(true);
        try {
            const payload = { email: email.trim() };
            const response = await api.post('/user/forgot-password', payload);
            const res = response?.data;

            // API returns status 8000 and message; data is intentionally null for security (no email enumeration)
            const isSuccess = res?.status === 8000 || response?.status === 200;
            if (isSuccess) {
                setSubmitted(true);
                Swal.fire({
                    icon: 'success',
                    title: 'Email Sent!',
                    text: res?.message || 'If an account exists with this email, a password reset email has been sent.',
                    confirmButtonText: 'OK'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: res?.message || 'Failed to send reset email. Please try again.',
                });
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.data?.email?.[0] ||
                                'Failed to send reset email. Please try again later.';
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };
    return (
        <AuthWrapper>
            {!submitted ? (
                <>
                    <h4 className="mb-2">Forgot Password? 🔒</h4>
                    <p className="mb-4">Enter your email and we'll send you instructions to reset your password</p>
                    <form id="formAuthentication" className="mb-3" onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                value={email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                disabled={loading}
                                autoFocus 
                                required />
                        </div>
                        <button 
                            aria-label='Click me' 
                            className="btn btn-primary d-grid w-100"
                            disabled={loading}
                            type="submit"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>
                    <div className="text-center">
                        <Link aria-label="Go to Login Page" to="/auth/login" className="d-flex align-items-center justify-content-center">
                            <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
                            Back to login
                        </Link>
                    </div>
                </>
            ) : (
                <>
                    <div className="text-center mb-4">
                        <i className="bx bx-check-circle text-success" style={{ fontSize: "4rem" }}></i>
                        <h4 className="mb-2 mt-3">Check Your Email</h4>
                        <p className="mb-4">
                            If an account exists with <strong>{email}</strong>, we've sent a password reset email.
                            Please check your inbox and follow the instructions.
                        </p>
                    </div>
                    <div className="text-center">
                        <Link aria-label="Go to Login Page" to="/auth/login" className="btn btn-primary">
                            <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
                            Back to login
                        </Link>
                    </div>
                    <div className="text-center mt-3">
                        <button 
                            className="btn btn-link text-decoration-none"
                            onClick={() => {
                                setSubmitted(false);
                                setEmail('');
                            }}
                        >
                            Try another email
                        </button>
                    </div>
                </>
            )}
        </AuthWrapper>
    )
}