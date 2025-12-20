import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { MaoniContext } from "../../../../utils/context";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { createUpdateData, fetchData } from "../../../../utils/GlobalQueries";

const MaoniModal = ({ onClose, loadOnlyModal = false }) => {
  const user = useSelector((state) => state.userReducer?.data);

  // Context for maoni management
  const { handleFetchData, selectedMaoni, setSelectedMaoni } =
    useContext(MaoniContext);

  const [categories, setCategories] = useState([]);
  const [directories, setDirectories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Fetch categories and directories on modal open
  useEffect(() => {
    fetchCategories();
    fetchDirectories();
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
    status: "DRAFT",
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required("Title is required")
      .min(10, "Title must be at least 10 characters")
      .max(200, "Title cannot exceed 200 characters"),
    category_id: Yup.string().required("Please select a category"),
    description: Yup.string()
      .required("Description is required")
      .min(
        30,
        "Please provide a detailed description (at least 30 characters)"
      ),
  });

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
              <li>Your identity will remain completely confidential</li>
              <li>Your feedback helps us improve continuously</li>
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

      // Append essential form values
      formData.append("title", values.title);
      formData.append("category_id", values.category_id);
      formData.append("description", values.description);
      formData.append("status", "SUBMITTED");

      // Auto-set anonymous visibility
      formData.append("visibility", "ANONYMOUS");

      // Only append directory if it's selected
      if (values.directory_id) {
        formData.append("directory_id", values.directory_id);
      }

      setSubmitting(true);
      const result = await createUpdateData({
        url: "/maoni",
        formData: formData,
      });

      if (result?.status === 200 || result?.status === 8000) {
        Swal.fire({
          title: "Thank You for Your Contribution!",
          html: `
            <div class="text-center">
              <i class="bx bx-check-circle text-success fs-1 mb-3"></i>
              <p class="mb-2"><strong>Your suggestion has been submitted successfully.</strong></p>
              <p class="text-muted small mb-0">
                <i class="bx bx-shield me-1"></i>
                Your identity remains confidential and protected
              </p>
            </div>
          `,
          icon: "success",
          confirmButtonText: "Done",
        }).then(() => {
          handleClose();
          resetForm();
          setSelectedCategory("");
          if (typeof handleFetchData === "function") handleFetchData();
        });
      } else if (result?.status === 8001) {
        // validation errors from backend
        setErrors(result.data || {});
        showToast(
          result.message || "Please check your inputs",
          "warning",
          "Validation Failed"
        );
      } else {
        showToast(result?.message || "Submission failed", "error");
      }
    } catch (error) {
      console.error("Submit suggestion error:", error);
      showToast("Unable to submit suggestion. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async (values) => {
    try {
      const formData = new FormData();

      formData.append("title", values.title);
      formData.append("category_id", values.category_id);
      formData.append("description", values.description);
      formData.append("status", "DRAFT");
      formData.append("visibility", "ANONYMOUS");

      if (values.directory_id) {
        formData.append("directory_id", values.directory_id);
      }

      const result = await createUpdateData({
        url: "/maoni",
        formData: formData,
      });

      if (result?.status === 200 || result?.status === 8000) {
        Swal.fire(
          "Draft Saved!",
          "Your suggestion has been saved as draft.",
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
      ["bold", "italic", "underline"],
      [{ list: "bullet" }, { list: "ordered" }],
      ["link"],
      ["clean"],
    ],
  };

  // Check if selected category requires directory selection
  const requiresDirectory = (categoryName) => {
    const lowerName = categoryName?.toLowerCase() || "";
    return !(lowerName.includes("general") || lowerName.includes("other"));
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
                  Share Your Suggestion
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
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue, isSubmitting }) => (
                <Form>
                  <div className="modal-body">
                    {/* Reassuring Message */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div
                          className="alert border-0"
                          style={{
                            backgroundColor: "#e8f4fd",
                            borderLeft: "4px solid #0d6efd",
                          }}
                        >
                          <div className="d-flex align-items-start">
                            <i className="bx bx-shield-alt text-primary fs-4 me-3"></i>
                            <div>
                              <h6 className="mb-2 text-primary">
                                <i className="bx bx-check-shield me-1"></i>
                                Share Your Ideas Freely & Safely
                              </h6>
                              <p className="mb-1">
                                <strong>
                                  Your identity is completely protected.
                                </strong>{" "}
                                We never collect or store personal information
                                with your suggestions.
                              </p>
                              <p className="mb-0 text-muted">
                                <small>
                                  <i className="bx bx-lock me-1"></i>
                                  Speak freely without fear of consequences.
                                  Your honest feedback helps us create a better
                                  workplace for everyone.
                                </small>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <label htmlFor="title" className="form-label">
                          <i className="bx bx-edit me-1"></i>
                          What's your suggestion about? *
                        </label>
                        <Field
                          type="text"
                          id="title"
                          name="title"
                          className="form-control"
                          placeholder="Brief title describing your suggestion"
                          maxLength="200"
                        />
                        <ErrorMessage
                          name="title"
                          component="div"
                          className="text-danger small mt-1"
                        />
                      </div>
                    </div>

                    {/* Category & Directory in same row */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="category_id" className="form-label">
                          <i className="bx bx-category me-1"></i>
                          What area does this concern? *
                        </label>
                        <Field
                          as="select"
                          id="category_id"
                          name="category_id"
                          className="form-select"
                          onChange={(e) => {
                            const categoryId = e.target.value;
                            const category = categories.find(
                              (c) => c.uid === categoryId
                            );
                            setSelectedCategory(category?.name || "");
                            setFieldValue("category_id", categoryId);
                            // Reset directory if category changes
                            if (!requiresDirectory(category?.name)) {
                              setFieldValue("directory_id", "");
                            }
                          }}
                        >
                          <option value="">Select area of concern</option>
                          {categories.map((category) => (
                            <option key={category.uid} value={category.uid}>
                              {category.name}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="category_id"
                          component="div"
                          className="text-danger small mt-1"
                        />
                      </div>

                      {/* Directory - Conditional */}
                      <div className="col-md-6">
                        {requiresDirectory(selectedCategory) ? (
                          <>
                            <label
                              htmlFor="directory_id"
                              className="form-label"
                            >
                              <i className="bx bx-building me-1"></i>
                              Which department?
                            </label>
                            <Field
                              as="select"
                              id="directory_id"
                              name="directory_id"
                              className="form-select"
                            >
                              <option value="">
                                Select department (Optional)
                              </option>
                              {directories.map((directory) => (
                                <option
                                  key={directory.uid}
                                  value={directory.uid}
                                >
                                  {directory.name}
                                </option>
                              ))}
                            </Field>
                            <small className="text-muted">
                              This helps route your suggestion
                            </small>
                          </>
                        ) : (
                          <div className="mt-4 pt-3 text-center">
                            <i className="bx bx-check-circle text-success fs-4 mb-2"></i>
                            <p className="small text-muted mb-0">
                              General suggestion -<br />
                              no department selection needed
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Suggestion Details with Rich Text Editor */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <label htmlFor="description" className="form-label">
                          <i className="bx bx-detail me-1"></i>
                          Please describe your suggestion in detail *
                        </label>
                        <ReactQuill
                          id="description"
                          value={values.description}
                          onChange={(value) =>
                            setFieldValue("description", value)
                          }
                          theme="snow"
                          modules={quillModules}
                          style={{
                            height: "200px",
                            marginBottom: "60px",
                            borderRadius: "6px",
                            border: "1px solid #ddd",
                          }}
                          placeholder="Describe your idea in detail. Be specific about what should change and why it would be beneficial..."
                        />
                        <ErrorMessage
                          name="description"
                          component="div"
                          className="text-danger small mt-1"
                        />
                        <div className="d-flex justify-content-between mt-2">
                          <small className="text-muted">
                            <i className="bx bx-info-circle me-1"></i>
                            Minimum 30 characters. Be clear and constructive.
                          </small>
                          <small className="text-muted">
                            Your identity is protected
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* Confidentiality Assurance */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <div className="card border-info bg-info-subtle">
                          <div className="card-body p-3">
                            <div className="d-flex align-items-center">
                              <div className="me-3">
                                <i className="bx bx-shield text-info fs-3"></i>
                              </div>
                              <div>
                                <h6 className="mb-1 text-info">
                                  <i className="bx bx-check-circle me-1"></i>
                                  Your Privacy is Guaranteed
                                </h6>
                                <p className="mb-0 small">
                                  This system is designed for{" "}
                                  <strong>100% anonymous feedback</strong>. Your
                                  suggestions are valuable, and your
                                  confidentiality is our priority. There are no
                                  consequences for honest, constructive
                                  feedback.
                                </p>
                              </div>
                            </div>
                          </div>
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
                              !values.description ||
                              !values.category_id
                            }
                          >
                            <i className="bx bx-save me-1"></i>
                            Save Draft
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
                                Submit Suggestion
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