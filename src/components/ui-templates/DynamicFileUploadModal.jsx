import React, { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { Based64Helper } from "../../helpers/Based64Helper";

export const DynamicFileUploadModal = ({
  title = "File Upload",
  description = "Please upload your file",
  acceptedTypes = ["*/*"], // Default to all file types
  maxSizeMB = 10,
  downloadTemplateUrl = null,
  templateFileName = "template",
  onSubmitHandler,
  buttonText = "Upload File",
  buttonIcon = "bx bx-upload",
  showPreview = false,
  children,
}) => {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const initialValues = {
    file: null,
    // Add any additional fields here
  };

  const validationSchema = Yup.object().shape({
    file: Yup.mixed()
      .required("File is required")
      .test(
        "fileSize",
        `File too large (max ${maxSizeMB}MB)`,
        (value) => !value || (value && value.size <= maxSizeMB * 1024 * 1024)
      )
      .test(
        "fileType",
        "Unsupported file format",
        (value) =>
          !value ||
          (value &&
            acceptedTypes.some((type) => {
              if (type === "*/*") return true;
              const acceptedType = type.split("/")[1];
              const fileType = value.type.split("/")[1];
              return (
                value.type.includes(type) ||
                (acceptedType === "*" &&
                  value.type.startsWith(type.split("/")[0])) ||
                (!value.type && type.includes("application/")) // For files without type
              );
            }))
      ),
  });

  const handleFileChange = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setFieldValue("file", file);

      // Create preview if enabled and file is an image
      if (showPreview && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    } else {
      setFieldValue("file", null);
      setPreview(null);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setIsLoading(true);
      setUploadProgress(0);

      // Simulate upload progress (replace with actual upload progress in your API call)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Convert file to Base64 if needed
      if (values.file) {
        const base64File = await Based64Helper.fileToBase64(values.file);
        values.file = base64File;
      }

      // Call the provided submit handler
      const result = await onSubmitHandler(values, setUploadProgress);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result?.success) {
        Swal.fire(
          "Success!",
          result.message || "File uploaded successfully",
          "success"
        );
        resetForm();
        fileInputRef.current.value = null;
        setPreview(null);
      } else if (result?.error) {
        Swal.fire("Error!", result.message || "Failed to upload file", "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire(
        "Error!",
        error.message || "An error occurred during upload",
        "error"
      );
    } finally {
      setIsLoading(false);
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("dynamicFileUploadModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  const getAcceptedTypesString = () => {
    return acceptedTypes
      .map((type) => {
        if (type === "*/*") return "All files";
        if (type.endsWith("/*")) return `${type.split("/")[0]} files`;
        return type;
      })
      .join(", ");
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-primary ms-auto btn-sm me-4"
        data-bs-toggle="modal"
        data-bs-target="#dynamicFileUploadModal"
      >
        <i className={buttonIcon}></i> {buttonText}
      </button>

      <div
        className="modal fade"
        id="dynamicFileUploadModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, setFieldValue }) => (
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setFieldValue("file", null);
                      handleClose();
                    }}
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>

                <Form>
                  <div className="modal-body">
                    <div className="mb-3">
                      <h6 className="fw-bold mb-1">{title}</h6>
                      <p
                        className="text-muted mb-2"
                        style={{ fontSize: "0.98em" }}
                      >
                        {description}
                      </p>
                      <p className="text-muted small">
                        Accepted formats: {getAcceptedTypesString()} | Max size:{" "}
                        {maxSizeMB}MB
                      </p>

                      {downloadTemplateUrl && (
                        <a
                          href={downloadTemplateUrl}
                          download={templateFileName}
                          className="btn btn-sm btn-outline-secondary mb-3"
                          style={{ fontSize: "0.95em" }}
                        >
                          <i className="bx bx-download"></i> Download Template
                        </a>
                      )}
                    </div>

                    {children}

                    <div className="mb-3">
                      <label htmlFor="file" className="form-label">
                        Select file to upload
                      </label>
                      <div className="input-group">
                        <input
                          type="file"
                          name="file"
                          className="form-control"
                          onChange={(event) =>
                            handleFileChange(event, setFieldValue)
                          }
                          ref={fileInputRef}
                          accept={acceptedTypes.join(",")}
                          aria-label="Upload"
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => {
                            fileInputRef.current.value = null;
                            setFieldValue("file", null);
                            setPreview(null);
                          }}
                        >
                          <i className="bx bx-x"></i>
                        </button>
                      </div>
                      <ErrorMessage
                        name="file"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    {showPreview && preview && (
                      <div className="mb-3">
                        <label className="form-label">Preview</label>
                        <div className="border p-2 text-center">
                          <img
                            src={preview}
                            alt="Preview"
                            className="img-fluid"
                            style={{ maxHeight: "200px" }}
                          />
                        </div>
                      </div>
                    )}

                    {isLoading && (
                      <div className="mb-3">
                        <div className="progress">
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            role="progressbar"
                            style={{ width: `${uploadProgress}%` }}
                            aria-valuenow={uploadProgress}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {uploadProgress}%
                          </div>
                        </div>
                        <div className="text-center small mt-2">
                          Uploading... Please wait
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setFieldValue("file", null);
                        handleClose();
                      }}
                      className="btn btn-outline-secondary"
                      data-bs-dismiss="modal"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      {isSubmitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Uploading...
                        </>
                      ) : (
                        "Upload"
                      )}
                    </button>
                  </div>
                </Form>
              </div>
            </div>
          )}
        </Formik>
      </div>
    </>
  );
};
