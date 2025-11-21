import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { createUpdateOxygenSupplier } from "./Queries";
import { OxygenSupplierContext } from "../../../../utils/context";
import Select from "react-select";

const OxygenSuppliersModal = () => {
  const { handleFetchData, selectOxygenSupplier, setSelectedOxygenSupplier } =
    useContext(OxygenSupplierContext);
  const [errors, setOtherError] = useState({});

  const initialValues = {
    name: selectOxygenSupplier?.name || "",
    email_address: selectOxygenSupplier?.email_address || "",
    physical_address: selectOxygenSupplier?.physical_address || "",
    contact: selectOxygenSupplier?.contact || "",
    telephone: selectOxygenSupplier?.telephone || "",
    remarks: selectOxygenSupplier?.remarks || "",
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    email_address: Yup.string().required("Email address is required"),
    physical_address: Yup.string().required("Physical address is required"),
    contact: Yup.string().required("Contact number is required"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectOxygenSupplier) {
        values.uid = selectOxygenSupplier.uid;
      }
      const result = await createUpdateOxygenSupplier(values);

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
    setSelectedOxygenSupplier(null);
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
        <i className="bx bx-edit-alt me-1"></i> Add Oxygen Supplier
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
                {selectOxygenSupplier === null ? "Create New" : "View / Update"}{" "}
                Oxygen Supplier{" "}
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
                        <label htmlFor="emailLarge" className="form-label">
                          Email
                        </label>
                        <Field
                          type="email"
                          name="email_address"
                          id="emailLarge"
                          className="form-control"
                          placeholder="Enter Email"
                        />
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="contactLarge" className="form-label">
                          Contact Number
                        </label>
                        <Field
                          type="text"
                          name="contact"
                          id="contactLarge"
                          className="form-control"
                          placeholder="Enter Contact Number"
                        />
                        <ErrorMessage
                          name="contact"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                      <div className="col mb-3">
                        <label htmlFor="telephoneLarge" className="form-label">
                          Telephone
                        </label>
                        <Field
                          type="text"
                          name="telephone"
                          id="telephoneLarge"
                          className="form-control"
                          placeholder="Enter Telephone"
                        />
                        <ErrorMessage
                          name="telephone"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="addressLarge" className="form-label">
                          Physical Address
                        </label>
                        <Field
                          as="textarea"
                          name="physical_address"
                          id="addressLarge"
                          className="form-control"
                          placeholder="Enter Physical Address"
                          rows={3}
                        />
                        <ErrorMessage
                          name="physical_address"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="remarksLarge" className="form-label">
                          Remarks
                        </label>
                        <Field
                          as="textarea"
                          name="remarks"
                          id="remarksLarge"
                          className="form-control"
                          placeholder="Enter Remarks"
                          rows={3}
                        />
                        <ErrorMessage
                          name="remarks"
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

export default OxygenSuppliersModal;
