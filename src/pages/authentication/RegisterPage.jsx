import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./page-auth.css";
import { AuthWrapper } from "./AuthWrapper";
import { connect } from "react-redux";
import { signup } from "../../redux/actions";
import { use } from "react";

const RegisterPage = ({ isLoading, success, msg, state, signup, user }) => {
    const [formData, setFormData] = useState({
        first_name: "",
        phone_number: "",
        last_name: "",
        email: "",
        password: "",
        account_type: "",
        account_name: "",
        terms: false,
    });

    const navigation = useNavigate();
    const [errors, setErrors] = useState(msg || {});


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));

        setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors[name];
            return newErrors;
        });
    };



    useEffect(() => {
        if (formData.account_type === "Individual") {
            setFormData((prevData) => ({
                ...prevData,
                account_name: prevData.email,
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                account_name: "",
            }));
        }
    }, [formData.account_type, formData.email]);

    useEffect(() => {
        setErrors(msg);
    }, [msg]);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData)
        signup(formData, navigation);
        console.log('--------------------------------');
        console.log(msg);
    };

    return (
        <AuthWrapper title="Register" maxWidth={'550px'}>

            {msg && msg.detail && (
                <div className="alert alert-danger" role="alert">
                    {
                        msg?.detail
                    }
                </div>
            )}

            {success && (
                <div className="alert alert-success" role="alert">
                    Registration successful! Please check your email to verify your
                    account.
                </div>
            )}



            <form id="formAuthentication" className="mb-3" onSubmit={handleSubmit}>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="first_name" className="form-label">First Name</label>
                        <input
                            type="text"
                            className={`form-control ${errors?.first_name ? "is-invalid" : ""}`}
                            id="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            name="first_name"
                            placeholder="Enter your first name"
                            autoFocus
                        />
                        {errors?.first_name && <div className="invalid-feedback">{errors?.first_name}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="last_name" className="form-label">Last Name</label>
                        <input
                            type="text"
                            className={`form-control ${errors?.last_name ? "is-invalid" : ""}`}
                            id="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            name="last_name"
                            placeholder="Enter your last name"
                        />
                        {errors?.last_name && <div className="invalid-feedback">{errors?.last_name}</div>}
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="text"
                            className={`form-control ${errors?.email ? "is-invalid" : ""}`}
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            name="email"
                            placeholder="Enter your email"
                        />
                        {errors?.email && <div className="invalid-feedback">{errors?.email}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label" htmlFor="phone_number">Phone Number</label>
                        <div className="input-group input-group-merge">
                            <span className="input-group-text">TZ (+255)</span>
                            <input
                                type="text"
                                id="phone_number"
                                name="phone_number"
                                className={`form-control ${errors?.phone_number ? "is-invalid" : ""}`}
                                maxLength={9}
                                onChange={handleChange}
                                value={formData.phone_number}
                                placeholder="7XX XXX XXXX"

                            />
                        </div>
                        {errors?.phone_number && <div style={{ width: "100%", marginTop: "0.3rem", fontSize: "85%", color: "var(--bs-form-invalid-color)", }}>{msg?.phone_number}</div>}
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="account_type" className="form-label">Account Type</label>
                        <select
                            id="account_type"
                            name="account_type"
                            className={`form-control ${errors?.account_type ? "is-invalid" : ""}`}
                            value={formData.account_type}
                            onChange={handleChange}
                        >
                            <option value="" style={{ color: "lightgray" }} disabled={'disabled'}>Select Account Type</option>
                            <option value="INDIVIDUAL" >Individual</option>
                            <option value="ORGANIZATION">Organization</option>
                            <option value="COMPANY">Company</option>
                        </select>
                        {errors?.account_type && <div className="invalid-feedback">{errors?.account_type}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="account_name" className="form-label">Company/Organization Name</label>
                        <input
                            type="text"
                            className={`form-control ${errors?.last_name ? "is-invalid" : ""}`}
                            id="account_name"
                            value={formData.account_name}
                            onChange={handleChange}
                            readOnly={formData.account_type === "Individual"}
                            name="account_name"
                            placeholder="Enter your Name"
                        />
                        {errors?.account_name && <div className="invalid-feedback">{errors?.account_name}</div>}
                    </div>
                </div>
                <div className="mb-3 form-password-toggle">
                    <label className="form-label" htmlFor="password">Password</label>
                    <div className="input-group input-group-merge">
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`form-control ${errors?.password ? "is-invalid" : ""}`}
                            name="password"
                            placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                            aria-describedby="password"
                        />
                        <span className="input-group-text cursor-pointer"><i className="bx bx-hide"></i></span>
                    </div>
                    {errors?.password && <div className="invalid-feedback">{errors?.password}</div>}
                </div>
                <div className="mb-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="terms-conditions"
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
                <Link
                    aria-label="Go to Login Page"
                    to="/auth/login"
                    className="d-flex align-items-center justify-content-center"
                >
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
    msg: state.signupReducer.error?.message,
    status: state.errorReducer.status,
    user: state.userReducer,
});

const mapDispatchToProps = {
    signup: signup,
};

export default connect(mapStateToProps, mapDispatchToProps)(RegisterPage);
