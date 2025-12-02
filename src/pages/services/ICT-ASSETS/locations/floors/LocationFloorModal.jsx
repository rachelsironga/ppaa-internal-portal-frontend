import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateFloor, getBuildings } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { AssetContext } from "../../../../../utils/context";

export const LocationFloorModal = ({ loadOnlyModal = false }) => {
    const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } = useContext(AssetContext);
    const [errors, setOtherError] = useState({});
    const [buildings, setBuildings] = useState([]);
    const [loadingBuildings, setLoadingBuildings] = useState(false);

    useEffect(() => {
        setOtherError({});
        fetchBuildings();
    }, [selectedObj]);

    const fetchBuildings = async () => {
        try {
            setLoadingBuildings(true);
            const response = await getBuildings({ search: "", pagination: {} });
            if (response.status === 200 || response.status === 8000) {
                setBuildings(response.data?.results || response.data || []);
            }
        } catch (error) {
            console.error("Error fetching buildings:", error);
        } finally {
            setLoadingBuildings(false);
        }
    };

    const initialValues = {
        name: selectedObj?.name || "",
        floor_number: selectedObj?.floor_number || "",
        building: selectedObj?.building || "",
        description: selectedObj?.description || "",
        is_active: selectedObj?.is_active ?? true,
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required("Floor name is required"),
        floor_number: Yup.string().nullable(),
        building: Yup.string().required("Building is required"),
        description: Yup.string().nullable(),
    });

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            const submitData = { ...values };

            if (selectedObj) {
                submitData.uid = selectedObj.uid;
            }

            setSubmitting(true);
            const result = await createUpdateFloor(submitData);

            if (result.status === 200 || result.status === 8000) {
                showToast("success", `Floor ${selectedObj ? 'Updated' : 'Created'} Successfully`);
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
            console.error("Floor submission error:", error);
            showToast("error", "Something went wrong while saving floor");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        const modalElement = document.getElementById("LocationFloorModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal modal-slide-in fade"
            id="LocationFloorModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header text-white">
                        <h5 className="modal-title">
                            <i className="bx bx-layer me-2"></i>
                            {selectedObj ? "Update Floor" : "Create New Floor"}
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
                                            <label htmlFor="building" className="form-label">
                                                Building <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                as="select"
                                                name="building"
                                                className="form-select"
                                            >
                                                <option value="">Select Building</option>
                                                {loadingBuildings ? (
                                                    <option disabled>Loading...</option>
                                                ) : (
                                                    buildings.map((building) => (
                                                        <option key={building.uid} value={building.uid}>
                                                            {building.name}
                                                        </option>
                                                    ))
                                                )}
                                            </Field>
                                            <ErrorMessage name="building" component="div" className="text-danger small mt-1" />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="floor_number" className="form-label">
                                                Floor Number
                                            </label>
                                            <Field
                                                type="text"
                                                name="floor_number"
                                                className="form-control"
                                                placeholder="e.g., 1, 2, G, B1"
                                            />
                                            <ErrorMessage name="floor_number" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="name" className="form-label">
                                                Floor Name <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="e.g., Ground Floor, First Floor, Basement Level 1"
                                            />
                                            <ErrorMessage name="name" component="div" className="text-danger small mt-1" />
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
                                                placeholder="Enter a description for this floor..."
                                            />
                                            <ErrorMessage name="description" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="is_active" className="form-label d-block">Floor Status</label>
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
