import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import { createMOU, updateMOU } from "./Queries";

const validationSchema = Yup.object().shape({
    institution_uid: Yup.string().required("Institution is required"),
    start_date: Yup.date().required("Start Date is required"),
    end_date: Yup.date()
        .required("End Date is required")
        .min(Yup.ref('start_date'), "End date must be after start date"),
    purpose: Yup.string().required("Purpose is required"),
    terms_and_conditions: Yup.string().required("Terms and Conditions are required"),
    signed_by: Yup.string().required("Signed By is required"),
    signed_date: Yup.date().required("Signed Date is required"),
    document: Yup.mixed().nullable(),
});

export const MOUModal = ({ mou = null, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});

    useEffect(() => {
        setBackendErrors({});
    }, [mou]);

    const initialValues = {
        institution_uid: mou?.institution?.uid || mou?.institution_uid || "",
        start_date: mou?.start_date || "",
        end_date: mou?.end_date || "",
        purpose: mou?.purpose || "",
        terms_and_conditions: mou?.terms_and_conditions || "",
        signed_by: mou?.signed_by || "",
        signed_date: mou?.signed_date || "",
        document: null,
    };

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        setLoading(true);
        setBackendErrors({});

        try {
            const formData = new FormData();
            formData.append("institution", values.institution_uid);
            formData.append("start_date", values.start_date);
            formData.append("end_date", values.end_date);
            formData.append("purpose", values.purpose);
            formData.append("terms_and_conditions", values.terms_and_conditions);
            formData.append("signed_by", values.signed_by);
            formData.append("signed_date", values.signed_date);
            
            if (values.document) {
                formData.append("document", values.document);
            }

            let result;
            if (mou?.uid) {
                result = await updateMOU(mou.uid, formData);
                showToast("MOU updated successfully", "success", "Complete");
            } else {
                result = await createMOU(formData);
                showToast("MOU created successfully", "success", "Complete");
            }

            handleClose();
            resetForm();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Error saving MOU:", err);

            if (err.response?.data?.status === 8002 && err.response?.data?.data) {
                setBackendErrors(err.response.data.data);
                setErrors(err.response.data.data);
                showToast("Please fix validation errors", "error", "Validation Failed");
            } else {
                const errorMessage = err.response?.data?.message || "Failed to save MOU";
                showToast(errorMessage, "error", "Failed");
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        const modalElement = document.getElementById("mouModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        if (onClose) onClose();
    };

    return (
        <div
            className="modal modal-slide-in"
            id="mouModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="bx bx-file-doc me-2"></i>
                            {mou ? "Update MOU" : "Create New MOU"}
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
                        {({ isSubmitting, setSubmitting, values, setFieldValue, resetForm, setErrors }) => (
                            <Form>
                                <div className="modal-body">
                                    <div className="row text-start">
                                        {/* Institution Selection */}
                                        <FormikSelect
                                            name="institution_uid"
                                            label="Institution *"
                                            url="/api/training/institutions"
                                            isFullPath={true}
                                            filters={{ page: 1, page_size: 50, paginated: true }}
                                            mapOption={(item) => ({
                                                value: item?.uid,
                                                label: item?.name,
                                            })}
                                            placeholder="Select Institution..."
                                            containerClass="col-md-12 mb-3"
                                            isRequired={true}
                                            isDisabled={!!mou}
                                        />

                                        {/* Purpose */}
                                        <div className="col-md-12 mb-3">
                                            <label htmlFor="purpose" className="form-label">Purpose *</label>
                                            <Field
                                                as="textarea"
                                                name="purpose"
                                                className="form-control"
                                                placeholder="Enter MOU purpose..."
                                                rows="3"
                                            />
                                            <ErrorMessage name="purpose" component="div" className="text-danger" />
                                        </div>

                                        {/* Date Fields */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="start_date" className="form-label">Start Date *</label>
                                            <Field
                                                type="date"
                                                name="start_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage name="start_date" component="div" className="text-danger" />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="end_date" className="form-label">End Date *</label>
                                            <Field
                                                type="date"
                                                name="end_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage name="end_date" component="div" className="text-danger" />
                                        </div>

                                        {/* Signed Information */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="signed_by" className="form-label">Signed By *</label>
                                            <Field
                                                type="text"
                                                name="signed_by"
                                                className="form-control"
                                                placeholder="Person name who signed the MOU"
                                            />
                                            <ErrorMessage name="signed_by" component="div" className="text-danger" />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="signed_date" className="form-label">Signed Date *</label>
                                            <Field
                                                type="date"
                                                name="signed_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage name="signed_date" component="div" className="text-danger" />
                                        </div>

                                        {/* Terms and Conditions */}
                                        <div className="col-md-12 mb-3">
                                            <label htmlFor="terms_and_conditions" className="form-label">Terms and Conditions *</label>
                                            <Field
                                                as="textarea"
                                                name="terms_and_conditions"
                                                className="form-control"
                                                placeholder="Enter MOU terms and conditions..."
                                                rows="4"
                                            />
                                            <ErrorMessage name="terms_and_conditions" component="div" className="text-danger" />
                                        </div>

                                        {/* Document Upload */}
                                        <div className="col-md-12 mb-3">
                                            <label htmlFor="document" className="form-label">MOU Document</label>
                                            <input
                                                type="file"
                                                name="document"
                                                className="form-control"
                                                onChange={(e) => setFieldValue("document", e.currentTarget.files[0])}
                                                accept=".pdf,.doc,.docx"
                                            />
                                            <small className="text-muted">Accepted formats: PDF, DOC, DOCX</small>
                                            <ErrorMessage name="document" component="div" className="text-danger" />
                                            {mou?.document && (
                                                <div className="mt-2">
                                                    <small className="text-info">Current document: <a href={mou.document} target="_blank" rel="noreferrer">View</a></small>
                                                </div>
                                            )}
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
                                                <i className="bx bx-save me-1"></i> {mou ? "Update" : "Save"}
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
