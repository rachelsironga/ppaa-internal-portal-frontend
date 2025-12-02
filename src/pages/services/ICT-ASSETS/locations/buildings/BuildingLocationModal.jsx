import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateBuilding } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { AssetContext } from "../../../../../utils/context";

export const BuildingLocationModal = ({ loadOnlyModal = false }) => {
    const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } = useContext(AssetContext);
    const [errors, setOtherError] = useState({});

    useEffect(() => {
        setOtherError({});
    }, [selectedObj]);

    const initialValues = {
        name: selectedObj?.name || "",
        code: selectedObj?.code || "",
        address: selectedObj?.address || "",
        description: selectedObj?.description || "",
        is_active: selectedObj?.is_active ?? true,
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required("Building name is required"),
        code: Yup.string().nullable(),
        address: Yup.string().nullable(),
        description: Yup.string().nullable(),
    });

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            const submitData = { ...values };

            if (selectedObj) {
                submitData.uid = selectedObj.uid;
            }

            setSubmitting(true);
            const result = await createUpdateBuilding(submitData);

            if (result.status === 200 || result.status === 8000) {
                showToast("success", `Building ${selectedObj ? 'Updated' : 'Created'} Successfully`);
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
            console.error("Building submission error:", error);
            showToast("error", "Something went wrong while saving building");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        const modalElement = document.getElementById("BuildingLocationModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal modal-slide-in fade"
            id="BuildingLocationModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header text-white">
                        <h5 className="modal-title">
                            <i className="bx bx-building me-2"></i>
                            {selectedObj ? "Update Building" : "Create New Building"}
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
                                            <label htmlFor="name" className="form-label">
                                                Building Name <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="e.g., Main Building, Block A, Tower 1"
                                            />
                                            <ErrorMessage name="name" component="div" className="text-danger small mt-1" />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="code" className="form-label">
                                                Building Code
                                            </label>
                                            <Field
                                                type="text"
                                                name="code"
                                                className="form-control"
                                                placeholder="e.g., BLD-001, MAIN, TWR-1"
                                            />
                                            <ErrorMessage name="code" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="address" className="form-label">Address</label>
                                            <Field
                                                as="textarea"
                                                name="address"
                                                className="form-control"
                                                rows="2"
                                                placeholder="Enter the building address..."
                                            />
                                            <ErrorMessage name="address" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="description" className="form-label">Description</label>
                                            <Field
                                                as="textarea"
                                                name="description"
                                                className="form-control"
                                                rows="3"
                                                placeholder="Enter a description for this building..."
                                            />
                                            <ErrorMessage name="description" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="is_active" className="form-label d-block">Building Status</label>
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
