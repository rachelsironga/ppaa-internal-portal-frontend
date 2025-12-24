import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateAsset } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { AssetContext } from "../../../../../utils/context";

export const WarrantiesModal = ({ loadOnlyModal = false }) => {
    const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } = useContext(AssetContext);
    const [errors, setOtherError] = useState({});

    useEffect(() => {
        setOtherError({});
    }, [selectedObj]);

    const initialValues = {
        asset: selectedObj?.asset_tag || selectedObj?.asset || "",
        start_date: selectedObj?.start_date || "",
        end_date: selectedObj?.end_date || "",
        provider: selectedObj?.provider || "",
        po_number: selectedObj?.po_number || "",
        po_date: selectedObj?.po_date || "",
        po_amount: selectedObj?.po_amount || "",
        coverage_details: selectedObj?.coverage_details || "",
        support_contact: selectedObj?.support_contact || "",
        procurement_notes: selectedObj?.procurement_notes || "",
    };

    const validationSchema = Yup.object().shape({
        asset: Yup.string().required("Asset tag is required"),
        start_date: Yup.date().required("Start date is required"),
        end_date: Yup.date().required("End date is required"),
        provider: Yup.string().required("Provider is required"),
        po_number: Yup.string().required("PO Number is required"),
        po_date: Yup.date().required("PO Date is required"),
        po_amount: Yup.string().required("PO Amount is required"),
        coverage_details: Yup.string(),
        support_contact: Yup.string().email("Invalid email"),
        procurement_notes: Yup.string(),
    });

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            const submitData = { ...values };

            if (selectedObj) {
                submitData.uid = selectedObj.uid;
            }

            setSubmitting(true);
            const result = await createUpdateAsset(submitData);

            if (result.status === 200 || result.status === 8000) {
                showToast("success", `Warranty ${selectedObj ? 'Updated' : 'Created'} Successfully`);
                handleClose();
                resetForm();
                setTableRefresh((prev) => prev + 1);
            } else if (result.status === 8002) {
                showToast("warning", result.message || "Validation Failed");
                setErrors(result.data);
                setOtherError(result.data);
            } else {
                showToast("warning", result.message || "Process Failed");
            }
        } catch (error) {
            console.error("Warranty submission error:", error);
            showToast("error", "Something went wrong while saving warranty");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        const modalElement = document.getElementById("warrantiesModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal modal-slide-in fade"
            id="warrantiesModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header text-white">
                        <h5 className="modal-title">
                            <i className="bx bx-shield me-2"></i>
                            {selectedObj ? "Update Warranty" : "Create New Warranty"}
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
                                    <div className="row text-start">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="asset" className="form-label">
                                                Asset Tag <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="asset"
                                                className="form-control"
                                                placeholder="e.g., ASSET-001, HW-12345"
                                                autoFocus
                                            />
                                            <ErrorMessage name="asset" component="div" className="text-danger small mt-1" />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="provider" className="form-label">
                                                Provider <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="provider"
                                                className="form-control"
                                                placeholder="e.g., Dell Warranty, HP Support"
                                            />
                                            <ErrorMessage name="provider" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="start_date" className="form-label">
                                                Start Date <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="date"
                                                name="start_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage name="start_date" component="div" className="text-danger small mt-1" />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="end_date" className="form-label">
                                                End Date <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="date"
                                                name="end_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage name="end_date" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="po_number" className="form-label">
                                                PO Number <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="po_number"
                                                className="form-control"
                                                placeholder="e.g., PO-BB173F6F"
                                            />
                                            <ErrorMessage name="po_number" component="div" className="text-danger small mt-1" />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="po_date" className="form-label">
                                                PO Date <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="date"
                                                name="po_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage name="po_date" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="po_amount" className="form-label">
                                                PO Amount <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="po_amount"
                                                className="form-control"
                                                placeholder="e.g., 931.70"
                                            />
                                            <ErrorMessage name="po_amount" component="div" className="text-danger small mt-1" />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="support_contact" className="form-label">
                                                Support Contact
                                            </label>
                                            <Field
                                                type="email"
                                                name="support_contact"
                                                className="form-control"
                                                placeholder="e.g., support@dell.com"
                                            />
                                            <ErrorMessage name="support_contact" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="coverage_details" className="form-label">
                                                Coverage Details
                                            </label>
                                            <Field
                                                as="textarea"
                                                name="coverage_details"
                                                className="form-control"
                                                rows="3"
                                                placeholder="Describe warranty coverage..."
                                            />
                                            <ErrorMessage name="coverage_details" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="procurement_notes" className="form-label">
                                                Procurement Notes
                                            </label>
                                            <Field
                                                as="textarea"
                                                name="procurement_notes"
                                                className="form-control"
                                                rows="3"
                                                placeholder="Enter any procurement notes..."
                                            />
                                            <ErrorMessage name="procurement_notes" component="div" className="text-danger small mt-1" />
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
