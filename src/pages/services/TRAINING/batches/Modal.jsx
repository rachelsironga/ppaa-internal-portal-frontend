import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import { createTrainingBatch, updateTrainingBatch } from "./Queries";

const validationSchema = Yup.object().shape({
    mou_uid: Yup.string().required("MOU is required"),
    number_of_students: Yup.number()
        .required("Number of students is required")
        .min(1, "Number of students must be at least 1"),
    departments: Yup.array()
        .min(1, "At least one department is required")
        .required("Departments are required"),
    invoiced_amount: Yup.number()
        .required("Invoiced amount is required")
        .min(0, "Amount must be greater than or equal to 0"),
    currency_uid: Yup.string().required("Currency is required"),
    training_start_date: Yup.date().required("Training start date is required"),
    training_end_date: Yup.date()
        .required("Training end date is required")
        .min(Yup.ref("training_start_date"), "End date must be after start date"),
    application_letter: Yup.mixed().required("Application letter is required"),
    status: Yup.string().required("Status is required"),
    notes: Yup.string().nullable(),
});

export const TrainingBatchModal = ({ batch = null, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});
    const [selectedDepartments, setSelectedDepartments] = useState([]);

    useEffect(() => {
        setBackendErrors({});
        if (batch?.departments) {
            setSelectedDepartments(batch.departments.map(d => d.uid || d.id));
        } else {
            setSelectedDepartments([]);
        }
    }, [batch]);

    const initialValues = {
        mou_uid: batch?.mou?.uid || batch?.mou_uid || "",
        number_of_students: batch?.number_of_students || 1,
        departments: batch?.departments?.map(d => d.uid || d.id) || [],
        invoiced_amount: batch?.invoiced_amount || 0,
        currency_uid: batch?.currency?.uid || batch?.currency_uid || "",
        training_start_date: batch?.training_start_date ? batch.training_start_date.split('T')[0] : "",
        training_end_date: batch?.training_end_date ? batch.training_end_date.split('T')[0] : "",
        application_letter: null,
        status: batch?.status || "planned",
        notes: batch?.notes || "",
    };

    const statusOptions = [
        { value: "planned", label: "Planned" },
        { value: "ongoing", label: "Ongoing" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        setLoading(true);
        setBackendErrors({});

        try {
            const formData = new FormData();
            formData.append("mou", values.mou_uid);
            formData.append("number_of_students", values.number_of_students);
            formData.append("invoiced_amount", values.invoiced_amount);
            formData.append("currency", values.currency_uid);
            formData.append("training_start_date", values.training_start_date);
            formData.append("training_end_date", values.training_end_date);
            formData.append("status", values.status);
            formData.append("notes", values.notes || "");

            // Add departments
            values.departments.forEach((dept) => {
                formData.append("departments", dept);
            });

            // Add application letter only if it's a new file
            if (values.application_letter && values.application_letter instanceof File) {
                formData.append("application_letter", values.application_letter);
            }

            let result;
            if (batch?.uid) {
                result = await updateTrainingBatch(batch.uid, formData);
                showToast("Training batch updated successfully", "success", "Complete");
            } else {
                result = await createTrainingBatch(formData);
                showToast("Training batch created successfully", "success", "Complete");
            }

            handleClose();
            resetForm();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Error saving training batch:", err);

            if (err.response?.data?.status === 8002 && err.response?.data?.data) {
                setBackendErrors(err.response.data.data);
                setErrors(err.response.data.data);
                showToast("Please fix validation errors", "error", "Validation Failed");
            } else {
                const errorMessage = err.response?.data?.message || "Failed to save training batch";
                showToast(errorMessage, "error", "Failed");
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        const modalElement = document.getElementById("trainingBatchModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        if (onClose) onClose();
    };

    return (
        <div
            className="modal modal-slide-in"
            id="trainingBatchModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="bx bx-group me-2"></i>
                            {batch ? "Update Training Batch" : "Create New Training Batch"}
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
                        {({ isSubmitting, setSubmitting, values, resetForm, setErrors, setFieldValue }) => (
                            <Form>
                                <div className="modal-body">
                                    <div className="row text-start">
                                        {/* MOU */}
                                        <FormikSelect
                                            name="mou_uid"
                                            label="MOU *"
                                            url="/api/training/mous"
                                            isFullPath={true}
                                            filters={{ page: 1, page_size: 100, paginated: true }}
                                            mapOption={(item) => ({
                                                value: item?.uid,
                                                label: `${item?.mou_number} - ${item?.institution?.name}`,
                                            })}
                                            placeholder="Select MOU..."
                                            containerClass="col-md-6 mb-3"
                                            isRequired={true}
                                        />

                                        {/* Number of Students */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="number_of_students" className="form-label">Number of Students *</label>
                                            <Field
                                                type="number"
                                                name="number_of_students"
                                                className="form-control"
                                                placeholder="Enter number of students..."
                                                min="1"
                                            />
                                            <ErrorMessage name="number_of_students" component="div" className="text-danger" />
                                        </div>

                                        {/* Departments */}
                                        <FormikSelect
                                            name="departments"
                                            label="Departments *"
                                            url="/api/auth/departments"
                                            isFullPath={true}
                                            filters={{ page: 1, page_size: 100, paginated: true }}
                                            mapOption={(item) => ({
                                                value: item?.uid || item?.id,
                                                label: item?.name,
                                            })}
                                            placeholder="Select Departments..."
                                            containerClass="col-md-12 mb-3"
                                            isRequired={true}
                                            isMulti={true}
                                            value={values.departments}
                                            onChange={(option) => {
                                                const selectedValues = option ? option.map(opt => opt.value) : [];
                                                setFieldValue("departments", selectedValues);
                                            }}
                                        />

                                        {/* Invoiced Amount */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="invoiced_amount" className="form-label">Invoiced Amount *</label>
                                            <Field
                                                type="number"
                                                name="invoiced_amount"
                                                className="form-control"
                                                placeholder="Enter invoiced amount..."
                                                step="0.01"
                                                min="0"
                                            />
                                            <ErrorMessage name="invoiced_amount" component="div" className="text-danger" />
                                        </div>

                                        {/* Currency */}
                                        <FormikSelect
                                            name="currency_uid"
                                            label="Currency *"
                                            url="/api/auth/currencies"
                                            isFullPath={true}
                                            filters={{ page: 1, page_size: 50, paginated: true }}
                                            mapOption={(item) => ({
                                                value: item?.uid || item?.id,
                                                label: item?.code,
                                            })}
                                            placeholder="Select Currency..."
                                            containerClass="col-md-6 mb-3"
                                            isRequired={true}
                                        />

                                        {/* Training Start Date */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="training_start_date" className="form-label">Training Start Date *</label>
                                            <Field
                                                type="date"
                                                name="training_start_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage name="training_start_date" component="div" className="text-danger" />
                                        </div>

                                        {/* Training End Date */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="training_end_date" className="form-label">Training End Date *</label>
                                            <Field
                                                type="date"
                                                name="training_end_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage name="training_end_date" component="div" className="text-danger" />
                                        </div>

                                        {/* Application Letter */}
                                        <div className="col-md-12 mb-3">
                                            <label htmlFor="application_letter" className="form-label">Application Letter {!batch && "*"}</label>
                                            <input
                                                type="file"
                                                name="application_letter"
                                                className="form-control"
                                                onChange={(e) => {
                                                    const file = e.currentTarget.files[0];
                                                    setFieldValue("application_letter", file);
                                                }}
                                                accept=".pdf,.doc,.docx"
                                            />
                                            <small className="text-muted">PDF or Word document</small>
                                            {batch && batch.application_letter && (
                                                <div className="mt-2">
                                                    <small className="text-success">
                                                        <i className="bx bx-check"></i> Document uploaded
                                                    </small>
                                                </div>
                                            )}
                                            <ErrorMessage name="application_letter" component="div" className="text-danger" />
                                        </div>

                                        {/* Status */}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="status" className="form-label">Status *</label>
                                            <Field as="select" name="status" className="form-select">
                                                <option value="">-- Select --</option>
                                                {statusOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </Field>
                                            <ErrorMessage name="status" component="div" className="text-danger" />
                                        </div>

                                        {/* Notes */}
                                        <div className="col-md-12 mb-3">
                                            <label htmlFor="notes" className="form-label">Notes</label>
                                            <Field
                                                as="textarea"
                                                name="notes"
                                                className="form-control"
                                                placeholder="Enter additional notes..."
                                                rows="3"
                                            />
                                            <ErrorMessage name="notes" component="div" className="text-danger" />
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
                                                <i className="bx bx-save me-1"></i> {batch ? "Update" : "Save"}
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
