import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./page-auth.css";
import { AuthWrapper } from "./AuthWrapper";
import { connect } from "react-redux";
import { login } from "../../redux/actions";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateData } from "../../utils/GlobalQueries";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../Costants";
import showToast from "../../helpers/ToastHelper";
import { loginTypes } from "../../redux/types/authentication";
import { useDispatch } from "react-redux";

const NewUserPage = ({
  isLoading,
  success,
  error,
  data,
  status,
  state,
  login,
  authUser,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const navigation = useNavigate();
  const dispatch = useDispatch();

  const initialValues = {
    username: data?.data?.username || "",
    email: "",
    phone_number: data?.data?.phone_number || "",
    password: "",
    confirm_password: "",
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone_number: Yup.string().required("Phone number is required"),
    password: Yup.string().required("Password is required"),
    confirm_password: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm Password is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (data?.data) {
        values.username = data?.data?.username;
      }

      const result = await createUpdateData({
        url: "/user/new_login",
        formData: values,
        isFullPath: true,
      });

      if (result.status === 200 || result.status === 8000) {
        const { access_token, refresh_token } = result.data;
        const user = result.data.user;

        // Save tokens to localStorage
        localStorage.setItem(ACCESS_TOKEN, access_token);
        localStorage.setItem(REFRESH_TOKEN, refresh_token);

        // Dispatch success action with user data
        dispatch({
          type: loginTypes.LOGIN_SUCCESS,
          payload: { user, access_token, refresh_token },
        });
        console.log("New user login successful, navigating to home.");
        navigation("/");
      } else if (result.status === 8002) {
        showToast(`${result.message}`, "warning", "Validation Failed");
        setErrors(result.data);
        // setOtherError(result.data);
      } else {
        showToast(`${result.message}`, "warning", "Process Failed");
        resetForm();
      }
    } catch (error) {
      console.error("Error during new user login:", error);
      showToast("Something went wrong while saving", "error", "Failed");
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthWrapper title="NewLogin" maxWidth={"550px"}>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, values, setFieldValue, errors }) => (
          <Form autoComplete="off">
            <div className="text-justify m-4">
              Hello and Welcome{" "}
              {data && data?.data && (
                <strong>
                  {data?.data?.first_name}&nbsp;
                  {data?.data?.last_name}&nbsp;
                </strong>
              )}
              To <span className="text-primary">MNH-CONNECT</span>. Please
              Complete the Form for New Password
            </div>

            {/* Email */}
            <div className="row mb-3">
              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <Field
                  type="text"
                  name="email"
                  autoComplete="off"
                  inputprops={{
                    autoComplete: "off",
                    form: { autoComplete: "off" },
                  }}
                  id="email"
                  className="form-control"
                  placeholder="Enter your email"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="invalid-feedback d-block"
                />
              </div>

              {/* Phone */}
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="phone_number">
                  Phone Number
                </label>
                <div className="input-group input-group-merge">
                  <span className="input-group-text text-bold">+255</span>
                  <Field
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    className="form-control"
                    maxLength={9}
                    placeholder="7XX XXX XXX"
                  />
                </div>
                <ErrorMessage
                  name="phone_number"
                  component="div"
                  className="invalid-feedback d-block"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-3 form-password-toggle">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-group input-group-merge">
                <Field
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete="off"
                  inputprops={{
                    autoComplete: "off",
                    form: { autoComplete: "off" },
                  }}
                  className="form-control"
                  placeholder="***********"
                />
                <span
                  className="input-group-text cursor-pointer"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <i className={showPassword ? "bx bx-show" : "bx bx-hide"}></i>
                </span>
              </div>
              <ErrorMessage
                name="password"
                component="div"
                className="invalid-feedback d-block"
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-3 form-password-toggle">
              <label className="form-label" htmlFor="confirm_password">
                Confirm Password
              </label>
              <div className="input-group input-group-merge">
                <Field
                  type={showPassword2 ? "text" : "password"}
                  id="confirm_password"
                  name="confirm_password"
                  className="form-control"
                  placeholder="***********"
                  autoComplete="off"
                  inputprops={{
                    autoComplete: "off",
                    form: { autoComplete: "off" },
                  }}
                />
                <span
                  className="input-group-text cursor-pointer"
                  onClick={() => setShowPassword2((prev) => !prev)}
                >
                  <i
                    className={showPassword2 ? "bx bx-show" : "bx bx-hide"}
                  ></i>
                </span>
              </div>
              <ErrorMessage
                name="confirm_password"
                component="div"
                className="invalid-feedback d-block"
              />
            </div>

            {/* General errors */}
            {errors?.non_field_errors &&
              errors?.non_field_errors.length > 0 && (
                <div className="text-danger">
                  {errors.non_field_errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}

            {error && (
              <div className="alert alert-danger" role="alert">
                {error?.message || "An error occurred. Please try again."}
              </div>
            )}

            <button
              aria-label="Click me"
              className="btn btn-primary d-grid w-100"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </Form>
        )}
      </Formik>

      <div className="flex items-center justify-between mt-3">
        <span style={{ marginRight: "40px" }}>Not a new User?</span>
        <Link
          aria-label="Go to Login Page"
          to="/auth/login"
          className="flex items-center text-primary hover:underline"
        >
          <i className="bx bx-chevron-left scaleX-n1-rtl bx-sm"></i>
          Back to login
        </Link>
      </div>
    </AuthWrapper>
  );
};

const mapStateToProps = (state) => ({
  isLoading: state.loginReducer.isLoading,
  success: state.loginReducer.success,
  error: state.loginReducer.error,
  data: state.loginReducer.data,
  status: state.loginReducer.status,
  authUser: state.userReducer,
});

const mapDispatchToProps = {
  login: login,
};

export default connect(mapStateToProps, mapDispatchToProps)(NewUserPage);
