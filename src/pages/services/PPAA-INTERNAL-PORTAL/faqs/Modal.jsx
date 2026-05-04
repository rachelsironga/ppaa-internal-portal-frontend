import React, { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateFAQ } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";

const FAQModal = ({ selectedObj, setSelectedObj, tableRefresh, setTableRefresh }) => {
  const [errors, setOtherError] = useState({});
  const [loading, setLoading] = useState(false);

  const initialValues = {
    question: selectedObj?.question || "",
    answer: selectedObj?.answer || "",
    is_active: selectedObj?.is_active !== undefined ? selectedObj.is_active : true,
  };

  const validationSchema = Yup.object().shape({
    question: Yup.string().required("Question is required"),
    answer: Yup.string().required("Answer is required"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm, setErrors }) => {
    try {
      setLoading(true);
      
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }

      const result = await createUpdateFAQ(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("FAQ saved successfully", "success", "Complete");
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
      setLoading(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("faqModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setSelectedObj(null);
  };

  useEffect(() => {
    const modalElement = document.getElementById("faqModal");
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
      id="faqModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {selectedObj === null ? "Create New" : "Update"} FAQ
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
                      <label className="form-label">Question *</label>
                      <Field
                        as="textarea"
                        name="question"
                        className="form-control"
                        rows="3"
                        placeholder="Enter the question"
                      />
                      <ErrorMessage
                        name="question"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">Answer *</label>
                      <Field
                        as="textarea"
                        name="answer"
                        className="form-control"
                        rows="5"
                        placeholder="Enter the answer"
                      />
                      <ErrorMessage
                        name="answer"
                        component="div"
                        className="text-danger small"
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label">Status</label>
                      <div className="form-check mt-3">
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

export default FAQModal;

