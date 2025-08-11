import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdatePositionalLevel } from "../../E-APPROVAL/positional_level/Queries";
import showToast from "../../../../helpers/ToastHelper";
import { PositionalLevelContext } from "../../../../utils/context";

const AssignedUserModal = () => {
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
            <h5 className="modal-title" id="exampleModalLabel3"></h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
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
              <div className="col mb-3"></div>
            </div>

            <div className="modal-footer"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignedUserModal;
