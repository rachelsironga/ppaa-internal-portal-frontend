import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from "reactstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateReportType, FREQUENCY_OPTIONS } from "../../Queries";
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

const ReportTypeModal = ({ show, onClose, onSuccess, item }) => {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!item?.uid;

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Report type name is required"),
    code: Yup.string()
      .max(20, "Code must be at most 20 characters")
      .required("Code is required"),
    frequency: Yup.string().required("Frequency is required"),
    submission_deadline_days: Yup.number()
      .min(0, "Must be at least 0 day")
      .max(90, "Must be at most 90 days")
      .required("Required"),
    before_reminder_days: Yup.number()
      .min(0, "Must be at least 0 day")
      .max(90, "Must be at most 90 days")
      .required("Required"),
    after_reminder_days: Yup.number()
      .min(0, "Must be at least 0 day")
      .max(90, "Must be at most 90 days")
      .required("Required"),
  });

  const initialValues = {
    name: item?.name || "",
    code: item?.code || "",
    frequency: item?.frequency || "monthly",
    description: item?.description || "",
    submission_deadline_days: item?.submission_deadline_days ?? 0,
    before_reminder_days: item?.before_reminder_days ?? 7,
    after_reminder_days: item?.after_reminder_days ?? 0,
    requires_attachment: item?.requires_attachment !== undefined ? item.requires_attachment : true,
    is_active: item?.is_active !== undefined ? item.is_active : true,
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    try {
      const data = isEditMode ? { ...values, uid: item.uid } : values;
      const response = await createUpdateReportType(data);

      if (response.status === 8000) {
        showToast(
          isEditMode ? "Report Type updated successfully" : "Report Type created successfully",
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
        text: "Failed to save report type. Please try again.",
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
          {isEditMode ? "Edit Report Type" : "Add Report Type"}
        </span>
      </ModalHeader>
      
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched, isSubmitting, values }) => (
          <Form>
            <ModalBody>
              <Row className="g-3">
                <Col md={8}>
                  <label className="form-label fw-medium">
                    Report Type Name <span className="text-danger">*</span>
                  </label>
                  <Field
                    name="name"
                    type="text"
                    className={`form-control ${errors.name && touched.name ? 'is-invalid' : ''}`}
                    placeholder="e.g., Quarterly Report"
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
                    placeholder="e.g., QTR"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <ErrorMessage name="code" component="div" className="invalid-feedback" />
                </Col>

                <Col md={6}>
                  <label className="form-label fw-medium">
                    Frequency <span className="text-danger">*</span>
                  </label>
                  <Field
                    as="select"
                    name="frequency"
                    className={`form-select ${errors.frequency && touched.frequency ? 'is-invalid' : ''}`}
                  >
                    {FREQUENCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="frequency" component="div" className="invalid-feedback" />
                </Col>

                <Col md={4}>
                  <label className="form-label fw-medium">
                    Submission Deadline Days <span className="text-danger">*</span>
                  </label>
                  <Field
                    name="submission_deadline_days"
                    type="number"
                    min="0"
                    max="90"
                    className={`form-control ${errors.submission_deadline_days && touched.submission_deadline_days ? 'is-invalid' : ''}`}
                  />
                  <small className="text-muted">
                    Number of days after the selected reporting period ends before the report is due.
                  </small>
                  <ErrorMessage name="submission_deadline_days" component="div" className="invalid-feedback" />
                </Col>

                <Col md={4}>
                  <label className="form-label fw-medium">
                    Before Reminder Days
                    <span className="text-danger">*</span>
                  </label>
                  <Field
                    name="before_reminder_days"
                    type="number"
                    min="0"
                    max="90"
                    className={`form-control ${errors.before_reminder_days && touched.before_reminder_days ? 'is-invalid' : ''}`}
                  />
                  <small className="text-muted">
                    Send reminder this many day(s) before the computed deadline.
                  </small>
                  <ErrorMessage name="before_reminder_days" component="div" className="invalid-feedback" />
                </Col>

                <Col md={4}>
                  <label className="form-label fw-medium">
                    After Reminder Days <span className="text-danger">*</span>
                  </label>
                  <Field
                    name="after_reminder_days"
                    type="number"
                    min="0"
                    max="90"
                    className={`form-control ${errors.after_reminder_days && touched.after_reminder_days ? 'is-invalid' : ''}`}
                  />
                  <small className="text-muted">
                    Send overdue reminder this many day(s) after the computed deadline.
                  </small>
                  <ErrorMessage name="after_reminder_days" component="div" className="invalid-feedback" />
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

                <Col md={6}>
                  <div className="form-check">
                    <Field
                      type="checkbox"
                      name="requires_attachment"
                      id="requires_attachment"
                      className="form-check-input"
                    />
                    <label className="form-check-label" htmlFor="requires_attachment">
                      Requires Attachment
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

export default ReportTypeModal;
