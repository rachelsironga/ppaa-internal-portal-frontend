import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { createMaintenanceRecord, getTechnicians } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

export const MaintenanceRecordModal = ({ assetUid, assetTag, onSuccess, selectedRecord = null }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [technicians, setTechnicians] = useState([]);
    const [loadingTechnicians, setLoadingTechnicians] = useState(false);

    useEffect(() => {
        console.log("MaintenanceRecordModal received assetUid:", assetUid);
        fetchTechnicians();
    }, [assetUid]);

    const fetchTechnicians = async () => {
        setLoadingTechnicians(true);
        try {
            const result = await getTechnicians({ pagination: { paginated: false } });
            if (result.status === 200 || result.status === 8000) {
                setTechnicians(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching technicians:", error);
        } finally {
            setLoadingTechnicians(false);
        }
    };

    const initialValues = {
        asset: assetUid || "",
        maintenance_type: selectedRecord?.maintenance_type || "",
        scheduled_date: selectedRecord?.scheduled_date || "",
        completed_date: selectedRecord?.completed_date || "",
        status: selectedRecord?.status || "scheduled",
        cost: selectedRecord?.cost || "",
        description: selectedRecord?.description || "",
        technician: selectedRecord?.technician || "",
        notes: selectedRecord?.notes || "",
    };

    const validationSchema = Yup.object().shape({
        maintenance_type: Yup.string().required("Maintenance type is required"),
        scheduled_date: Yup.date().required("Scheduled date is required"),
        completed_date: Yup.date().nullable(),
        status: Yup.string().required("Status is required"),
        cost: Yup.number().nullable().positive("Cost must be positive"),
        description: Yup.string().required("Description is required"),
        technician: Yup.string().nullable(),
    });

    const maintenanceTypes = [
        { value: "preventive", label: "Preventive Maintenance" },
        { value: "corrective", label: "Corrective Maintenance" },
        { value: "predictive", label: "Predictive Maintenance" },
        { value: "calibration", label: "Calibration" },
        { value: "inspection", label: "Inspection" },
        { value: "upgrade", label: "Upgrade" },
        { value: "repair", label: "Repair" },
        { value: "cleaning", label: "Cleaning" },
    ];

    const statusOptions = [
        { value: "scheduled", label: "Scheduled" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            console.log("Submitting maintenance record with values:", values);
            
            if (!values.asset || values.asset.trim() === '') {
                showToast("Asset UID is missing. Please close and reopen the modal.", "error", "Validation Error");
                setIsSubmitting(false);
                setSubmitting(false);
                return;
            }
            
            setIsSubmitting(true);
            const result = await createMaintenanceRecord(values);

            if (result.status === 200 || result.status === 8000) {
                showToast("Maintenance Record Created Successfully", "success", "Complete");
                handleClose();
                resetForm();
                if (onSuccess) onSuccess();
            } else if (result.status === 8002) {
                showToast(`${result.message}`, "warning", "Validation Failed");
                console.error("Validation errors:", result.data);
                setErrors(result.data);
            } else {
                showToast(`${result.message}`, "warning", "Process Failed");
            }
        } catch (error) {
            console.error("Maintenance record submission error:", error);
            showToast("Something went wrong", "error", "Failed");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        const modalElement = document.getElementById("maintenanceRecordModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal fade"
            id="maintenanceRecordModal"
            tabIndex="-1"
            aria-labelledby="maintenanceRecordModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="maintenanceRecordModalLabel">
                            <i className="bx bx-wrench me-2"></i>
                            Add Maintenance Record - {assetTag}
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
                        {({ isSubmitting: formikSubmitting, values }) => (
                            <Form>
                                <Field type="hidden" name="asset" />
                                {!assetUid && (
                                    <div className="alert alert-warning mx-3 mt-3">
                                        <i className="bx bx-error-circle me-2"></i>
                                        Asset information not loaded. Please close and try again.
                                    </div>
                                )}
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="maintenance_type" className="form-label">
                                                Maintenance Type <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                as="select"
                                                name="maintenance_type"
                                                className="form-select"
                                            >
                                                <option value="">Select Type</option>
                                                {maintenanceTypes.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage
                                                name="maintenance_type"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="status" className="form-label">
                                                Status <span className="text-danger">*</span>
                                            </label>
                                            <Field as="select" name="status" className="form-select">
                                                {statusOptions.map((status) => (
                                                    <option key={status.value} value={status.value}>
                                                        {status.label}
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage
                                                name="status"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="scheduled_date" className="form-label">
                                                Scheduled Date <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="date"
                                                name="scheduled_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage
                                                name="scheduled_date"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="completed_date" className="form-label">
                                                Completed Date
                                            </label>
                                            <Field
                                                type="date"
                                                name="completed_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage
                                                name="completed_date"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="cost" className="form-label">
                                                Cost (TSH)
                                            </label>
                                            <Field
                                                type="number"
                                                name="cost"
                                                className="form-control"
                                                placeholder="Enter cost"
                                            />
                                            <ErrorMessage
                                                name="cost"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="technician" className="form-label">
                                                Technician
                                            </label>
                                            <Field name="technician">
                                                {({ field, form }) => (
                                                    <select 
                                                        {...field}
                                                        className="form-select"
                                                        onChange={(e) => form.setFieldValue('technician', e.target.value)}
                                                    >
                                                        <option value="">
                                                            {loadingTechnicians ? "Loading technicians..." : "Select technician"}
                                                        </option>
                                                        {technicians.map((tech) => (
                                                            <option key={tech.guid} value={tech.guid}>
                                                                {tech.first_name && tech.last_name 
                                                                    ? `${tech.first_name} ${tech.last_name}` 
                                                                    : tech.email || tech.username}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </Field>
                                        </div>

                                        <div className="col-12 mb-3">
                                            <label htmlFor="description" className="form-label">
                                                Description <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                as="textarea"
                                                name="description"
                                                className="form-control"
                                                rows="3"
                                                placeholder="Describe the maintenance work..."
                                            />
                                            <ErrorMessage
                                                name="description"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-12 mb-3">
                                            <label htmlFor="notes" className="form-label">
                                                Additional Notes
                                            </label>
                                            <Field
                                                as="textarea"
                                                name="notes"
                                                className="form-control"
                                                rows="2"
                                                placeholder="Any additional notes..."
                                            />
                                            <ErrorMessage
                                                name="notes"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>
                                    </div>
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
                                        disabled={formikSubmitting || isSubmitting}
                                    >
                                        {formikSubmitting || isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bx bx-save me-1"></i> Save Record
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
