import React, { useContext, useEffect, useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../helpers/ToastHelper";
import { ApprovalModuleContext } from "../../utils/context";
import { createUpdateItemLevel } from "./Queries";
import Select from "react-select";
import { getApprovalLevels } from "../approval_level/Queries";
import { getApprovalActions } from "../approval_action/Queries";

const ApprovalModuleLevelModal = () => {
  const {
    handleFetchData,
    debounceTimeout,
    setDebounceTimeout,
    selectApprovalModule,
    setSelectedApprovalLevelModule,
    selectedApprovalLevelModule,
  } = useContext(ApprovalModuleContext);
  const [errors, setOtherError] = useState({});
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [loadingActions, setLoadingActions] = useState(false);

  const [levels, setLevels] = useState([]);
  const [actions, setActions] = useState([]);
  const resetFormRef = useRef(null);
  const initialValues = {
    module_uid: selectApprovalModule?.name || "",
    level_uid: selectedApprovalLevelModule?.level?.uid || "",
    action_uid: selectedApprovalLevelModule?.action?.uid || "",
    order: selectedApprovalLevelModule?.order || 1,
    is_signatory: selectedApprovalLevelModule?.is_signatory || true,
    is_active: selectedApprovalLevelModule?.is_active || true,
  };

  const validationSchema = Yup.object().shape({
    level_uid: Yup.string().required("Level is required"),
    module_uid: Yup.string().required("Module is required"),
    action_uid: Yup.string().required("Action is required"),
    order: Yup.string().required("Level Order is required"),
    is_signatory: Yup.string().required("Is The Signatory"),
  });

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      if (selectedApprovalLevelModule) {
        values.uid = selectedApprovalLevelModule.uid;
      }
      values.module_uid = selectApprovalModule.uid;
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
    setSelectedApprovalLevelModule(null);
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

  const handleFetchLevels = async (searchValue = "") => {
    setLoadingLevels(true);
    try {
      const result = await getApprovalLevels({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setLevels(result.data);
      } else {
        setLevels(null);
      }
    } catch (err) {
      setLevels(null);
    } finally {
      setLoadingLevels(false);
    }
  };

  const handleFetchActions = async (searchValue = "") => {
    setLoadingActions(true);
    try {
      const result = await getApprovalActions({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setActions(result.data);
      } else {
        setActions(null);
      }
    } catch (err) {
      setLevels(null);
    } finally {
      setLoadingActions(false);
    }
  };

  useEffect(() => {
    if (!selectedApprovalLevelModule) {
      handleFetchLevels();
      handleFetchActions();
    } else {
      values.level_uid = selectedApprovalLevelModule?.level?.uid;
      values.action_uid = selectedApprovalLevelModule?.action?.uid;
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
                {selectedApprovalLevelModule === null
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
                        <div className="col mb-3">
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
                      </div>

                      <div className="row">
                        <div className="col mb-3">
                          <label htmlFor="levelUid" className="form-label">
                            Level
                          </label>
                          <Select
                            isLoading={loadingLevels}
                            onChange={(e) => {
                              console.log("Selected Level:", e);
                              if (e === null || e.value == "") {
                                setFieldValue("level_uid", "");
                              } else {
                                setFieldValue("level_uid", e.value);
                              }
                            }}
                            onInputChange={(e) => {
                              console.log("Input Changed:", e);
                              handleFetchLevels(e);
                            }}
                            options={levels?.map((item) => ({
                              value: item.uid,
                              label: `${item.name} (${item.code})`,
                            }))}
                            className="select2-selection fetched-select2"
                            styles={{
                              menu: (base) => ({
                                ...base,
                                position: "absolute",
                                zIndex: 9999,
                              }),
                            }}
                            name="level_uid"
                            value={
                              levels
                                ?.map((item) => ({
                                  value: item.uid,
                                  label: `${item.name} (${item.code})`,
                                }))
                                .find(
                                  (option) => option.value === values.level_uid
                                ) || null
                            }

                            // defaultValue={selectedApprovalLevelModule?.level?.uid || ""}
                            // defaultInputValue={selectedApprovalLevelModule ? `${selectedApprovalLevelModule?.level?.name} (${selectedApprovalLevelModule?.level?.code})` : values.level_uid}
                          />
                          {/* <Field type="hidden" name="level_uid" id="actionUidLarge" /> */}
                          <ErrorMessage
                            name="level_uid"
                            component="div"
                            className="text-danger"
                          />
                        </div>
                        <div className="col mb-3">
                          <label htmlFor="levelUid" className="form-label">
                            Action
                          </label>
                          <Select
                            isLoading={loadingActions}
                            onChange={(e) => {
                              console.log("Selected Action:", e);
                              if (e === null || e.value == "") {
                                setFieldValue("action_uid", "");
                              } else {
                                setFieldValue("action_uid", e.value);
                              }
                            }}
                            onInputChange={(e) => {
                              handleFetchActions(e);
                            }}
                            options={actions?.map((item) => ({
                              value: item.uid,
                              label: `${item.name} (${item.code})`,
                            }))}
                            className="select2-selection fetched-select2"
                            styles={{
                              menu: (base) => ({
                                ...base,
                                position: "absolute",
                                zIndex: 9999,
                              }),
                            }}
                            value={
                              actions
                                ?.map((item) => ({
                                  value: item.uid,
                                  label: `${item.name} (${item.code})`,
                                }))
                                .find(
                                  (option) => option.value === values.action_uid
                                ) || null
                            }
                            // defaultValue={selectedApprovalLevelModule?.action?.uid || ""}
                            // defaultInputValue={selectedApprovalLevelModule ? `${selectedApprovalLevelModule.action?.name} (${selectedApprovalLevelModule.action?.code})` : ""}
                            isClearable
                          />
                          <Field
                            type="hidden"
                            name="action_uid"
                            id="actionUidLarge"
                          />
                          <ErrorMessage
                            name="action_uid"
                            component="div"
                            className="text-danger"
                          />
                        </div>
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
