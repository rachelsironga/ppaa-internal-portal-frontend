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

const ActionModal = ({ loadOnlyModal = false }) => {
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

  const fetchUsers = async (searchValue = "") => {
    setLoadingUser(true);
    try {
      const result = await getUsers({
        search: searchValue,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: true,
          exception: {
            user: "mimi",
            age: "sfdfd",
          },
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setUsers(result.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setUsers([]);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("approvalActionSetModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  useEffect(() => {
    fetchUsers();
  }, [isLastStep]);

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="approvalActionSetModal"
        tabIndex="-1"
        aria-hidden="true"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Approval Request Action Form
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
                    <div className="row">
                      <div className="col-sm-12 col-md-12">
                        <div className=" text-justify mb-4">
                          <p className="mb-1 fw-bold">
                            <i className="bx bx-info-circle me-2"></i>
                            Attension
                          </p>
                          <p className="mb-0">
                            Please review the action details below.
                            <strong> Approve / Forward</strong> to approve and
                            send to the next level.
                            <strong> Send Back</strong> to return the request to
                            the sender. A Comment is required for Reject
                            actions.
                          </p>
                        </div>
                        <div className="m-4">
                          <p className="text-nowrap mb-2">
                            <i className="icon-base bx bx-command me-2 align-top" />
                            <span className=" me-3 ">Action Required:</span>
                            <strong className="bold">
                              {selectedModuleLevel
                                ? selectedModuleLevel?.action.name +
                                  `( ${selectedModuleLevel?.action.code} )`
                                : "N/A"}
                            </strong>
                          </p>
                          <p className="text-nowrap mb-2">
                            <i className="icon-base bx bx-trophy me-2 align-bottom" />
                            <span className=" me-3 ">
                              Action Should Taken By:
                            </span>
                            <strong className="bold">
                              {selectedModuleLevel
                                ? selectedModuleLevel?.level.name
                                : "N/A"}
                            </strong>
                          </p>
                          <p className="text-nowrap mb-2">
                            <i className="icon-base bx bx-trophy me-2 align-bottom" />
                            <span className=" me-3 ">
                              From Department/Office :
                            </span>
                            <strong className="bold">
                              {selectedModuleLevel
                                ? selectedModuleLevel?.department.name
                                : "N/A"}
                            </strong>
                          </p>
                          <p className="text-nowrap mb-2">
                            <i className="icon-base bx bx-user me-2 align-top" />
                            <span className=" me-3 ">
                              I Who Perform Action is :
                            </span>
                            <strong className="bold">
                              {user?.first_name} {user?.middle_name ?? ""}{" "}
                              {user?.last_name}
                              {selectedModuleLevel?.is_acting && (
                                <span className="text-info">
                                  ( Acting {selectedModuleLevel?.level.code} )
                                </span>
                              )}
                            </strong>
                          </p>
                        </div>
                      </div>
                    </div>
                    {isLastStep && (
                      <div className="row">
                        <FormikSelect
                          name="handler_user"
                          label={
                            <>
                              <label
                                htmlFor="handlerLarge"
                                className="form-label"
                              >
                                Select Handler
                              </label>{" "}
                              <small className="text-danger">
                                Only if is to be Forwarded
                              </small>
                            </>
                          }
                          url={"/user/setup"}
                          isFullPath={true}
                          containerClass="col-md-8 mb-3"
                          filters={{
                            page: 1,
                            page_size: 10,
                            paginated: true,
                            excluded_user: user?.guid,
                          }}
                          mapOption={(item) => ({
                            value: item.guid,
                            label: `${item.first_name} ${
                              item.middle_name ?? ""
                            } ${item.last_name}`,
                            first_name: `${item.first_name}`,
                            middle_name: `${item.middle_name ?? ""}`,
                            last_name: `${item.last_name}`,
                            email: `${item.email}`,
                            current_level_name: item.current_level_name,
                            photo: item.photo,
                            guid: item.guid,
                            full_name: `${item.first_name} ${
                              item.middle_name ?? ""
                            } ${item.last_name}`,
                          })}
                          formatOptionLabel={(user) => (
                            <div className="d-flex justify-content-start align-items-center user-name">
                              <div className="avatar-wrapper">
                                <div className="avatar avatar-sm me-4">
                                  <img
                                    src={
                                      user.photo && user.photo !== ""
                                        ? user.photo
                                        : "../../assets/img/avatars/1.png"
                                    }
                                    alt="Avatar"
                                    className="rounded-circle"
                                    style={{ width: "32px", height: "32px" }}
                                  />
                                </div>
                              </div>
                              <div className="d-flex flex-column">
                                <span className="text-heading text-truncate">
                                  <span className="fw-medium">
                                    {user.first_name} {user?.middle_name ?? ""}{" "}
                                    {user.last_name}
                                  </span>
                                </span>
                                <small className="text-primary">
                                  {user.current_level_name
                                    ? user.current_level_name
                                    : user.email !== ""
                                    ? user.email
                                    : "- - -"}
                                </small>
                              </div>
                            </div>
                          )}
                          placeholder="Search Users ..."
                          debounceMs={500}
                          minChars={3}
                          isReadOnly={false}
                        />
                      </div>
                    )}
                    <div className="row">
                      <div className="col mb-3">
                        <label htmlFor="commentLarge" className="form-label">
                          Comment
                        </label>
                        <Field
                          as="textarea"
                          name="comment"
                          id="commentLarge"
                          className="form-control"
                          rows="3"
                          placeholder="Enter Comment"
                          style={{
                            maxHeight: "150px",
                            overflowY: "auto",
                          }}
                        />
                        <ErrorMessage
                          name="comment"
                          component="div"
                          className="text-danger"
                        />
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

export default ActionModal;
