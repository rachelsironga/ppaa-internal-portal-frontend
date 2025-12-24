// ...existing code...
import React, { useContext, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { UsersContext } from "../../../../utils/context";
import { User } from "lucide-react";
import { createUpdateData } from "../../../../utils/GlobalQueries";

const AdminChangePasswordModal = () => {
  const { selectedObj, handleFetchData, isModalOpen, setIsModalOpen } =
    useContext(UsersContext);
  const [errors, setOtherError] = useState({});

  // new state to toggle visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const initialValues = {
    uid: selectedObj?.guid || "",
    new_password: "",
    confirm_password: "",
  };

  const passwordRules = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/; // min 8, one uppercase, one symbol

  const validationSchema = Yup.object().shape({
    uid: Yup.string().required("Unable to identify user"),
    new_password: Yup.string()
      .matches(
        passwordRules,
        "Password must be at least 8 characters, include an uppercase letter and a symbol"
      )
      .required("New password is required"),
    confirm_password: Yup.string()
      .oneOf([Yup.ref("new_password"), null], "Passwords must match")
      .required("Please confirm the new password"),
  });

  const handleClose = () => {
    const modalElement = document.getElementById("AdminChangePasswordModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
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
      if (!selectedObj?.guid) {
        showToast("No user selected", "warning", "Validation");
        return;
      }

      // payload expected by backend (adjust field names if API expects different)
      const payload = {
        uid: selectedObj.guid,
        current_password: values.current_password,
        new_password: values.new_password,
      };

      const result = await createUpdateData({
        url: "/user/reset-update-password",
        formData: values,
        isFullPath: true,
      });

      if (result.status === 200 || result.status === 8000) {
        showToast("Password Changed", "success", "Complete");
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
    <div
      className="modal modal-slide-in"
      id="AdminChangePasswordModal"
      tabIndex="-1"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Change{" "}
              {selectedObj
                ? `${selectedObj.first_name} ${selectedObj.last_name}`
                : "User"}{" "}
              Password
            </h5>
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
                      <label className="form-label">New Password</label>
                      <div className="input-group">
                        <Field
                          type={showNewPassword ? "text" : "password"}
                          name="new_password"
                          className="form-control"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          aria-label={
                            showNewPassword ? "Hide password" : "Show password"
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
                        name="new_password"
                        component="div"
                        className="text-danger"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col mb-3">
                      <label className="form-label">Confirm New Password</label>
                      <div className="input-group">
                        <Field
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirm_password"
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
                              showConfirmPassword ? "bx bx-hide" : "bx bx-show"
                            }
                          />
                        </button>
                      </div>
                      <ErrorMessage
                        name="confirm_password"
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
  );
};

export default AdminChangePasswordModal;
// ...existing code...
