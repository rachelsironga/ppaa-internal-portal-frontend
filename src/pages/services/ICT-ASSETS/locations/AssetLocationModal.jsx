import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateLocation, getBuildings, getFloors } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { AssetContext } from "../../../../utils/context";

export const AssetLocationModal = ({ loadOnlyModal = false }) => {
    const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } = useContext(AssetContext);
    const [errors, setOtherError] = useState({});
    const [buildings, setBuildings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [loadingBuildings, setLoadingBuildings] = useState(false);
    const [loadingFloors, setLoadingFloors] = useState(false);

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

    const fetchFloors = async (buildingUid) => {
        if (!buildingUid) {
            setFloors([]);
            return;
        }
        try {
            setLoadingFloors(true);
            const response = await getFloors({ building: buildingUid, search: "", pagination: {} });
            if (response.status === 200 || response.status === 8000) {
                setFloors(response.data?.results || response.data || []);
            }
        } catch (error) {
            console.error("Error fetching floors:", error);
        } finally {
            setLoadingFloors(false);
        }
    };

    useEffect(() => {
        if (selectedObj?.building) {
            fetchFloors(selectedObj.building);
        }
    }, [selectedObj]);

    const initialValues = {
        name: selectedObj?.name || "",
        code: selectedObj?.code || "",
        building: selectedObj?.building || "",
        floor: selectedObj?.floor || "",
        description: selectedObj?.description || "",
        is_active: selectedObj?.is_active ?? true,
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required("Location name is required"),
        code: Yup.string().nullable(),
        building: Yup.string().nullable(),
        floor: Yup.string().nullable(),
        description: Yup.string().nullable(),
    });

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            const submitData = { ...values };

            if (selectedObj) {
                submitData.uid = selectedObj.uid;
            }

            setSubmitting(true);
            const result = await createUpdateLocation(submitData);

            if (result.status === 200 || result.status === 8000) {
                showToast("success", `Location ${selectedObj ? 'Updated' : 'Created'} Successfully`);
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
            console.error("Location submission error:", error);
            showToast("error", "Something went wrong while saving location");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        setFloors([]);
        const modalElement = document.getElementById("AssetLocationModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal modal-slide-in fade"
            id="AssetLocationModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header text-white">
                        <h5 className="modal-title">
                            <i className="bx bx-map me-2"></i>
                            {selectedObj ? "Update Location" : "Create New Location"}
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
                                                Location Name <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                placeholder="e.g., Server Room, Office 101, Conference Room A"
                                            />
                                            <ErrorMessage name="name" component="div" className="text-danger small mt-1" />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="code" className="form-label">
                                                Location Code
                                            </label>
                                            <Field
                                                type="text"
                                                name="code"
                                                className="form-control"
                                                placeholder="e.g., SR-001, OFF-101"
                                            />
                                            <ErrorMessage name="code" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="building" className="form-label">
                                                Building
                                            </label>
                                            <Field
                                                as="select"
                                                name="building"
                                                className="form-select"
                                                onChange={(e) => {
                                                    const buildingUid = e.target.value;
                                                    setFieldValue("building", buildingUid);
                                                    setFieldValue("floor", "");
                                                    fetchFloors(buildingUid);
                                                }}
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
                                            <label htmlFor="floor" className="form-label">
                                                Floor
                                            </label>
                                            <Field
                                                as="select"
                                                name="floor"
                                                className="form-select"
                                                disabled={!values.building}
                                            >
                                                <option value="">Select Floor</option>
                                                {loadingFloors ? (
                                                    <option disabled>Loading...</option>
                                                ) : (
                                                    floors.map((floor) => (
                                                        <option key={floor.uid} value={floor.uid}>
                                                            {floor.name}
                                                        </option>
                                                    ))
                                                )}
                                            </Field>
                                            <ErrorMessage name="floor" component="div" className="text-danger small mt-1" />
                                            {!values.building && (
                                                <small className="text-muted">Select a building first</small>
                                            )}
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
                                                placeholder="Enter a description for this location..."
                                            />
                                            <ErrorMessage name="description" component="div" className="text-danger small mt-1" />
                                        </div>
                                    </div>

                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="is_active" className="form-label d-block">Location Status</label>
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
