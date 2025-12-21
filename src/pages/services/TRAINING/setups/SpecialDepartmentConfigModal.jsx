import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import { setSpecialDepartmentConfig } from "./Queries";

const validationSchema = Yup.object().shape({
    department_uid: Yup.string().required("Department is required"),
    config: Yup.object().shape({
        exemption_allowed: Yup.boolean(),
        custom_duration_weeks: Yup.number().nullable(),
        special_requirements: Yup.string().nullable(),
    }),
});

export const SpecialDepartmentConfigModal = ({
    department = null,
    departments = [],
    onSuccess,
    onClose,
}) => {
    const [loading, setLoading] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});

    useEffect(() => {
        setBackendErrors({});
    }, [department]);

    const initialValues = {
        department_uid: department?.uid || "",
        config: {
            exemption_allowed: department?.config?.exemption_allowed || false,
            custom_duration_weeks: department?.config?.custom_duration_weeks || null,
            special_requirements: department?.config?.special_requirements || "",
        },
    };

    const departmentOptions = departments.map((dept) => ({
        value: dept.uid,
        label: dept.name,
    }));

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        setLoading(true);
        setBackendErrors({});

        try {
            const payload = {
                department_uid: values.department_uid,
                config: {
                    exemption_allowed: values.config.exemption_allowed,
                    custom_duration_weeks: values.config.custom_duration_weeks,
                    special_requirements: values.config.special_requirements,
                },
            };

            const result = await setSpecialDepartmentConfig(payload);
            showToast("Special department configuration set successfully", "success", "Complete");
            handleClose();
            resetForm();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Error saving special department config:", err);

            if (err.response?.data?.status === 8002 && err.response?.data?.data) {
                setBackendErrors(err.response.data.data);
                setErrors(err.response.data.data);
                showToast("Please fix validation errors", "error", "Validation Failed");
            } else {
                const errorMessage =
                    err.response?.data?.message || "Failed to save special department configuration";
                showToast(errorMessage, "error", "Failed");
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        const modalElement = document.getElementById("specialDepartmentConfigModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        if (onClose) onClose();
    };

    return (
        <div
            className="modal fade"
            id="specialDepartmentConfigModal"
            tabIndex="-1"
            aria-labelledby="specialDepartmentConfigModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold" id="specialDepartmentConfigModalLabel">
                            <i className="bx bx-adjust me-2"></i>Special Department Configuration
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>
                    </div>

                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ values, errors, touched, isSubmitting, setFieldValue }) => (
                            <Form>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label htmlFor="department_uid" className="form-label">
                                            Department <span className="text-danger">*</span>
                                        </label>
                                        <Field
                                            as="select"
                                            className={`form-control ${
                                                touched.department_uid && errors.department_uid
                                                    ? "is-invalid"
                                                    : ""
                                            }`}
                                            id="department_uid"
                                            name="department_uid"
                                        >
                                            <option value="">-- Select Department --</option>
                                            {departmentOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Field>
                                        <ErrorMessage name="department_uid">
                                            {(msg) => <div className="invalid-feedback d-block">{msg}</div>}
                                        </ErrorMessage>
                                    </div>

                                    <div className="card mb-3">
                                        <div className="card-body">
                                            <h6 className="card-title mb-3">Configuration</h6>

                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Exemption Allowed
                                                </label>
                                                <div className="form-check">
                                                    <Field
                                                        as="input"
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="exemption_allowed"
                                                        name="config.exemption_allowed"
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="exemption_allowed"
                                                    >
                                                        Allow exemptions for this department
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label htmlFor="custom_duration" className="form-label">
                                                    Custom Training Duration (Weeks)
                                                </label>
                                                <Field
                                                    as="input"
                                                    type="number"
                                                    className={`form-control ${
                                                        touched.config?.custom_duration_weeks &&
                                                        errors.config?.custom_duration_weeks
                                                            ? "is-invalid"
                                                            : ""
                                                    }`}
                                                    id="custom_duration"
                                                    name="config.custom_duration_weeks"
                                                    min="1"
                                                    placeholder="Leave empty to use default"
                                                />
                                                <small className="text-muted d-block mt-1">
                                                    Leave empty to use global default
                                                </small>
                                            </div>

                                            <div className="mb-3">
                                                <label htmlFor="special_requirements" className="form-label">
                                                    Special Requirements
                                                </label>
                                                <Field
                                                    as="textarea"
                                                    className={`form-control ${
                                                        touched.config?.special_requirements &&
                                                        errors.config?.special_requirements
                                                            ? "is-invalid"
                                                            : ""
                                                    }`}
                                                    id="special_requirements"
                                                    name="config.special_requirements"
                                                    rows="4"
                                                    placeholder="Describe any special requirements or exceptions for this department"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {Object.keys(backendErrors).length > 0 && (
                                        <div className="alert alert-danger" role="alert">
                                            <strong>Validation Errors:</strong>
                                            <ul className="mb-0 mt-2">
                                                {Object.entries(backendErrors).map(([key, value]) => (
                                                    <li key={key}>
                                                        {key}: {Array.isArray(value) ? value.join(", ") : value}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        data-bs-dismiss="modal"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting || loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span
                                                    className="spinner-border spinner-border-sm me-2"
                                                    role="status"
                                                    aria-hidden="true"
                                                ></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bx bx-save me-2"></i>Save Configuration
                                            </>
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
