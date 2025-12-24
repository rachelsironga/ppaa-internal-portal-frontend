import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import { createInstitution, updateInstitution } from "./Queries";

const validationSchema = Yup.object().shape({
    name: Yup.string().required("Institution name is required").min(2, "Name must be at least 2 characters"),
    institution_code: Yup.string().required("Institution code is required"),
    institution_type: Yup.string().required("Institution type is required"),
    country_uid: Yup.string().required("Country is required"),
    contact_person: Yup.string().required("Contact person is required"),
    contact_email: Yup.string().email("Valid email is required").required("Email is required"),
    contact_phone: Yup.string().required("Phone is required"),
    address: Yup.string().required("Address is required"),
    website: Yup.string().nullable(),
    established_date: Yup.date().nullable(),
});

export const InstitutionModal = ({ institution = null, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});

    useEffect(() => {
        setBackendErrors({});
    }, [institution]);

    const initialValues = {
        name: institution?.name || "",
        institution_code: institution?.institution_code || "",
        institution_type: institution?.institution_type || "",
        country_uid: institution?.country?.uid || institution?.country_uid || "",
        contact_person: institution?.contact_person || "",
        contact_email: institution?.contact_email || "",
        contact_phone: institution?.contact_phone || "",
        address: institution?.address || "",
        website: institution?.website || "",
        established_date: institution?.established_date || "",
    };

    const institutionTypes = [
        { value: "university", label: "University" },
        { value: "college", label: "College" },
        { value: "polytechnic", label: "Polytechnic" },
        { value: "school", label: "School" },
        { value: "other", label: "Other" },
    ];

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        setLoading(true);
        setBackendErrors({});

        try {
            const payload = {
                name: values.name,
                institution_code: values.institution_code,
                institution_type: values.institution_type,
                country: values.country_uid,
                contact_person: values.contact_person,
                contact_email: values.contact_email,
                contact_phone: values.contact_phone,
                address: values.address,
                website: values.website || null,
                established_date: values.established_date || null,
            };

            let result;
            if (institution?.uid) {
                result = await updateInstitution(institution.uid, payload);
                showToast("Institution updated successfully", "success", "Complete");
            } else {
                result = await createInstitution(payload);
                showToast("Institution created successfully", "success", "Complete");
            }

            handleClose();
            resetForm();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Error saving institution:", err);

            if (err.response?.data?.status === 8002 && err.response?.data?.data) {
                setBackendErrors(err.response.data.data);
                setErrors(err.response.data.data);
                showToast("Please fix validation errors", "error", "Validation Failed");
            } else {
                const errorMessage = err.response?.data?.message || "Failed to save institution";
                showToast(errorMessage, "error", "Failed");
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        const modalElement = document.getElementById("institutionModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        if (onClose) onClose();
    };

    return (
        <div
            className="modal modal-slide-in"
            id="institutionModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="bx bx-building me-2"></i>
                            {institution ? "Update Institution" : "Create New Institution"}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>
                    </div>

                    <Formik
                        enableReinitialize
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ isSubmitting, setSubmitting, values, resetForm, setErrors }) => (
                            <Form>
                                <div className="modal-body">
                                    <div className="row text-start">
                                        {/* Name */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="name" className="form-label">Institution Name *</label>
                                            <Field
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="Enter institution name..."
                                            />
                                            <ErrorMessage name="name" component="div" className="text-danger" />
                                        </div>

                                        {/* Code */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="institution_code" className="form-label">Code *</label>
                                            <Field
                                                type="text"
                                                name="institution_code"
                                                className="form-control"
                                                placeholder="e.g., INST-001"
                                            />
                                            <ErrorMessage name="institution_code" component="div" className="text-danger" />
                                        </div>

                                        {/* Type */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="institution_type" className="form-label">Type *</label>
                                            <Field as="select" name="institution_type" className="form-select">
                                                <option value="">-- Select --</option>
                                                {institutionTypes.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </Field>
                                            <ErrorMessage name="institution_type" component="div" className="text-danger" />
                                        </div>

                                        {/* Country */}
                                        <FormikSelect
                                            name="country_uid"
                                            label="Country *"
                                            url="/api/auth/countries"
                                            isFullPath={true}
                                            filters={{ page: 1, page_size: 50, paginated: true }}
                                            mapOption={(item) => ({
                                                value: item?.uid,
                                                label: item?.name,
                                            })}
                                            placeholder="Select Country..."
                                            containerClass="col-md-6 mb-3"
                                            isRequired={true}
                                        />

                                        {/* Contact Person */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="contact_person" className="form-label">Contact Person *</label>
                                            <Field
                                                type="text"
                                                name="contact_person"
                                                className="form-control"
                                                placeholder="Enter contact person name..."
                                            />
                                            <ErrorMessage name="contact_person" component="div" className="text-danger" />
                                        </div>

                                        {/* Email */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="contact_email" className="form-label">Email *</label>
                                            <Field
                                                type="email"
                                                name="contact_email"
                                                className="form-control"
                                                placeholder="e.g., info@institution.com"
                                            />
                                            <ErrorMessage name="contact_email" component="div" className="text-danger" />
                                        </div>

                                        {/* Phone */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="contact_phone" className="form-label">Phone *</label>
                                            <Field
                                                type="tel"
                                                name="contact_phone"
                                                className="form-control"
                                                placeholder="Enter phone number..."
                                            />
                                            <ErrorMessage name="contact_phone" component="div" className="text-danger" />
                                        </div>

                                        {/* Address */}
                                        <div className="col-md-12 mb-3">
                                            <label htmlFor="address" className="form-label">Address *</label>
                                            <Field
                                                as="textarea"
                                                name="address"
                                                className="form-control"
                                                placeholder="Enter institution address..."
                                                rows="3"
                                            />
                                            <ErrorMessage name="address" component="div" className="text-danger" />
                                        </div>

                                        {/* Website */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="website" className="form-label">Website</label>
                                            <Field
                                                type="url"
                                                name="website"
                                                className="form-control"
                                                placeholder="e.g., https://institution.com"
                                            />
                                            <ErrorMessage name="website" component="div" className="text-danger" />
                                        </div>

                                        {/* Established Date */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="established_date" className="form-label">Established Date</label>
                                            <Field
                                                type="date"
                                                name="established_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage name="established_date" component="div" className="text-danger" />
                                        </div>
                                    </div>

                                    {backendErrors && Object.keys(backendErrors).length > 0 && (
                                        <div className="alert alert-danger">
                                            {Object.entries(backendErrors).map(([field, messages]) => (
                                                <div key={field}>
                                                    <strong>{field.replace(/_/g, ' ')}:</strong>{" "}
                                                    {Array.isArray(messages) ? messages.join(', ') : messages}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={handleClose}
                                        data-bs-dismiss="modal"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting || loading}
                                    >
                                        {isSubmitting || loading ? (
                                            <>
                                                <i className="bx bx-loader-alt bx-spin me-1"></i> Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bx bx-save me-1"></i> {institution ? "Update" : "Save"}
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
