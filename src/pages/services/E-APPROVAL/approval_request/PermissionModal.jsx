import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { ApprovalRequestsContext } from "../../../../utils/context";
import { useSelector } from "react-redux";
import { approveRejectRequest } from "./Queries";
import Swal from "sweetalert2";
import Select from "react-select";
import { getUsers } from "../../../account/Queries";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";
import { createUpdateData } from "../../../../utils/GlobalQueries";

const PermissionModal = () => {
  const user = useSelector((state) => state.userReducer?.data);

  const {
    handleFetchData,
    selectedRequest,
    setSelectedRequest,
    selectedModuleLevel,
    setSelectedModuleLevel,
    isLastStep,
    isCurrentApprover,
  } = useContext(ApprovalRequestsContext);
  const [errors, setOtherError] = useState({});

  const initialValues = {
    request_data: {
      attachment: selectedRequest?.request_data?.attachment || "",
      grants: selectedRequest?.request_data?.grants || [],
      is_edited: selectedRequest?.request_data?.is_edited || false,
      is_read_term: selectedRequest?.request_data?.is_read_term || false,
    },
  };

  const validationSchema = Yup.object().shape({
    request_data: Yup.object().shape({
      grants: Yup.array().min(
        1,
        "Your Must Select Group or Manual Select Module with its Permission"
      ),
    }),
  });

  const [updatedGrants, setUpdatedGrants] = useState([]);
  const handleSubmit = async (
    values,
    { setSubmitting, setFieldValue, resetForm, setErrors }
  ) => {
    try {
      setFieldValue("request_data.grants", finalGrants);
      setSubmitting(true);

      const result = await createUpdateData({
        url:
          "/approval-request-update-permissions/" +
          (selectedRequest ? selectedRequest.uid : ""),
        formData: values,
      });

      if (result.status === 200 || result.status === 8000) {
        showToast("Data Saved Successfuly", "success", "Complete");
        handleClose();
        resetForm();
        handleFetchData();
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

  // Toggle entire module
  const handleModuleToggle = (codename) => {
    setUpdatedGrants((prev) =>
      prev.map((mod) =>
        mod.codename === codename
          ? {
              ...mod,
              isChecked: !mod.isChecked,
              Permissions: mod.Permissions.map((perm) => ({
                ...perm,
                isChecked: !mod.isChecked ? true : false,
              })),
            }
          : mod
      )
    );
  };

  const handleClose = () => {
    const modalElement = document.getElementById("approvalActionSetModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  // Toggle individual permission
  const handlePermissionToggle = (moduleCodename, permCodename) => {
    setUpdatedGrants((prev) =>
      prev.map((mod) =>
        mod.codename === moduleCodename
          ? {
              ...mod,
              Permissions: mod.Permissions.map((perm) =>
                perm.codename === permCodename
                  ? { ...perm, isChecked: !perm.isChecked }
                  : perm
              ),
              isChecked: mod.Permissions.some((perm) =>
                perm.codename === permCodename
                  ? !perm.isChecked
                  : perm.isChecked
              ), // update module checkbox if at least one permission remains
            }
          : mod
      )
    );
  };

  // Filtered "final state" without removed modules/permissions
  const finalGrants = updatedGrants
    .filter((mod) => mod.isChecked) // keep only checked modules
    .map((mod) => ({
      ...mod,
      Permissions: mod.Permissions.filter((perm) => perm.isChecked),
    }));

  useEffect(() => {
    if (selectedRequest?.request_details?.grants) {
      // Initialize state with all modules + permissions checked
      const initialGrants = selectedRequest.request_details.grants.map(
        (mod) => ({
          ...mod,
          isChecked: true,
          Permissions: mod.Permissions.map((perm) => ({
            ...perm,
            isChecked: true,
          })),
        })
      );
      setUpdatedGrants(initialGrants);
    }
  }, [selectedRequest]);

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="approvalRequestPermissionModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Customise Approval Request Permissions
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
              {({
                values,
                resetForm,
                setErrors,
                setSubmitting,
                setFieldValue,
                isSubmitting,
                setTouched,
              }) => (
                <Form>
                  <div
                    className="modal-body"
                    style={{ maxHeight: "70vh", overflowY: "auto" }}
                  >
                    <div className="row g-4">
                      <p className="text-muted">
                        Here is the list of permissions selected for this
                        request. Please review them carefully before performing
                        any action.
                      </p>
                      <ErrorMessage
                        name="request_data.grants"
                        component="div"
                        className="alert alert-danger"
                      />

                      {updatedGrants.map((mod) => (
                        <div
                          key={mod.codename}
                          className="col-12 col-sm-6 col-md-4 col-lg-"
                        >
                          <div className="card h-100 shadow-sm">
                            <div className="card-body d-flex flex-column">
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="card-title mb-0">{mod.name}</h5>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  style={{
                                    cursor: "pointer",
                                    transform: "scale(1.2)",
                                  }}
                                  checked={mod.isChecked}
                                  ref={(el) => {
                                    if (el) {
                                      const total = mod.Permissions.length;
                                      const checked = mod.Permissions.filter(
                                        (p) => p.isChecked
                                      ).length;
                                      el.indeterminate =
                                        checked > 0 && checked < total;
                                    }
                                  }}
                                  onChange={() =>
                                    handleModuleToggle(mod.codename)
                                  }
                                />
                              </div>

                              <div
                                style={{
                                  flex: 1,
                                  minHeight: "120px",
                                  maxHeight: "220px",
                                  overflowY: "auto",
                                  border: "1px solid #f0f0f0",
                                  borderRadius: "6px",
                                  background: "#fafbfc",
                                  padding: "0.5rem",
                                  textAlign: "left",
                                }}
                              >
                                <ul className="list-group list-group-flush small">
                                  {mod.Permissions.map((perm) => (
                                    <li
                                      key={perm.codename}
                                      className="list-group-item py-1 px-2 d-flex align-items-center"
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        handlePermissionToggle(
                                          mod.codename,
                                          perm.codename
                                        )
                                      }
                                    >
                                      <input
                                        type="checkbox"
                                        className="form-check-input me-2"
                                        style={{
                                          cursor: "pointer",
                                          transform: "scale(1.1)",
                                        }}
                                        checked={perm.isChecked}
                                        disabled={!mod.isChecked}
                                        onChange={() =>
                                          handlePermissionToggle(
                                            mod.codename,
                                            perm.codename
                                          )
                                        }
                                        onClick={(e) => e.stopPropagation()} // prevent double toggle
                                      />
                                      <span>{perm.name}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Optional: Show count of checked permissions */}
                              <div className="mt-2 text-end small text-muted">
                                {
                                  mod.Permissions.filter((p) => p.isChecked)
                                    .length
                                }{" "}
                                permission
                                {mod.Permissions.filter((p) => p.isChecked)
                                  .length > 1
                                  ? "s"
                                  : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {isCurrentApprover && (
                    <div className="modal-footer">
                      <button
                        aria-label="Click me"
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => {
                          handleClose();
                        }}
                        className="btn btn-sm btn-outline-danger "
                        data-bs-dismiss="modal"
                        style={{ marginRight: "20px", minWidth: "150px" }}
                      >
                        Cancel
                      </button>
                      <button
                        aria-label="Click me"
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-sm btn-primary"
                        style={{ marginRight: "20px", minWidth: "150px" }}
                        onClick={() => {
                          setTouched({ "request_data.grants": true }, false);
                          setFieldValue("request_data.grants", finalGrants);
                        }}
                      >
                        {isSubmitting ? "Processing..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default PermissionModal;
