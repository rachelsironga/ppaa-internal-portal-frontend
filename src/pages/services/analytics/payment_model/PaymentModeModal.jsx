import React, { useState, useContext } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdatePaymentMode } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { PaymentModeContext } from "./PaymentModeListPage";

export const PaymentModeModal = () => {
    const { selectedObj, setSelectedObj, setTableRefresh } = useContext(PaymentModeContext);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialValues = {
        uid: selectedObj?.uid || "",
        name: selectedObj?.name || "",
        code: selectedObj?.code || "",
        description: selectedObj?.description || "",
        is_active: selectedObj?.is_active ?? true,
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required("Payment mode name is required"),
        code: Yup.string().required("Payment mode code is required"),
        description: Yup.string().nullable(),
    });

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            setIsSubmitting(true);
            const result = await createUpdatePaymentMode(values);

            if (result.status === 200 || result.status === 8000) {
                showToast(
                    values.uid ? "Payment Mode Updated Successfully" : "Payment Mode Created Successfully",
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
            console.error("Payment mode submission error:", error);
            showToast("Something went wrong", "error", "Failed");
        } finally {
            setIsSubmitting(false);
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        const modalElement = document.getElementById("paymentModeModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal fade"
            id="paymentModeModal"
            tabIndex="-1"
            aria-labelledby="paymentModeModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="paymentModeModalLabel">
                            <i className="bx bx-credit-card me-2"></i>
                            {selectedObj?.uid ? "Edit Payment Mode" : "Add New Payment Mode"}
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
                                                Payment Mode Name <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="e.g., Cash, Insurance, NHIF"
                                            />
                                            <ErrorMessage
                                                name="name"
                                                component="div"
                                                className="text-danger small"
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="code" className="form-label">
                                                Payment Mode Code <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="code"
                                                className="form-control"
                                                placeholder="e.g., CASH, INS, NHIF"
                                            />
                                            <ErrorMessage
                                                name="code"
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
                                                placeholder="Enter payment mode description..."
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
                                                {selectedObj?.uid ? "Update Payment Mode" : "Save Payment Mode"}
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
