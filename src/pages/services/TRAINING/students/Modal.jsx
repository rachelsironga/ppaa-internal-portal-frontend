import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import { createStudent, updateStudent } from "./Queries";

const validationSchema = Yup.object().shape({
    first_name: Yup.string().required("First name is required").min(2, "Too short"),
    last_name: Yup.string().required("Last name is required").min(2, "Too short"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    primary_phone: Yup.string().required("Phone is required"),
    sex: Yup.string().required("Sex is required"),
    student_id: Yup.string().required("Student ID is required"),
    nationality: Yup.string().nullable(),
    are_you_currently_studying: Yup.boolean(),
    bio: Yup.string().nullable(),
});

export const StudentModal = ({ student = null, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});

    const handleSubmit = async (values, { setSubmitting, setErrors }) => {
        setLoading(true);
        setBackendErrors({});
        
        try {
            let result;
            const formData = new FormData();

            // Prepare form data, skip null/undefined values
            Object.keys(values).forEach(key => {
                if (values[key] !== null && values[key] !== undefined && values[key] !== '') {
                    // For file inputs
                    if (key === 'profile_picture' && values[key] instanceof File) {
                        formData.append(key, values[key]);
                    } else if (key === 'copy_of_id' && values[key] instanceof File) {
                        formData.append(key, values[key]);
                    } else if (key === 'nationality') {
                        // Send as nationality_uid for backend
                        formData.append('nationality_uid', values[key]);
                    } else {
                        formData.append(key, values[key]);
                    }
                }
            });

            if (student?.uid) {
                result = await updateStudent(student.uid, formData);
                showToast("Student updated successfully", "success", "Complete");
            } else {
                result = await createStudent(formData);
                showToast("Student created successfully", "success", "Complete");
            }

            // Close modal programmatically
            const modal = document.getElementById('studentModal');
            if (modal) {
                const bootstrapModal = window.bootstrap.Modal.getInstance(modal);
                if (bootstrapModal) {
                    bootstrapModal.hide();
                }
            }

            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } catch (err) {
            console.error("Error saving student:", err);
            
            // Handle validation errors from backend (status 8002)
            if (err.response?.data?.status === 8002 && err.response?.data?.data) {
                const validationErrors = err.response.data.data;
                setBackendErrors(validationErrors);
                
                // Also set Formik errors for fields that have validation issues
                const formikErrors = {};
                Object.keys(validationErrors).forEach(field => {
                    if (Array.isArray(validationErrors[field])) {
                        formikErrors[field] = validationErrors[field][0];
                    } else {
                        formikErrors[field] = validationErrors[field];
                    }
                });
                setErrors(formikErrors);
                
                showToast("Please fix validation errors", "error", "Validation Failed");
            } else {
                // Handle other errors
                const errorMessage = err.response?.data?.message || "Failed to save student";
                showToast(errorMessage, "error", "Failed");
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const initialValues = student ? {
        ...student,
        // Extract UUID from nationality object if it exists, otherwise use empty string
        nationality: student.nationality?.uid || student.nationality || "",
    } : {
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        primary_phone: "",
        secondary_phone: "",
        sex: "",
        student_id: "",
        id_type: "",
        nationality: "",
        type: "",
        are_you_currently_studying: false,
        bio: "",
        profile_picture: null,
        copy_of_id: null,
    };

    return (
        <div
            className="modal fade"
            id="studentModal"
            tabIndex="-1"
            aria-labelledby="studentModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="studentModalLabel">
                            {student ? "Edit Student" : "Add New Student"}
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
                        {({ isSubmitting, values, setFieldValue, errors, touched }) => (
                            <Form>
                                {/* Backend Validation Errors Alert */}
                                {Object.keys(backendErrors).length > 0 && (
                                    <div className="alert alert-danger alert-dismissible fade show m-3" role="alert">
                                        <strong>Validation Failed:</strong>
                                        <ul className="mb-0 mt-2">
                                            {Object.entries(backendErrors).map(([field, messages]) => (
                                                <li key={field}>
                                                    <strong>{field.replace(/_/g, ' ')}:</strong>{' '}
                                                    {Array.isArray(messages) ? messages.join(', ') : messages}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="modal-body">
                                    <div className="row">
                                        {/* First Name */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">First Name *</label>
                                            <Field
                                                as="input"
                                                type="text"
                                                name="first_name"
                                                className="form-control"
                                                placeholder="John"
                                            />
                                            <ErrorMessage name="first_name" component="small" className="text-danger" />
                                        </div>

                                        {/* Middle Name */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Middle Name</label>
                                            <Field
                                                as="input"
                                                type="text"
                                                name="middle_name"
                                                className="form-control"
                                                placeholder="M."
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        {/* Last Name */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Last Name *</label>
                                            <Field
                                                as="input"
                                                type="text"
                                                name="last_name"
                                                className="form-control"
                                                placeholder="Doe"
                                            />
                                            <ErrorMessage name="last_name" component="small" className="text-danger" />
                                        </div>

                                        {/* Sex */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Sex *</label>
                                            <Field
                                                as="select"
                                                name="sex"
                                                className="form-select"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="M">Male</option>
                                                <option value="F">Female</option>
                                            </Field>
                                            <ErrorMessage name="sex" component="small" className="text-danger" />
                                        </div>
                                    </div>

                                    <div className="row">
                                        {/* Email */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Email *</label>
                                            <Field
                                                as="input"
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                placeholder="gianna@example.com"
                                            />
                                            <ErrorMessage name="email" component="small" className="text-danger" />
                                        </div>

                                        {/* Primary Phone */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Primary Phone *</label>
                                            <Field
                                                as="input"
                                                type="tel"
                                                name="primary_phone"
                                                className="form-control"
                                                placeholder="+255..."
                                            />
                                            <ErrorMessage name="primary_phone" component="small" className="text-danger" />
                                        </div>
                                    </div>

                                    <div className="row">
                                        {/* Secondary Phone */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Secondary Phone</label>
                                            <Field
                                                as="input"
                                                type="tel"
                                                name="secondary_phone"
                                                className="form-control"
                                                placeholder="+255..."
                                            />
                                        </div>

                                        {/* Student ID */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Student ID *</label>
                                            <Field
                                                as="input"
                                                type="text"
                                                name="student_id"
                                                className="form-control"
                                                placeholder="STU-2024-001"
                                            />
                                            <ErrorMessage name="student_id" component="small" className="text-danger" />
                                        </div>
                                    </div>

                                    <div className="row">
                                        {/* ID Type */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">ID Type</label>
                                            <Field
                                                as="select"
                                                name="id_type"
                                                className="form-select"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="P">Passport</option>
                                                <option value="N">National ID</option>
                                                <option value="V">Voter ID</option>
                                                <option value="O">Other</option>
                                            </Field>
                                        </div>

                                        {/* Nationality using FormikSelect */}
                                        <FormikSelect
                                            name="nationality"
                                            label="Nationality"
                                            url="/user/countries"
                                            isFullPath={true}
                                            staticOptions={[]}
                                            mapOption={(item) => ({
                                                value: item?.uid || item?.id,
                                                label: item?.name,
                                                ...item
                                            })}
                                            placeholder="Select Nationality..."
                                            containerClass="col-md-6 mb-3"
                                            onSelectObject={(selected) => {
                                                // Set type based on nationality
                                                if (selected?.name?.toLowerCase() === 'tanzania') {
                                                    setFieldValue('type', 'LC'); // Local
                                                } else if (selected) {
                                                    setFieldValue('type', 'F'); // Foreign
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="row">
                                        {/* Currently Studying */}
                                        <div className="col-md-6 mb-3">
                                            <div className="form-check">
                                                <Field
                                                    as="input"
                                                    type="checkbox"
                                                    name="are_you_currently_studying"
                                                    className="form-check-input"
                                                    id="currentlyStudying"
                                                />
                                                <label className="form-check-label" htmlFor="currentlyStudying">
                                                    Currently Studying
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div className="mb-3">
                                        <label className="form-label">Bio</label>
                                        <Field
                                            as="textarea"
                                            name="bio"
                                            className="form-control"
                                            placeholder="Brief biography... (only letters, numbers, spaces, and -.,!?() allowed)"
                                            rows="3"
                                        />
                                        <small className="text-muted d-block mt-1">
                                            Note: Only letters, numbers, spaces, hyphens, periods, commas, question marks, exclamation marks, and parentheses are allowed.
                                        </small>
                                        <ErrorMessage name="bio" component="small" className="text-danger d-block" />
                                    </div>

                                    {/* Profile Picture */}
                                    <div className="mb-3">
                                        <label className="form-label">Profile Picture</label>
                                        <input
                                            type="file"
                                            name="profile_picture"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.currentTarget.files[0];
                                                if (file) {
                                                    setFieldValue('profile_picture', file);
                                                }
                                            }}
                                        />
                                        <small className="text-muted">Accepted formats: JPG, PNG, GIF</small>
                                    </div>

                                    {/* Copy of ID - Only visible if ID Type is selected */}
                                    {values.id_type && (
                                        <div className="mb-3">
                                            <label className="form-label">ID Document Copy</label>
                                            <input
                                                type="file"
                                                name="copy_of_id"
                                                className="form-control"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    const file = e.currentTarget.files[0];
                                                    if (file) {
                                                        setFieldValue('copy_of_id', file);
                                                    }
                                                }}
                                            />
                                            <small className="text-muted">Accepted formats: PDF, JPG, PNG (max 5MB)</small>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        data-bs-dismiss="modal"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting || loading}
                                    >
                                        {loading ? "Saving..." : "Save Student"}
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
