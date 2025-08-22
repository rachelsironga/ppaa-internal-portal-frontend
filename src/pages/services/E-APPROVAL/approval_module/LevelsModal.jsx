import React, { useContext, useEffect, useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { ApprovalModuleContext } from "../../../../utils/context";
import { createUpdateItemLevel } from "./Queries";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

const ApprovalModuleLevelModal = () => {
  const {
    handleFetchData,
    selectedObj,
    setSelectedObj,
    debounceTimeout,
    setDebounceTimeout,
    setSelectedPositionalLevelModule,
    selectedPositionalLevelModule,
  } = useContext(ApprovalModuleContext);
  const [errors, setOtherError] = useState({});

  const resetFormRef = useRef(null);
  const initialValues = {
    module_uid: selectedObj?.name || "",
    level_uid: selectedPositionalLevelModule?.level?.uid || "",
    action_uid: selectedPositionalLevelModule?.action?.uid || "",
    department_uid: selectedPositionalLevelModule?.department?.uid || "",
    order: selectedPositionalLevelModule?.order || 1,
    is_signatory: selectedPositionalLevelModule?.is_signatory || true,
    is_active: selectedPositionalLevelModule?.is_active || true,
  };

  const validationSchema = Yup.object().shape({
    level_uid: Yup.string().required("Level is required"),
    module_uid: Yup.string().required("Module is required"),
    action_uid: Yup.string().required("Action is required"),
    department_uid: Yup.string().required("Department is required"),
    order: Yup.string().required("Level Order is required"),
    is_signatory: Yup.string().required("Is The Signatory"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedPositionalLevelModule) {
        values.uid = selectedPositionalLevelModule.uid;
      }
      values.module_uid = selectedObj.uid;
      const result = await createUpdateItemLevel(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        handleClose();
        handleFetchData();
      } else if (result.status === 8002) {
        console.log("Validation error:", result.data);
        showToast(`${result.message}`, "warning", "Validation Failed");
        setErrors(result.data);
        setOtherError(result.data);
      } else {
        showToast(`${result.message}`, "warning", "Process Failed");
        handleClose();
      }
    } catch (error) {
      console.log("Error submitting form:", error);
      showToast("Something went wrong while saving", "error", "Failed");
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedPositionalLevelModule(null);
    if (resetFormRef.current) {
      resetFormRef.current();
      // Clear all Select components with the class name 'fetched-select2'
      const selectElements = document.querySelectorAll(".fetched-select2");
      selectElements.forEach((selectElement) => {
        selectElement.value = "";
        const reactSelectInstance = selectElement.__reactSelectInstance;
        if (reactSelectInstance) {
          reactSelectInstance.clearValue();
        }
      });
    }

    const modalElement = document.getElementById("viewCreateDataLevelModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  useEffect(() => {
    if (selectedPositionalLevelModule) {
      values.level_uid = selectedPositionalLevelModule?.level?.uid;
      values.action_uid = selectedPositionalLevelModule?.action?.uid;
      values.department_uid = selectedPositionalLevelModule?.department?.uid;
    }
  }, []);

  return (
    <>
      <button
        aria-label="Click me"
        type="button"
        className="btn btn-primary ms-auto btn-sm"
        data-bs-toggle="modal"
        data-bs-target="#viewCreateDataLevelModal"
      >
        <i className="bx bx-edit-alt me-1"></i> Add Level
      </button>

      <div
        className="modal modal-slide-in"
        id="viewCreateDataLevelModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                {selectedPositionalLevelModule === null
                  ? "Add New"
                  : "View / Update"}{" "}
                Approval Module Level
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
              {({ isSubmitting, values, setFieldValue, resetForm }) => (
                (resetFormRef.current = resetForm),
                (
                  <Form>
                    <div className="modal-body">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label htmlFor="nameLarge" className="form-label">
                            Module
                          </label>
                          <Field
                            type="text"
                            name="module_uid"
                            id="nameLarge"
                            disabled={"disabled"}
                            readOnly={true}
                            className="form-control readonly"
                            placeholder="Enter Name"
                          />
                          <ErrorMessage
                            name="name"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <FormikSelect
                          name="department_uid"
                          label="Departments"
                          url="/departments"
                          containerClass="col-md-6 mb-3"
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
                          placeholder="Search Departments..."
                          debounceMs={500}
                          minChars={3}
                          isReadOnly={false}
                        />
                      </div>

                      <div className="row">
                        <FormikSelect
                          name="level_uid"
                          label="Level (Designation)"
                          url="/positional-level"
                          containerClass="col-md-6 mb-3"
                          filters={{
                            page: 1,
                            page_size: 10,
                            paginated: true,
                          }}
                          mapOption={(item) => ({
                            value: item.uid,
                            label: `${item.name}`,
                          })}
                          placeholder="Search Designations..."
                          debounceMs={500}
                          minChars={3}
                          isReadOnly={false}
                        />
                        <FormikSelect
                          name="action_uid"
                          label="Actions"
                          url="/approval-action"
                          containerClass="col-md-6 mb-3"
                          filters={{
                            page: 1,
                            page_size: 10,
                            paginated: true,
                          }}
                          mapOption={(item) => ({
                            value: item.uid,
                            label: `${item.name} (${item.code})`,
                          })}
                          placeholder="Search Actions..."
                          debounceMs={500}
                          minChars={3}
                          isReadOnly={false}
                        />
                      </div>

                      <div className="row">
                        <label htmlFor="AllStatusSwitch" className="form-label">
                          Module Level Setup
                        </label>
                        <div className="col mb-3">
                          <div className="form-check form-switch">
                            <Field
                              type="checkbox"
                              name="is_signatory"
                              className="form-check-input"
                              id="isSignatorySwitch"
                              checked={values.is_signatory}
                              onChange={(e) =>
                                setFieldValue("is_signatory", e.target.checked)
                              }
                            />
                            <label
                              className="form-check-label"
                              htmlFor="isSignatorySwitch"
                            >
                              Allow Level to be Signatory
                            </label>
                          </div>
                          <ErrorMessage
                            name="is_signatory"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col mb-3">
                          <div className="form-check form-switch">
                            <Field
                              type="checkbox"
                              className="form-check-input"
                              id="isActiveSwitch"
                              name="is_active"
                              checked={values.is_active}
                              onChange={(e) =>
                                setFieldValue("is_active", e.target.checked)
                              }
                            />
                            <label
                              className="form-check-label"
                              htmlFor="isActiveSwitch"
                            >
                              Mark Level As Active
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
                )
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApprovalModuleLevelModal;
