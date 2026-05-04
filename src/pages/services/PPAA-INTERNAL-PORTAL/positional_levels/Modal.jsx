import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdatePositionalLevel } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";

const PositionalLevelModal = ({ selectedObj, setSelectedObj, tableRefresh, setTableRefresh }) => {
  const [errors, setOtherError] = useState({});
  
  const initialValues = {
    name: selectedObj?.name || "",
    code: selectedObj?.code || "",
    is_active: selectedObj?.is_active !== undefined ? selectedObj.is_active : true,
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Position/Designation name is required"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }
      
      const result = await createUpdatePositionalLevel(values);
      
      if (result.status === 200 || result.status === 8000) {
        showToast("Position/Designation saved successfully", "success", "Complete");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
        setSelectedObj(null);
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
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("positionalLevelModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setSelectedObj(null);
  };

  useEffect(() => {
    const modalElement = document.getElementById("positionalLevelModal");
    if (!modalElement) return;

    const handleHidden = () => {
      setSelectedObj(null);
    };

    modalElement.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      modalElement.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, []);

  return (
    <div
      className="modal modal-slide-in"
      id="positionalLevelModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedObj === null ? "Create New" : "Update"} Position/Designation
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
            {({ isSubmitting }) => (
              <Form>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Position/Designation Name *</label>
                    <Field
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="e.g., Executive Secretary, HEAD OF ICT, Manager, Director"
                    />
                    <small className="text-muted">Enter the job title or designation</small>
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-danger small"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Code (Optional)</label>
                    <Field
                      type="text"
                      name="code"
                      className="form-control"
                      placeholder="e.g., HOICT, ES, MGR, DIR"
                    />
                    <small className="text-muted">Optional short code for this position</small>
                    <ErrorMessage
                      name="code"
                      component="div"
                      className="text-danger small"
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <Field
                        type="checkbox"
                        name="is_active"
                        className="form-check-input"
                        id="is_active"
                      />
                      <label className="form-check-label" htmlFor="is_active">
                        Active
                      </label>
                    </div>
                    <small className="text-muted">Inactive positions will not be available for selection</small>
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save"}
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

export default PositionalLevelModal;

