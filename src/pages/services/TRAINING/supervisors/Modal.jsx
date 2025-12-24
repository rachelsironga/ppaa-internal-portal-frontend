import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import { createSupervisor, updateSupervisor } from "./Queries";

const validationSchema = Yup.object().shape({
    user_guid: Yup.string().required("User GUID is required"),
    department_uid: Yup.string().required("Department UID is required"),
    description: Yup.string().nullable(),
});

export const SupervisorModal = ({ supervisor = null, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});

    useEffect(() => {
        setBackendErrors({});
    }, [supervisor]);

    const initialValues = {
        user_guid: supervisor?.user_guid || "",
        department_uid: supervisor?.department_uid || "",
        description: supervisor?.description || "",
    };

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        setLoading(true);
        setBackendErrors({});

        try {
            const payload = {
                user_guid: values.user_guid,
                department_uid: values.department_uid,
                description: values.description || "",
            };

            let result;
            if (supervisor?.uid) {
                result = await updateSupervisor(supervisor.uid, payload);
                showToast("Supervisor updated successfully", "success", "Complete");
            } else {
                result = await createSupervisor(payload);
                showToast("Supervisor created successfully", "success", "Complete");
            }

            handleClose();
            resetForm();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Error saving supervisor:", err);

            if (err.response?.data?.status === 8002 && err.response?.data?.data) {
                setBackendErrors(err.response.data.data);
                setErrors(err.response.data.data);
                showToast("Please fix validation errors", "error", "Validation Failed");
            } else {
                const errorMessage = err.response?.data?.message || "Failed to save supervisor";
                showToast(errorMessage, "error", "Failed");
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        const modalElement = document.getElementById("supervisorModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        if (onClose) onClose();
    };

    return (
        <div
            className="modal modal-slide-in"
            id="supervisorModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="bx bx-user-check me-2"></i>
                            {supervisor ? "Update Supervisor" : "Create New Supervisor"}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize={true}
                    >
                        {({ isSubmitting, errors, touched, values, setFieldValue }) => (
                            <Form>
                                <div className="modal-body">
                                    <div className="row">
                                        {/* User Select */}
                                        <FormikSelect
                                            name="user_guid"
                                            label="User"
                                            url="/api/auth/users"
                                            isFullPath={true}
                                            staticOptions={[]}
                                            mapOption={(item) => ({
                                                value: item?.guid || item?.id,
                                                label: `${item?.first_name || ''} ${item?.last_name || ''} (${item?.email || ''})`.trim(),
                                                ...item
                                            })}
                                            placeholder="Select User..."
                                            containerClass="col-md-6 mb-3"
                                            onSelectObject={(selected) => {
                                                if (selected) {
                                                    setFieldValue("user_guid", selected?.guid || selected?.id || selected?.value);
                                                }
                                            }}
                                            required={true}
                                        />

                                        {/* Department Select */}
                                        <FormikSelect
                                            name="department_uid"
                                            label="Department"
                                            url="/api/departments"
                                            isFullPath={true}
                                            staticOptions={[]}
                                            mapOption={(item) => ({
                                                value: item?.uid || item?.id,
                                                label: item?.name || '',
                                                ...item
                                            })}
                                            placeholder="Select Department..."
                                            containerClass="col-md-6 mb-3"
                                            onSelectObject={(selected) => {
                                                if (selected) {
                                                    setFieldValue("department_uid", selected?.uid || selected?.id || selected?.value);
                                                }
                                            }}
                                            required={true}
                                        />

                                        {/* Description */}
                                        <div className="col-12 mb-3">
                                            <label className="form-label">Description</label>
                                            <Field
                                                as="textarea"
                                                name="description"
                                                className="form-control"
                                                rows="4"
                                                placeholder="Optional description"
                                            />
                                            <ErrorMessage name="description">
                                                {(msg) => (
                                                    <div className="invalid-feedback d-block">
                                                        {msg}
                                                    </div>
                                                )}
                                            </ErrorMessage>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        data-bs-dismiss="modal"
                                        onClick={handleClose}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || isSubmitting}
                                    >
                                        {loading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>
                                                {supervisor ? "Updating..." : "Creating..."}
                                            </>
                                        ) : supervisor ? (
                                            "Update Supervisor"
                                        ) : (
                                            "Create Supervisor"
                                        )}
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
