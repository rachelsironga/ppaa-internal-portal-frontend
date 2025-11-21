import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdatePatientAgeGroup } from "./Queries";
import { PatientAgeGroupContext } from "../../../../utils/context";
import Select from "react-select";

const PatientAgeGroupsModal = () => {
  const { handleFetchData, selectPatientAgeGroup, setSelectedPatientAgeGroup } =
    useContext(PatientAgeGroupContext);
  const [errors, setOtherError] = useState({});

  const initialValues = {
    name: selectPatientAgeGroup?.name || "",
    min_age: selectPatientAgeGroup?.min_age || "0",
    max_age: selectPatientAgeGroup?.max_age || "",
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    min_age: Yup.string().required("Minimum age is required"),
    max_age: Yup.string().required("Maximum age is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectPatientAgeGroup) {
        values.uid = selectPatientAgeGroup.uid;
      }
      const result = await createUpdatePatientAgeGroup(values);

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
    setSelectedPatientAgeGroup(null);
    const modalElement = document.getElementById("viewCreateDataModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  return (
    <>
      <button
        aria-label="Click me"
        type="button"
        className="btn btn-primary ms-auto btn-sm"
        data-bs-toggle="modal"
        data-bs-target="#viewCreateDataModal"
      >
        <i className="bx bx-edit-alt me-1"></i> Add Patient Age Group
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
                {selectPatientAgeGroup === null
                  ? "Create New"
                  : "View / Update"}{" "}
                Patient Age Group{" "}
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
                      <div className="col-6 mb-3">
                        <label htmlFor="min_agelLarge" className="form-label">
                          Minimum Age
                        </label>
                        <Field
                          type="number"
                          name="min_age"
                          id="min_agelLarge"
                          className="form-control"
                          placeholder="Enter Minimum Age"
                        />
                        <ErrorMessage
                          name="min_age"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                      <div className="col-6 mb-3">
                        <label htmlFor="max_agelLarge" className="form-label">
                          Minimum Age
                        </label>
                        <Field
                          type="number"
                          name="max_age"
                          id="max_agelLarge"
                          className="form-control"
                          placeholder="Enter Maximum Age"
                          step="0.1"
                          min="0"
                        />
                        <ErrorMessage
                          name="max_age"
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

export default PatientAgeGroupsModal;
