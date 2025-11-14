// ...existing code...
import React, { useContext, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../helpers/ToastHelper";
import { AccountContext } from "../../utils/context";
import { createUpdateData } from "../../utils/GlobalQueries"; // adjust import if different

const ResetPasswordModal = () => {
  const { handleFetchData, selectedUser, setSelectedUser } =
    useContext(AccountContext);
  const [errors, setOtherError] = useState({});

  // new state to toggle visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  const passwordRules = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/; // min 8, one uppercase, one symbol

  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string().required("Current password is required"),
    newPassword: Yup.string()
      .matches(
        passwordRules,
        "Password must be at least 8 characters, include an uppercase letter and a symbol"
      )
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("newPassword"), null], "Passwords must match")
      .required("Please confirm the new password"),
  });

  const handleClose = () => {
    const modalElement = document.getElementById("resetPasswordModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
    setShowCurrentPassword(false);
    if (modalInstance) modalInstance.hide();
  };

  // ...existing code...
  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      setShowConfirmPassword(false);
      setShowNewPassword(false);
      setShowCurrentPassword(false);
      if (!selectedUser?.guid) {
        showToast("No user selected", "warning", "Validation");
        return;
      }

      // payload expected by backend (adjust field names if API expects different)
      const payload = {
        current_password: values.currentPassword,
        new_password: values.newPassword,
      };

      const result = await createUpdateData({
        url: "/user/change-password",
        formData: payload,
        isFullPath: true,
      });

      if (result.status === 200 || result.status === 8000) {
        showToast("Password Changed", "success", "Complete");
        // refresh user data if returned
        if (result.data) {
          setSelectedUser(result.data);
        }
        handleClose();
        resetForm();
        if (typeof handleFetchData === "function") handleFetchData();
      } else if (result.status === 8002) {
        // validation errors from backend - keep modal open
        const apiErrors = result.data || {};
        setErrors(apiErrors);
        setOtherError(apiErrors);
        showToast(
          result.message || "Validation failed",
          "warning",
          "Validation"
        );
        // do NOT close modal or reset form so user can correct input
      } else {
        // process failed - keep modal open so user can retry
        showToast(result.message || "Process failed", "warning", "Failed");
        // do NOT close modal or reset form
      }
    } catch (error) {
      console.error("Reset password error:", error);
      // try to extract server validation/errors if available
      const apiErrData = error?.response?.data || null;
      if (apiErrData) {
        setErrors(apiErrData);
        setOtherError(apiErrData);
      }
      showToast(
        "Unable to reset password. Please try again or contact support.",
        "error",
        "Failed"
      );
      // do NOT close modal or reset form on exception
    } finally {
      setSubmitting(false);
    }
  };
  // ...existing code...

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="resetPasswordModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-md" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Reset User Password</h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>

            <Formik
              enableReinitialize
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form>
                  <div className="modal-body">
                    <p className="text-muted">
                      Next time the user logs in, they will need to use this new
                      password.
                    </p>

                    <div className="row">
                      <div className="col mb-3">
                        <label className="form-label">Current Password</label>
                        <div className="input-group">
                          <Field
                            type={showCurrentPassword ? "text" : "password"}
                            name="currentPassword"
                            className="form-control"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() =>
                              setShowCurrentPassword((prev) => !prev)
                            }
                            aria-label={
                              showCurrentPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            <i
                              className={
                                showCurrentPassword
                                  ? "bx bx-hide"
                                  : "bx bx-show"
                              }
                            />
                          </button>
                        </div>
                        <ErrorMessage
                          name="currentPassword"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col mb-3">
                        <label className="form-label">New Password</label>
                        <div className="input-group">
                          <Field
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            className="form-control"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            aria-label={
                              showNewPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            <i
                              className={
                                showNewPassword ? "bx bx-hide" : "bx bx-show"
                              }
                            />
                          </button>
                        </div>
                        <ErrorMessage
                          name="newPassword"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col mb-3">
                        <label className="form-label">
                          Confirm New Password
                        </label>
                        <div className="input-group">
                          <Field
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            className="form-control"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            <i
                              className={
                                showConfirmPassword
                                  ? "bx bx-hide"
                                  : "bx bx-show"
                              }
                            />
                          </button>
                        </div>
                        <ErrorMessage
                          name="confirmPassword"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>

                    {errors.non_field_errors &&
                      errors.non_field_errors.length > 0 && (
                        <div className="text-danger">
                          {errors.non_field_errors.map((err, i) => (
                            <div key={i}>{err}</div>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleClose}
                      className="btn btn-outline-secondary"
                      data-bs-dismiss="modal"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      {isSubmitting ? "Submiting..." : "Change Password"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordModal;
// ...existing code...
