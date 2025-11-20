import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { createSupportTicket, updateSupportTicket, getUsers } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

export const SupportTicketModal = ({ assetUid, assetTag, onSuccess, selectedTicket = null }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const isEditMode = !!selectedTicket;

    useEffect(() => {
        console.log("SupportTicketModal received assetUid:", assetUid);
        console.log("SupportTicketModal selectedTicket:", selectedTicket);
        fetchUsers();
    }, [assetUid, selectedTicket]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            console.log('Fetching users/custodians for technician assignment...');
            const result = await getUsers({});
            console.log('Users result:', result);
            if (result.status === 200 || result.status === 8000) {
                const userData = result.data || [];
                // Convert object to array if needed
                const usersArray = Array.isArray(userData) ? userData : Object.values(userData);
                console.log('Users data (converted to array):', usersArray);
                setUsers(usersArray);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const initialValues = {
        asset: selectedTicket?.asset || assetUid || "",
        issue_description: selectedTicket?.issue_description || "",
        priority: selectedTicket?.priority || "medium",
        status: selectedTicket?.status || "open",
        assigned_technician: selectedTicket?.assigned_technician || "",
        resolution_notes: selectedTicket?.resolution_notes || "",
    };

    const validationSchema = Yup.object().shape({
        asset: Yup.string().required("Asset is required").min(1, "Asset is required"),
        issue_description: Yup.string().required("Issue description is required").min(1, "Issue description is required"),
        priority: Yup.string().required("Priority is required"),
        status: Yup.string().required("Status is required"),
        assigned_technician: Yup.string().nullable(),
        resolution_notes: Yup.string().when('status', {
            is: (val) => val === 'resolved' || val === 'closed',
            then: (schema) => schema.required("Resolution notes are required when ticket is resolved or closed"),
            otherwise: (schema) => schema.nullable(),
        }),
    });

    const priorityOptions = [
        { value: "low", label: "Low", icon: "📘", color: "info" },
        { value: "medium", label: "Medium", icon: "📙", color: "warning" },
        { value: "high", label: "High", icon: "📕", color: "danger" },
        { value: "critical", label: "Critical", icon: "🚨", color: "danger" },
    ];

    const statusOptions = [
        { value: "open", label: "Open", icon: "🔓", color: "primary" },
        { value: "in_progress", label: "In Progress", icon: "⚙️", color: "info" },
        { value: "resolved", label: "Resolved", icon: "✅", color: "success" },
        { value: "closed", label: "Closed", icon: "🔒", color: "secondary" },
    ];

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            console.log("Submitting support ticket with values:", values);
            console.log("Current assetUid prop:", assetUid);

            setIsSubmitting(true);

            // Ensure asset field is not empty
            if (!values.asset || values.asset.trim() === '') {
                showToast("Asset information is missing. Please close and reopen the modal.", "error", "Validation Error");
                console.error("Asset field is empty. assetUid prop:", assetUid);
                setIsSubmitting(false);
                setSubmitting(false);
                return;
            }

            // Ensure issue_description is not empty
            if (!values.issue_description || values.issue_description.trim() === '') {
                showToast("Issue description is required", "error", "Validation Error");
                setIsSubmitting(false);
                setSubmitting(false);
                return;
            }

            const result = isEditMode
                ? await updateSupportTicket(selectedTicket.uid, values)
                : await createSupportTicket(values);

            if (result.status === 200 || result.status === 8000) {
                showToast(
                    `Support Ticket ${isEditMode ? 'Updated' : 'Created'} Successfully`,
                    "success",
                    "Complete"
                );
                if (onSuccess) onSuccess();
                resetForm();
                handleClose();
            } else if (result.status === 8002) {
                showToast(`${result.message}`, "warning", "Validation Failed");
                console.error("Validation errors:", result.data);
                setErrors(result.data);
                // Don't close modal on validation error
            } else {
                showToast(`${result.message}`, "warning", "Process Failed");
                // Don't close modal on error
            }
        } catch (error) {
            console.error("Support ticket submission error:", error);
            showToast("Something went wrong", "error", "Failed");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        const modalElement = document.getElementById("supportTicketModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal fade"
            id="supportTicketModal"
            tabIndex="-1"
            aria-labelledby="supportTicketModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title" id="supportTicketModalLabel">
                            <i className="bx bx-support me-2"></i>
                            {isEditMode ? 'Update' : 'Create'} Support Ticket - {assetTag}
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
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
                                {isEditMode && <Field type="hidden" name="issue_description" />}
                                {!assetUid && !isEditMode && (
                                    <div className="alert alert-warning mx-3 mt-3">
                                        <i className="bx bx-error-circle me-2"></i>
                                        Asset information not loaded. Please close and try again.
                                    </div>
                                )}
                                <div className="modal-body">
                                    <div className="row">
                                        {!isEditMode && (
                                            <div className="col-12 mb-3">
                                                <label htmlFor="issue_description" className="form-label">
                                                    Issue Description <span className="text-danger">*</span>
                                                </label>
                                                <Field
                                                    as="textarea"
                                                    name="issue_description"
                                                    className="form-control"
                                                    rows="4"
                                                    placeholder="Describe the issue in detail..."
                                                />
                                                <ErrorMessage
                                                    name="issue_description"
                                                    component="div"
                                                    className="text-danger small"
                                                />
                                            </div>
                                        )}

                                        {isEditMode && (
                                            <div className="col-12 mb-3">
                                                <div className="alert alert-info">
                                                    <strong>Issue:</strong> {selectedTicket?.issue_description}
                                                </div>
                                            </div>
                                        )}

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="priority" className="form-label">
                                                Priority <span className="text-danger">*</span>
                                            </label>
                                            <Field as="select" name="priority" className="form-select">
                                                {priorityOptions.map((priority) => (
                                                    <option key={priority.value} value={priority.value}>
                                                        {priority.icon} {priority.label}
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage
                                                name="priority"
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
                                                        {status.icon} {status.label}
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage
                                                name="status"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-12 mb-3">
                                            <label htmlFor="assigned_technician" className="form-label">
                                                <i className="bx bx-user-check me-1 text-primary"></i>
                                                Assigned Technician
                                            </label>
                                            <FormikSelect
                                                name="assigned_technician"
                                                options={users}
                                                getOptionLabel={(option) => option.first_name && option.last_name
                                                    ? `${option.first_name} ${option.last_name}`
                                                    : option.email || option.username
                                                }
                                                getOptionValue={(option) => option.guid || option.user || option.id || option.uid}
                                                placeholder={loadingUsers ? "Loading users..." : "Select technician to assign"}
                                                isClearable
                                                isLoading={loadingUsers}
                                            />
                                            <small className="text-muted d-block mt-1">
                                                <i className="bx bx-info-circle me-1"></i>
                                                Assign a user/technician to handle this support ticket (leave empty to assign later)
                                            </small>
                                        </div>

                                        {(isEditMode || values.status === 'resolved' || values.status === 'closed') && (
                                            <div className="col-12 mb-3">
                                                <label htmlFor="resolution_notes" className="form-label">
                                                    Resolution Notes {(values.status === 'resolved' || values.status === 'closed') && <span className="text-danger">*</span>}
                                                </label>
                                                <Field
                                                    as="textarea"
                                                    name="resolution_notes"
                                                    className="form-control"
                                                    rows="3"
                                                    placeholder="Describe how the issue was resolved..."
                                                />
                                                <ErrorMessage
                                                    name="resolution_notes"
                                                    component="div"
                                                    className="text-danger small"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Priority Guide */}
                                    <div className="alert alert-light border mt-3">
                                        <h6 className="alert-heading mb-2">
                                            <i className="bx bx-info-circle me-1"></i>
                                            Priority Guidelines:
                                        </h6>
                                        <ul className="mb-0 small">
                                            <li><strong>Low:</strong> Minor issues, non-urgent</li>
                                            <li><strong>Medium:</strong> Important but not blocking work</li>
                                            <li><strong>High:</strong> Affecting productivity, needs attention</li>
                                            <li><strong>Critical:</strong> System down, immediate action required</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        data-bs-dismiss="modal"
                                    >
                                        <i className="bx bx-x me-1"></i> Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={formikSubmitting || isSubmitting}
                                    >
                                        {formikSubmitting || isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                {isEditMode ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <i className="bx bx-save me-1"></i>
                                                {isEditMode ? 'Update Ticket' : 'Create Ticket'}
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
