import React, { useContext, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { uploadAssets } from "./Queries";
import { AssetContext } from "../../../../utils/context";
import showToast from "../../../../helpers/ToastHelper";

export const SoftwareAssetImportModal = ({ loadOnlyModal = false }) => {
  const { setTableRefresh } = useContext(AssetContext);
  const [errors, setOtherError] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const initialValues = {
    file: "",
    override_existing: false,
    skip_duplicates: true,
  };

  const validationSchema = Yup.object().shape({
    file: Yup.string().required("Excel File is required"),
  });

  const handleUpload = async (values, { setSubmitting, resetForm, setErrors }) => {
    if (!fileInputRef.current || !fileInputRef.current.files[0]) {
      Swal.fire("Error!", "No file selected. Please choose a file to upload.", "error");
      return;
    }

    try {
      const file = fileInputRef.current.files[0];
      
      const fileSize = file.size / 1024 / 1024;
      if (fileSize > 10) {
        Swal.fire("Error!", "File size must be less than 10MB", "error");
        return;
      }

      const confirmation = await Swal.fire({
        title: "Import Software Assets?",
        html: `
          <p>You're about to import software assets from:</p>
          <p class="fw-bold">${file.name}</p>
          <p class="text-muted small">File size: ${fileSize.toFixed(2)} MB</p>
          ${values.skip_duplicates ? '<p class="text-info small">Duplicate assets will be skipped</p>' : ''}
          ${values.override_existing ? '<p class="text-warning small">Existing assets will be overridden</p>' : ''}
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Yes, Import",
        cancelButtonText: "Cancel",
      });

      if (confirmation.isConfirmed) {
        setSubmitting(true);
        handleClose();

        Swal.fire({
          title: "Uploading...",
          html: '<div class="progress"><div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%" id="upload-progress"></div></div>',
          showConfirmButton: false,
          allowOutsideClick: false,
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("override_existing", values.override_existing);
        formData.append("skip_duplicates", values.skip_duplicates);

        const progressBar = document.getElementById("upload-progress");
        const interval = setInterval(() => {
          const currentWidth = parseInt(progressBar.style.width);
          if (currentWidth < 90) {
            progressBar.style.width = `${currentWidth + 10}%`;
          }
        }, 200);

        const result = await uploadAssets(formData);
        
        clearInterval(interval);
        if (progressBar) progressBar.style.width = "100%";

        if (result.status === 200 || result.status === 8000) {
          const imported = result.data?.imported || result.imported || 0;
          const skipped = result.data?.skipped || result.skipped || 0;
          const errors = result.data?.errors || result.errors || 0;

          Swal.fire({
            title: "Import Completed!",
            html: `
              <div class="text-start">
                <p class="mb-2"><strong>Import Summary:</strong></p>
                <ul class="list-unstyled">
                  <li class="text-success"><i class="bx bx-check-circle"></i> Successfully imported: <strong>${imported}</strong> assets</li>
                  ${skipped > 0 ? `<li class="text-warning"><i class="bx bx-error-circle"></i> Skipped: <strong>${skipped}</strong> duplicates</li>` : ''}
                  ${errors > 0 ? `<li class="text-danger"><i class="bx bx-x-circle"></i> Errors: <strong>${errors}</strong> failed</li>` : ''}
                </ul>
                ${result.data?.error_details ? `<p class="text-muted small mt-2">Check console for detailed errors</p>` : ''}
              </div>
            `,
            icon: errors > 0 ? "warning" : "success",
            confirmButtonText: "OK"
          });

          if (result.data?.error_details) {
            console.error("Import errors:", result.data.error_details);
          }

          resetForm();
          if (fileInputRef.current) fileInputRef.current.value = "";
          setTableRefresh((prev) => prev + 1);
        } else if (result.status === 8002) {
          Swal.fire("Validation Error!", result.message || "Invalid data format", "error");
          setErrors(result.data);
          setOtherError(result.data);
        } else {
          Swal.fire("Error!", result.message || "Import failed", "error");
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire(
        "Upload Failed",
        error.response?.data?.message || "Unable to upload file. Please try again or contact support.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("softwareAssetImportModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  return (
    <div
      className="modal modal-slide-in"
      id="softwareAssetImportModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <i className="bx bx-upload me-2"></i>
              Import Software Assets
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
            onSubmit={handleUpload}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form>
                <div className="modal-body">
                  <div className="alert alert-success mb-3">
                    <i className="bx bx-info-circle me-2"></i>
                    <strong>Instructions:</strong>
                    <ul className="mb-0 mt-2 small">
                      <li>Download the Excel template below</li>
                      <li>Fill in your software asset data</li>
                      <li>Upload the completed file</li>
                      <li>Maximum file size: 10MB</li>
                    </ul>
                  </div>

                  <div className="mb-3">
                    <a
                      href="/assets/templates/software_assets_template.xlsx"
                      download
                      className="btn btn-sm btn-outline-success w-100"
                    >
                      <i className="bx bx-download me-2"></i>
                      Download Excel Template
                    </a>
                  </div>

                  <hr />

                  <div className="mb-3">
                    <label htmlFor="file" className="form-label fw-bold">
                      Select Excel File to Import *
                    </label>
                    <div className="input-group">
                      <input
                        type="file"
                        name="file"
                        className="form-control"
                        onChange={(event) => {
                          const file = event.currentTarget.files[0];
                          if (file) {
                            setFieldValue("file", file.name);
                          } else {
                            setFieldValue("file", "");
                          }
                        }}
                        ref={fileInputRef}
                        accept=".xlsx,.xls"
                        aria-label="Upload Excel File"
                      />
                      <button
                        className="btn btn-outline-danger"
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                          setFieldValue("file", "");
                        }}
                        title="Clear file"
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                    <ErrorMessage name="file" component="div" className="text-danger small mt-1" />
                    {values.file && (
                      <small className="text-success d-block mt-1">
                        <i className="bx bx-check-circle"></i> {values.file}
                      </small>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Import Options</label>
                    
                    <div className="form-check">
                      <Field
                        type="checkbox"
                        className="form-check-input"
                        id="skip_duplicates"
                        name="skip_duplicates"
                      />
                      <label className="form-check-label" htmlFor="skip_duplicates">
                        Skip duplicate assets
                        <small className="d-block text-muted">Assets with existing asset tags will be skipped</small>
                      </label>
                    </div>

                    <div className="form-check mt-2">
                      <Field
                        type="checkbox"
                        className="form-check-input"
                        id="override_existing"
                        name="override_existing"
                      />
                      <label className="form-check-label" htmlFor="override_existing">
                        Override existing assets
                        <small className="d-block text-muted">Update existing assets with new data</small>
                      </label>
                    </div>
                  </div>

                  {values.skip_duplicates && values.override_existing && (
                    <div className="alert alert-warning small">
                      <i className="bx bx-error-circle me-1"></i>
                      Note: Override will take precedence over skip duplicates
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleClose}
                    className="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                  >
                    <i className="bx bx-x me-1"></i>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !values.file}
                    className="btn btn-success"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="bx bx-loader-alt bx-spin me-1"></i>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="bx bx-upload me-1"></i>
                        Import Assets
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
