import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { RolesManagementContext } from "../../../../utils/context";
import { createUpdateItem } from "./Queries";
import { Select } from "@headlessui/react";
import DualListSelect from "../../../../components/ui-templates/DualListSelect";
import { fetchData } from "../../../../utils/GlobalQueries";

const SystemRoleModal = () => {
  const { selectedObj, setSelectedObj } = useContext(RolesManagementContext);
  const [errors, setOtherError] = useState({});
  const initialValues = {
    name: selectedObj?.name || "",
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
  });

  const [leftOptions, setLeftOptions] = useState([]);

  const [loadingRightOptions, setLoadingRightOptions] = useState(false);
  const [clearSelectTrigger, setClearSelectTrigger] = useState(0);

  const [rightOptions, setRightOptions] = useState([]);

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
        values.uid = selectedObj.uid;
      }
      const result = await createUpdateItem(values);

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        handleClose();
        resetForm();
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
    const modalElement = document.getElementById("viewCreateDataModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    setSelectedObj(null);
    setOtherError({});
    setLeftOptions([]);
    setRightOptions([]);
    setClearSelectTrigger((prev) => prev + 1);
  };

  const handleFetchPermissions = async (searchValue = "") => {
    setLoadingRightOptions(true);
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
    } finally {
      setLoadingRightOptions(false);
    }
  };

  useEffect(() => {
    if (selectedObj) {
      handleFetchPermissions();
      if (selectedObj.permissions && selectedObj.permissions.length > 0) {
        const formattedRightOptions = selectedObj.permissions.map((perm) => ({
          value: perm.id,
          label: `${perm.name}`,
        }));
        setRightOptions(formattedRightOptions);
      } else {
        setRightOptions([]);
      }
    } else {
      setRightOptions([]);
    }
  }, [selectedObj]);

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
