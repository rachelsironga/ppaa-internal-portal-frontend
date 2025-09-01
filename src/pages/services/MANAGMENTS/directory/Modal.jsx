import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { createUpdateDirectory, getDirectories } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { DirectoryContext } from "../../../../utils/context";
import { createUpdateDepartment } from "../department/Queries";
import Select from "react-select";
import { hasAccess } from "../../../../hooks/AccessHandler";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import { useSelector } from "react-redux";

export const DirectoryModal = ({ loadOnlyModal = false }) => {
  const { selectedObj, setSelectedObj, setTableRefresh } =
    useContext(DirectoryContext);
  const [errors, setOtherError] = useState({});
  const initialValues = {
    name: selectedObj?.name || "",
    code: selectedObj?.code || "",
    description: selectedObj?.description || "",
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
      // Check if the Directory is being created or updated
      if (selectedObj) {
        values.uid = selectedObj.uid;
      }
      const result = await createUpdateDirectory(values);
      // Call the API to create or update the Directory
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
      showToast("Something went wrong while saving", "error", "Failed");
      handleClose();
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("viewCreateDirectoryModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  return (
    <div
      className="modal modal-slide-in"
      id="viewCreateDirectoryModal"
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
    >
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel3">
              {selectedObj === null ? "Create New" : "View / Update"}{" "}
              Directories{" "}
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
                      <label htmlFor="descriptionLarge" className="form-label">
                        Description
                      </label>
                      <Field
                        as="textarea"
                        name="description"
                        id="descriptionLarge"
                        className="form-control"
                        rows="3"
                        placeholder="Enter Description"
                      />
                      <ErrorMessage
                        name="description"
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

export const DirectoryDepartmentModal = () => {
  const {
    selectedObj,
    setTableRefresh,
    selectedDepartment,
    setSelectedDepartment,
  } = useContext(DirectoryContext);
  const [errors, setOtherError] = useState({});
  const user = useSelector((state) => state.userReducer?.data);
  const initialValues = {
    name: selectedDepartment?.name || "",
    code: selectedDepartment?.code || "",
    description: selectedDepartment?.description || "",
    is_active: selectedDepartment?.is_active ?? true,
    directory_uid: selectedObj?.uid || "",
  };

    const validationSchema = Yup.object().shape({
      name: Yup.string().required("Name is required"),
      code: Yup.string().required("Code is required"),
      directory_uid: Yup.string().required("Directory is required"),
    });

    const handleSubmit = async (
      values,
      { setSubmitting, resetForm, setErrors }
    ) => {
      try {
        if (
          !hasAccess(user, [
            "view_directory",
            "can_add_directory",
            "can_update_directory",
            "add_directory",
            "change_directory",
          ])
        ) {
          showToast(
            "You don't have permission to perform this action",
            "error",
            "Access Denied"
          );
          setSubmitting(false);
          return;
        }

        // Check if the department is being created or updated
        if (selectedDepartment) {
          values.uid = selectedDepartment.uid;
        }
        // Call the API to create or update the department
        const result = await createUpdateDepartment(values);

        if (result.status === 200 || result.status === 8000) {
          showToast("Data Saved Successfuly", "success", "Complete");
          handleClose();
          resetForm();
          setTableRefresh((prev) => prev + 1);
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
    setSelectedDepartment(null);
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
        <i className="bx bx-edit-alt me-1"></i> Add Directory's Department
      </button>

      <div
        className="modal modal-slide-in"
        id="viewCreateDataModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                {selectedDepartment === null ? "Create New" : "View / Update"}{" "}
                Departments{" "}
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
                      <FormikSelect
                        name="directory_uid"
                        label="Directory"
                        url="/directory"
                        containerClass="col-md-12 mb-3"
                        filters={{
                          page: 1,
                          page_size: 10,
                          paginated: true,
                        }}
                        mapOption={(item) => ({
                          value: item.uid,
                          label: `${item.name}`,
                          name: `${item.name}`,
                          code: `${item.code}`,
                        })}
                        placeholder="Search Directory ..."
                        debounceMs={500}
                        minChars={3}
                        isReadOnly={false}
                      />
                    </div>

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
                        <label
                          htmlFor="descriptionLarge"
                          className="form-label"
                        >
                          Description
                        </label>
                        <Field
                          as="textarea"
                          name="description"
                          id="descriptionLarge"
                          className="form-control"
                          rows="3"
                          placeholder="Enter Description"
                        />
                        <ErrorMessage
                          name="description"
                          component="div"
                          className="text-danger"
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="statusSwitch" className="form-label">
                          Set The Department as
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
