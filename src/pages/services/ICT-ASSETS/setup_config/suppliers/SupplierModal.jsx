import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateSupplier } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { SupplierContext } from "../../../../../utils/context";

export const SupplierModal = ({ loadOnlyModal = false }) => {
    const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } = useContext(SupplierContext);
    const [errors, setOtherError] = useState({});

    useEffect(() => {
        setOtherError({});
    }, [selectedObj]);

    const initialValues = {
        name: selectedObj?.name || "",
        contact_email: selectedObj?.contact_email || "",
        support_phone: selectedObj?.support_phone || "",
        website: selectedObj?.website || "",
        is_active: selectedObj?.is_active ?? true,
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string()
          .required("Supplier name is required"),
      
        contact_email: Yup.string()
          .email("Invalid email format")
          .nullable(),

        support_phone: Yup.string()
          .matches(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone (8-15 digits, optional +)")
          .nullable(),
      
        website: Yup.string()
          .url("Invalid website URL")
          .nullable(),
      
        is_active: Yup.boolean(),
      
        description: Yup.string().nullable(),
      });
      

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            const submitData = { ...values };

            if (selectedObj) {
                submitData.uid = selectedObj.uid;
            }

            setSubmitting(true);
            const result = await createUpdateSupplier(submitData);

            if (result.status === 200 || result.status === 8000) {
                showToast(`Supplier ${selectedObj ? 'Updated' : 'Created'} Successfully`, "success", "success");
                handleClose();
                resetForm();
                setTableRefresh((prev) => prev + 1);
            } else if (result.status === 8002) {
                showToast(result.message || "Validation Failed", "warning", "warning");
                setErrors(result.data);
                setOtherError(result.data);
            } else {
                showToast(result.message || "Process Failed", "warning", "warning");
            }
        } catch (error) {
            console.error("Supplier submission error:", error);
            showToast("Something went wrong while saving supplier", "error", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        const modalElement = document.getElementById("suppliersModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal modal-slide-in fade"
            id="suppliersModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header text-white">
                        <h5 className="modal-title">
                            <i className="bx bx-store me-2"></i>
                            {selectedObj ? "Update Supplier" : "Create New Supplier"}
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
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
                        {({
                            isSubmitting,
                            values,
                            setFieldValue,
                        }) => (
                            <Form>
                                <div className="modal-body">
                                    <div className="row d-flex text-start mb-3">
                                        <div className="col-12 col-lg-6 mb-3">
                                            <label htmlFor="name" className="form-label">
                                                Supplier Name <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="e.g., Supplier Name"
                                            />
                                            <ErrorMessage name="name" component="div" className="text-danger small mt-1" />
                                        </div>
                                        <div className="col-12 col-lg-6 mb-3">
                                            <label htmlFor="contact_email" className="form-label">
                                                Email
                                            </label>
                                            <Field
                                                type="email"
                                                name="contact_email"
                                                className="form-control"
                                                placeholder="e.g., supplier.email@gmail.com"
                                            />
                                            <ErrorMessage name="contact_email" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>


                                    <div className="row d-flex text-start mb-3">
                                        <div className="col-12 col-lg-6 mb-3">
                                            <label htmlFor="support_phone" className="form-label">
                                                Phone Number
                                            </label>
                                            <Field
                                                type="tel"
                                                name="support_phone"
                                                className="form-control"
                                                placeholder="e.g., +255756578778"
                                                
                                            />
                                            <ErrorMessage name="support_phone" component="div" className="text-danger small mt-1" />
                                        </div>
                                        <div className="col-12 col-lg-6 mb-3">
                                            <label htmlFor="website" className="form-label">
                                                Website
                                            </label>
                                            <Field
                                                type="url"
                                                name="website"
                                                className="form-control"
                                                placeholder="e.g., https://supplier.website.com"
                                            />
                                            <ErrorMessage name="website" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>
                                  

                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="is_active" className="form-label d-block">Supplier Status</label>
                                            <div className="form-check form-switch">
                                                <Field
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="is_active"
                                                    name="is_active"
                                                    checked={values.is_active}
                                                    onChange={(e) => setFieldValue("is_active", e.target.checked)}
                                                />
                                                <label className="form-check-label" htmlFor="is_active">
                                                    {values.is_active ? "Active" : "Inactive"}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {errors.non_field_errors && errors.non_field_errors.length > 0 && (
                                        <div className="alert alert-danger">
                                            {errors.non_field_errors.map((error, index) => (
                                                <div key={index}>{error}</div>
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
                                        disabled={isSubmitting}
                                    >
                                        <i className="bx bx-x"></i> Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <i className="bx bx-loader-alt bx-spin"></i> Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bx bx-save"></i> {selectedObj ? "Update" : "Save"}
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
