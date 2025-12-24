import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { updateTrainingSettings } from "./Queries";

const validationSchema = Yup.object().shape({
    organization_name: Yup.string().required("Organization name is required"),
    student_id_prefix: Yup.string().required("Student ID prefix is required"),
    student_id_format: Yup.string().required("Student ID format is required"),
    reset_student_counter_yearly: Yup.boolean(),
    application_ref_prefix: Yup.string().required("Application reference prefix is required"),
    application_ref_format: Yup.string().required("Application reference format is required"),
    reset_application_counter_yearly: Yup.boolean(),
    certificate_number_prefix: Yup.string().required("Certificate number prefix is required"),
    certificate_number_format: Yup.string().required("Certificate number format is required"),
    reset_certificate_counter_yearly: Yup.boolean(),
    training_hours_per_week: Yup.number().required("Training hours per week is required").min(1),
    training_days_per_week: Yup.number().required("Training days per week is required").min(1).max(7),
    standard_training_duration: Yup.number().required("Standard training duration is required").min(1),
    min_training_days: Yup.number().required("Min training days is required").min(1),
    max_training_days: Yup.number().required("Max training days is required").min(1),
    certificate_validity_years: Yup.number().required("Certificate validity years is required").min(0),
    minimum_attendance_percentage: Yup.number().required("Minimum attendance % is required").min(0).max(100),
    days_before_training_reminder: Yup.number().required("Days before reminder is required").min(0),
    allow_overlapping_departments: Yup.boolean(),
    require_supervisor_approval: Yup.boolean(),
    notify_on_completion: Yup.boolean(),
    is_active: Yup.boolean(),
});

export const TrainingSettingsModal = ({ settings = null, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});

    useEffect(() => {
        setBackendErrors({});
    }, [settings]);

    const initialValues = {
        organization_name: settings?.organization_name || "MNH Training Center",
        student_id_prefix: settings?.student_id_prefix || "STD",
        student_id_format: settings?.student_id_format || "STD-{YYYY}-{NNNN}",
        reset_student_counter_yearly: settings?.reset_student_counter_yearly ?? true,
        application_ref_prefix: settings?.application_ref_prefix || "APP",
        application_ref_format: settings?.application_ref_format || "APP-{YYYY}-{NNNN}",
        reset_application_counter_yearly: settings?.reset_application_counter_yearly ?? true,
        certificate_number_prefix: settings?.certificate_number_prefix || "CERT",
        certificate_number_format: settings?.certificate_number_format || "CERT-{YYYY}-{NNNN}",
        reset_certificate_counter_yearly: settings?.reset_certificate_counter_yearly ?? true,
        training_hours_per_week: settings?.training_hours_per_week || 40,
        training_days_per_week: settings?.training_days_per_week || 5,
        standard_training_duration: settings?.standard_training_duration || 12,
        min_training_days: settings?.min_training_days || 1,
        max_training_days: settings?.max_training_days || 365,
        certificate_validity_years: settings?.certificate_validity_years || 0,
        minimum_attendance_percentage: settings?.minimum_attendance_percentage || 80,
        days_before_training_reminder: settings?.days_before_training_reminder || 7,
        allow_overlapping_departments: settings?.allow_overlapping_departments ?? false,
        require_supervisor_approval: settings?.require_supervisor_approval ?? true,
        notify_on_completion: settings?.notify_on_completion ?? true,
        is_active: settings?.is_active ?? true,
    };

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        setLoading(true);
        setBackendErrors({});

        try {
            const payload = {
                organization_name: values.organization_name,
                student_id_prefix: values.student_id_prefix,
                student_id_format: values.student_id_format,
                reset_student_counter_yearly: values.reset_student_counter_yearly,
                application_ref_prefix: values.application_ref_prefix,
                application_ref_format: values.application_ref_format,
                reset_application_counter_yearly: values.reset_application_counter_yearly,
                certificate_number_prefix: values.certificate_number_prefix,
                certificate_number_format: values.certificate_number_format,
                reset_certificate_counter_yearly: values.reset_certificate_counter_yearly,
                training_hours_per_week: values.training_hours_per_week,
                training_days_per_week: values.training_days_per_week,
                standard_training_duration: values.standard_training_duration,
                min_training_days: values.min_training_days,
                max_training_days: values.max_training_days,
                certificate_validity_years: values.certificate_validity_years,
                minimum_attendance_percentage: values.minimum_attendance_percentage,
                days_before_training_reminder: values.days_before_training_reminder,
                allow_overlapping_departments: values.allow_overlapping_departments,
                require_supervisor_approval: values.require_supervisor_approval,
                notify_on_completion: values.notify_on_completion,
                is_active: values.is_active,
            };

            const result = await updateTrainingSettings(payload);
            showToast("Training settings updated successfully", "success", "Complete");
            handleClose();
            resetForm();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Error saving training settings:", err);

            if (err.response?.data?.status === 8002 && err.response?.data?.data) {
                setBackendErrors(err.response.data.data);
                setErrors(err.response.data.data);
                showToast("Please fix validation errors", "error", "Validation Failed");
            } else {
                const errorMessage = err.response?.data?.message || "Failed to save training settings";
                showToast(errorMessage, "error", "Failed");
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        const modalElement = document.getElementById("trainingSettingsModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        if (onClose) onClose();
    };

    return (
        <div
            className="modal fade"
            id="trainingSettingsModal"
            tabIndex="-1"
            aria-labelledby="trainingSettingsModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold" id="trainingSettingsModalLabel">
                            <i className="bx bx-cog me-2"></i>Training Settings
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
                                <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                                    {/* Organization Section */}
                                    <div className="card mb-3">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Organization</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="mb-3">
                                                <label htmlFor="organization_name" className="form-label">
                                                    Organization Name <span className="text-danger">*</span>
                                                </label>
                                                <Field
                                                    as="input"
                                                    type="text"
                                                    className={`form-control ${
                                                        touched.organization_name && errors.organization_name
                                                            ? "is-invalid"
                                                            : ""
                                                    }`}
                                                    id="organization_name"
                                                    name="organization_name"
                                                />
                                                <ErrorMessage name="organization_name">
                                                    {(msg) => <div className="invalid-feedback d-block">{msg}</div>}
                                                </ErrorMessage>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Student ID Section */}
                                    <div className="card mb-3">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Student ID Configuration</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="student_id_prefix" className="form-label">
                                                        Prefix <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="text"
                                                        className={`form-control ${
                                                            touched.student_id_prefix && errors.student_id_prefix
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="student_id_prefix"
                                                        name="student_id_prefix"
                                                    />
                                                    <ErrorMessage name="student_id_prefix">
                                                        {(msg) => <div className="invalid-feedback d-block">{msg}</div>}
                                                    </ErrorMessage>
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="student_id_format" className="form-label">
                                                        Format <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="text"
                                                        className={`form-control ${
                                                            touched.student_id_format && errors.student_id_format
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="student_id_format"
                                                        name="student_id_format"
                                                    />
                                                    <small className="text-muted">e.g., STD-&#123;YYYY&#125;-&#123;NNNN&#125;</small>
                                                </div>
                                            </div>
                                            <div className="form-check">
                                                <Field
                                                    as="input"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="reset_student_counter_yearly"
                                                    name="reset_student_counter_yearly"
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor="reset_student_counter_yearly"
                                                >
                                                    Reset counter yearly
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Application Reference Section */}
                                    <div className="card mb-3">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Application Reference Configuration</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="application_ref_prefix" className="form-label">
                                                        Prefix <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="text"
                                                        className={`form-control ${
                                                            touched.application_ref_prefix && errors.application_ref_prefix
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="application_ref_prefix"
                                                        name="application_ref_prefix"
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="application_ref_format" className="form-label">
                                                        Format <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="text"
                                                        className={`form-control ${
                                                            touched.application_ref_format && errors.application_ref_format
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="application_ref_format"
                                                        name="application_ref_format"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-check">
                                                <Field
                                                    as="input"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="reset_application_counter_yearly"
                                                    name="reset_application_counter_yearly"
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor="reset_application_counter_yearly"
                                                >
                                                    Reset counter yearly
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Certificate Configuration */}
                                    <div className="card mb-3">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Certificate Configuration</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="certificate_number_prefix" className="form-label">
                                                        Prefix <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="text"
                                                        className={`form-control ${
                                                            touched.certificate_number_prefix && errors.certificate_number_prefix
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="certificate_number_prefix"
                                                        name="certificate_number_prefix"
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="certificate_number_format" className="form-label">
                                                        Format <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="text"
                                                        className={`form-control ${
                                                            touched.certificate_number_format && errors.certificate_number_format
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="certificate_number_format"
                                                        name="certificate_number_format"
                                                    />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="certificate_validity_years" className="form-label">
                                                        Validity (Years) <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="number"
                                                        className={`form-control ${
                                                            touched.certificate_validity_years && errors.certificate_validity_years
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="certificate_validity_years"
                                                        name="certificate_validity_years"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-check">
                                                <Field
                                                    as="input"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="reset_certificate_counter_yearly"
                                                    name="reset_certificate_counter_yearly"
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor="reset_certificate_counter_yearly"
                                                >
                                                    Reset counter yearly
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Training Schedule */}
                                    <div className="card mb-3">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Training Schedule</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="training_hours_per_week" className="form-label">
                                                        Hours Per Week <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="number"
                                                        className={`form-control ${
                                                            touched.training_hours_per_week && errors.training_hours_per_week
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="training_hours_per_week"
                                                        name="training_hours_per_week"
                                                        min="1"
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="training_days_per_week" className="form-label">
                                                        Days Per Week <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="number"
                                                        className={`form-control ${
                                                            touched.training_days_per_week && errors.training_days_per_week
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="training_days_per_week"
                                                        name="training_days_per_week"
                                                        min="1"
                                                        max="7"
                                                    />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-4 mb-3">
                                                    <label htmlFor="standard_training_duration" className="form-label">
                                                        Standard Duration <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="number"
                                                        className={`form-control ${
                                                            touched.standard_training_duration && errors.standard_training_duration
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="standard_training_duration"
                                                        name="standard_training_duration"
                                                        min="1"
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-3">
                                                    <label htmlFor="min_training_days" className="form-label">
                                                        Min Days <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="number"
                                                        className={`form-control ${
                                                            touched.min_training_days && errors.min_training_days
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="min_training_days"
                                                        name="min_training_days"
                                                        min="1"
                                                    />
                                                </div>
                                                <div className="col-md-4 mb-3">
                                                    <label htmlFor="max_training_days" className="form-label">
                                                        Max Days <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="number"
                                                        className={`form-control ${
                                                            touched.max_training_days && errors.max_training_days
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="max_training_days"
                                                        name="max_training_days"
                                                        min="1"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compliance & Notifications */}
                                    <div className="card mb-3">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Compliance & Notifications</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="minimum_attendance_percentage" className="form-label">
                                                        Minimum Attendance % <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="number"
                                                        className={`form-control ${
                                                            touched.minimum_attendance_percentage && errors.minimum_attendance_percentage
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="minimum_attendance_percentage"
                                                        name="minimum_attendance_percentage"
                                                        min="0"
                                                        max="100"
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label htmlFor="days_before_training_reminder" className="form-label">
                                                        Days Before Reminder <span className="text-danger">*</span>
                                                    </label>
                                                    <Field
                                                        as="input"
                                                        type="number"
                                                        className={`form-control ${
                                                            touched.days_before_training_reminder && errors.days_before_training_reminder
                                                                ? "is-invalid"
                                                                : ""
                                                        }`}
                                                        id="days_before_training_reminder"
                                                        name="days_before_training_reminder"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                            <div className="form-check mb-2">
                                                <Field
                                                    as="input"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="require_supervisor_approval"
                                                    name="require_supervisor_approval"
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor="require_supervisor_approval"
                                                >
                                                    Require supervisor approval
                                                </label>
                                            </div>
                                            <div className="form-check mb-2">
                                                <Field
                                                    as="input"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="notify_on_completion"
                                                    name="notify_on_completion"
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor="notify_on_completion"
                                                >
                                                    Notify on completion
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Other Settings */}
                                    <div className="card mb-3">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Other Settings</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="form-check mb-2">
                                                <Field
                                                    as="input"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="allow_overlapping_departments"
                                                    name="allow_overlapping_departments"
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor="allow_overlapping_departments"
                                                >
                                                    Allow overlapping departments
                                                </label>
                                            </div>
                                            <div className="form-check">
                                                <Field
                                                    as="input"
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="is_active"
                                                    name="is_active"
                                                />
                                                <label
                                                    className="form-check-label"
                                                    htmlFor="is_active"
                                                >
                                                    Active
                                                </label>
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
                                                <i className="bx bx-save me-2"></i>Save Settings
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
