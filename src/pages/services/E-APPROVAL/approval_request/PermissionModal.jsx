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

const PermissionModal = () => {
  const user = useSelector((state) => state.userReducer?.data);

  const {
    handleFetchData,
    selectedRequest,
    setSelectedRequest,
    selectedModuleLevel,
    setSelectedModuleLevel,
    isLastStep,
  } = useContext(ApprovalRequestsContext);
  const [errors, setOtherError] = useState({});

  const initialValues = {
    request_uid: selectedRequest?.uid || "",
    module_level_uid: selectedModuleLevel?.module_level_uid || "",
    comment: selectedRequest?.step?.comment || "",
    action: selectedRequest?.step?.is_approved ? "FORWARD" : "RETURN",
    handler_user: "",
  };

  const validationSchema = Yup.object().shape({
    request_uid: Yup.string().required("Request is required"),
    module_level_uid: Yup.string().required("Position is required"),
    comment: Yup.string().required("Please Write Something as Comment"),
    handler_user: Yup.string().when([], {
      is: () => isLastStep === true,
      then: (schema) =>
        schema.required("You Must Select The final Handler For this Request"),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const [loadingUser, setLoadingUser] = useState(false);
  const [errorUser, setErrorUser] = useState(false);
  const [users, setUsers] = useState([]);
  const [updatedGrants, setUpdatedGrants] = useState([]);
  const [finalGrants, setFinalGrants] = useState([]);

  const handleSubmit = async (
    values,
    { resetForm, setErrors, setSubmitting }
  ) => {
    try {
      handleClose();
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: `You are about to ${
          values.action === "FORWARD"
            ? "Allow The Request to go Forward "
            : "Denying & Send Back The Request"
        }. Please Click confirm to proceed.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#696cff", // info color
        cancelButtonColor: "#fff",
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        buttonsStyling: true,
        customClass: {
          confirmButton: "btn btn-info btn-sm",
          cancelButton: "btn btn-outline-secondary btn-sm",
        },
      });

      if (confirmation.isConfirmed) {
        if (!selectedRequest || !selectedModuleLevel?.level) {
          showToast(
            "Opps! Unable to Perform Action Please try Again or Contact Support team",
            "error",
            ""
          );
          handleClose();
          resetForm();
          return;
        }

        if (selectedRequest) {
          values.uid = selectedRequest.uid;
          values.module_level_uid = selectedModuleLevel?.module_level_uid;
        }

        // Clone values
        const payload = { ...values };

        // Remove handler_user if not needed
        if (!isLastStep) {
          delete payload.handler_user;
        }
        const result = await approveRejectRequest(payload);

        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "Process Saved Successful",
            "success"
          );
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
      }
    } catch (error) {
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Action. Please Try Again or Contact Support Team`,
        "error"
      );

      handleClose();
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("approvalActionSetModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

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
              }) => (
                <Form>
                  <div className="modal-body">
                    <div className="row g-4">
                      <p className="text-muted">
                        Here is the list of permissions selected for this
                        request. Please review them carefully before performing
                        any action.
                      </p>

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

                      {/* Debugging: show current final state */}
                      <pre className="mt-4 bg-light p-2 rounded small">
                        {JSON.stringify(finalGrants, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      aria-label="Click me"
                      type="submit"
                      disabled={isSubmitting}
                      onClick={() => {
                        setFieldValue("action", "RETURN");
                      }}
                      className="btn btn-sm btn-outline-danger "
                      data-bs-dismiss="modal"
                      style={{ marginRight: "20px", minWidth: "150px" }}
                    >
                      Send Back
                    </button>
                    <button
                      aria-label="Click me"
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-sm btn-primary"
                      style={{ marginRight: "20px", minWidth: "150px" }}
                      onClick={() => {
                        setFieldValue("action", "FORWARD");
                      }}
                    >
                      {isSubmitting ? "Processing..." : "Approve / Forward "}
                    </button>
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

export default PermissionModal;
