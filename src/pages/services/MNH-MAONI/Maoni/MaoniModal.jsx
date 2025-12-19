import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { MaoniContext } from "../../../../utils/context"; // You'll need to create this context
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createUpdateData, fetchData } from "../../../../utils/GlobalQueries";

const MaoniModal = ({ onClose, loadOnlyModal = false }) => {
  const user = useSelector((state) => state.userReducer?.data);

  // Context for maoni management (you'll need to create this)
  const { handleFetchData, selectedMaoni, setSelectedMaoni } =
    useContext(MaoniContext);

  const [errors, setOtherError] = useState({});
  const [categories, setCategories] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [attachments, setAttachments] = useState([]);

  // Fetch categories and directories on modal open
  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
    if (directories.length === 0) {
      fetchDirectories();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await fetchData({ url: "/maoni/categories" });
      if (result?.data) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDirectories = async () => {
    try {
      const result = await fetchData({ url: "/maoni/directories" });
      if (result?.data) {
        setDirectories(result.data);
      }
    } catch (error) {
      console.error("Error fetching directories:", error);
    }
  };

  const initialValues = {
    title: "",
    category_id: "",
    directory_id: "",
    description: "",
    problem_statement: "",
    proposed_solution: "",
    expected_benefits: "",
    estimated_cost: "",
    estimated_implementation_time: "",
    priority: "MEDIUM",
    visibility: "ANONYMOUS",
    status: "DRAFT",
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required("Title is required")
      .min(10, "Title must be at least 10 characters")
      .max(200, "Title cannot exceed 200 characters"),
    category_id: Yup.string().required("Please select a category"),
    directory_id: Yup.string().required("Please select a directory/department"),
    description: Yup.string()
      .required("Description is required")
      .min(
        50,
        "Please provide a detailed description (at least 50 characters)"
      ),
    problem_statement: Yup.string()
      .required("Problem statement is required")
      .min(30, "Please describe the problem in detail"),
    proposed_solution: Yup.string()
      .required("Proposed solution is required")
      .min(30, "Please describe your solution in detail"),
    expected_benefits: Yup.string()
      .required("Expected benefits are required")
      .min(30, "Please describe the expected benefits"),
  });

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (file.size > maxSize) {
        showToast(`File ${file.name} exceeds 10MB limit`, "warning");
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        showToast(`File ${file.name} has unsupported format`, "warning");
        return false;
      }

      return true;
    });

    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async (values) => {
    try {
      const formData = new FormData();

      // Append all form values
      Object.keys(values).forEach((key) => {
        if (
          values[key] !== undefined &&
          values[key] !== null &&
          values[key] !== ""
        ) {
          formData.append(key, values[key]);
        }
      });

      // Set status to DRAFT
      formData.append("status", "DRAFT");

      // Append attachments
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const result = await createUpdateData({
        url: "/maoni",
        formData: formData,
      });

      if (result?.status === 200 || result?.status === 8000) {
        Swal.fire(
          "Draft Saved!",
          "Your suggestion has been saved as draft. You can continue editing later.",
          "success"
        );
        handleClose();
        if (typeof handleFetchData === "function") handleFetchData();
      } else {
        showToast(result?.message || "Failed to save draft", "error");
      }
    } catch (error) {
      console.error("Save draft error:", error);
      showToast("Unable to save draft. Please try again.", "error");
    }
  };

  const handleSubmit = async (
    values,
    { resetForm, setErrors, setSubmitting }
  ) => {
    try {
      const confirmation = await Swal.fire({
        title: "Ready to Submit?",
        html: `
          <div class="text-start">
            <p>Your suggestion will be submitted for review. Please confirm:</p>
            <ul class="text-muted small">
              <li>All required information is provided</li>
              <li>Your submission is ${values.visibility.toLowerCase()}</li>
              <li>You won't be able to edit after submission</li>
            </ul>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#696cff",
        cancelButtonColor: "#fff",
        confirmButtonText: "Submit Suggestion",
        cancelButtonText: "Review Again",
        buttonsStyling: true,
        customClass: {
          confirmButton: "btn btn-primary btn-sm",
          cancelButton: "btn btn-outline-secondary btn-sm",
        },
        didOpen: () => {
          const popup = Swal.getPopup();
          if (popup) popup.style.zIndex = "20050";
          const container = document.querySelector(".swal2-container");
          if (container) container.style.zIndex = "20040";
        },
      });

      if (!confirmation.isConfirmed) {
        setSubmitting(false);
        return;
      }

      const formData = new FormData();

      // Append all form values
      Object.keys(values).forEach((key) => {
        if (
          values[key] !== undefined &&
          values[key] !== null &&
          values[key] !== ""
        ) {
          formData.append(key, values[key]);
        }
      });

      // Set status to SUBMITTED
      formData.append("status", "SUBMITTED");

      // Append attachments
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      setSubmitting(true);
      const result = await createUpdateData({
        url: "/maoni",
        formData: formData,
      });

      if (result?.status === 200 || result?.status === 8000) {
        Swal.fire({
          title: "Submitted Successfully!",
          html: `
            <div class="text-center">
              <i class="bx bx-check-circle text-success fs-1 mb-3"></i>
              <p class="mb-2">Your suggestion has been submitted for review.</p>
              <p class="text-muted small mb-0">Track ID: <strong>${
                result.data?.uid || "N/A"
              }</strong></p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Continue",
          showCancelButton: true,
          cancelButtonText: "Submit Another",
        }).then((result) => {
          handleClose();
          resetForm();
          setAttachments([]);
          if (typeof handleFetchData === "function") handleFetchData();

          if (
            result.isDismissed &&
            result.dismiss === Swal.DismissReason.cancel
          ) {
            // User wants to submit another, keep modal open
            document.getElementById("maoniModal").classList.add("show");
            document.getElementById("maoniModal").style.display = "block";
            document.querySelector(".modal-backdrop").classList.add("show");
          }
        });
      } else if (result?.status === 8001) {
        // validation errors from backend - keep modal open
        setErrors(result.data || {});
        setOtherError(result.data || {});
        showToast(
          result.message || "Validation failed",
          "warning",
          "Validation Failed"
        );
      } else {
        // other failures - keep modal open so user can retry
        showToast(result?.message || "Submission failed", "warning", "Failed");
      }
    } catch (error) {
      // extract API errors when available
      const apiErr = error?.response?.data;
      if (apiErr) {
        setErrors(apiErr);
        setOtherError(apiErr);
      }
      console.error("Submit suggestion error:", error);
      showToast(
        "Unable to submit suggestion. Please try again or contact support.",
        "error",
        "Failed"
      );
      // keep modal open on exception
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("maoniModal");
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) modalInstance.hide();
    }
    if (onClose) onClose();
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="maoniModal"
        tabIndex="-1"
        aria-hidden="true"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog modal-xl" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <div className="d-flex align-items-center">
                <i className="bx bx-message-rounded-add text-primary fs-4 me-2"></i>
                <h5 className="modal-title mb-0" id="exampleModalLabel3">
                  New Suggestion / Contribution
                </h5>
              </div>
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
                values,
                resetForm,
                setErrors,
                setSubmitting,
                setFieldValue,
                isSubmitting,
              }) => (
                <Form>
                  <div className="modal-body">
                    {/* Submission Guidelines */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="card border-0 bg-light">
                          <div className="card-body p-3">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bx bx-info-circle text-primary me-2"></i>
                              <h6 className="mb-0">Submission Guidelines</h6>
                            </div>
                            <ul className="mb-0 small text-muted">
                              <li>
                                All submissions are confidential and can be
                                anonymous
                              </li>
                              <li>
                                Please provide specific details and practical
                                solutions
                              </li>
                              <li>
                                Your suggestion will be reviewed within 5-7
                                working days
                              </li>
                              <li>You can save as draft and submit later</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <label htmlFor="title" className="form-label">
                          <i className="bx bx-edit me-1"></i>
                          Suggestion Title *
                        </label>
                        <Field
                          type="text"
                          id="title"
                          name="title"
                          className={`form-control ${
                            errors.title ? "is-invalid" : ""
                          }`}
                          placeholder="Brief, descriptive title of your suggestion"
                          maxLength="200"
                        />
                        <ErrorMessage
                          name="title"
                          component="div"
                          className="invalid-feedback"
                        />
                        <small className="text-muted">
                          {values.title.length}/200 characters
                        </small>
                      </div>
                    </div>

                    {/* Category & Directory */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="category_id" className="form-label">
                          <i className="bx bx-category me-1"></i>
                          Category *
                        </label>
                        <Field
                          as="select"
                          id="category_id"
                          name="category_id"
                          className={`form-select ${
                            errors.category_id ? "is-invalid" : ""
                          }`}
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.uid} value={category.uid}>
                              {category.name}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="category_id"
                          component="div"
                          className="invalid-feedback"
                        />
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="directory_id" className="form-label">
                          <i className="bx bx-building me-1"></i>
                          Relevant Department/Directory *
                        </label>
                        <Field
                          as="select"
                          id="directory_id"
                          name="directory_id"
                          className={`form-select ${
                            errors.directory_id ? "is-invalid" : ""
                          }`}
                        >
                          <option value="">Select department</option>
                          {directories.map((directory) => (
                            <option key={directory.uid} value={directory.uid}>
                              {directory.name}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="directory_id"
                          component="div"
                          className="invalid-feedback"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <label htmlFor="description" className="form-label">
                          <i className="bx bx-detail me-1"></i>
                          Detailed Description *
                        </label>
                        <ReactQuill
                          id="description"
                          value={values.description}
                          onChange={(val) => setFieldValue("description", val)}
                          style={{ height: "150px", marginBottom: "50px" }}
                          theme="snow"
                          modules={quillModules}
                          placeholder="Provide a detailed description of your suggestion..."
                        />
                        <ErrorMessage
                          name="description"
                          component="div"
                          className="text-danger small mt-1"
                        />
                        <small className="text-muted">
                          Minimum 50 characters. Please be as detailed as
                          possible.
                        </small>
                      </div>
                    </div>

                    {/* Problem Statement */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <label
                          htmlFor="problem_statement"
                          className="form-label"
                        >
                          <i className="bx bx-error-circle me-1"></i>
                          Problem Statement *
                        </label>
                        <Field
                          as="textarea"
                          id="problem_statement"
                          name="problem_statement"
                          className={`form-control ${
                            errors.problem_statement ? "is-invalid" : ""
                          }`}
                          rows="3"
                          placeholder="What problem or issue are you addressing?"
                        />
                        <ErrorMessage
                          name="problem_statement"
                          component="div"
                          className="invalid-feedback"
                        />
                      </div>
                    </div>

                    {/* Proposed Solution */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <label
                          htmlFor="proposed_solution"
                          className="form-label"
                        >
                          <i className="bx bx-bulb me-1"></i>
                          Proposed Solution *
                        </label>
                        <Field
                          as="textarea"
                          id="proposed_solution"
                          name="proposed_solution"
                          className={`form-control ${
                            errors.proposed_solution ? "is-invalid" : ""
                          }`}
                          rows="3"
                          placeholder="What is your proposed solution or improvement?"
                        />
                        <ErrorMessage
                          name="proposed_solution"
                          component="div"
                          className="invalid-feedback"
                        />
                      </div>
                    </div>

                    {/* Expected Benefits */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <label
                          htmlFor="expected_benefits"
                          className="form-label"
                        >
                          <i className="bx bx-trending-up me-1"></i>
                          Expected Benefits *
                        </label>
                        <Field
                          as="textarea"
                          id="expected_benefits"
                          name="expected_benefits"
                          className={`form-control ${
                            errors.expected_benefits ? "is-invalid" : ""
                          }`}
                          rows="3"
                          placeholder="What benefits will this bring to the organization?"
                        />
                        <ErrorMessage
                          name="expected_benefits"
                          component="div"
                          className="invalid-feedback"
                        />
                      </div>
                    </div>

                    {/* Cost & Timeline */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="estimated_cost" className="form-label">
                          <i className="bx bx-dollar-circle me-1"></i>
                          Estimated Cost (Optional)
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">TZS</span>
                          <Field
                            type="number"
                            id="estimated_cost"
                            name="estimated_cost"
                            className="form-control"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <small className="text-muted">
                          If known, provide estimated cost
                        </small>
                      </div>

                      <div className="col-md-6">
                        <label
                          htmlFor="estimated_implementation_time"
                          className="form-label"
                        >
                          <i className="bx bx-time me-1"></i>
                          Estimated Implementation Time (Optional)
                        </label>
                        <Field
                          type="text"
                          id="estimated_implementation_time"
                          name="estimated_implementation_time"
                          className="form-control"
                          placeholder="e.g., 2-4 weeks, 3 months"
                          maxLength="50"
                        />
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="priority" className="form-label">
                          <i className="bx bx-flag me-1"></i>
                          Priority
                        </label>
                        <Field
                          as="select"
                          id="priority"
                          name="priority"
                          className="form-select"
                        >
                          <option value="LOW">Low Priority</option>
                          <option value="MEDIUM">Medium Priority</option>
                          <option value="HIGH">High Priority</option>
                          <option value="URGENT">Urgent</option>
                        </Field>
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="visibility" className="form-label">
                          <i className="bx bx-shield me-1"></i>
                          Visibility
                        </label>
                        <Field
                          as="select"
                          id="visibility"
                          name="visibility"
                          className="form-select"
                        >
                          <option value="ANONYMOUS">
                            Anonymous (Recommended)
                          </option>
                          <option value="PUBLIC">Public (Show my name)</option>
                          <option value="CONFIDENTIAL">
                            Confidential (Admins only)
                          </option>
                        </Field>
                        <small className="text-muted">
                          {values.visibility === "ANONYMOUS"
                            ? "Your identity will remain confidential"
                            : values.visibility === "PUBLIC"
                            ? "Your name will be visible with the suggestion"
                            : "Only administrators will see your identity"}
                        </small>
                      </div>
                    </div>

                    {/* Attachments */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <label className="form-label">
                          <i className="bx bx-paperclip me-1"></i>
                          Attachments (Optional)
                        </label>
                        <div className="border rounded p-3">
                          <input
                            type="file"
                            className="form-control"
                            onChange={handleFileUpload}
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                            disabled={isSubmitting}
                          />
                          <small className="text-muted">
                            Max 10MB per file. Supported: PDF, Word, Excel,
                            Images
                          </small>

                          {attachments.length > 0 && (
                            <div className="mt-3">
                              <h6 className="small mb-2">Selected files:</h6>
                              <div className="list-group">
                                {attachments.map((file, index) => (
                                  <div
                                    key={index}
                                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2"
                                  >
                                    <div className="d-flex align-items-center">
                                      <i className="bx bx-file me-2"></i>
                                      <span className="small">{file.name}</span>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => removeAttachment(index)}
                                      disabled={isSubmitting}
                                    >
                                      <i className="bx bx-trash"></i>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <div className="d-flex justify-content-between w-100">
                        <div>
                          <button
                            type="button"
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => handleSaveDraft(values)}
                            disabled={
                              isSubmitting ||
                              !values.title ||
                              !values.description
                            }
                          >
                            <i className="bx bx-save me-1"></i>
                            Save as Draft
                          </button>
                        </div>

                        <div>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm me-2"
                            onClick={handleClose}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={isSubmitting}
                            style={{ minWidth: "150px" }}
                          >
                            {isSubmitting ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                ></span>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <i className="bx bx-paper-plane me-1"></i>
                                Submit for Review
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default MaoniModal;
