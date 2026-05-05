import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { MaoniContext } from "../../../../utils/context";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  getDepartments,
  getCategories,
  createSuggestion,
  updateSuggestion,
} from "../../PPAA-MAONI/Queries";

const MaoniModal = ({ onClose, loadOnlyModal = false }) => {
  const user = useSelector((state) => state.userReducer?.data);

  // Context for maoni management
  const { handleFetchData, selectedMaoni, setSelectedMaoni } =
    useContext(MaoniContext);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [departments, setDepartments] = useState([]);

  // Fetch categories and departments on modal open
  useEffect(() => {
    fetchCategories();
    fetchDepartments();
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await getCategories();
      const cats = Array.isArray(result?.data) ? result.data : [];
      setCategories(cats);
      if (cats.length === 0 && result?.message) {
        console.warn("Maoni categories:", result.message);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const departmentsRes = await getDepartments();
      // Handle departments response - same format as SuggestionForm
      console.log("Departments response:", departmentsRes);
      if (departmentsRes.status === 8000 || departmentsRes.status === 200) {
        const deptData = departmentsRes.data || [];
        console.log("Setting departments:", deptData);
        setDepartments(Array.isArray(deptData) ? deptData : []);
      } else {
        // Try to handle different response formats
        console.warn("Departments response format unexpected:", departmentsRes);
        if (Array.isArray(departmentsRes)) {
          setDepartments(departmentsRes);
        } else if (departmentsRes?.data) {
          const deptData = Array.isArray(departmentsRes.data) ? departmentsRes.data : [];
          setDepartments(deptData);
        } else {
          console.warn("No departments data found in response");
          setDepartments([]);
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      console.error("Error details:", error.response?.data || error.message);
      // Set empty array on error to prevent form from breaking
      setDepartments([]);
    }
  };

  const baseInitialValues = {
    title: "",
    category: "",
    description: "",
    status: "DRAFT",
    department_uid: "",
    priority: "MEDIUM",
  };

  const getInitialValues = () => {
    if (selectedMaoni) {
      const rawCategory = selectedMaoni.category;
      const categoryId =
        rawCategory && typeof rawCategory === "object"
          ? rawCategory.id ?? rawCategory.uid
          : rawCategory;

      return {
        title: selectedMaoni.title || "",
        category: categoryId != null ? String(categoryId) : "",
        description: selectedMaoni.description || "",
        status: (selectedMaoni.status || "DRAFT").toUpperCase(),
        department_uid: selectedMaoni.department_uid || "",
        priority: selectedMaoni.priority || "MEDIUM",
      };
    }
    return baseInitialValues;
  };

  const validationSchema = Yup.object().shape({
    title: Yup.string()
      .required("Title is required")
      .min(10, "Title must be at least 10 characters")
      .max(200, "Title cannot exceed 200 characters"),
    category: Yup.string().required("Please select a category"),
    department_uid: Yup.string()
      .trim()
      .required("Please select which department your suggestion is for"),
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
        confirmButtonColor: "#00853f",
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

      const payload = {
        title: values.title,
        // backend expects numeric PK for category
        category: values.category ? Number(values.category) : null,
        description: values.description,
        status: "SUBMITTED",
        department_uid: values.department_uid || "",
        priority: values.priority || "MEDIUM",
      };

      setSubmitting(true);
      const isEdit = Boolean(selectedMaoni?.uid);
      const result = isEdit
        ? await updateSuggestion(selectedMaoni.uid, payload)
        : await createSuggestion(payload);

      if (result?.status === 200 || result?.status === 8000) {
        // Close modal and reset before showing success message
        handleClose();
        resetForm();
        setSelectedCategory("");
        if (typeof setSelectedMaoni === "function") setSelectedMaoni(null);
        if (typeof handleFetchData === "function") handleFetchData();

        await Swal.fire({
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
      const payload = {
        title: values.title,
        category: values.category ? Number(values.category) : null,
        description: values.description,
        status: "DRAFT",
        department_uid: values.department_uid || "",
        priority: values.priority || "MEDIUM",
      };

      const isEdit = Boolean(selectedMaoni?.uid);
      const result = isEdit
        ? await updateSuggestion(selectedMaoni.uid, payload)
        : await createSuggestion(payload);

      if (result?.status === 200 || result?.status === 8000) {
        Swal.fire(
          "Draft Saved!",
          "Your suggestion has been saved as draft.",
          "success"
        );
        handleClose();
        if (typeof setSelectedMaoni === "function") setSelectedMaoni(null);
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

  // Department selection and priority handled via PPAA Maoni fields as well

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
              initialValues={getInitialValues()}
              enableReinitialize
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

                    {/* Category & Department in same row */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="category" className="form-label">
                          <i className="bx bx-category me-1"></i>
                          What area does this concern? *
                        </label>
                        <Field
                          as="select"
                          id="category"
                          name="category"
                          className="form-select"
                          onChange={(e) => {
                            const categoryId = e.target.value;
                            const category = categories.find(
                              (c) =>
                                String(c.id ?? c.uid) === String(categoryId)
                            );
                            setSelectedCategory(category?.name || "");
                            setFieldValue("category", categoryId);
                          }}
                        >
                          <option value="">Select area of concern</option>
                          {categories.map((category) => {
                            const optVal =
                              category.id != null
                                ? String(category.id)
                                : String(category.uid ?? "");
                            return (
                              <option
                                key={category.uid ?? category.id}
                                value={optVal}
                              >
                                {category.name}
                              </option>
                            );
                          })}
                        </Field>
                        {categories.length === 0 && (
                          <small className="text-danger d-block mt-1">
                            <i className="bx bx-error-circle me-1"></i>
                            No categories available. Enable{" "}
                            <code className="small">microservices.maoni</code>{" "}
                            and run{" "}
                            <code className="small">python manage.py migrate maoni</code>
                            .
                          </small>
                        )}
                        <ErrorMessage
                          name="category"
                          component="div"
                          className="text-danger small mt-1"
                        />
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="department_uid" className="form-label">
                          <i className="bx bx-buildings me-1"></i>
                          Which department?{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <Field
                          as="select"
                          id="department_uid"
                          name="department_uid"
                          className="form-select"
                        >
                          <option value="">Select department</option>
                          {departments.map((dept) => (
                            <option key={dept.uid} value={dept.uid}>
                              {dept.name}{" "}
                              {dept.code ? `(${dept.code})` : ""}
                            </option>
                          ))}
                        </Field>
                        <small className="form-text text-muted">
                          This helps route your suggestion.
                        </small>
                        <ErrorMessage
                          name="department_uid"
                          component="div"
                          className="text-danger small mt-1"
                        />
                      </div>
                    </div>

                    {/* Priority */}
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
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </Field>
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
                              !values.category
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