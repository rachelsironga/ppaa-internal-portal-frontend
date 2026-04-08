import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from "reactstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateFinancialYear } from "../../Queries";
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

const FinancialYearModal = ({ show, onClose, onSuccess, item }) => {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!item?.uid;

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .matches(/^\d{4}\/\d{4}$/, "Format must be YYYY/YYYY (e.g., 2025/2026)")
      .required("Financial year name is required"),
    start_date: Yup.date().required("Start date is required"),
    end_date: Yup.date()
      .min(Yup.ref('start_date'), "End date must be after start date")
      .required("End date is required"),
  });

  const initialValues = {
    name: item?.name || "",
    start_date: item?.start_date || "",
    end_date: item?.end_date || "",
    is_current: item?.is_current || false,
    is_active: item?.is_active !== undefined ? item.is_active : true,
    description: item?.description || "",
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    try {
      const data = isEditMode ? { ...values, uid: item.uid } : values;
      const response = await createUpdateFinancialYear(data);

      if (response.status === 8000) {
        showToast(
          isEditMode ? "Financial Year updated successfully" : "Financial Year created successfully",
          "success"
        );
        onSuccess();
      } else if (response.status === 8002 && response.data) {
        // Validation error with field-specific messages
        Swal.fire({
          title: "Validation Error",
          html: formatValidationErrors(response.data),
          icon: "warning",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK"
        });
      } else {
        Swal.fire({
          title: "Error",
          text: response.message || "Operation failed",
          icon: "error",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK"
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Failed to save financial year. Please try again.",
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK"
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
          {isEditMode ? "Edit Financial Year" : "Add Financial Year"}
        </span>
      </ModalHeader>
      
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <ModalBody>
              <Row className="g-3">
                <Col md={12}>
                  <label className="form-label fw-medium">
                    Financial Year Name <span className="text-danger">*</span>
                  </label>
                  <Field
                    name="name"
                    type="text"
                    className={`form-control ${errors.name && touched.name ? 'is-invalid' : ''}`}
                    placeholder="e.g., 2025/2026"
                  />
                  <ErrorMessage name="name" component="div" className="invalid-feedback" />
                </Col>

                <Col md={6}>
                  <label className="form-label fw-medium">
                    Start Date <span className="text-danger">*</span>
                  </label>
                  <Field
                    name="start_date"
                    type="date"
                    className={`form-control ${errors.start_date && touched.start_date ? 'is-invalid' : ''}`}
                  />
                  <ErrorMessage name="start_date" component="div" className="invalid-feedback" />
                </Col>

                <Col md={6}>
                  <label className="form-label fw-medium">
                    End Date <span className="text-danger">*</span>
                  </label>
                  <Field
                    name="end_date"
                    type="date"
                    className={`form-control ${errors.end_date && touched.end_date ? 'is-invalid' : ''}`}
                  />
                  <ErrorMessage name="end_date" component="div" className="invalid-feedback" />
                </Col>

                <Col md={6}>
                  <div className="form-check">
                    <Field
                      type="checkbox"
                      name="is_current"
                      id="is_current"
                      className="form-check-input"
                    />
                    <label className="form-check-label" htmlFor="is_current">
                      Set as Current Financial Year
                    </label>
                  </div>
                </Col>

                <Col md={6}>
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

                <Col md={12}>
                  <label className="form-label fw-medium">Description</label>
                  <Field
                    as="textarea"
                    name="description"
                    className="form-control"
                    rows="2"
                    placeholder="Optional description..."
                  />
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

export default FinancialYearModal;
