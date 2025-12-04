import React, { useEffect, useState, useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateBlock } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { BlockContext } from "./BlockListPage";

export const BlockModal = () => {
    const { selectedObj, setSelectedObj, setTableRefresh } = useContext(BlockContext);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialValues = {
        uid: selectedObj?.uid || "",
        name: selectedObj?.name || "",
        code: selectedObj?.code || "",
        location: selectedObj?.location || "Upanga",
        description: selectedObj?.description || "",
        is_active: selectedObj?.is_active ?? true,
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required("Block name is required"),
        code: Yup.string().required("Block code is required"),
        location: Yup.string().required("Location is required"),
        description: Yup.string().nullable(),
    });

    const locationOptions = [
        { value: "Upanga", label: "Upanga" },
        { value: "Mloganzila", label: "Mloganzila" },
    ];

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            setIsSubmitting(true);
            const result = await createUpdateBlock(values);

            if (result.status === 200 || result.status === 8000) {
                showToast(
                    values.uid ? "Block Updated Successfully" : "Block Created Successfully",
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
            console.error("Block submission error:", error);
            showToast("Something went wrong", "error", "Failed");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        const modalElement = document.getElementById("blockModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal fade"
            id="blockModal"
            tabIndex="-1"
            aria-labelledby="blockModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="blockModalLabel">
                            <i className="bx bx-building me-2"></i>
                            {selectedObj?.uid ? "Edit Block" : "Add New Block"}
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
                                                Block Name <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="Enter block name"
                                            />
                                            <ErrorMessage
                                                name="name"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="code" className="form-label">
                                                Block Code <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="code"
                                                className="form-control"
                                                placeholder="Enter block code"
                                            />
                                            <ErrorMessage
                                                name="code"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="location" className="form-label">
                                                Location <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                as="select"
                                                name="location"
                                                className="form-select"
                                            >
                                                {locationOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage
                                                name="location"
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
                                                placeholder="Enter block description..."
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
                                                {selectedObj?.uid ? "Update Block" : "Save Block"}
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
