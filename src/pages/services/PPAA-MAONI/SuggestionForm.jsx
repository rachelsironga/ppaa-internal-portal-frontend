import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { createSuggestion, updateSuggestion, getCategories, getDepartments } from "./Queries";
import LinearIndeterminate from "../../../LinearIndeterminate";

const SuggestionForm = ({ initialData = null, isEditMode = false, onSuccess = null }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "",
    department_uid: "", // Department from ppaa_auth
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  // Helper function to strip HTML tags
  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Populate form when initialData is provided (for editing)
  useEffect(() => {
    if (initialData) {
      console.log("🔍 Populating form with initialData:", {
        category: initialData.category,
        categoryType: typeof initialData.category,
        categoriesCount: categories.length,
        categories: categories.map(c => ({ id: c.id, uid: c.uid, name: c.name }))
      });

      // Strip HTML from description before displaying
      const cleanDescription = stripHtml(initialData.description || "");
      
      // Extract category ID - handle both object and numeric formats
      let categoryId = null;
      if (initialData.category !== null && initialData.category !== undefined) {
        // Category might be an object with id property, or just the numeric ID
        if (typeof initialData.category === 'object' && initialData.category !== null) {
          categoryId = initialData.category.id || initialData.category.uid;
        } else {
          // It's a primitive value (number or string) - this is the most common case from API
          // The API returns category as a numeric PK (ForeignKey)
          categoryId = initialData.category;
        }
      }

      let categoryValue = "";
      
      // Only try to match category if categories are loaded
      if (categories.length > 0 && categoryId !== null) {
        console.log("🔎 Attempting to match category:", categoryId, "Type:", typeof categoryId);
        
        // Find the category by matching ID (numeric) or UID (string)
        // The API returns category as a numeric PK, so we need to match by id
        const matchedCategory = categories.find((c) => {
          // Normalize both values for comparison
          const catId = c.id != null ? Number(c.id) : null;
          const catUid = c.uid ? String(c.uid) : null;
          const searchId = categoryId != null ? Number(categoryId) : null;
          const searchIdStr = categoryId != null ? String(categoryId) : null;
          
          // Try to match by numeric ID first (most common case from ForeignKey)
          if (catId !== null && searchId !== null) {
            if (catId === searchId) {
              console.log("✅ Matched by numeric ID:", catId, "===", searchId);
              return true;
            }
          }
          // Also try string comparison for safety
          if (catId !== null && searchIdStr !== null) {
            if (String(catId) === searchIdStr) {
              console.log("✅ Matched by string ID:", String(catId), "===", searchIdStr);
              return true;
            }
          }
          // Fallback to UID matching
          if (catUid && searchIdStr) {
            if (catUid === searchIdStr) {
              console.log("✅ Matched by UID:", catUid, "===", searchIdStr);
              return true;
            }
          }
          return false;
        });
        
        if (matchedCategory) {
          // Use the same format as the option value: category.id ?? category.uid
          // Convert to string to match the option value format
          const optionValue = matchedCategory.id != null ? matchedCategory.id : matchedCategory.uid;
          categoryValue = optionValue != null ? String(optionValue) : "";
          console.log("✅ Category matched successfully:", { 
            categoryId, 
            matchedCategory: { id: matchedCategory.id, uid: matchedCategory.uid, name: matchedCategory.name },
            categoryValue,
            optionValue
          });
        } else {
          console.error("❌ Category not found:", {
            categoryId,
            categoryIdType: typeof categoryId,
            availableCategories: categories.map(c => ({ id: c.id, uid: c.uid, name: c.name }))
          });
        }
      } else if (categoryId !== null && categories.length === 0) {
        // Categories not loaded yet, but we have a category ID
        // We'll set it once categories load (this useEffect will run again)
        console.log("⏳ Waiting for categories to load. Category ID:", categoryId);
      } else if (!categoryId) {
        console.log("⚠️ No category ID found in initialData");
      }

      setFormData((prev) => ({
        ...prev,
        title: initialData.title || "",
        description: cleanDescription, // Use stripped HTML description
        priority: initialData.priority || "MEDIUM",
        category: categoryValue, // Set category value (empty string if not matched yet, will update when categories load)
        department_uid: initialData.department_uid || "",
      }));
      
      console.log("📝 Form data set with category:", categoryValue || "(empty - will retry when categories load)");
    }
  }, [initialData, categories]);

  const fetchFormData = async () => {
    try {
      setLoadingData(true);
      const [categoriesRes, departmentsRes] = await Promise.all([
        getCategories(),
        getDepartments(),
      ]);

      const categoriesData = Array.isArray(categoriesRes?.data)
        ? categoriesRes.data
        : [];
      setCategories(categoriesData);
      if (
        categoriesData.length === 0 &&
        categoriesRes?.status !== 8000 &&
        categoriesRes?.status !== 200
      ) {
        console.warn("Categories unavailable:", categoriesRes?.message);
      }

      // Handle departments response
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
      console.error("Error fetching form data:", error);
      console.error("Error details:", error.response?.data || error.message);
      // Set empty arrays on error to prevent form from breaking
      setCategories([]);
      setDepartments([]);
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: error.response?.data?.message || "Some form options may not be available. Please refresh the page.",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveDraft = async () => {
    // Draft can be saved even with minimal data
    if (!formData.title.trim() && !formData.description.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please enter at least a title or description to save as draft",
      });
      return;
    }

    try {
      setLoading(true);
      // Prepare data for draft submission
      const selectedCategory = categories.find(
        (c) =>
          String(c.id) === String(formData.category) ||
          String(c.uid) === String(formData.category)
      );
      const submitData = {
        title: formData.title || "Untitled Draft",
        description: formData.description || "",
        priority: formData.priority,
        status: "DRAFT", // Explicitly set status to DRAFT
        // Backend expects numeric PK for category
        category: selectedCategory ? selectedCategory.id : null,
        department_uid: formData.department_uid || null,
      };

      let response;
      if (isEditMode && initialData?.uid) {
        // Update existing suggestion
        response = await updateSuggestion(initialData.uid, submitData);
      } else {
        // Create new suggestion
        response = await createSuggestion(submitData);
      }

      const ok =
        response?.status === 8000 ||
        response?.status === 200 ||
        response?.status === 201;
      if (ok) {
        // If form is inside a Bootstrap modal, close it before showing success
        const modalElement = document.getElementById(
          "ppaaMaoniSuggestionModal"
        );
        if (modalElement && window.bootstrap?.Modal) {
          const existingInstance =
            window.bootstrap.Modal.getInstance(modalElement) ||
            new window.bootstrap.Modal(modalElement);
          existingInstance.hide();
        }

        await Swal.fire({
          icon: "success",
          title: "Draft Saved",
          text: response.message || "Your draft has been saved successfully",
        });
        
        // Call onSuccess callback if provided, otherwise navigate
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/ppaa-maoni/suggestions");
        }
        return;
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to save draft",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please fill in all required fields",
      });
      return;
    }

    try {
      setLoading(true);
      // Prepare data for submission
      const selectedCategory = categories.find(
        (c) =>
          String(c.id) === String(formData.category) ||
          String(c.uid) === String(formData.category)
      );
      const submitData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: "SUBMITTED", // Explicitly set status to SUBMITTED
        // Backend expects numeric PK for category
        category: selectedCategory ? selectedCategory.id : null,
        department_uid: formData.department_uid || null,
      };

      let response;
      if (isEditMode && initialData?.uid) {
        // Update existing suggestion
        response = await updateSuggestion(initialData.uid, submitData);
      } else {
        // Create new suggestion
        response = await createSuggestion(submitData);
      }

      const ok =
        response?.status === 8000 ||
        response?.status === 200 ||
        response?.status === 201;
      if (ok) {
        // If form is inside a Bootstrap modal, close it before showing success
        const modalElement = document.getElementById(
          "ppaaMaoniSuggestionModal"
        );
        if (modalElement && window.bootstrap?.Modal) {
          const existingInstance =
            window.bootstrap.Modal.getInstance(modalElement) ||
            new window.bootstrap.Modal(modalElement);
          existingInstance.hide();
        }

        await Swal.fire({
          icon: "success",
          title: "Success",
          text: response.message || "Suggestion submitted successfully",
        });
        
        // Call onSuccess callback if provided, otherwise navigate
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/ppaa-maoni/suggestions");
        }
        return;
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to submit suggestion",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <LinearIndeterminate />;
  }

  return (
    <div className="py-4">
      {/* Reassuring Message - match Maoni modal style */}
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
                  <strong>Your identity is completely protected.</strong>{" "}
                  We never collect or store personal information with your
                  suggestions.
                </p>
                <p className="mb-0 text-muted">
                  <small>
                    <i className="bx bx-lock me-1"></i>
                    Speak freely without fear of consequences. Your honest
                    feedback helps us create a better workplace for
                    everyone.
                  </small>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <div className="d-flex align-items-center">
            <i className="bx bx-message-rounded-add fs-4 me-2"></i>
            <h4 className="mb-0 text-white">Share Your Suggestion</h4>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} style = {{marginTop: "20px"}}>
                {/* Title Field */}
                <div className="mb-4">
                  <label htmlFor="title" className="form-label fw-bold">
                    What&apos;s your suggestion about?{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="title"
                    placeholder="Brief title describing your suggestion"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    maxLength={200}
                  />
                </div>

                {/* Area of Concern (Category) */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label htmlFor="category" className="form-label fw-bold">
                      What area does this concern?{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select form-select-lg"
                      id="category"
                      value={formData.category || ""}
                      onChange={(e) => {
                        console.log("Category changed to:", e.target.value);
                        setFormData({
                          ...formData,
                          category: e.target.value,
                        });
                      }}
                      required
                    >
                      <option value="">Select area of concern</option>
                      {categories.map((category) => {
                        // Ensure value is a string to match formData format
                        // Use id (numeric PK) as primary, fallback to uid
                        const optionValue = category.id != null ? category.id : category.uid;
                        const optionValueStr = optionValue != null ? String(optionValue) : "";
                        const isSelected = formData.category === optionValueStr;
                        if (isSelected) {
                          console.log("✅ Selected category option:", {
                            categoryId: category.id,
                            categoryUid: category.uid,
                            categoryName: category.name,
                            optionValue: optionValueStr,
                            formDataCategory: formData.category
                          });
                        }
                        return (
                          <option
                            key={category.uid || category.id}
                            value={optionValueStr}
                          >
                            {category.name}
                          </option>
                        );
                      })}
                    </select>
                    {!loadingData && categories.length === 0 && (
                      <small className="text-danger d-block mt-1">
                        <i className="bx bx-error-circle me-1"></i>
                        No categories loaded. Enable the Maoni API on the server (
                        <code className="small">microservices.maoni</code> in{" "}
                        <code className="small">INSTALLED_APPS</code>, then{" "}
                        <code className="small">migrate maoni</code>).
                      </small>
                    )}
                    {isEditMode && initialData?.category && !formData.category && categories.length > 0 && (
                      <small className="text-warning d-block mt-1">
                        <i className="bx bx-info-circle me-1"></i>
                        Category not matched. Please select the category manually.
                      </small>
                    )}
                  </div>

                  {/* Department (Optional) */}
                  <div className="col-md-6">
                    <label
                      htmlFor="department"
                      className="form-label fw-bold d-flex align-items-center"
                    >
                      Which department?
                    </label>
                    <select
                      className="form-select form-select-lg"
                      id="department"
                      value={formData.department_uid}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department_uid: e.target.value,
                        })
                      }
                      disabled={loadingData}
                    >
                      <option value="">Select department (Optional)</option>
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <option key={dept.uid} value={dept.uid}>
                            {dept.name}{" "}
                            {dept.code ? `(${dept.code})` : ""}
                          </option>
                        ))
                      ) : (
                        !loadingData && (
                          <option value="" disabled>
                            No departments available
                          </option>
                        )
                      )}
                    </select>
                    <small className="form-text text-muted">
                      This helps route your suggestion.
                    </small>
                    {loadingData && (
                      <small className="form-text text-info">
                        Loading departments...
                      </small>
                    )}
                  </div>
                </div>
                <div className="mb-4">
              <label htmlFor="priority" className="form-label fw-bold">
                Priority
              </label>
              <select
                className="form-select form-select-lg"
                id="priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

                {/* Description Field */}
                <div className="mb-4">
                  <label htmlFor="description" className="form-label fw-bold">
                    Please describe your suggestion in detail{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    rows="10"
                    placeholder="Describe your idea in detail. Be specific about what should change and why it would be beneficial..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    required
                  />

          
                  <div className="d-flex justify-content-between mt-2">
                    <small className="text-muted">
                      <i className="bx bx-info-circle me-1"></i>
                      Minimum 30 characters. Be clear and constructive.
                    </small>
                    <small className="text-muted">Your identity is protected.</small>
                  </div>
                </div>

                          {/* Priority Field */}
        

                {/* Confidentiality Assurance */}
                <div className="mb-4">
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
                            consequences for honest, constructive feedback.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

          

            {/* Actions */}
            <div className="d-flex justify-content-between">
              <div>
                <button
                  type="button"
                  className="btn btn-outline-warning btn-lg"
                  onClick={handleSaveDraft}
                  disabled={
                    loading ||
                    (!formData.title.trim() && !formData.description.trim())
                  }
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-save me-2"></i>
                      Save Draft
                    </>
                  )}
                </button>
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ minWidth: "180px" }}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Submit Suggestion
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuggestionForm;
