import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { RolesManagementContext } from "../../../../utils/context";
import DualListSelect from "../../../../components/ui-templates/DualListSelect";
import { createUpdateData, fetchData } from "../../../../utils/GlobalQueries";

const SystemRoleModal = () => {
  const { selectedObj, setSelectedObj, setTableRefresh } = useContext(
    RolesManagementContext
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setOtherError] = useState({});
  const initialValues = {
    name: selectedObj?.name || "",
    parmisions: selectedObj?.permissions || [],
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    parmisions: Yup.array()
      .of(Yup.object())
      .required("At least one permission is required"),
  });

  const [leftOptions, setLeftOptions] = useState([]);
  const [rightOptions, setRightOptions] = useState([]);
  const [loadingRightOptions, setLoadingRightOptions] = useState(false);
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
      if (selectedObj) {
        values.id = selectedObj.id;
      }

      // Map to IDs (assuming your backend expects a list of permission IDs)
      values.permissions = rightOptions.map((item) => item.value);
      const payload = {
        name: values.name,
        permissions: values.permissions,
      };
      if (values.permissions.length === 0) {
        showToast(
          "You must assign at least one permission",
          "warning",
          "Validation Failed"
        );
        setSubmitting(false);
        return;
      }

      const result = await createUpdateData({
        url: "/system/roles",
        uid: selectedObj?.id || "",
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
    const modalElement = document.getElementById("viewCreateRoleModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setIsModalOpen(false);
    setClearSelectTrigger((prev) => prev + 1);
  };

  const handleFetchPermissions = async (searchValue = "") => {
    try {
      const result = await fetchData({
        url: "/system/system-permissions",
        filter: {
          page: 1,
          page_size: 50,
          paginated: true,
          search: searchValue,
          selected_role: selectedObj?.id || "",
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
    const modalElement = document.getElementById("viewCreateRoleModal");
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
    handleFetchPermissions();
    if (
      selectedObj !== null &&
      selectedObj.permissions &&
      selectedObj.permissions.length > 0
    ) {
      const formattedRightOptions = selectedObj.permissions.map((perm) => ({
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
        id="viewCreateRoleModal"
        tabIndex="-1"
        aria-hidden="true"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                {selectedObj === null ? "Create New" : "View / Update"} Approval
                Module{" "}
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
              {({ isSubmitting, values, setFieldValue }) => (
                <Form>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-sm-11 text-normal">
                        <p className="text-justify">
                          Use the panel below to manage permissions. All
                          available permissions appear on the
                          <strong> left</strong>, and all assigned permissions
                          appear on the <strong> right</strong>. Select items
                          and click the{" "}
                          <span className="text-success fw-bold">
                            green arrow
                          </span>{" "}
                          to assign, or click the{" "}
                          <span className="text-danger fw-bold">red arrow</span>{" "}
                          to remove them.
                        </p>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col mb-3">
                        <label
                          htmlFor="nameLarge"
                          className="form-label text-capitalize"
                        >
                          Role/Group Name&nbsp;&nbsp;
                          <small className="text-info text-capitalize">
                            * You Must Have a Unique Role Name
                          </small>
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
                      <div className="col-md-12">
                        <DualListSelect
                          leftTitle="Available Permissions"
                          rightTitle="Assigned Permissions"
                          leftOptions={leftOptions}
                          rightOptions={rightOptions}
                          onAssign={handleAssign}
                          onRemove={handleRemove}
                          clearTrigger={clearSelectTrigger}
                          searchMethod={handleFetchPermissions}
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

export default SystemRoleModal;
