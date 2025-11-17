import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { createUpdateAsset } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { AssetContext } from "../../../../utils/context";
import FormWizard from "react-form-wizard-component";
import "react-form-wizard-component/dist/style.css";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

export const AssetModal = ({ loadOnlyModal = false }) => {
  const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } =
    useContext(AssetContext);

  //for Wizard tab validation & Control
  const [errors, setOtherError] = useState({});
  const [tabsError, setTabsError] = useState([false, false, false, false]);
  const [isValidTab, setIsValidTab] = useState([false, false, false, false]);
  const [isFirstTabChange, setIsFirstTabChange] = useState(true);
  const [tabIndex, setTabIndex] = useState(0); // current tab index

  // Reset wizard to first step when modal opens or selectedObj changes
  useEffect(() => {
    setTabIndex(0);
    setTabsError([false, false, false, false]);
    setIsValidTab([false, false, false, false]);
    setIsFirstTabChange(true);
    setOtherError({});
  }, [selectedObj]);

  const initialValues = {
    asset_tag: selectedObj?.asset_tag || "",
    serial_number: selectedObj?.serial_number || "",
    barcode: selectedObj?.barcode || "",
    asset_type: selectedObj?.asset_type_uid || selectedObj?.asset_type?.uid || selectedObj?.asset_type || "",
    manufacturer: selectedObj?.manufacturer_uid || selectedObj?.manufacturer?.uid || selectedObj?.manufacturer || "",
    model: selectedObj?.model || "",
    purchase_date: selectedObj?.purchase_date || "",
    purchase_cost: selectedObj?.purchase_cost || "",
    supplier: selectedObj?.supplier_uid || selectedObj?.supplier?.uid || selectedObj?.supplier || "",
    status: selectedObj?.status || "operational",
    condition: selectedObj?.condition || "",
    location: selectedObj?.location_uid || selectedObj?.location?.uid || selectedObj?.location || "",
    custodian: selectedObj?.custodian_guid || selectedObj?.custodian?.guid || selectedObj?.custodian || "",
    warranty_expiry: selectedObj?.warranty_expiry || "",
    photo: selectedObj?.photo || "",
    notes: selectedObj?.notes || "",
    is_active: selectedObj?.is_active ?? true,
  };

  const validationSchema = Yup.object().shape({
    asset_tag: Yup.string().required("Asset Tag is required"),
    asset_type: Yup.string().required("Asset Type is required"),
    serial_number: Yup.string().nullable(),
    status: Yup.string().required("Status is required"),
    condition: Yup.string().nullable(),
    purchase_cost: Yup.number().nullable().positive("Must be positive"),
    manufacturer: Yup.string().nullable(),
    model: Yup.string().nullable(),
    purchase_date: Yup.date().nullable().typeError("Please enter a valid date"),
    warranty_expiry: Yup.date().nullable().typeError("Please enter a valid date"),
  });

  // Status options from your model
  const statusOptions = [
    { value: 'operational', label: 'Operational' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'in_repair', label: 'In Repair' },
    { value: 'under_maintenance', label: 'Under Maintenance' },
    { value: 'in_storage', label: 'In Storage' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'retired', label: 'Retired' },
    { value: 'lost', label: 'Lost' },
    { value: 'disposed', label: 'Disposed' },
  ];

  // Condition options from your model
  const conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];

  //for Submit modal
  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }
      setSubmitting(true);
      const result = await createUpdateAsset(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Asset Saved Successfully", "success", "Complete");
        handleClose();
        resetForm();
        setTableRefresh((prev) => prev + 1);
      } else if (result.status === 8002) {
        showToast(`${result.message}`, "warning", "Validation Failed");
        setErrors(result.data);
        setOtherError(result.data);
      } else {
        showToast(`${result.message}`, "warning", "Process Failed");
      }
    } catch (error) {
      console.error("Asset submission error:", error);
      showToast("Something went wrong while saving asset", "error", "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  //for closing modal
  const handleClose = () => {
    console.log("Modal closed");
    setSelectedObj(null);
    setIsFirstTabChange(true);
    const modalElement = document.getElementById("assetModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  //for Wizard tab validation & Control - useCallback to memoize
  const validateTab = useCallback(async (values, setFieldError, setTouched) => {
    try {
      if (tabIndex === 1) {
        await validationSchema.validateAt("asset_tag", values);
        await validationSchema.validateAt("asset_type", values);
        await validationSchema.validateAt("status", values);
      }
      if (tabIndex === 2) {
        await validationSchema.validateAt("manufacturer", values);
        await validationSchema.validateAt("model", values);
      }
      if (tabIndex === 3) {
        await validationSchema.validateAt("purchase_date", values);
        await validationSchema.validateAt("purchase_cost", values);
      }
      if (tabIndex === 4) {
        // Additional info tab - no specific validation required
        return true;
      }

      return true;
    } catch (err) {
      if (err.path && err.message) {
        setTouched({ [err.path]: true }, false);
        setFieldError(err.path, err.message);
      }
      return false;
    }
  }, [tabIndex]);

  //for Wizard tab validation & Control - useCallback to memoize and fix the state update issue
  const tabChanged = useCallback(async (
    { handleNext },
    values,
    setSubmitting,
    resetForm,
    setErrors,
    setFieldError,
    setTouched,
    lastTab
  ) => {
    if (isFirstTabChange) {
      setIsFirstTabChange(false);
    }

    const isValid = await validateTab(values, setFieldError, setTouched);
    
    // Use setTimeout to defer state updates until after render
    setTimeout(() => {
      if (isValid) {
        setIsValidTab((prev) => {
          const updated = [...prev];
          updated[tabIndex - 1] = true;
          return updated;
        });
        setTabsError((prev) => {
          const updated = [...prev];
          updated[tabIndex - 1] = false;
          return updated;
        });
        
        if (tabIndex === lastTab) {
          handleSubmit(values, {
            setSubmitting,
            resetForm,
            setErrors,
            setTouched,
          });
        } else {
          handleNext();
        }
      } else {
        setIsValidTab((prev) => {
          const updated = [...prev];
          updated[tabIndex - 1] = false;
          return updated;
        });
        setTabsError((prev) => {
          const updated = [...prev];
          updated[tabIndex - 1] = true;
          return updated;
        });
      }
    }, 0);

    return isValid;
  }, [tabIndex, isFirstTabChange, validateTab]);

  // Handle tab change separately to update tabIndex
  const handleTabChange = useCallback((activeTab) => {
    setTabIndex(activeTab);
  }, []);

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="assetModal"
        tabIndex="-1"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="assetModalLabel">
                {selectedObj ? "Update Asset" : "Create New Asset"}
              </h5>
              <button
                type="button"
                className="btn-close"
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
                setSubmitting,
                values,
                setFieldValue,
                resetForm,
                setErrors,
                setFieldError,
                setTouched,
              }) => (
                <Form>
                  <FormWizard
                    shape="circle"
                    color="#696cff"
                    stepSize="xs"
                    onTabChange={({ prevIndex, nextIndex }) => {
                      setTimeout(() => setTabIndex(nextIndex), 0);
                    }}

                    backButtonTemplate={(handlePrevious) => (
                      <button
                        type={"button"}
                        className="base-button btn btn-sm btn-primary float-right"
                        style={{ width: "100px", alignItems: "right" }}
                        onClick={handlePrevious}
                      >
                        <i className="bx bx-left-arrow-alt"></i> Back
                      </button>
                    )}
                    nextButtonTemplate={(handleNext) => (
                      <button
                        type={"button"}
                        className="base-button btn btn-sm btn-primary"
                        style={{ width: "100px", marginLeft: "80%" }}
                        onClick={async () =>
                          await tabChanged(
                            { handleNext },
                            values,
                            setSubmitting,
                            resetForm,
                            setErrors,
                            setFieldError,
                            setTouched,
                            4 // last tab index
                          )
                        }
                      >
                        Next <i className="bx bx-right-arrow-alt"></i>
                      </button>
                    )}
                    finishButtonTemplate={(handleNext) => (
                      <button
                        type={"button"}
                        className="base-button btn btn-sm btn-primary"
                        style={{ width: "150px", marginLeft: "70%" }}
                        disabled={isSubmitting}
                        onClick={async () =>
                          await tabChanged(
                            { handleNext },
                            values,
                            setSubmitting,
                            resetForm,
                            setErrors,
                            setFieldError,
                            setTouched,
                            4 // last tab index
                          )
                        }
                      >
                        {isSubmitting ? (
                          <>
                            <i className="bx bx-loader-alt bx-spin"></i>&nbsp;
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="bx bx-save"></i> &nbsp;
                            {selectedObj ? "Update Asset" : "Save Asset"}
                          </>
                        )}
                      </button>
                    )}
                  >
                    <FormWizard.TabContent
                      title="Basic Info"
                      icon="ti-tag"
                      showErrorOnTab={tabsError[0]}
                    >
                      {/* Tab 1 content - Basic Information */}
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="asset_tag" className="form-label">
                            Asset Tag *
                          </label>
                          <Field
                            type="text"
                            name="asset_tag"
                            id="asset_tag"
                            className="form-control"
                            placeholder="Enter Asset Tag"
                          />
                          <ErrorMessage
                            name="asset_tag"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="serial_number" className="form-label">
                            Serial Number
                          </label>
                          <Field
                            type="text"
                            name="serial_number"
                            id="serial_number"
                            className="form-control"
                            placeholder="Enter Serial Number"
                          />
                          <ErrorMessage
                            name="serial_number"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="barcode" className="form-label">
                            Barcode
                          </label>
                          <Field
                            type="text"
                            name="barcode"
                            id="barcode"
                            className="form-control"
                            placeholder="Enter Barcode"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <FormikSelect
                            name="asset_type"
                            label="Asset Type *"
                            url="/asset-types"
                            containerClass="mb-0"
                            filters={{ page: 1, page_size: 10, paginated: true }}
                            mapOption={(item) => ({
                              value: item.uid,
                              label: item.name,
                            })}
                            placeholder="Select Asset Type"
                            isRequired={true}
                          />
                          <ErrorMessage
                            name="asset_type"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="status" className="form-label">
                            Status *
                          </label>
                          <Field
                            as="select"
                            name="status"
                            id="status"
                            className="form-select"
                          >
                            <option value="">Select Status</option>
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Field>
                          <ErrorMessage
                            name="status"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="condition" className="form-label">
                            Condition
                          </label>
                          <Field
                            as="select"
                            name="condition"
                            id="condition"
                            className="form-select"
                          >
                            <option value="">Select Condition</option>
                            {conditionOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Field>
                        </div>
                      </div>
                    </FormWizard.TabContent>

                    <FormWizard.TabContent
                      title="Hardware Details"
                      icon="ti-layout-media-center"
                      isValid={isValidTab[0]}
                      showErrorOnTab={tabsError[1]}
                    >
                      {/* Tab 2 content - Hardware Details */}
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <FormikSelect
                            name="manufacturer"
                            label="Manufacturer"
                            url="/asset-manufacturers"
                            containerClass="mb-0"
                            filters={{ page: 1, page_size: 10, paginated: true }}
                            mapOption={(item) => ({
                              value: item.uid,
                              label: item.name,
                            })}
                            placeholder="Select Manufacturer"
                          />
                          <ErrorMessage
                            name="manufacturer"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="model" className="form-label">
                            Model
                          </label>
                          <Field
                            type="text"
                            name="model"
                            id="model"
                            className="form-control"
                            placeholder="Enter Model"
                          />
                          <ErrorMessage
                            name="model"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <FormikSelect
                            name="location"
                            label="Location"
                            url="/asset-locations"
                            containerClass="mb-0"
                            filters={{ page: 1, page_size: 10, paginated: true }}
                            mapOption={(item) => ({
                              value: item.uid,
                              label: item.name,
                            })}
                            placeholder="Select Location"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <FormikSelect
                            name="custodian"
                            label="Custodian"
                            url="/assets-custodians"
                            containerClass="mb-0"
                            filters={{ page: 1, page_size: 10, paginated: true }}
                            mapOption={(item) => ({
                              value: item.guid,
                              label: `${item.full_name}`,
                            })}
                            placeholder="Search Custodian"
                          />
                        </div>
                      </div>
                    </FormWizard.TabContent>

                    <FormWizard.TabContent
                      title="Purchase Info"
                      icon="ti-shopping-cart"
                      isValid={isValidTab[1]}
                      showErrorOnTab={tabsError[2]}
                    >
                      {/* Tab 3 content - Purchase Information */}
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="purchase_date" className="form-label">
                            Purchase Date
                          </label>
                          <Field
                            type="date"
                            name="purchase_date"
                            id="purchase_date"
                            className="form-control"
                          />
                          <ErrorMessage
                            name="purchase_date"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="purchase_cost" className="form-label">
                            Purchase Cost
                          </label>
                          <Field
                            type="number"
                            name="purchase_cost"
                            id="purchase_cost"
                            className="form-control"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                          <ErrorMessage
                            name="purchase_cost"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <FormikSelect
                            name="supplier"
                            label="Supplier"
                            url="/asset-suppliers"
                            containerClass="mb-0"
                            filters={{ page: 1, page_size: 10, paginated: true }}
                            mapOption={(item) => ({
                              value: item.uid,
                              label: item.name,
                            })}
                            placeholder="Select Supplier"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="warranty_expiry" className="form-label">
                            Warranty Expiry
                          </label>
                          <Field
                            type="date"
                            name="warranty_expiry"
                            id="warranty_expiry"
                            className="form-control"
                          />
                          <ErrorMessage
                            name="warranty_expiry"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                      </div>
                    </FormWizard.TabContent>

                    <FormWizard.TabContent
                      title="Additional Info"
                      icon="ti-info"
                      isValid={isValidTab[2]}
                      showErrorOnTab={tabsError[3]}
                    >
                      {/* Tab 4 content - Additional Information */}
                      <div className="row text-start">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="photo" className="form-label">
                            Photo URL
                          </label>
                          <Field
                            type="text"
                            name="photo"
                            id="photo"
                            className="form-control"
                            placeholder="Enter image URL"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label htmlFor="is_active" className="form-label d-block">
                            Asset Status
                          </label>
                          <div className="form-check form-switch">
                            <Field
                              type="checkbox"
                              className="form-check-input"
                              id="is_active"
                              checked={values.is_active}
                              onChange={(e) => setFieldValue("is_active", e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="is_active">
                              {values.is_active ? "Active" : "Inactive"}
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="row text-start">
                        <div className="col-12 mb-3">
                          <label htmlFor="notes" className="form-label">
                            Notes
                          </label>
                          <Field
                            as="textarea"
                            name="notes"
                            id="notes"
                            className="form-control"
                            rows="3"
                            placeholder="Enter any additional notes..."
                          />
                        </div>
                      </div>
                    </FormWizard.TabContent>
                  </FormWizard>

                  {/* Non-field errors */}
                  {errors.non_field_errors && errors.non_field_errors.length > 0 && (
                    <div className="alert alert-danger mx-3">
                      {errors.non_field_errors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  )}

                  {/* add style */}
                  <style>{`
                    @import url("https://cdn.jsdelivr.net/gh/lykmapipo/themify-icons@0.1.2/css/themify-icons.css");
                    .form-control {
                        height: 36px;
                        padding: 0.375rem 0.75rem;
                        font-size: 1rem;
                        font-weight: 400;
                        line-height: 1.5;
                        color: #495057;
                        border: 1px solid #ced4da;
                        border-radius: 0.25rem;
                    }
                    .wizard-card-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 2rem 2.5rem;
                        width: 100%;
                    }
                  `}</style>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};