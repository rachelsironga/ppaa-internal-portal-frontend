import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from "reactstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateReportCategory } from "../../Queries";
import showToast from "../../../../../helpers/ToastHelper";
import Swal from "sweetalert2";

const formatValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') return '';
  const errorMessages = [];
  Object.keys(errors).forEach(field => {
    const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    fieldErrors.forEach(error => {
      errorMessages.push(`<li><strong>${fieldName}:</strong> ${error}</li>`);
    });
  });
  return `<ul style="text-align: left; margin: 0; padding-left: 20px;">${errorMessages.join('')}</ul>`;
};

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

const ICON_OPTIONS = [
  { value: "bx-bar-chart", label: "Chart" },
  { value: "bx-money", label: "Finance" },
  { value: "bx-user", label: "HR" },
  { value: "bx-cog", label: "Operations" },
  { value: "bx-shield", label: "Compliance" },
  { value: "bx-health", label: "Health" },
  { value: "bx-building", label: "Administration" },
  { value: "bx-globe", label: "External" },
  { value: "bx-file", label: "General" },
  { value: "bx-analyse", label: "Analytics" },
];

const ReportCategoryModal = ({ show, onClose, onSuccess, item }) => {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!item?.uid;

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Category name is required"),
    code: Yup.string()
      .max(20, "Code must be at most 20 characters")
      .required("Code is required"),
    color: Yup.string()
      .matches(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
      .required("Color is required"),
  });

  const initialValues = {
    name: item?.name || "",
    code: item?.code || "",
    description: item?.description || "",
    color: item?.color || "#3B82F6",
    icon: item?.icon || "",
    is_active: item?.is_active !== undefined ? item.is_active : true,
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    try {
      const data = isEditMode ? { ...values, uid: item.uid } : values;
      const response = await createUpdateReportCategory(data);

      if (response.status === 8000) {
        showToast(
          isEditMode ? "Category updated successfully" : "Category created successfully",
          "success"
        );
        onSuccess();
      } else if (response.status === 8002 && response.data) {
        Swal.fire({
          title: "Validation Error",
          html: formatValidationErrors(response.data),
          icon: "warning",
          confirmButtonColor: "#3085d6",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: response.message || "Operation failed",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Failed to save category. Please try again.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={show} toggle={onClose} size="md" backdrop="static">
      <ModalHeader toggle={onClose} className="bg-primary text-white" close={<button type="button" className="btn-close btn-close-white" onClick={onClose}></button>}>
        <span className="text-white">
          <i className={`bx ${isEditMode ? 'bx-edit' : 'bx-plus-circle'} me-2`}></i>
          {isEditMode ? "Edit Category" : "Add Category"}
        </span>
      </ModalHeader>
      
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, values, setFieldValue, isSubmitting }) => (
          <Form>
            <ModalBody>
              <Row className="g-3">
                <Col md={8}>
                  <label className="form-label fw-medium">
                    Category Name <span className="text-danger">*</span>
                  </label>
                  <Field
                    name="name"
                    type="text"
                    className={`form-control ${errors.name && touched.name ? 'is-invalid' : ''}`}
                    placeholder="e.g., Finance"
                  />
                  <ErrorMessage name="name" component="div" className="invalid-feedback" />
                </Col>

                <Col md={4}>
                  <label className="form-label fw-medium">
                    Code <span className="text-danger">*</span>
                  </label>
                  <Field
                    name="code"
                    type="text"
                    className={`form-control ${errors.code && touched.code ? 'is-invalid' : ''}`}
                    placeholder="e.g., FIN"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <ErrorMessage name="code" component="div" className="invalid-feedback" />
                </Col>

                <Col md={12}>
                  <label className="form-label fw-medium">
                    Color <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {PRESET_COLORS.map(color => (
                      <div
                        key={color}
                        className={`rounded-circle cursor-pointer ${values.color === color ? 'ring-2 ring-offset-2' : ''}`}
                        style={{
                          width: "30px",
                          height: "30px",
                          backgroundColor: color,
                          cursor: "pointer",
                          border: values.color === color ? "3px solid #000" : "2px solid #ddd",
                        }}
                        onClick={() => setFieldValue('color', color)}
                      ></div>
                    ))}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Field
                      name="color"
                      type="color"
                      className="form-control form-control-color"
                      style={{ width: "50px", height: "38px" }}
                    />
                    <Field
                      name="color"
                      type="text"
                      className={`form-control ${errors.color && touched.color ? 'is-invalid' : ''}`}
                      placeholder="#3B82F6"
                      style={{ maxWidth: "120px" }}
                    />
                    <span
                      className="badge"
                      style={{ backgroundColor: values.color, color: "#fff" }}
                    >
                      Preview
                    </span>
                  </div>
                  <ErrorMessage name="color" component="div" className="invalid-feedback d-block" />
                </Col>

                <Col md={12}>
                  <label className="form-label fw-medium">Icon</label>
                  <Field as="select" name="icon" className="form-select">
                    <option value="">Select an icon (optional)</option>
                    {ICON_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Field>
                  {values.icon && (
                    <div className="mt-2">
                      <span className="badge bg-light text-dark">
                        <i className={`bx ${values.icon} me-1`}></i>
                        Icon Preview
                      </span>
                    </div>
                  )}
                </Col>

                <Col md={12}>
                  <label className="form-label fw-medium">Description</label>
                  <Field
                    as="textarea"
                    name="description"
                    className="form-control"
                    rows="2"
                    placeholder="Brief description..."
                  />
                </Col>

                <Col md={12}>
                  <div className="form-check">
                    <Field
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      className="form-check-input"
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Active
                    </label>
                  </div>
                </Col>
              </Row>
            </ModalBody>
            
            <ModalFooter>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || isSubmitting}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                ) : (
                  <><i className="bx bx-save me-1"></i>{isEditMode ? "Update" : "Create"}</>
                )}
              </button>
            </ModalFooter>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default ReportCategoryModal;
