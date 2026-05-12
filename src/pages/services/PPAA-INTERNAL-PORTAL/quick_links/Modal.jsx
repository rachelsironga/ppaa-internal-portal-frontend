import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateQuickLink } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { normalizePublicPortalAssetUrl } from "../../../../helpers/publicPortalAssetUrl";

const QuickLinkModal = ({ selectedObj, setSelectedObj, tableRefresh, setTableRefresh }) => {
  const [errors, setOtherError] = useState({});
  const [logoBase64, setLogoBase64] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [logoPreview, setLogoPreview] = useState("");

  const initialValues = {
    name: selectedObj?.name || "",
    url: selectedObj?.url || "",
    is_active: selectedObj?.is_active !== undefined ? selectedObj.is_active : true,
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    url: Yup.string().url("Must be a valid URL").required("URL is required"),
  });

  const handleLogoFileChange = (event, setFieldValue) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast("Please select an image file", "warning", "Invalid File");
        event.target.value = "";
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size should be less than 5MB", "warning", "File Too Large");
        event.target.value = "";
        return;
      }

      setLogoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setLogoBase64(base64String);
        setLogoPreview(base64String);
        // Clear logo URL field when file is uploaded
        if (setFieldValue) {
          setFieldValue("logo", "");
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Clear file selection
      setLogoBase64("");
      setLogoFileName("");
      setLogoPreview("");
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }

      // Handle logo upload - if file is uploaded, use base64
      if (logoBase64) {
        values.logo_base64 = logoBase64;
        values.logo_name = logoFileName;
      }
      // Remove logo field from values (we only use file upload now)
      delete values.logo;

      const result = await createUpdateQuickLink(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Quick link saved successfully", "success", "Complete");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
        setSelectedObj(null);
        setLogoBase64("");
        setLogoFileName("");
        setLogoPreview("");
      } else if (result.status === 8002) {
        showToast(`${result.message}`, "warning", "Validation Failed");
        setErrors(result.data);
        setOtherError(result.data);
      } else {
        showToast(`${result.message}`, "warning", "Process Failed");
        handleClose();
        resetForm();
      }
    } catch (error) {
      showToast("Something went wrong while saving", "error", "Failed");
      handleClose();
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("quickLinkModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setSelectedObj(null);
    setLogoBase64("");
    setLogoFileName("");
    setLogoPreview("");
  };

  useEffect(() => {
    // Reset logo preview when selectedObj changes
    if (selectedObj?.logo) {
      setLogoPreview(normalizePublicPortalAssetUrl(selectedObj.logo));
    } else {
      setLogoPreview("");
    }
    setLogoBase64("");
    setLogoFileName("");
  }, [selectedObj]);

  useEffect(() => {
    const modalElement = document.getElementById("quickLinkModal");
    if (!modalElement) return;

    const handleHidden = () => {
      setSelectedObj(null);
      setLogoBase64("");
      setLogoFileName("");
      setLogoPreview("");
    };

    modalElement.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, []);

  return (
    <div
      className="modal modal-slide-in"
      id="quickLinkModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedObj === null ? "Create New" : "Update"} Quick Link
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
            {({ isSubmitting, setFieldValue, values }) => (
              <Form>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Link Name *</label>
                      <Field
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Enter link name"
                      />
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">URL *</label>
                      <Field
                        type="url"
                        name="url"
                        className="form-control"
                        placeholder="https://example.com"
                      />
                      <ErrorMessage
                        name="url"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">Logo (Optional)</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => handleLogoFileChange(e, setFieldValue)}
                      />
                      <small className="text-muted">Upload an image file (max 5MB)</small>
                      {logoBase64 && (
                        <div className="mt-2">
                          <small className="text-info">
                            <i className="bx bx-info-circle me-1"></i>
                            File selected: {logoFileName}
                          </small>
                        </div>
                      )}
                      {logoPreview && (
                        <div className="mt-2">
                          <img 
                            src={logoPreview} 
                            alt="Logo preview"
                            style={{ maxWidth: "150px", maxHeight: "150px", objectFit: "contain", border: "1px solid #ddd", padding: "5px", borderRadius: "4px" }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="col-md-12 mb-3">
                      <div className="form-check form-switch">
                        <Field
                          type="checkbox"
                          name="is_active"
                          className="form-check-input"
                          id="is_active"
                        />
                        <label className="form-check-label" htmlFor="is_active">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-label-secondary"
                    onClick={handleClose}
                    data-bs-dismiss="modal"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
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

export default QuickLinkModal;

