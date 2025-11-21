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

export const SoftwareAssetModal = ({ loadOnlyModal = false }) => {
  const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } = useContext(AssetContext);

  const [errors, setOtherError] = useState({});
  const [tabsError, setTabsError] = useState([false, false, false]);
  const [isValidTab, setIsValidTab] = useState([false, false, false]);
  const [isFirstTabChange, setIsFirstTabChange] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    setTabIndex(0);
    setTabsError([false, false, false]);
    setIsValidTab([false, false, false]);
    setIsFirstTabChange(true);
    setOtherError({});
  }, [selectedObj]);

  const initialValues = {
    // Basic Information
    asset_tag: selectedObj?.asset_tag || "",
    software_name: selectedObj?.software_name || "",
    version: selectedObj?.version || "",
    asset_type: selectedObj?.asset_type_uid || selectedObj?.asset_type?.uid || selectedObj?.asset_type || "",
    publisher: selectedObj?.publisher || "",
    
    // Software Specific
    software_type: selectedObj?.software_type || "",
    license_type: selectedObj?.license_type || "",
    license_key: selectedObj?.license_key || "",
    total_licenses: selectedObj?.total_licenses || "",
    used_licenses: selectedObj?.used_licenses || "",
    available_licenses: selectedObj?.available_licenses || "",
    license_expiry: selectedObj?.license_expiry || "",
    
    // Technical Details
    platform: selectedObj?.platform || "",
    system_requirements: selectedObj?.system_requirements || "",
    installation_path: selectedObj?.installation_path || "",
    support_url: selectedObj?.support_url || "",
    documentation_url: selectedObj?.documentation_url || "",
    
    // Purchase Information
    purchase_date: selectedObj?.purchase_date || "",
    purchase_cost: selectedObj?.purchase_cost || "",
    supplier: selectedObj?.supplier_uid || selectedObj?.supplier?.uid || selectedObj?.supplier || "",
    status: selectedObj?.status || "active",
    notes: selectedObj?.notes || "",
    is_active: selectedObj?.is_active ?? true,
  };

  const validationSchema = Yup.object().shape({
    asset_tag: Yup.string().required("Asset Tag is required"),
    software_name: Yup.string().required("Software Name is required"),
    asset_type: Yup.string().required("Asset Type is required"),
    version: Yup.string().nullable(),
    status: Yup.string().required("Status is required"),
    purchase_cost: Yup.number().nullable().positive("Must be positive"),
    total_licenses: Yup.number().nullable().positive().integer(),
    used_licenses: Yup.number().nullable().min(0).integer(),
    purchase_date: Yup.date().nullable().typeError("Please enter a valid date"),
    license_expiry: Yup.date().nullable().typeError("Please enter a valid date"),
  });

  const softwareTypeOptions = [
      { value: 'operating_system', label: 'Operating System' },
      { value: 'application', label: 'Application' },
      { value: 'utility', label: 'Utility' },
      { value: 'productivity', label: 'productivity' },
      { value: 'database', label: 'Database' },
      { value: 'development_tool', label: 'Development Tool' },
      { value: 'security', label: 'Security Software' },
      { value: 'office_suite', label: 'Office Suite' },
      { value: 'graphics_design', label: 'Graphics/Design' },
      { value: 'server_software', label: 'Server Software' },
      { value: 'virtualization', label: 'Virtualization' },
      { value: 'backup', label: 'Backup Software' },
      { value: 'antivirus', label: 'Antivirus' },
      { value: 'other', label: 'Other' },
  ];

  const licenseTypeOptions = [
    { value: 'perpetual', label: 'Perpetual' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'trial', label: 'Trial' },
    { value: 'freeware', label: 'Freeware' },
    { value: 'open_source', label: 'Open Source' },
    { value: 'site_license', label: 'Site License' },
    { value: 'volume', label: 'Volume License' },
    { value: 'oem', label: 'OEM' },
    { value: 'concurrent', label: 'Concurrent' },
    { value: 'other', label: 'Other' },
  ];

  const platformOptions = [
    { value: 'windows', label: 'Windows' },
    { value: 'linux', label: 'Linux' },
    { value: 'macos', label: 'macOS' },
    { value: 'android', label: 'Android' },
    { value: 'ios', label: 'iOS' },
    { value: 'web', label: 'Web-based' },
    { value: 'cross_platform', label: 'Cross-Platform' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'trial', label: 'Trial' },
    { value: 'expired', label: 'Expired' },
    { value: 'deprecated', label: 'Deprecated' },
    { value: 'operational', label: 'Operational' },
    { value: 'retired', label: 'Retired' },
    { value: 'disposed', label: 'Disposed' },
    { value: 'other', label: 'Other' },
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
        showToast("success", `Software Asset ${selectedObj ? 'Updated' : 'Created'} Successfully`);
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
      console.error("Software asset submission error:", error);
      showToast("error", "Something went wrong while saving software asset");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedObj(null);
    setIsFirstTabChange(true);
    const modalElement = document.getElementById("softwareAssetModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  const validateTab = useCallback(async (values, setFieldError, setTouched) => {
    try {
      if (tabIndex === 1) {
        await validationSchema.validateAt("asset_tag", values);
        await validationSchema.validateAt("software_name", values);
        await validationSchema.validateAt("asset_type", values);
        await validationSchema.validateAt("status", values);
      }
      if (tabIndex === 2) {
        await validationSchema.validateAt("total_licenses", values);
        await validationSchema.validateAt("used_licenses", values);
      }
      if (tabIndex === 3) {
        await validationSchema.validateAt("purchase_date", values);
        await validationSchema.validateAt("purchase_cost", values);
        await validationSchema.validateAt("license_expiry", values);
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
      id="softwareAssetModal"
      tabIndex="-1"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-xl" role="document">
        <div className="modal-content">
          <div className="modal-header text-white">
            <h5 className="modal-title">
              <i className="bx bx-code-alt me-2"></i>
              {selectedObj ? "Update Software Asset" : "Create New Software Asset"}
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
                  stepSize="xs"
                  onTabChange={({ prevIndex, nextIndex }) => {
                    setTimeout(() => setTabIndex(nextIndex), 0);
                  }}
                  backButtonTemplate={(handlePrevious) => (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ width: "100px" }}
                      onClick={handlePrevious}
                    >
                      <i className="bx bx-left-arrow-alt"></i> Back
                    </button>
                  )}
                  nextButtonTemplate={(handleNext) => (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
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
                          3
                        )
                      }
                    >
                      Next <i className="bx bx-right-arrow-alt"></i>
                    </button>
                  )}
                  finishButtonTemplate={(handleNext) => (
                    <button
                      type="button"
                      className="btn btn-sm btn-pr"
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
                          3
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
                    icon="ti-info"
                    showErrorOnTab={tabsError[0]}
                  >
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="asset_tag" className="form-label">Asset Tag *</label>
                        <Field
                          type="text"
                          name="asset_tag"
                          className="form-control"
                          placeholder="e.g., SOFT-WIN11-001"
                        />
                        <ErrorMessage name="asset_tag" component="div" className="text-danger small" />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="software_name" className="form-label">Software Name *</label>
                        <Field
                          type="text"
                          name="software_name"
                          className="form-control"
                          placeholder="e.g., Microsoft Office 365"
                        />
                        <ErrorMessage name="software_name" component="div" className="text-danger small" />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="version" className="form-label">Version</label>
                        <Field
                          type="text"
                          name="version"
                          className="form-control"
                          placeholder="e.g., 2023, v1.5.2"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="publisher" className="form-label">Publisher/Vendor</label>
                        <Field
                          type="text"
                          name="publisher"
                          className="form-control"
                          placeholder="e.g., Microsoft, Adobe"
                        />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="software_type" className="form-label">Software Type</label>
                        <Field as="select" name="software_type" className="form-select">
                          <option value="">Select Software Type</option>
                          {softwareTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Field>
                      </div>
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
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="platform" className="form-label">Platform</label>
                        <Field as="select" name="platform" className="form-select">
                          <option value="">Select Platform</option>
                          {platformOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Field>
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
                  </FormWizard.TabContent>

                  {/* Tab 2: License Information */}
                  <FormWizard.TabContent
                    title="License"
                    icon="ti-key"
                    isValid={isValidTab[0]}
                    showErrorOnTab={tabsError[1]}
                  >
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="license_type" className="form-label">License Type</label>
                        <Field as="select" name="license_type" className="form-select">
                          <option value="">Select License Type</option>
                          {licenseTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Field>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="license_key" className="form-label">License Key</label>
                        <Field
                          type="text"
                          name="license_key"
                          className="form-control"
                          placeholder="Enter license key"
                        />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-4 mb-3">
                        <label htmlFor="total_licenses" className="form-label">Total Licenses</label>
                        <Field
                          type="number"
                          name="total_licenses"
                          className="form-control"
                          placeholder="0"
                          min="0"
                        />
                        <ErrorMessage name="total_licenses" component="div" className="text-danger small" />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label htmlFor="used_licenses" className="form-label">Used Licenses</label>
                        <Field
                          type="number"
                          name="used_licenses"
                          className="form-control"
                          placeholder="0"
                          min="0"
                        />
                        <ErrorMessage name="used_licenses" component="div" className="text-danger small" />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label htmlFor="available_licenses" className="form-label">Available Licenses</label>
                        <Field
                          type="number"
                          name="available_licenses"
                          className="form-control"
                          placeholder="0"
                          min="0"
                          disabled
                          value={
                            (parseInt(values.total_licenses) || 0) - (parseInt(values.used_licenses) || 0)
                          }
                        />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="license_expiry" className="form-label">License Expiry Date</label>
                        <Field type="date" name="license_expiry" className="form-control" />
                        <ErrorMessage name="license_expiry" component="div" className="text-danger small" />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="system_requirements" className="form-label">System Requirements</label>
                        <Field
                          as="textarea"
                          name="system_requirements"
                          className="form-control"
                          rows="2"
                          placeholder="e.g., 4GB RAM, 2GHz CPU"
                        />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-6 mb-3">
                        <label htmlFor="installation_path" className="form-label">Installation Path</label>
                        <Field
                          type="text"
                          name="installation_path"
                          className="form-control"
                          placeholder="e.g., C:\Program Files\..."
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label htmlFor="support_url" className="form-label">Support URL</label>
                        <Field
                          type="text"
                          name="support_url"
                          className="form-control"
                          placeholder="https://support.example.com"
                        />
                      </div>
                    </div>
                    <div className="row text-start">
                      <div className="col-md-12 mb-3">
                        <label htmlFor="documentation_url" className="form-label">Documentation URL</label>
                        <Field
                          type="text"
                          name="documentation_url"
                          className="form-control"
                          placeholder="https://docs.example.com"
                        />
                      </div>
                    </div>
                  </FormWizard.TabContent>

                  {/* Tab 3: Purchase & Additional Info */}
                  <FormWizard.TabContent
                    title="Purchase"
                    icon="ti-shopping-cart"
                    isValid={isValidTab[1]}
                    showErrorOnTab={tabsError[2]}
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
                          label="Supplier/Vendor"
                          url="/asset-suppliers"
                          containerClass="mb-0"
                          filters={{ page: 1, page_size: 10, paginated: true }}
                          mapOption={(item) => ({ value: item.uid, label: item.name })}
                          placeholder="Select Supplier"
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
                          rows="4"
                          placeholder="Enter any additional notes about this software..."
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
                  textarea.form-control {
                    height: auto;
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
