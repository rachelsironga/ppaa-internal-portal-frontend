import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import { createAllocation, updateAllocation } from "./Queries";

const validationSchema = Yup.object().shape({
    application_uid: Yup.string().required("Application is required"),
    department_uid: Yup.string().required("Department is required"),
    supervisor_uid: Yup.string().nullable(),
    start_date: Yup.date().required("Start Date is required"),
    end_date: Yup.date().required("End Date is required"),
    description: Yup.string().nullable(),
});

export const AllocationModal = ({ allocation = null, onSuccess, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [backendErrors, setBackendErrors] = useState({});

    useEffect(() => {
        setBackendErrors({});
    }, [allocation]);

    const initialValues = {
        application_uid: allocation?.application?.uid || allocation?.application_uid || "",
        department_uid: allocation?.department?.uid || allocation?.department_uid || "",
        supervisor_uid: allocation?.supervisor?.uid || allocation?.supervisor_uid || "",
        start_date: allocation?.start_date || "",
        end_date: allocation?.end_date || "",
        description: allocation?.description || "",
    };

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        setLoading(true);
        setBackendErrors({});

        try {
            const payload = {
                application: values.application_uid,
                department: values.department_uid,
                supervisor: values.supervisor_uid || null,
                start_date: values.start_date,
                end_date: values.end_date,
                description: values.description || "",
            };

            let result;
            if (allocation?.uid) {
                result = await updateAllocation(allocation.uid, payload);
                showToast("Allocation updated successfully", "success", "Complete");
            } else {
                result = await createAllocation(payload);
                showToast("Allocation created successfully", "success", "Complete");
            }

            handleClose();
            resetForm();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Error saving allocation:", err);

            if (err.response?.data?.status === 8002 && err.response?.data?.data) {
                setBackendErrors(err.response.data.data);
                setErrors(err.response.data.data);
                showToast("Please fix validation errors", "error", "Validation Failed");
            } else {
                const errorMessage = err.response?.data?.message || "Failed to save allocation";
                showToast(errorMessage, "error", "Failed");
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        const modalElement = document.getElementById("allocationModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
        if (onClose) onClose();
    };

    return (
        <div
            className="modal modal-slide-in"
            id="allocationModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="bx bx-sitemap me-2"></i>
                            {allocation ? "Update Allocation" : "Create New Allocation"}
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
                                        {/* Application Selection */}
                                        <FormikSelect
                                            name="application_uid"
                                            label="Application *"
                                            url="/api/training/applications"
                                            isFullPath={true}
                                            filters={{ page: 1, page_size: 50, paginated: true }}
                                            mapOption={(item) => ({
                                                value: item?.uid,
                                                label: `${item?.student?.first_name} ${item?.student?.last_name} - ${item?.reference_number}`,
                                            })}
                                            placeholder="Select Application..."
                                            containerClass="col-md-12 mb-3"
                                            isRequired={true}
                                            isDisabled={!!allocation}
                                        />

                                        {/* Department Selection */}
                                        <FormikSelect
                                            name="department_uid"
                                            label="Department *"
                                            url="/user/departments"
                                            isFullPath={true}
                                            filters={{ page: 1, page_size: 50, paginated: true }}
                                            mapOption={(item) => ({
                                                value: item?.uid,
                                                label: item?.name,
                                            })}
                                            placeholder="Select Department..."
                                            containerClass="col-md-12 mb-3"
                                            isRequired={true}
                                        />

                                        {/* Supervisor Selection */}
                                        <FormikSelect
                                            name="supervisor_uid"
                                            label="Supervisor"
                                            url="/api/training/supervisors"
                                            isFullPath={true}
                                            filters={{ page: 1, page_size: 50, paginated: true }}
                                            mapOption={(item) => ({
                                                value: item?.uid,
                                                label: item?.user?.full_name || item?.user?.username,
                                            })}
                                            placeholder="Select Supervisor..."
                                            containerClass="col-md-12 mb-3"
                                            isClearable={true}
                                        />

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

                                        {/* Description */}
                                        <div className="col-md-12 mb-3">
                                            <label htmlFor="description" className="form-label">Description</label>
                                            <Field
                                                as="textarea"
                                                name="description"
                                                className="form-control"
                                                placeholder="Enter allocation description..."
                                                rows="4"
                                            />
                                            <ErrorMessage name="description" component="div" className="text-danger" />
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
                                                <i className="bx bx-save me-1"></i> {allocation ? "Update" : "Save"}
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
