import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { UsersContext } from "../../../../utils/context";
import DualListSelect from "../../../../components/ui-templates/DualListSelect";
import { createUpdateData, fetchData } from "../../../../utils/GlobalQueries";

const UserPermissionModal = () => {
  const { selectedObj, setSelectedObj, setTableRefresh } =
    useContext(UsersContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setOtherError] = useState({});
  const initialValues = {
    user_uid: selectedObj?.guid || "",
    selected_roles: selectedObj?.groups || [],
  };

  const validationSchema = Yup.object().shape({
    user_uid: Yup.string().required("User is required"),
    selected_roles: Yup.array()
      .of(Yup.object())
      .required("At least one permission is required"),
  });

  const [leftOptions, setLeftOptions] = useState([]);
  const [rightOptions, setRightOptions] = useState([]);
  const [clearSelectTrigger, setClearSelectTrigger] = useState(0);

  const handleAssign = (selected) => {
    // Move items to right
    const toMove = selected.map((item) => item.value);
    const newRight = [
      ...rightOptions,
      ...leftOptions.filter((item) => toMove.includes(item.value)),
    ];
    const newLeft = leftOptions.filter((item) => !toMove.includes(item.value));
    setRightOptions(newRight);
    setLeftOptions(newLeft);
  };

  const handleRemove = (selected) => {
    // Move items back to left
    const toMove = selected.map((item) => item.value);
    const newLeft = [
      ...leftOptions,
      ...rightOptions.filter((item) => toMove.includes(item.value)),
    ];
    const newRight = rightOptions.filter(
      (item) => !toMove.includes(item.value)
    );
    setLeftOptions(newLeft);
    setRightOptions(newRight);
  };

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors }
  ) => {
    try {
      console.log("Submitting with values:", values);

      if (selectedObj) {
        values.permitted_user = selectedObj?.guid;
      }
      console.log("Submitting with values:", values);

      // Map to IDs (assuming your backend expects a list of permission IDs)
      values.selected_roles = rightOptions.map((item) => item.value);
      const payload = {
        permitted_user: values.permitted_user,
        selected_roles: values.selected_roles,
      };
      if (values.selected_roles.length === 0) {
        showToast(
          "You must assign at least one Role to the user",
          "warning",
          "Validation Failed"
        );
        setSubmitting(false);
        return;
      }

      const result = await createUpdateData({
        url: "/system/roles-list-assign-users",
        formData: payload,
      });

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        setSelectedObj(result.data);
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
      handleClose(); // Close the modal after submission
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById(
      "viewCreateAssignUserRoleModal"
    );
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setIsModalOpen(false);
    setClearSelectTrigger((prev) => prev + 1);
  };

  const handleFetchGroups = async (searchValue = "") => {
    try {
      const result = await fetchData({
        url: "/system/system-groups",
        filter: {
          page: 1,
          page_size: 50,
          paginated: true,
          search: searchValue,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        const formattedOptions = (result.data || []).map((perm) => ({
          value: perm.id,
          label: `${perm.name}`,
        }));

        setLeftOptions(formattedOptions);
      } else {
        setLeftOptions([]);
      }
    } catch (err) {
      setLeftOptions([]);
    }
  };

  useEffect(() => {
    const modalElement = document.getElementById(
      "viewCreateAssignUserRoleModal"
    );
    if (!modalElement) return;

    const handleShow = () => setIsModalOpen(true);
    const handleHide = () => setIsModalOpen(false);

    modalElement.addEventListener("shown.bs.modal", handleShow);
    modalElement.addEventListener("hidden.bs.modal", handleHide);

    return () => {
      modalElement.removeEventListener("shown.bs.modal", handleShow);
      modalElement.removeEventListener("hidden.bs.modal", handleHide);
    };
  }, []);

  useEffect(() => {
    handleFetchGroups();
    if (
      selectedObj !== null &&
      selectedObj?.permissions &&
      selectedObj?.permissions.length > 0
    ) {
      const formattedRightOptions = selectedObj?.permissions.map((perm) => ({
        value: perm.id,
        label: `${perm.name}`,
      }));
      setRightOptions(formattedRightOptions);
    } else {
      setRightOptions([]);
    }
  }, [isModalOpen, selectedObj]);

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="viewCreateAssignUserRoleModal"
        tabIndex="-1"
        aria-hidden="true"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                User Role and Permission Assignment
              </h5>
              <button
                onClick={() => handleClose()}
                type="button"
                className="btn-close"
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
              {({
                isSubmitting,
                values,
                setFieldValue,
                setSubmitting,
                setErrors,
                resetForm,
              }) => (
                <Form>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-sm-11 text-normal">
                        <p className="text-justify">
                          Use the panel below to manage permissions. All
                          available Role appear on the
                          <strong> left</strong>, and all assigned Role appear
                          on the <strong> right</strong>. Select items and click
                          the{" "}
                          <span className="text-success fw-bold">
                            green arrow
                          </span>{" "}
                          to assign, or click the{" "}
                          <span className="text-danger fw-bold">red arrow</span>{" "}
                          to remove them.
                        </p>
                      </div>
                    </div>
                    <div className="row mb-3">
                      {selectedObj && (
                        <div className="d-flex justify-content-start align-items-center user-name">
                          <div className="avatar-wrapper">
                            <div className="avatar avatar-sm me-4">
                              <img
                                src={
                                  selectedObj.photo && selectedObj.photo !== ""
                                    ? selectedObj.photo
                                    : "../../assets/img/avatars/1.png"
                                }
                                alt="Avatar"
                                className="rounded-circle"
                                style={{ width: "40px", height: "40px" }}
                              />
                            </div>
                          </div>
                          <div className="d-flex flex-column">
                            <span className="text-heading text-truncate">
                              <span className="fw-medium text-uppercase">
                                {selectedObj.first_name}{" "}
                                {selectedObj.middle_name}{" "}
                                {selectedObj.last_name}
                              </span>
                              &nbsp;
                              <span className="text-secondary">
                                ({selectedObj.pf_number || ""} )
                              </span>
                            </span>
                            <small className="text-primary">
                              {selectedObj.email && selectedObj.email !== ""
                                ? selectedObj.email
                                : "- - -"}
                            </small>
                          </div>
                        </div>
                      )}
                      <Field
                        type="hidden"
                        name="user_uid"
                        id="nameLarge"
                        className="form-control"
                        placeholder="Enter Name"
                      />
                      <ErrorMessage
                        name="user_uid"
                        component="div"
                        className="text-danger"
                      />
                    </div>
                    <div className="row">
                      <div className="col-md-12">
                        <DualListSelect
                          leftTitle="Available Permissions"
                          rightTitle="Assigned Permissions"
                          leftOptions={leftOptions}
                          rightOptions={rightOptions}
                          onAssign={handleAssign}
                          onRemove={handleRemove}
                          clearTrigger={clearSelectTrigger}
                          searchMethod={handleFetchGroups}
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
                        type="button"
                        onClick={() => {
                          setFieldValue("selected_roles", rightOptions);
                          handleSubmit(values, {
                            setSubmitting,
                            setErrors,
                            resetForm,
                          });
                        }}
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

export default UserPermissionModal;
