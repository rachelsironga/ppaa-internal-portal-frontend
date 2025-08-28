import { useState } from "react";
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom";
import './page-auth.css'
import { AuthWrapper } from "./AuthWrapper";
import { connect } from "react-redux";
import { login } from "../../redux/actions"




const LoginPage = ({ isLoading, success, error, status, state, login, authUser }) => {
    const [formData, setFormData] = useState({
        password: '',
        username: '',
        rememberMe: false,
    });

    const [isloading, setIsLoading] = useState(true);
      const [showPassword, setShowPassword] = useState(false);

      const navigate = useNavigate();

      const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prevData) => ({
          ...prevData,
          [name]: type === "checkbox" ? checked : value,
        }));
      };

      const handleSubmit = (e) => {
        e.preventDefault();
        login(formData, navigate);
      };

      return (
        <AuthWrapper>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error?.message || "An error occurred. Please try again."}
            </div>
          )}

          <form
            id="formAuthentication"
            className="mb-3"
            onSubmit={handleSubmit}
          >
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                required="required"
                value={formData.name}
                onChange={handleChange}
                name="username"
                placeholder="Enter your username"
                autoFocus
              />
            </div>
            <div className="mb-3 form-password-toggle">
              <div className="d-flex justify-content-between">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <Link
                  aria-label="Go to Forgot Password Page"
                  to="/auth/forgot-password"
                >
                  <small>Forgot Password?</small>
                </Link>
              </div>
              <div className="input-group input-group-merge">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="true"
                  id="password"
                  required="required"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-control"
                  name="password"
                  placeholder="&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;&#xb7;"
                  aria-describedby="password"
                />
                <span
                  className="input-group-text cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <i className={showPassword ? "bx bx-show" : "bx bx-hide"}></i>
                </span>{" "}
              </div>
            </div>
            {error?.message && (
              <div className="invalid-feedback">{error?.message}</div>
            )}{" "}
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="remember-me"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="remember-me">
                  {" "}
                  Remember Me{" "}
                </label>
              </div>
            </div>
            <div className="mb-3">
              <button
                aria-label="Click me"
                className="btn btn-primary d-grid w-100"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>

          {/* <p className="text-center">
                <span>New on our platform? </span>
                <Link aria-label="Go to Register Page" to='/auth/register' className="registration-link">
                    <span>Create an account</span>
                </Link>
            </p> */}
        </AuthWrapper>
      );
}

const mapStateToProps = (state) => ({
    isLoading: state.loginReducer.isLoading,
    success: state.loginReducer.success,
    error: state.loginReducer.error,
    status: state.loginReducer.status,
    authUser: state.userReducer,
});

const mapDispatchToProps = {
    login: login,
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginPage);