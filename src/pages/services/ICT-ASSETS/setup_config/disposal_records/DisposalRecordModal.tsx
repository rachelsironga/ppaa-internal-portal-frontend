import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { createUpdateDisposalRecords } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import FormikSelect from "../../../../../components/ui-templates/form-components/FormikSelect";
import { DisposalRecordContext } from "../../../../../utils/context";

export const DisposalRecordModal = ({ loadOnlyModal = false }) => {
    const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh, handleFetchDisposalRecord } = useContext(DisposalRecordContext);
    const [errors, setOtherError] = useState({});

    useEffect(() => {
        setOtherError({});
    }, [selectedObj]);

    const initialValues = {
        asset_tag: selectedObj?.asset_tag || "",
        category_uid: selectedObj?.category?.uid || "",  // <-- use category.uid
        specifications_template: selectedObj?.specifications_template?.length
            ? selectedObj.specifications_template
            : [{ key: "", value: "" }],
        is_active: selectedObj?.is_active ?? true,
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().required("Asset Type is required"),
        category_uid: Yup.string().required("Category is required"),
        specifications_template: Yup.array().of(
            Yup.object({
                key: Yup.string().required("Key is required"),
                value: Yup.string().required("Value is required"),
            })
        ),

    });

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            const submitData = { ...values };

            if (selectedObj) {
                submitData.uid = selectedObj.uid;
            }

            setSubmitting(true);
            const result = await createUpdateDisposalRecords(submitData);

            if (result.status === 200 || result.status === 8000) {
                showToast(`Disposal Record ${selectedObj ? 'Updated' : 'Created'} Successfully`, "success", "success");
                handleClose();
                resetForm();
                setTableRefresh((prev) => prev + 1);
                // Refresh the disposal record data if handle Fetch DisposalRecord is available
                if (handleFetchDisposalRecord) {
                    handleFetchDisposalRecord();
                }
            } else if (result.status === 8002) {
                showToast(result.message || "Validation Failed", "warning", "warning");
                setErrors(result.data);
                setOtherError(result.data);
            } else {
                showToast(result.message || "Process Failed", "warning", "warning");
            }
        } catch (error) {
            console.error("Disposal record submission error:", error);
            showToast("Something went wrong while saving disposal record", "error", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedObj(null);
        const modalElement = document.getElementById("disposalrecordModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) modalInstance.hide();
    };

    return (
        <div
            className="modal modal-slide-in fade"
            id="disposalrecordModal"
            tabIndex="-1"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
        >
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header text-white">
                        <h5 className="modal-title">
                            <i className="bx bx-category me-2"></i>
                            {selectedObj ? "Update Disposal Record" : "Create New Disposal Record"}
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
                                    <div className="row flex-row text-start justify-content-center mb-3">
                                        <div className="col-md-6 mb-3">
                                            <FormikSelect
                                                name="asset"
                                                label="Asset"
                                                url="/assets"
                                                containerClass="mb-0"
                                                filters={{
                                                    page: 1,
                                                    page_size: 10,
                                                    paginated: true,
                                                }}
                                                mapOption={(item) => ({
                                                    value: item.uid,
                                                    label: `${item.asset_tag}`,
                                                    name: `${item.asset_tag}`,
                                                })}
                                                placeholder="Search Asset ..."
                                                debounceMs={500}
                                                minChars={3}
                                                isReadOnly={false}
                                            />
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            <FormikSelect
                                                name="category_uid"
                                                label="Asset Category"
                                                url="/asset-categories"
                                                containerClass="mb-0"
                                                filters={{
                                                    page: 1,
                                                    page_size: 10,
                                                    paginated: true,
                                                }}
                                                mapOption={(item) => ({
                                                    value: item.uid,
                                                    label: `${item.name}`,
                                                    name: `${item.name}`,
                                                })}
                                                placeholder="Search Category ..."
                                                debounceMs={500}
                                                minChars={3}
                                                isReadOnly={false}
                                            />
                                        </div>
                                    </div>

                                    <div className="row mb-3 text-start">
                                        <div className="col-12">

                                            <FieldArray name="specifications_template">
                                                {({ push, remove }) => {
                                                    const canAdd = () => {
                                                        const last = values.specifications_template[values.specifications_template.length - 1];
                                                        return last.key?.trim() !== "" && last.value?.trim() !== "";
                                                    };

                                                    const handleAdd = () => {
                                                        if (!canAdd()) {
                                                            // alert("Please fill both Key and Value before adding another specification.");
                                                            return;
                                                        }
                                                        push({ key: "", value: "" });
                                                    };

                                                    return (
                                                        <>
                                                            {/* Label + Add Button */}
                                                            <div className="row align-items-center mb-2">
                                                                <div className="col d-flex justify-content-between align-items-center">

                                                                    <label className="form-label m-0">Specifications</label>

                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline  border-primary text-primary rounded"
                                                                        onClick={handleAdd}
                                                                        disabled={values.specifications_template.length === 0 || !canAdd()}
                                                                    >
                                                                        <i className="bx bx-plus me-1"></i>
                                                                        Add
                                                                    </button>

                                                                </div>
                                                            </div>

                                                            {/* Fields List */}
                                                            <div className="col-12 mb-3 justify-content-center rounded spec-scroll"
                                                            >
                                                                {values.specifications_template.map((spec, index) => (
                                                                    <div className="row mb-3 align-items-end" key={index}>

                                                                        {/* Key */}
                                                                        <div className="col-md-6">
                                                                            <label className="form-label small fw-500">Key</label>
                                                                            <Field
                                                                                name={`specifications_template[${index}].key`}
                                                                                className="form-control"
                                                                                placeholder="e.g., RAM, Storage..."
                                                                            />
                                                                            <ErrorMessage
                                                                                name={`specifications_template[${index}].key`}
                                                                                component="div"
                                                                                className="text-danger small mt-1"
                                                                            />
                                                                        </div>

                                                                        {/* Value */}
                                                                        <div className={
                                                                            index === 0 && values.specifications_template.length === 1
                                                                                ? "col-md-6"       // No delete button yet
                                                                                : "col-md-5"       // Delete button is there
                                                                        }>
                                                                            <label className="form-label small fw-500">Value</label>
                                                                            <Field
                                                                                name={`specifications_template[${index}].value`}
                                                                                className="form-control"
                                                                                placeholder="e.g., 16GB, 512GB SSD..."
                                                                            />
                                                                            <ErrorMessage
                                                                                name={`specifications_template[${index}].value`}
                                                                                component="div"
                                                                                className="text-danger small mt-1"
                                                                            />
                                                                        </div>

                                                                        {/* Remove Button (index > 0 only) */}
                                                                        {(index > 0 || (index === 0 && values.specifications_template.length > 1)) && (
                                                                            <div className="col-md-1 d-flex justify-content-end align-items-end">
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-sm btn-outline-danger py-1"
                                                                                    onClick={() => remove(index)}
                                                                                    title="Remove specification"
                                                                                >
                                                                                    <i className="bx bx-trash"></i>
                                                                                </button>
                                                                            </div>
                                                                        )}


                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    );
                                                }}
                                            </FieldArray>
                                        </div>
                                    </div>


                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="is_active" className="form-label d-block">Category Status</label>
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
