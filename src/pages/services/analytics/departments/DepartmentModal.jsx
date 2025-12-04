import React, { useEffect, useState, useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateDepartment, getDirectories } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { DepartmentContext } from "./DepartmentsListPage";

export const DepartmentModal = () => {
    const { selectedObj, setSelectedObj, setTableRefresh } = useContext(DepartmentContext);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [directories, setDirectories] = useState([]);
    const [loadingDirectories, setLoadingDirectories] = useState(false);

    useEffect(() => {
        fetchDirectories();
    }, []);

    const fetchDirectories = async () => {
        setLoadingDirectories(true);
        try {
            const result = await getDirectories({ pagination: { paginated: false } });
            if (result.status === 200 || result.status === 8000) {
                setDirectories(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching directories:", error);
        } finally {
            setLoadingDirectories(false);
        }
    };

    const initialValues = {
        uid: selectedObj?.uid || "",
        name: selectedObj?.name || "",
        code: selectedObj?.code || "",
        directory_uid: selectedObj?.directory?.uid || selectedObj?.directory_uid || "",
        description: selectedObj?.description || "",
        is_active: selectedObj?.is_active ?? true,
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required("Department name is required"),
        code: Yup.string().required("Department code is required"),
        directory_uid: Yup.string().required("Directory is required"),
        description: Yup.string().nullable(),
    });

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            setIsSubmitting(true);
            const result = await createUpdateDepartment(values);

            if (result.status === 200 || result.status === 8000) {
                showToast(
                    values.uid ? "Department Updated Successfully" : "Department Created Successfully",
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
            console.error("Department submission error:", error);
            showToast("Something went wrong", "error", "Failed");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        const modalElement = document.getElementById("departmentModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal fade"
            id="departmentModal"
            tabIndex="-1"
            aria-labelledby="departmentModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="departmentModalLabel">
                            <i className="bx bx-buildings me-2"></i>
                            {selectedObj?.uid ? "Edit Department" : "Add New Department"}
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
                                                Department Name <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="Enter department name"
                                            />
                                            <ErrorMessage
                                                name="name"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="code" className="form-label">
                                                Department Code <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="code"
                                                className="form-control"
                                                placeholder="Enter department code"
                                            />
                                            <ErrorMessage
                                                name="code"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="directory_uid" className="form-label">
                                                Directory <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                as="select"
                                                name="directory_uid"
                                                className="form-select"
                                            >
                                                <option value="">
                                                    {loadingDirectories ? "Loading directories..." : "Select Directory"}
                                                </option>
                                                {directories.map((directory) => (
                                                    <option key={directory.uid} value={directory.uid}>
                                                        {directory.name} ({directory.code})
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage
                                                name="directory_uid"
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
                                                placeholder="Enter department description..."
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
                                                {selectedObj?.uid ? "Update Department" : "Save Department"}
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
