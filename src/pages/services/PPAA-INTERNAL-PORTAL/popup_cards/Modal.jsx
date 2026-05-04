import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdatePopupCard } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";

const PopupCardModal = ({ selectedObj, setSelectedObj, tableRefresh, setTableRefresh }) => {
  const [errors, setOtherError] = useState({});
  const [esImageBase64, setEsImageBase64] = useState("");
  const [esImageName, setEsImageName] = useState("");
  const [esImagePreview, setEsImagePreview] = useState("");

  const initialValues = {
    motivational_quote: selectedObj?.motivational_quote || "",
    gratitude_message: selectedObj?.gratitude_message || "",
  };

  const validationSchema = Yup.object().shape({
    motivational_quote: Yup.string(),
    gratitude_message: Yup.string(),
  });

  const handleEsImageChange = (event, setFieldValue) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file", "warning", "Invalid File");
        event.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size should be less than 5MB", "warning", "File Too Large");
        event.target.value = "";
        return;
      }
      setEsImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        setEsImageBase64(base64);
        setEsImagePreview(base64);
      };
      reader.readAsDataURL(file);
    } else {
      setEsImageBase64("");
      setEsImageName("");
      setEsImagePreview("");
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      const payload = { ...values };
      if (selectedObj) payload.uid = selectedObj.uid;
      if (esImageBase64) {
        payload.es_image_base64 = esImageBase64;
        payload.es_image_name = esImageName;
      }

      const result = await createUpdatePopupCard(payload);

      if (result.status === 200 || result.status === 8000) {
        showToast("Popup card saved successfully", "success", "Complete");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
        setSelectedObj(null);
        setEsImageBase64("");
        setEsImageName("");
        setEsImagePreview("");
      } else if (result.status === 8002) {
        showToast(`${result.message}`, "warning", "Validation Failed");
        setErrors(result.data || {});
        setOtherError(result.data || {});
      } else {
        showToast(result.message || "Failed to save", "warning", "Process Failed");
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
    const modalElement = document.getElementById("popupCardModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setSelectedObj(null);
    setEsImageBase64("");
    setEsImageName("");
    setEsImagePreview("");
  };

  useEffect(() => {
    if (selectedObj?.es_image_url) {
      setEsImagePreview(selectedObj.es_image_url);
    } else {
      setEsImagePreview("");
    }
    setEsImageBase64("");
    setEsImageName("");
  }, [selectedObj]);

  useEffect(() => {
    const modalElement = document.getElementById("popupCardModal");
    if (!modalElement) return;
    const handleHidden = () => {
      setSelectedObj(null);
      setEsImageBase64("");
      setEsImageName("");
      setEsImagePreview("");
    };
    modalElement.addEventListener("hidden.bs.modal", handleHidden);
    return () => modalElement.removeEventListener("hidden.bs.modal", handleHidden);
  }, []);

  return (
    <div
      className="modal modal-slide-in"
      id="popupCardModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedObj == null ? "Create New" : "Update"} Popup Card
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
            {({ isSubmitting, setFieldValue }) => (
              <Form>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Motivational Quote</label>
                      <Field
                        as="textarea"
                        name="motivational_quote"
                        className="form-control"
                        rows="3"
                        placeholder="Enter a motivational quote"
                      />
                      <ErrorMessage name="motivational_quote" component="div" className="text-danger small" />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Gratitude Message</label>
                      <Field
                        as="textarea"
                        name="gratitude_message"
                        className="form-control"
                        rows="3"
                        placeholder="Enter a gratitude message"
                      />
                      <ErrorMessage name="gratitude_message" component="div" className="text-danger small" />
                    </div>
                    <div className="col-md-12 mb-3">
                      <label className="form-label">ES Image (Optional)</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => handleEsImageChange(e, setFieldValue)}
                      />
                      <small className="text-muted">Upload an image (max 5MB)</small>
                      {esImagePreview && (
                        <div className="mt-2">
                          <img
                            src={esImagePreview}
                            alt="ES preview"
                            style={{
                              maxWidth: "150px",
                              maxHeight: "150px",
                              objectFit: "contain",
                              border: "1px solid #ddd",
                              borderRadius: "4px",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-label-secondary" onClick={handleClose} data-bs-dismiss="modal">
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
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

export default PopupCardModal;
