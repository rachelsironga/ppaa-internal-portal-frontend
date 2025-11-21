import React, { useContext, useEffect, useState, useCallback } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { createUpdateAsset } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { AssetContext } from "../../../../utils/context";
import FormWizard from "react-form-wizard-component";
import "react-form-wizard-component/dist/style.css";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

export const PeripheralAssetModal = ({ loadOnlyModal = false }) => {
  const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } = useContext(AssetContext);

  const [errors, setOtherError] = useState({});
  const [tabsError, setTabsError] = useState([false, false, false, false]);
  const [isValidTab, setIsValidTab] = useState([false, false, false, false]);
  const [isFirstTabChange, setIsFirstTabChange] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    setTabIndex(0);
    setTabsError([false, false, false, false]);
    setIsValidTab([false, false, false, false]);
    setIsFirstTabChange(true);
    setOtherError({});
  }, [selectedObj]);

  const initialValues = {
    // Basic Information
    asset_tag: selectedObj?.asset_tag || "",
    serial_number: selectedObj?.serial_number || "",
    barcode: selectedObj?.barcode || "",
    asset_type: selectedObj?.asset_type_uid || selectedObj?.asset_type?.uid || selectedObj?.asset_type || "",
    manufacturer: selectedObj?.manufacturer_uid || selectedObj?.manufacturer?.uid || selectedObj?.manufacturer || "",
    model: selectedObj?.model || "",
    
    // Peripheral Specific
    peripheral_type: selectedObj?.peripheral_type || "",
    connection_type: selectedObj?.connection_type || "",
    interface_type: selectedObj?.interface_type || "",
    resolution: selectedObj?.resolution || "",
    screen_size: selectedObj?.screen_size || "",
    color: selectedObj?.color || "",
    compatibility: selectedObj?.compatibility || "",
    
    // Asset Information
    purchase_date: selectedObj?.purchase_date || "",
    purchase_cost: selectedObj?.purchase_cost || "",
    supplier: selectedObj?.supplier_uid || selectedObj?.supplier?.uid || selectedObj?.supplier || "",
    status: selectedObj?.status || "operational",
    condition: selectedObj?.condition || "good",
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
    peripheral_type: Yup.string().nullable(),
    serial_number: Yup.string().nullable(),
    status: Yup.string().required("Status is required"),
    condition: Yup.string().nullable(),
    purchase_cost: Yup.number().nullable().positive("Must be positive"),
    manufacturer: Yup.string().nullable(),
    model: Yup.string().nullable(),
    purchase_date: Yup.date().nullable().typeError("Please enter a valid date"),
    warranty_expiry: Yup.date().nullable().typeError("Please enter a valid date"),
  });

  const peripheralTypeOptions = [
    { value: 'monitor', label: 'Monitor' },
    { value: 'keyboard', label: 'Keyboard' },
    { value: 'mouse', label: 'Mouse' },
    { value: 'printer', label: 'Printer' },
    { value: 'scanner', label: 'Scanner' },
    { value: 'speaker', label: 'Speaker' },
    { value: 'webcam', label: 'Webcam' },
    { value: 'headset', label: 'Headset' },
    { value: 'microphone', label: 'Microphone' },
    { value: 'external_drive', label: 'External Drive' },
    { value: 'ups', label: 'UPS' },
    { value: 'docking_station', label: 'Docking Station' },
    { value: 'other', label: 'Other' },
  ];

  const connectionTypeOptions = [
    { value: 'usb', label: 'USB' },
    { value: 'usb-c', label: 'USB-C' },
    { value: 'hdmi', label: 'HDMI' },
    { value: 'displayport', label: 'DisplayPort' },
    { value: 'vga', label: 'VGA' },
    { value: 'bluetooth', label: 'Bluetooth' },
    { value: 'wireless', label: 'Wireless' },
    { value: 'ethernet', label: 'Ethernet' },
    { value: 'thunderbolt', label: 'Thunderbolt' },
    { value: '3.5mm_jack', label: '3.5mm Jack' },
    { value: 'other', label: 'Other' },
  ];

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

  const conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
  ];

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      const submitData = { ...values };
      
      if (selectedObj) {
        submitData.uid = selectedObj.uid;
      }
      
      setSubmitting(true);
      const result = await createUpdateAsset(submitData);

      if (result.status === 200 || result.status === 8000) {
        showToast("success", `Peripheral Asset ${selectedObj ? 'Updated' : 'Created'} Successfully`);
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
      console.error("Peripheral asset submission error:", error);
      showToast("error", "Something went wrong while saving peripheral asset");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedObj(null);
    setIsFirstTabChange(true);
    const modalElement = document.getElementById("peripheralAssetModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

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
        // Peripheral specs - all optional
        return true;
      }
      if (tabIndex === 4) {
        await validationSchema.validateAt("purchase_date", values);
        await validationSchema.validateAt("purchase_cost", values);
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
          handleSubmit(values, { setSubmitting, resetForm, setErrors, setTouched });
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

  return (
    <div
      className="modal modal-slide-in"
      id="peripheralAssetModal"
      tabIndex="-1"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-xl" role="document">
        <div className="modal-content">
          <div className="modal-header text-white">
            <h5 className="modal-title">
              <i className="bx bx-devices me-2"></i>
              {selectedObj ? "Update Peripheral Asset" : "Create New Peripheral Asset"}
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
                  color="#17a2b8"
                  stepSize="xs"
                  onTabChange={({ prevIndex, nextIndex }) => {
                    setTimeout(() => setTabIndex(nextIndex), 0);
                  }}
                  backButtonTemplate={(handlePrevious) => (
                    <button
                      type="button"
                      className="btn btn-sm btn-info"
                      style={{ width: "100px" }}
                      onClick={handlePrevious}
                    >
                      <i className="bx bx-left-arrow-alt"></i> Back
                    </button>
                  )}
                  nextButtonTemplate={(handleNext) => (
                    <button
                      type="button"
                      className="btn btn-sm btn-info"
                      style={{ width: "100px", marginLeft: "auto" }}
                      onClick={async () =>
                        await tabChanged(
                          { handleNext },
                          values,
                          setSubmitting,
                          resetForm,
                          setErrors,
                          setFieldError,
                          setTouched,
                          4
                        )
                      }
                    >
                      Next <i className="bx bx-right-arrow-alt"></i>
                    </button>
                  )}
                  finishButtonTemplate={(handleNext) => (
                    <button
                      type="button"
                      className="btn btn-sm btn-info"
                      style={{ width: "150px", marginLeft: "auto" }}
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
                          4
                        )
                      }
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
                  )}
                >
                  {/* Tab 1: Basic Information */}
                  <FormWizard.TabContent
                    title="Basic Info"
                    icon="ti-tag"
                    showErrorOnTab={tabsError[0]}
                  >
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="asset_tag" className="form-label">Asset Tag *</label>
                        <Field
                          type="text"
                          name="asset_tag"
                          className="form-control"
                          placeholder="e.g., PER-MOUSE-001"
                        />
                        <ErrorMessage name="asset_tag" component="div" className="text-danger small" />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="peripheral_type" className="form-label">Peripheral Type</label>
                        <Field as="select" name="peripheral_type" className="form-select">
                          <option value="">Select Peripheral Type</option>
                          {peripheralTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Field>
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="serial_number" className="form-label">Serial Number</label>
                        <Field
                          type="text"
                          name="serial_number"
                          className="form-control"
                          placeholder="Enter Serial Number"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="barcode" className="form-label">Barcode</label>
                        <Field
                          type="text"
                          name="barcode"
                          className="form-control"
                          placeholder="Enter Barcode"
                        />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <FormikSelect
                          name="asset_type"
                          label="Asset Type *"
                          url="/asset-types"
                          containerClass="mb-0"
                          filters={{ page: 1, page_size: 10, paginated: true }}
                          mapOption={(item) => ({ value: item.uid, label: item.name })}
                          placeholder="Select Asset Type"
                          isRequired={true}
                        />
                        <ErrorMessage name="asset_type" component="div" className="text-danger small" />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="status" className="form-label">Status *</label>
                        <Field as="select" name="status" className="form-select">
                          <option value="">Select Status</option>
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Field>
                        <ErrorMessage name="status" component="div" className="text-danger small" />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="condition" className="form-label">Condition</label>
                        <Field as="select" name="condition" className="form-select">
                          <option value="">Select Condition</option>
                          {conditionOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Field>
                      </div>
                    </div>
                  </FormWizard.TabContent>

                  {/* Tab 2: Hardware & Location */}
                  <FormWizard.TabContent
                    title="Hardware"
                    icon="ti-layout-media-center"
                    isValid={isValidTab[0]}
                    showErrorOnTab={tabsError[1]}
                  >
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <FormikSelect
                          name="manufacturer"
                          label="Manufacturer"
                          url="/asset-manufacturers"
                          containerClass="mb-0"
                          filters={{ page: 1, page_size: 10, paginated: true }}
                          mapOption={(item) => ({ value: item.uid, label: item.name })}
                          placeholder="Select Manufacturer"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="model" className="form-label">Model</label>
                        <Field
                          type="text"
                          name="model"
                          className="form-control"
                          placeholder="e.g., Logitech MX Master 3"
                        />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="color" className="form-label">Color</label>
                        <Field
                          type="text"
                          name="color"
                          className="form-control"
                          placeholder="e.g., Black, White, Silver"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="connection_type" className="form-label">Connection Type</label>
                        <Field as="select" name="connection_type" className="form-select">
                          <option value="">Select Connection Type</option>
                          {connectionTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Field>
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
                          mapOption={(item) => ({ value: item.uid, label: item.name })}
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
                          mapOption={(item) => ({ value: item.guid, label: item.full_name })}
                          placeholder="Search Custodian"
                        />
                      </div>
                    </div>
                  </FormWizard.TabContent>

                  {/* Tab 3: Peripheral Specifications */}
                  <FormWizard.TabContent
                    title="Specifications"
                    icon="ti-settings"
                    isValid={isValidTab[1]}
                    showErrorOnTab={tabsError[2]}
                  >
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="interface_type" className="form-label">Interface Type</label>
                        <Field
                          type="text"
                          name="interface_type"
                          className="form-control"
                          placeholder="e.g., USB 2.0, USB 3.0, Wireless"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="resolution" className="form-label">Resolution (for displays)</label>
                        <Field
                          type="text"
                          name="resolution"
                          className="form-control"
                          placeholder="e.g., 1920x1080, 4K"
                        />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="screen_size" className="form-label">Screen Size (for monitors)</label>
                        <Field
                          type="text"
                          name="screen_size"
                          className="form-control"
                          placeholder="e.g., 24 inches, 27 inches"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="compatibility" className="form-label">Compatibility</label>
                        <Field
                          type="text"
                          name="compatibility"
                          className="form-control"
                          placeholder="e.g., Windows, Mac, Linux"
                        />
                      </div>
                    </div>
                  </FormWizard.TabContent>

                  {/* Tab 4: Purchase & Additional Info */}
                  <FormWizard.TabContent
                    title="Purchase"
                    icon="ti-shopping-cart"
                    isValid={isValidTab[2]}
                    showErrorOnTab={tabsError[3]}
                  >
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="purchase_date" className="form-label">Purchase Date</label>
                        <Field type="date" name="purchase_date" className="form-control" />
                        <ErrorMessage name="purchase_date" component="div" className="text-danger small" />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="purchase_cost" className="form-label">Purchase Cost</label>
                        <Field
                          type="number"
                          name="purchase_cost"
                          className="form-control"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                        <ErrorMessage name="purchase_cost" component="div" className="text-danger small" />
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
                          mapOption={(item) => ({ value: item.uid, label: item.name })}
                          placeholder="Select Supplier"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="warranty_expiry" className="form-label">Warranty Expiry</label>
                        <Field type="date" name="warranty_expiry" className="form-control" />
                        <ErrorMessage name="warranty_expiry" component="div" className="text-danger small" />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="photo" className="form-label">Photo URL</label>
                        <Field
                          type="text"
                          name="photo"
                          className="form-control"
                          placeholder="Enter image URL"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="is_active" className="form-label d-block">Asset Status</label>
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
                        <label htmlFor="notes" className="form-label">Notes</label>
                        <Field
                          as="textarea"
                          name="notes"
                          className="form-control"
                          rows="3"
                          placeholder="Enter any additional notes about this peripheral..."
                        />
                      </div>
                    </div>
                  </FormWizard.TabContent>
                </FormWizard>

                {errors.non_field_errors && errors.non_field_errors.length > 0 && (
                  <div className="alert alert-danger mx-3">
                    {errors.non_field_errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                )}

                <style>{`
                  @import url("https://cdn.jsdelivr.net/gh/lykmapipo/themify-icons@0.1.2/css/themify-icons.css");
                  .form-control, .form-select {
                    height: 36px;
                    padding: 0.375rem 0.75rem;
                    font-size: 1rem;
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
  );
};
