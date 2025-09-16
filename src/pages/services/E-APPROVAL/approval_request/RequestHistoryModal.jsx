import React, { useContext, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import showToast from "../../../../helpers/ToastHelper";
import { ApprovalRequestsContext } from "../../../../utils/context";
import { useSelector } from "react-redux";
import { approveRejectRequest, getRequestApprovalSteps } from "./Queries";
import Swal from "sweetalert2";
import CustomTimeline from "../../../../components/common/CustomTimeline";
import ReactLoading from "react-loading";
import TextSignature from "../../../../components/common/TextSignature";

const RequestHistoryModal = ({ loadOnlyModal = false }) => {
  const user = useSelector((state) => state.userReducer?.data);

  const {
    handleFetchData,
    selectedRequest,
    setSelectedRequest,
    selectedModuleLevel,
    setSelectedModuleLevel,
    viewRequestHistory,
    setViewRequestHistory,
  } = useContext(ApprovalRequestsContext);
  const [errors, setOtherError] = useState({});

  const [loadingRequestApprovalSteps, setLoadingRequestApprovalSteps] =
    useState(true);

  const [requestApprovalSteps, setRequestApprovalSteps] = useState([]);

  const initialValues = {
    request_uid: selectedRequest?.uid || "",
    module_level_uid: selectedModuleLevel?.module_level_uid || "",
    comment: selectedRequest?.step?.comment || "",
    action: selectedRequest?.step?.is_approved ? "FORWARD" : "RETURN",
  };

  const validationSchema = Yup.object().shape({
    request_uid: Yup.string().required("Request is required"),
    module_level_uid: Yup.string().required("Position is required"),
    comment: Yup.string().required("Please Write Something as Comment"),
  });

  const handleFetchRequestSteps = async () => {
    setLoadingRequestApprovalSteps(true);
    try {
      const result = await getRequestApprovalSteps({
        request_uid: selectedRequest?.uid,
        pagination: {
          page: 1,
          page_size: 10,
          paginated: false,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setRequestApprovalSteps(result.data);
      } else {
        setRequestApprovalSteps([]);
      }
    } catch (err) {
      setRequestApprovalSteps([]);
    } finally {
      setLoadingRequestApprovalSteps(false);
    }
  };

  const handleClose = () => {
    const modalElement = document.getElementById("approvalRequestHistoryModal");
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
  };

  // Fetch ApprovalRequests on initial load
  useEffect(() => {
    setTimeout(() => {
      if (selectedRequest) {
        handleFetchRequestSteps();
      }
    }, 1300);
  }, [viewRequestHistory]); // Fetch when search query changes

  return (
    <>
      <div
        className="modal modal-slide-in"
        id="approvalRequestHistoryModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel3">
                Request Approval Chain Full History
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
                        <div className="text-justify mb-4">
                          <p className="mb-1 fw-bold">
                            <i className="bx bx-info-circle me-2"></i>
                            Description
                          </p>
                          <p className="mb-0">
                            Below is a list of all the steps taken for this
                            request up to its current status. It outlines the
                            entire process from the day it entered the approval
                            workflow until today.
                          </p>
                        </div>
                        <div
                          className="m-4"
                          style={{
                            maxHeight: "60vh",
                            overflowY: "auto",
                            msOverflowX: "hidden",
                          }}
                        >
                          {loadingRequestApprovalSteps ? (
                            <div className="col-md-12 col-lg-12 col-sm-12 p-2">
                              <center>
                                <ReactLoading
                                  type={"cylon"}
                                  color={"#696cff"}
                                  height={"30px"}
                                  width={"50px"}
                                />
                              </center>
                              <center className="mt-1">
                                <h6 className="text-muted">
                                  Fetching Approval Request History
                                </h6>
                              </center>
                            </div>
                          ) : (
                            <div>
                              {requestApprovalSteps.map((level, index) => (
                                <div
                                  className="d-flex justify-content-start align-items-start user-name me-3 animate__animated animate__fadeInRight"
                                  style={{
                                    minWidth: "300px",
                                    borderRadius: "10px",
                                    paddingTop: "10px",
                                    animationDelay: `${index * 0.25}s`,
                                    WebkitAnimationDelay: `${index * 0.25}s`,
                                  }}
                                  key={`levels_history_${index}`}
                                >
                                  <div
                                    className="vr py-0 text-muted"
                                    style={{
                                      position: "absolute",
                                      left: "55px",
                                      top: "60px",
                                      bottom: "10px", // Anchors the bottom
                                    }}
                                  ></div>

                                  <div
                                    className="avatar me-4 mb-5 text-muted d-flex flex-column"
                                    style={{
                                      border: level.is_approved
                                        ? "2px solid #696cff"
                                        : "2px solid rgb(247, 55, 55)",
                                      borderRadius: "10px",
                                      width: "120px",
                                      textAlign: "center",
                                      justifyContent: "center",
                                      alignContent: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "12",
                                        fontWeight: "100",
                                        width: "120px",
                                        color: level.is_approved
                                          ? "rgb(97, 100, 250)"
                                          : "rgb(247, 55, 55)",
                                      }}
                                    >
                                      {new Date(
                                        level.created_at
                                      ).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                  <div className="d-flex flex-column">
                                    <h6
                                      className="mb-1"
                                      style={{
                                        color: level.is_approved
                                          ? "#696cff"
                                          : "rgb(247, 55, 55)",
                                      }}
                                    >
                                      {" "}
                                      {level.is_approved
                                        ? `${level.approval_level?.action.name} By `
                                        : `Rejected By `}
                                      &nbsp;
                                      {level.approval_level?.level.name
                                        ? `${level.approval_level?.level.name}`
                                        : "Approver N/S"}
                                    </h6>
                                    <strong>
                                      <span
                                        className="text-capitalize"
                                        style={{ fontWeight: "300" }}
                                      >
                                        {level.approved_by
                                          ? `${level.approved_by.name}`
                                          : "Approver N/S"}
                                      </span>{" "}
                                      {level.is_acting ? `( Act )` : ""}
                                    </strong>
                                    <div
                                      className="comment-popup animate__animated animate__fadeIn"
                                      style={{
                                        marginTop: "0px",
                                        marginBottom: "16px",
                                        maxWidth: "100%",
                                        background: "#fff",
                                        color: "#222",
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "8px",
                                        boxShadow:
                                          "0 8px 24px rgba(0,0,0,0.12)",
                                        padding: "16px",
                                        zIndex: 10,
                                        width: "100%",
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="d-flex align-items-center mb-2">
                                        <i className="bx bx-comment text-info me-2"></i>
                                        <span>
                                          {" "}
                                          {`${level.approval_level?.level.name} `}{" "}
                                          Comment
                                        </span>
                                        <strong>&nbsp;</strong>
                                      </div>
                                      <div
                                        className="text-gray"
                                        style={{
                                          fontSize: "0.98em",
                                          whiteSpace: "pre-line",
                                        }}
                                      >
                                        {level.comment
                                          ? `${level.comment}`
                                          : ""}
                                      </div>
                                    </div>

                                    {level.approved_by.signature &&
                                    level.approved_by.signature.trim() !==
                                      "" ? (
                                      <img
                                        src={level.approved_by.signature}
                                        alt="Avatar"
                                        className="img-fluid rounded mb-4 shadow"
                                        height="100px"
                                        width="85%"
                                        style={{
                                          height: "40px",
                                          width: "150px",
                                        }}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src =
                                            "/assets/img/avatars/signature.png";
                                        }}
                                      />
                                    ) : (
                                      <TextSignature
                                        text={level.approved_by.name}
                                      />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
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
                      className="btn btn-sm btn-outline-info "
                      data-bs-dismiss="modal"
                      style={{ marginRight: "20px", minWidth: "150px" }}
                    >
                      Close
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

export default RequestHistoryModal;
