import React, { useEffect, useState, useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateClinic, getBlocks, getDepartments } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { ClinicContext } from "./ClinicListPage";

export const ClinicModal = () => {
    const { selectedObj, setSelectedObj, setTableRefresh } = useContext(ClinicContext);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [blocks, setBlocks] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loadingBlocks, setLoadingBlocks] = useState(false);
    const [loadingDepartments, setLoadingDepartments] = useState(false);

    useEffect(() => {
        fetchBlocks();
        fetchDepartments();
    }, []);

    const fetchBlocks = async () => {
        setLoadingBlocks(true);
        try {
            const result = await getBlocks({ pagination: { paginated: false } });
            if (result.status === 200 || result.status === 8000) {
                setBlocks(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching blocks:", error);
        } finally {
            setLoadingBlocks(false);
        }
    };

    const fetchDepartments = async () => {
        setLoadingDepartments(true);
        try {
            const result = await getDepartments({ pagination: { paginated: false } });
            if (result.status === 200 || result.status === 8000) {
                setDepartments(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
        } finally {
            setLoadingDepartments(false);
        }
    };

    const initialValues = {
        uid: selectedObj?.uid || "",
        name: selectedObj?.name || "",
        code: selectedObj?.code || "",
        block: selectedObj?.block || selectedObj?.block_details?.uid || "",
        department: selectedObj?.department || selectedObj?.department_details?.uid || "",
        description: selectedObj?.description || "",
        is_active: selectedObj?.is_active ?? true,
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required("Clinic name is required"),
        code: Yup.string().required("Clinic code is required"),
        block: Yup.string().required("Block is required"),
        department: Yup.string().nullable(),
        description: Yup.string().nullable(),
    });

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            setIsSubmitting(true);
            const result = await createUpdateClinic(values);

            if (result.status === 200 || result.status === 8000) {
                showToast(
                    values.uid ? "Clinic Updated Successfully" : "Clinic Created Successfully",
                    "success",
                    "Complete"
                );
                handleClose();
                resetForm();
                setTableRefresh((prev) => prev + 1);
            } else if (result.status === 8002) {
                showToast(`${result.message}`, "warning", "Validation Failed");
                setErrors(result.data);
            } else {
                showToast(`${result.message}`, "warning", "Process Failed");
            }
        } catch (error) {
            console.error("Clinic submission error:", error);
            showToast("Something went wrong", "error", "Failed");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        const modalElement = document.getElementById("clinicModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal fade"
            id="clinicModal"
            tabIndex="-1"
            aria-labelledby="clinicModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="clinicModalLabel">
                            <i className="bx bx-clinic me-2"></i>
                            {selectedObj?.uid ? "Edit Clinic" : "Add New Clinic"}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                            onClick={() => setSelectedObj(null)}
                        ></button>
                    </div>
                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ isSubmitting: formikSubmitting }) => (
                            <Form>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="name" className="form-label">
                                                Clinic Name <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="Enter clinic name"
                                            />
                                            <ErrorMessage
                                                name="name"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="code" className="form-label">
                                                Clinic Code <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="code"
                                                className="form-control"
                                                placeholder="Enter clinic code"
                                            />
                                            <ErrorMessage
                                                name="code"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="block" className="form-label">
                                                Block <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                as="select"
                                                name="block"
                                                className="form-select"
                                            >
                                                <option value="">
                                                    {loadingBlocks ? "Loading blocks..." : "Select Block"}
                                                </option>
                                                {blocks.map((block) => (
                                                    <option key={block.uid} value={block.uid}>
                                                        {block.name} ({block.code})
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage
                                                name="block"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="department" className="form-label">
                                                Department
                                            </label>
                                            <Field
                                                as="select"
                                                name="department"
                                                className="form-select"
                                            >
                                                <option value="">
                                                    {loadingDepartments ? "Loading departments..." : "Select Department"}
                                                </option>
                                                {departments.map((dept) => (
                                                    <option key={dept.uid} value={dept.uid}>
                                                        {dept.name}
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage
                                                name="department"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="is_active" className="form-label">
                                                Status
                                            </label>
                                            <Field name="is_active">
                                                {({ field, form }) => (
                                                    <div className="form-check form-switch mt-2">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            id="is_active"
                                                            checked={field.value}
                                                            onChange={(e) =>
                                                                form.setFieldValue("is_active", e.target.checked)
                                                            }
                                                        />
                                                        <label className="form-check-label" htmlFor="is_active">
                                                            {field.value ? "Active" : "Inactive"}
                                                        </label>
                                                    </div>
                                                )}
                                            </Field>
                                        </div>

                                        <div className="col-12 mb-3">
                                            <label htmlFor="description" className="form-label">
                                                Description
                                            </label>
                                            <Field
                                                as="textarea"
                                                name="description"
                                                className="form-control"
                                                rows="3"
                                                placeholder="Enter clinic description..."
                                            />
                                            <ErrorMessage
                                                name="description"
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
                                        onClick={() => setSelectedObj(null)}
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
                                                <i className="bx bx-save me-1"></i> 
                                                {selectedObj?.uid ? "Update Clinic" : "Save Clinic"}
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
