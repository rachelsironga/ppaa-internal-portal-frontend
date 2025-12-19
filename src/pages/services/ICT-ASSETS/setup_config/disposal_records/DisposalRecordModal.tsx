import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import { createUpdateDisposalRecords } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import FormikSelect from "../../../../../components/ui-templates/form-components/FormikSelect";
import { DisposalRecordContext } from "../../../../../utils/context";

export const DisposalRecordModal = ({ loadOnlyModal = false }) => {
    const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh, handleFetchDisposalRecord } = useContext(DisposalRecordContext);
    const [errors, setOtherError] = useState<any>({});

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

    const validationSchema = Yup.object({
        asset_uid: Yup.string().required("Asset is required"),
        disposal_date: Yup.date().required("Disposal date is required"),
        disposal_method: Yup.string().required("Disposal method is required"),
        disposal_value: Yup.number()
            .required("Disposal value is required")
            .min(0, "Value cannot be negative"),
        disposal_reason: Yup.string()
            .required("Disposal reason is required")
            .min(10, "Please provide more details (minimum 10 characters)"),
    });

    const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
        try {
            const submitData = { ...values };

            // Ensure asset_uid is sent as UID string
            if (typeof submitData.asset_uid === 'object' && submitData.asset_uid?.uid) {
                submitData.asset_uid = submitData.asset_uid.uid;
            }

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
        // Don't set selectedObj to null here - it will cause the view page to show an error
        // The view page depends on selectedObj to display the record details
        // Just close the modal and let the view page keep its data
        const modalElement = document.getElementById("disposalrecordModal");
        if (modalElement) {
            const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
        }
    };

    const disposalMethodOptions = [
        { value: 'recycled', label: 'Recycled' },
        { value: 'sold', label: 'Sold' },
        { value: 'donated', label: 'Donated' },
        { value: 'destroyed', label: 'Destroyed' },

    ];

    return (
        <div
            className="modal modal-slide-in fade"
            id="disposalrecordModal"
            tabIndex={-1}
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
                                                name="asset_uid"
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
                                                formatOptionLabel={(option: any) => option.label}
                                                onSelectObject={() => {}}
                                            />
                                        </div>


                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="disposal_date" className="form-label">
                                                Disposal Date  <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="date"
                                                name="disposal_date"
                                                id="disposal_date"
                                                className="form-control"
                                            />
                                            <ErrorMessage
                                                name="disposal_date"
                                                component="div"
                                                className="text-danger"
                                            />
                                        </div>
                                    </div>

                                    <div className="row flex-row text-start justify-content-center mb-3">
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="disposal_method" className="form-label">Disposal Method  <span className="text-danger">*</span></label>
                                            <Field as="select" name="disposal_method" className="form-select">
                                                {disposalMethodOptions.map(option => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </Field>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="disposal_value" className="form-label">
                                                Disposal Value <span className="text-danger">*</span>
                                            </label>
                                            <Field
                                                type="number"
                                                name="disposal_value"
                                                className="form-control"
                                                placeholder="e.g., 1200.50"
                                                step="0.01"  // allows decimals up to 2 places
                                                min="0"      // optional, prevents negative numbers
                                            />
                                            <ErrorMessage
                                                name="disposal_value"
                                                component="div"
                                                className="text-danger small mt-1"
                                            />
                                        </div>


                                    </div>

                                    <div className="row flex-row text-start justify-content-center mb-3">
                                        <div className="col-md-12 mb-3">
                                            <label htmlFor="disposal_reason" className="form-label">
                                                Disposal Reason 
                                            </label>

                                            <Field
                                                as="textarea"
                                                name="disposal_reason"
                                                id="disposal_reason"
                                                className="form-control"
                                                rows="4"
                                                placeholder="Explain why this asset should be disposed..."
                                            />

                                            <ErrorMessage
                                                name="disposal_reason"
                                                component="div"
                                                className="text-danger small mt-1"
                                            />
                                        </div>




                                    </div>



                                    <div className="row text-start">
                                        <div className="col-12 mb-3">
                                            <label htmlFor="is_active" className="form-label d-block">Disposal Record Status</label>
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

                                    {errors.non_field_errors && Array.isArray(errors.non_field_errors) && errors.non_field_errors.length > 0 && (
                                        <div className="alert alert-danger">
                                            {errors.non_field_errors.map((error: string, index: number) => (
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
