import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateManufacture } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { ManufactureContext } from "../../../../../utils/context";

export const ManufactureModal = ({ loadOnlyModal = false }) => {
    const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } = useContext(ManufactureContext);
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
          .required("Manufacturer name is required"),
      
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
            });
      

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            const submitData = { ...values };

            if (selectedObj) {
                submitData.uid = selectedObj.uid;
            }

            setSubmitting(true);
            const result = await createUpdateManufacture(submitData);

            if (result.status === 200 || result.status === 8000) {
                showToast(`Manufacturer ${selectedObj ? 'Updated' : 'Created'} Successfully`, "success", "success");
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
            console.error("Manufacturer submission error:", error);
            showToast("Something went wrong while saving manufacturer", "error", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        const modalElement = document.getElementById("manufacturesModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal modal-slide-in fade"
            id="manufacturesModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header text-white">
                        <h5 className="modal-title">
                            <i className="bx bx-category me-2"></i>
                            {selectedObj ? "Update Manufacturer" : "Create New Manufacturer"}
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
                                                Manufacturer Name <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="e.g., Manufacturer Name"
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
                                                placeholder="e.g., manufacturer.email@gmail.com"
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
                                                Email
                                            </label>
                                            <Field
                                                type="url"
                                                name="website"
                                                className="form-control"
                                                placeholder="e.g., https://manufacture.website.com"
                                            />
                                            <ErrorMessage name="website" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>
                                  

                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="is_active" className="form-label d-block">Manufacturer Status</label>
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
