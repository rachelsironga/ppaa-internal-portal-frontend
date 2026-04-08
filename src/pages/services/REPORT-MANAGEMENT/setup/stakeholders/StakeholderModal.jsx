import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from "reactstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateStakeholder, ORGANIZATION_TYPE_OPTIONS } from "../../Queries";
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

const StakeholderModal = ({ show, onClose, onSuccess, item }) => {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!item?.uid;

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Stakeholder name is required"),
    organization_type: Yup.string().required("Organization type is required"),
    email: Yup.string().email("Invalid email format"),
  });

  const initialValues = {
    name: item?.name || "",
    organization_type: item?.organization_type || "other",
    contact_person: item?.contact_person || "",
    email: item?.email || "",
    phone: item?.phone || "",
    address: item?.address || "",
    website: item?.website || "",
    description: item?.description || "",
    is_active: item?.is_active !== undefined ? item.is_active : true,
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setLoading(true);
    try {
      const data = isEditMode ? { ...values, uid: item.uid } : values;
      const response = await createUpdateStakeholder(data);

      if (response.status === 8000) {
        showToast(
          isEditMode ? "Stakeholder updated successfully" : "Stakeholder created successfully",
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
        text: "Failed to save stakeholder. Please try again.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={show} toggle={onClose} size="lg" backdrop="static">
      <ModalHeader toggle={onClose} className="bg-primary text-white" close={<button type="button" className="btn-close btn-close-white" onClick={onClose}></button>}>
        <span className="text-white">
          <i className={`bx ${isEditMode ? 'bx-edit' : 'bx-plus-circle'} me-2`}></i>
          {isEditMode ? "Edit Stakeholder" : "Add Stakeholder"}
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
                <Col md={8}>
                  <label className="form-label fw-medium">
                    Stakeholder Name <span className="text-danger">*</span>
                  </label>
                  <Field
                    name="name"
                    type="text"
                    className={`form-control ${errors.name && touched.name ? 'is-invalid' : ''}`}
                    placeholder="Enter organization name"
                  />
                  <ErrorMessage name="name" component="div" className="invalid-feedback" />
                </Col>

                <Col md={4}>
                  <label className="form-label fw-medium">
                    Organization Type <span className="text-danger">*</span>
                  </label>
                  <Field
                    as="select"
                    name="organization_type"
                    className={`form-select ${errors.organization_type && touched.organization_type ? 'is-invalid' : ''}`}
                  >
                    {ORGANIZATION_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="organization_type" component="div" className="invalid-feedback" />
                </Col>

                <Col md={6}>
                  <label className="form-label fw-medium">Contact Person</label>
                  <Field
                    name="contact_person"
                    type="text"
                    className="form-control"
                    placeholder="Contact person name"
                  />
                </Col>

                <Col md={6}>
                  <label className="form-label fw-medium">Email</label>
                  <Field
                    name="email"
                    type="email"
                    className={`form-control ${errors.email && touched.email ? 'is-invalid' : ''}`}
                    placeholder="email@example.com"
                  />
                  <ErrorMessage name="email" component="div" className="invalid-feedback" />
                </Col>

                <Col md={6}>
                  <label className="form-label fw-medium">Phone</label>
                  <Field
                    name="phone"
                    type="text"
                    className="form-control"
                    placeholder="+255 xxx xxx xxx"
                  />
                </Col>

                <Col md={6}>
                  <label className="form-label fw-medium">Website</label>
                  <Field
                    name="website"
                    type="url"
                    className="form-control"
                    placeholder="https://example.com"
                  />
                </Col>

                <Col md={12}>
                  <label className="form-label fw-medium">Address</label>
                  <Field
                    as="textarea"
                    name="address"
                    className="form-control"
                    rows="2"
                    placeholder="Physical address..."
                  />
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

export default StakeholderModal;
