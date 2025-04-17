import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import { signup } from "../../redux/actions";
import { AccountWrapper } from "../../components/wrapper/AccountWrapper";

const ChangePasswordPage = ({ isLoading, success, msg, state, signup, user }) => {
    const [formData, setFormData] = useState({
        old_password: "",
        password: "",
        password2: "",
    });

    const navigation = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData)
        signup(formData, navigation);
        console.log('--------------------------------');
        console.log(msg)
    };

    return (
        <AccountWrapper title="Password">
            <div className="row">
                <div className="col-md-8 col-12 mb-md-0 mb-4">
                    <div className="card">
                        <h5 className="card-header">Change Password</h5>
                        <div className="card-body">
                            <p>
                                Please Enter Credential to Change Password
                            </p>
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
                                <div className="form-password-toggle">
                                    <label className="form-label" htmlFor="old_password">
                                        Old Password
                                    </label>
                                    <div className="input-group input-group-merge">
                                        <input
                                            type="password"
                                            id="old_password"
                                            value={formData.old_password}
                                            onChange={handleChange}
                                            className={`form-control ${msg?.old_password ? "is-invalid" : ""}`}
                                            name="old_password"
                                            placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                            aria-describedby="old_password"
                                        />
                                        <span className="input-group-text cursor-pointer">
                                            <i className="bx bx-hide"></i>
                                        </span>
                                    </div>
                                    {msg?.old_password && <div className="invalid-feedback">{msg?.old_password}</div>}

                                </div>

                                <div className="form-password-toggle">
                                    <label className="form-label" htmlFor="password">
                                        New Password
                                    </label>
                                    <div className="input-group input-group-merge">
                                        <input
                                            type="password"
                                            id="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`form-control ${msg?.password ? "is-invalid" : ""}`}
                                            name="password"
                                            placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                            aria-describedby="password"
                                        />
                                        <span className="input-group-text cursor-pointer">
                                            <i className="bx bx-hide"></i>
                                        </span>
                                    </div>
                                    {msg?.password && <div className="invalid-feedback">{msg?.password}</div>}

                                </div>

                                <div className="form-password-toggle">
                                    <label className="form-label" htmlFor="password2">
                                        Confirm Password
                                    </label>
                                    <div className="input-group input-group-merge">
                                        <input
                                            type="password"
                                            id="password2"
                                            value={formData.password2}
                                            onChange={handleChange}
                                            className={`form-control ${msg?.password2 ? "is-invalid" : ""}`}
                                            name="password2"
                                            placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                                            aria-describedby="password"
                                        />
                                        <span className="input-group-text cursor-pointer">
                                            <i className="bx bx-hide"></i>
                                        </span>
                                    </div>
                                    {msg?.password2 && <div className="invalid-feedback">{msg?.password2}</div>}

                                </div>

                                <button
                                    aria-label="Click me"
                                    className="btn btn-primary d-grid w-80 mt-3"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Submiting..." : "Submit"}
                                </button>
                            </form>

                        </div>
                    </div>
                </div>
            </div>
        </AccountWrapper>
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

export default connect(mapStateToProps, mapDispatchToProps)(ChangePasswordPage);
