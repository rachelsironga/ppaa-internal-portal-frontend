import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateApprovalAction } from "./Queries";
import { ApprovalActionContext } from "../../../../utils/context";
import showToast from "../../../../helpers/ToastHelper";

const ApprovalActionsModal = () => {
  const { handleFetchData, selectApprovalAction, setSelectedApprovalAction } =
    useContext(ApprovalActionContext);
  const [errors, setOtherError] = useState({});
  const initialValues = {
    name: selectApprovalAction?.name || "",
    code: selectApprovalAction?.code || "",
    is_active: selectApprovalAction?.is_active ?? true,
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    code: Yup.string().required("Code is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectApprovalAction) {
        values.uid = selectApprovalAction.uid;
      }
      const result = await createUpdateApprovalAction(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        handleClose();
        resetForm();
        handleFetchData();
      } else if (result.status === 8002) {
        console.log("Validation error:", result.data);
        showToast(`${result.message}`, "warning", "Validation Failed");
        setErrors(result.data);
        setOtherError(result.data);
      } else {
        showToast(`${result.message}`, "warning", "Process Failed");
        handleClose();
        resetForm();
      }
    } catch (error) {
      console.log("Error submitting form:", error);
      showToast("Something went wrong while saving", "error", "Failed");
      handleClose(); // Close the modal after submission
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    console.log("Modal closed");
    setSelectedApprovalAction(null);
    const modalElement = document.getElementById("viewCreateDataModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  return (
    <>
      <button
        aria-label="Click me"
        type="button"
        className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow"
        data-bs-toggle="modal"
        data-bs-target="#viewCreateDataModal"
      >
        <i className="bx bx-edit-alt me-1"></i> Add Approval Action
      </button>

      <div
        className="modal modal-slide-in"
        id="viewCreateDataModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-md" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                {selectApprovalAction === null ? "Create New" : "View / Update"}{" "}
                Approval Actions{" "}
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
                      <div className="col mb-3">
                        <label htmlFor="nameLarge" className="form-label">
                          Name
                        </label>
                        <Field
                          type="text"
                          name="name"
                          id="nameLarge"
                          className="form-control"
                          placeholder="Enter Name"
                        />
                        <ErrorMessage
                          name="name"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="codeLarge" className="form-label">
                          Code
                        </label>
                        <Field
                          type="text"
                          name="code"
                          id="codeLarge"
                          className="form-control"
                          placeholder="Enter Code"
                        />
                        <ErrorMessage
                          name="code"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="statusSwitch" className="form-label">
                          Activate or Deactivate Option :{" "}
                        </label>
                        <div className="form-check form-switch">
                          <Field
                            type="checkbox"
                            className="form-check-input"
                            id="statusSwitch"
                            checked={values.is_active}
                            onChange={(e) =>
                              setFieldValue("is_active", e.target.checked)
                            }
                          />
                          <label
                            className="form-check-label"
                            htmlFor="statusSwitch"
                          >
                            {values.is_active ? "Active" : "Inactive"}
                          </label>
                        </div>
                        <ErrorMessage
                          name="is_active"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>

                    {errors.non_field_errors &&
                      errors.non_field_errors.length > 0 && (
                        <div className="text-danger">
                          {errors.non_field_errors.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      )}

                    <div className="modal-footer">
                      <button
                        aria-label="Click me"
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleClose}
                        className="btn btn-outline-secondary"
                        data-bs-dismiss="modal"
                      >
                        Close
                      </button>
                      <button
                        aria-label="Click me"
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary"
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </button>
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

export default ApprovalActionsModal;
