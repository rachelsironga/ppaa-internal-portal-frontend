import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdateOxygenLocation } from "./Queries";
import { OxygenLocationContext } from "../../../../utils/context";
import Select from "react-select";

const OxygenLocationsModal = ({ loadOnlyModal = false }) => {
  const { handleFetchData, selectOxygenLocation, setSelectedOxygenLocation } =
    useContext(OxygenLocationContext);
  const [errors, setOtherError] = useState({});
  const typeOptions = [
    { value: "WARD", label: "Ward" },
    { value: "STORE", label: "Store" },
  ];

  const initialValues = {
    name: selectOxygenLocation?.name || "",
    code: selectOxygenLocation?.code || "",
    type: selectOxygenLocation?.type || "",
    quantity: selectOxygenLocation?.quantity || 0,
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    code: Yup.string().required("Code is required"),
    type: Yup.string().required("Type is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectOxygenLocation) {
        values.uid = selectOxygenLocation.uid;
      }

      delete values.quantity;
      const result = await createUpdateOxygenLocation(values);

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
    // setSelectedOxygenLocation(null);
    const modalElement = document.getElementById("viewCreateDataModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  return (
    <>
      {!loadOnlyModal && (
        <button
          aria-label="Click me"
          type="button"
          className="btn btn-primary ms-auto btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#viewCreateDataModal"
        >
          <i className="bx bx-edit-alt me-1"></i> Add Oxygen Location
        </button>
      )}

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
                {selectOxygenLocation === null ? "Create New" : "View / Update"}{" "}
                Oxygen Locations{" "}
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
                      <div className="col-sm-6 mb-3">
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
                      <div className="col-sm-6 mb-3">
                        <label htmlFor="typeLarge" className="form-label">
                          Type
                        </label>
                        <Select
                          id="typeLarge"
                          name="type"
                          className="select2-selection fetched-select2"
                          options={typeOptions}
                          value={typeOptions.find(
                            (option) => option.value === values.type
                          )}
                          onChange={(option) =>
                            setFieldValue("type", option.value)
                          }
                          placeholder="Select Type"
                        />
                        <ErrorMessage
                          name="type"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="quantityLarge" className="form-label">
                          Oxygen Available
                        </label>
                        <Field
                          type="number"
                          name="quantity"
                          id="quantityLarge"
                          className="form-control"
                          placeholder="Enter Quantity"
                        />
                        <ErrorMessage
                          name="quantity"
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

export default OxygenLocationsModal;
