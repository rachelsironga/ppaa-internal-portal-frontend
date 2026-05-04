import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateDocument, getDocumentCategories, downloadPortalDocument } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import Select from "react-select";

const DocumentModal = ({ selectedObj, setSelectedObj, tableRefresh, setTableRefresh }) => {
  const [errors, setOtherError] = useState({});
  const [categories, setCategories] = useState([]);
  const [fileBase64, setFileBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentFileDownloading, setCurrentFileDownloading] = useState(false);

  const initialValues = {
    title: selectedObj?.title || "",
    description: selectedObj?.description || "",
    category_uid: selectedObj?.category?.uid || "",
    status: selectedObj?.status || "DRAFT",
    is_public: selectedObj?.is_public || false,
    tags: selectedObj?.tags || "",
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    status: Yup.string().required("Status is required"),
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const catsResult = await getDocumentCategories({ activeOnly: true });

        if (catsResult.status === 200 || catsResult.status === 8000) {
          let rows = catsResult.data || [];
          const cur = selectedObj?.category;
          if (cur?.uid && !rows.some((c) => c.uid === cur.uid)) {
            rows = [...rows, cur];
          }
          setCategories(
            rows.map((cat) => ({
              value: cat.uid,
              label: cat.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };

    fetchOptions();
  }, [selectedObj?.category?.uid]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFileBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      setLoading(true);
      
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }

      // Add file data if provided
      if (fileBase64) {
        values.file_base64 = fileBase64;
        values.file_name = fileName;
      }

      const result = await createUpdateDocument(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Document saved successfully", "success", "Complete");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
        setSelectedObj(null);
        setFileBase64("");
        setFileName("");
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
      setLoading(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("documentModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setSelectedObj(null);
    setFileBase64("");
    setFileName("");
  };

  useEffect(() => {
    const modalElement = document.getElementById("documentModal");
    if (!modalElement) return;

    const handleHidden = () => {
      setSelectedObj(null);
      setFileBase64("");
      setFileName("");
    };

    modalElement.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, []);

  return (
    <div
      className="modal modal-slide-in"
      id="documentModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedObj === null ? "Create New" : "Update"} Document
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
            {({ isSubmitting, values, setFieldValue }) => (
              <Form>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-12 mb-3">
                      <label className="form-label">Title *</label>
                      <Field
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="Enter document title"
                      />
                      <ErrorMessage
                        name="title"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">Description</label>
                      <Field
                        as="textarea"
                        name="description"
                        className="form-control"
                        rows="3"
                        placeholder="Enter description"
                      />
                      <ErrorMessage
                        name="description"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Category</label>
                      <Select
                        options={categories}
                        value={categories.find((cat) => cat.value === values.category_uid) || null}
                        onChange={(option) => setFieldValue("category_uid", option?.value || "")}
                        isClearable
                        placeholder="Select category"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status *</label>
                      <Field as="select" name="status" className="form-select">
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </Field>
                      <ErrorMessage
                        name="status"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tags</label>
                      <Field
                        type="text"
                        name="tags"
                        className="form-control"
                        placeholder="Comma-separated tags"
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <div className="form-check">
                        <Field
                          type="checkbox"
                          name="is_public"
                          className="form-check-input"
                          id="is_public"
                        />
                        <label className="form-check-label" htmlFor="is_public">
                          Make this document public
                        </label>
                      </div>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">File Upload</label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                      />
                      {fileName && (
                        <small className="text-muted">Selected: {fileName}</small>
                      )}
                      {selectedObj?.file_key && !fileBase64 && (
                        <div className="mt-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            disabled={currentFileDownloading}
                            onClick={async () => {
                              if (!selectedObj?.uid) return;
                              setCurrentFileDownloading(true);
                              try {
                                await downloadPortalDocument(
                                  selectedObj.uid,
                                  selectedObj.original_filename || "document"
                                );
                              } catch {
                                showToast(
                                  "Download failed. Re-upload the file if needed.",
                                  "danger",
                                  "Download"
                                );
                              } finally {
                                setCurrentFileDownloading(false);
                              }
                            }}
                          >
                            {currentFileDownloading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" />
                                Loading…
                              </>
                            ) : (
                              <>
                                <i className="bx bx-download me-1"></i> View Current File
                              </>
                            )}
                          </button>
                        </div>
                      )}
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
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting || loading ? "Saving..." : "Save"}
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

export default DocumentModal;

