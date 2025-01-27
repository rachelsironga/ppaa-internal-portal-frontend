import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import './page-auth.css';
import { AuthWrapper } from "./AuthWrapper";
import { connect } from "react-redux";
import { signup } from "../../state-manager/actions/authentication";

const RegisterPage = ({ isLoading, success, msg, status, signup }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        terms: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        signup(formData);
    };

    useEffect(() => {
        if (success) {
            // Handle success, e.g., redirect to login page or show a success message
            console.log("Registration successful!");
        }
    }, [success]);

    return (
        <AuthWrapper>
            <h4 className="mb-2">Create Your New Account 🚀</h4>
            <p className="mb-4">Please Make Sure you give Correct Information</p>

            {msg && (
                <div className="alert alert-danger" role="alert">
                    {typeof msg === "string" ? msg : JSON.stringify(msg)}
                </div>
            )}

            {success && (
                <div className="alert alert-success" role="alert">
                    Registration successful! Please check your email to verify your account.
                </div>
            )}

            <form id="formAuthentication" className="mb-3" onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label htmlFor="first_name" className="form-label">First Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        name="first_name"
                        placeholder="Enter your first name"
                        autoFocus />
                </div>
                <div className="mb-3">
                    <label htmlFor="last_name" className="form-label">Last Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        name="last_name"
                        placeholder="Enter your last name"
                        autoFocus />
                </div>
                <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                        type="text"
                        className="form-control"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        name="email"
                        placeholder="Enter your email" />
                </div>
                <div className="mb-3 form-password-toggle">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div className="input-group input-group-merge">
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-control"
                            name="password"
                            placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                            aria-describedby="password" />
                        <span className="input-group-text cursor-pointer"><i className="bx bx-hide"></i></span>
                    </div>
                </div>

                <div className="mb-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox" id="terms-conditions"
                            name="terms"
                            value={formData.terms}
                            onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="terms-conditions">
                            I agree to
                            <a aria-label="privacy policy and terms" href="#"> privacy policy & terms</a>
                        </label>
                    </div>
                </div>
                <button aria-label='Click me' className="btn btn-primary d-grid w-100" disabled={isLoading}>
                    {isLoading ? 'Signing up...' : 'Sign up'}
                </button>
            </form>

            <p className="text-center">
                <span>Already have an account?</span>
                <Link aria-label="Go to Login Page" to="/auth/login" className="d-flex align-items-center justify-content-center">
                    <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
                    Back to login
                </Link>
            </p>
        </AuthWrapper>
    );
};

const mapStateToProps = (state) => ({
    isLoading: state.signupReducer.isLoading,
    success: state.signupReducer.success,
    msg: state.errorReducer.msg,
    status: state.errorReducer.status,
});

const mapDispatchToProps = {
    signup: signup,
};

export default connect(mapStateToProps, mapDispatchToProps)(RegisterPage);