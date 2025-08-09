import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdatePositionalLevel } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { PositionalLevelContext } from "../../../../utils/context";

const PositionalLevelModal = () => {
  const { selectedObj, setSelectedObj, tableRefresh, setTableRefresh } =
    useContext(PositionalLevelContext);
  const [errors, setOtherError] = useState({});
  const initialValues = {
    name: selectedObj?.name || "",
    code: selectedObj?.code || "",
    is_active: selectedObj?.is_active ?? true,
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
      // Check if the department is being created or updated
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }
      // Call the API to create or update the department
      const result = await createUpdatePositionalLevel(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        setTableRefresh((prev) => prev + 1);
        handleClose();
        resetForm();
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
      if (error.status !== 403) {
        showToast("Something went wrong while saving", "error", "Failed");
      }

      handleClose(); // Close the modal after submission
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const [show, setShow] = useState(false);

  const handleClose = () => {
    setSelectedObj(null);
    const modalElement = document.getElementById("viewCreateDesignationModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  return (
    <div
      className="modal modal-slide-in"
      id="viewCreateDesignationModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel3">
              {selectedObj === null ? "Create New" : "View / Update"} Positional
              Levels{" "}
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
  );
};

export default PositionalLevelModal;
