import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import usePagination from "../../../../hooks/usePagination";
import { useNavigate, useParams } from "react-router-dom";
import "animate.css";
import {
  getApprovalRequests,
  deleteApprovalRequest,
  getApprovalRequestActing,
} from "./Queries";
import { ApprovalRequestsContext } from "../../../../utils/context";
import ActionModal from "./ActionModal";
import TextSignature from "../../../../components/common/TextSignature";
import ApprovalRequestOpenShimmer from "../../../../components/loaders/ApprovalRequestOpenShimmer";
import { getBadgeClass } from "../../../../helpers/BadgeClassHelper";
import BreadCumb from "../../../../layouts/BreadCumb";
import RequestHistoryModal from "./RequestHistoryModal";
import { useSelector } from "react-redux";
import PermissionModal from "./PermissionModal";
import { bool } from "yup";
import HandlerActionModal from "./HandlerActionModal";
import MarkupViewer from "../../../../components/ui-templates/MarkupViewer";
import ResultPanel from "../../../../components/ui-templates/ResultPanel";

const growButtonStyle = `
@keyframes pulse-grow {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(105, 108, 255, 0.4);
  }
  70% {
    transform: scale(1.12);
    box-shadow: 0 0 0 10px rgba(105, 108, 255, 0.1);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(105, 108, 255, 0.0);
  }
}
.attention-grow {
  animation: pulse-grow 2s infinite;
  transition: transform 0.3s cubic-bezier(.4,2,.6,1), box-shadow 0.3s;
  z-index: 2;
  position: relative;
}

@keyframes pulseAttention {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
`;

// Inject the style into the document head (only once)
if (
  typeof document !== "undefined" &&
  !document.getElementById("grow-btn-style")
) {
  const style = document.createElement("style");
  style.id = "grow-btn-style";
  style.innerHTML = growButtonStyle;
  document.head.appendChild(style);
}

export const ApprovalRequestOpenPage = () => {
  const { uid } = useParams();
  const user = useSelector((state) => state.userReducer?.data);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewVisible, setIsViewVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const [selectedModuleLevel, setSelectedModuleLevel] = useState(null);
  const [openCommentIndex, setOpenCommentIndex] = useState(null);
  const commentBoxRef = useRef(null);
  const navigate = useNavigate();
  const [viewRequestHistory, setViewRequestHistory] = useState(0);
  const [isLastStep, setIsLastStep] = useState(false);
  const [isCurrentApprover, setIsCurrentApprover] = useState(false);

  const [loadingIsActing, setLoadingIsActing] = useState(false);
  const [isActing, setIsActing] = useState(null);

  const viewSignature = ({ signature = null }) => {
    sign =
      signature && signature.trim() !== ""
        ? signature
        : "/assets/img/avatars/signature.png";
    return sign;
  };

  const navigateToPrev = () => {
    navigate(-1);
  };

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const result = await getApprovalRequests({
        uid: uid,
        pagination: {
          full_details: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setSelectedRequest(result.data);
        setLoadingIsActing(false);
      } else {
        showToast("No Approval Request Found", "warning", "Fetch Completed");
      }
    } catch (err) {
      if (err.status === 401) {
        showToast(
          "Session Expired. Please Login Again",
          "error",
          "Session Expired"
        );
      } else {
        showToast("Unable to Fetch Approval Request", "warning", "Failed");
      }
    } finally {
      if (debounceTimeout) clearTimeout(debounceTimeout);

      // Set new debounce timeout
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 1600);

      setDebounceTimeout(timeout);

      return () => clearTimeout(timeout); // Cleanup on unmount
    }
  };

  const handleFetchActing = async (level, department) => {
    setLoadingIsActing(true);
    try {
      const result = await getApprovalRequestActing({
        filter: {
          level: level,
          department: department,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setLoadingIsActing(false);
        setIsActing(true);
      }
    } catch (err) {
      if (err.status === 401) {
        showToast(
          "Session Expired. Please Login Again",
          "error",
          "Session Expired"
        );
      } else {
        showToast("Unable Check Acting Status", "warning", "");
      }
    } finally {
      setTimeout(() => {
        setLoadingIsActing(false);
      }, 8000);
    }
  };

  const handleDelete = async (approvalRequest = null) => {
    if (!approvalRequest) {
      Swal.fire("Error!", "Unable to Select this approval Action.", "error");
      return;
    }

    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "Your About to Delete the data",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Yes, delete it!",
      });

      if (confirmation.isConfirmed) {
        const result = await deleteApprovalRequest(approvalRequest.uid);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "The approval Action has been deleted.",
            "success"
          );
          handleFetchData();
        } else {
          console.error("Error deleting approval Action:", result);
          Swal.fire("Error Occurred!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting approval Action:", error);
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Delete. Please Try Again or Contact Support Team`,
        "error"
      );
    }

    setSelectedRequest(null); // Reset selected ApprovalRequest after deletion
  };

  // Runs only once when component mounts
  useEffect(() => {
    handleFetchData();
  }, []);

  useEffect(() => {
    if (!selectedRequest || !user?.position) return;

    const levels = selectedRequest.module?.approval_module_levels ?? [];
    const isRequestFinalized =
      selectedRequest.status === "REJECTED" ||
      selectedRequest.status === "APPROVED";

    levels.forEach((level, index) => {
      const isCurrentLevel = selectedRequest.current_state === index;

      const isNotOwner =
        level.level?.uid !== user.position.level_uid ||
        level.department?.uid !== user.position.department_uid;

      if (isCurrentLevel && !isRequestFinalized && isNotOwner) {
        if (level.level?.uid && level.department?.uid) {
          handleFetchActing(level.level.uid, level.department.uid);
        }
      }
    });

    const approver = levels.some(
      (level, index) =>
        selectedRequest.current_state === index &&
        !isRequestFinalized &&
        ((level.level?.uid === user.position?.level_uid &&
          level.department?.uid === user.position?.department_uid) ||
          isActing)
    );

    setIsCurrentApprover(approver);
  }, [selectedRequest, user, isActing]);

  return (
    <ApprovalRequestsContext.Provider
      value={{
        handleFetchData,
        selectedRequest,
        setSelectedRequest,
        isModalOpen,
        setIsModalOpen,
        selectedModuleLevel,
        setSelectedModuleLevel,
        viewRequestHistory,
        setViewRequestHistory,
        isLastStep,
        isActing,
        isCurrentApprover,
      }}
    >
      <BreadCumb pageList={["Approval Requests", "view"]} />
      <PermissionModal />

      {loading ? (
        <div className="row">
          <div className="col-12">
            <ApprovalRequestOpenShimmer />
          </div>
        </div>
      ) : (
        <div className="card animate__animated animate__fadeInUp animate__fast">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap mb-6 gap-2 mb-2">
              <div className="me-1">
                <h5 className="mb-0">Approval Request Details</h5>
                <p className="mb-0 text-muted">
                  Use Right Options Button to perform different Actions
                </p>
              </div>
              <div
                className={`badge d-flex align-items-center gap-2 ${getBadgeClass(
                  selectedRequest?.status
                )} pe-3 text-start  animate__animated animate__fadeInUp animate__slower`}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  minWidth: "180px",
                  animation: "pulseAttention 3s ease",
                  animationIterationCount: "infinite",
                }}
              >
                <i className="bx bx-purchase-tag"></i>
                <div>
                  <span
                    className="d-block mb-2 text-muted fw-semibold text-lowercase"
                    style={{ fontSize: "0.9rem" }}
                  >
                    Request Status
                  </span>
                  <div
                    style={{
                      fontWeight: 600,
                      textTransform: "capitalize",
                      paddingLeft: "0.5rem",
                    }}
                  >
                    {selectedRequest?.status || "Unknown"}
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center">
                <div className="py-3 ml-4" id="dropdown-icon-demo">
                  <button
                    aria-label="Click me"
                    type="button"
                    className="btn btn-sm btn-outline-primary  dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bx bx-menu me-1"></i> Select Options
                  </button>
                  <ul className="dropdown-menu">
                    {/* <li>
                      <button
                        aria-label="dropdown action link"
                        className="dropdown-item d-flex align-items-center"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="bx bx-pencil mx-2"></i>Edit Request
                      </button>
                    </li> */}
                    <li>
                      <button
                        aria-label="dropdown action link"
                        className="dropdown-item d-flex align-items-center"
                        data-bs-toggle="modal"
                        aria-expanded="false"
                        data-bs-target="#approvalRequestHistoryModal"
                        onClick={() => {
                          setViewRequestHistory((prev) => prev + 1);
                        }}
                      >
                        <i className="bx bx-transfer mx-2"></i>Preview Approval
                        History
                      </button>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    {/* <li>
                      <button
                        aria-label="dropdown action link"
                        className="dropdown-item d-flex align-items-center"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="bx bxs-file-pdf  mx-2"></i> Print Request
                      </button>
                    </li> */}
                  </ul>
                </div>
              </div>
            </div>
            <div className="card academy-content shadow-none border">
              <div className="p-2"></div>
              <div className="card-body pt-4">
                <div className="row">
                  <div
                    className="col-lg-4 col-md-4 animate__animated animate__fadeInLeft animate__fast"
                    style={{ overflow: "hidden" }}
                  >
                    <h5>Requester Detail</h5>
                    <div className="m-4">
                      <p className=" mb-2">
                        <i className="icon-base bx bx-user me-2 align-top" />
                        <span className=" me-3 ">Name:</span>
                        <strong className="bold">
                          {selectedRequest?.created_by?.first_name} &nbsp;
                          {selectedRequest?.created_by?.middle_name}&nbsp;
                          {selectedRequest?.created_by?.last_name}
                        </strong>
                      </p>
                      <p className=" mb-2">
                        <i className="icon-base bx bx-card me-2 align-bottom" />
                        <span className=" me-3 ">PF-Number:</span>
                        <strong className="bold">
                          {selectedRequest?.created_by?.pf_number}
                        </strong>
                      </p>
                      <p className=" mb-2 ">
                        <i className="icon-base bx bx-trophy me-2 align-bottom" />
                        <span className=" me-3 ">Position:</span>
                        <strong className="bold">
                          {selectedRequest?.created_by?.position?.level_name}
                        </strong>
                      </p>
                      <p className=" mb-2">
                        <i className="icon-base bx bxs-layer me-2 align-bottom" />
                        <span className=" me-3 ">Departments:</span>
                        <strong className="bold">
                          {
                            selectedRequest?.created_by?.position
                              ?.department_name
                          }
                        </strong>
                      </p>
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-4    animate__animated animate__fadeInRight animate__fast">
                    <h5>About This Request</h5>
                    <div className="m-4">
                      <p className="text-nowrap mb-2">
                        <i className="icon-base bx bx-pin me-2 align-top" />
                        <span className=" me-3 ">Title:</span>
                        <strong className="bold text-wrap">
                          {selectedRequest?.title}
                        </strong>
                      </p>
                      <p className="text-nowrap mb-2">
                        <i className="icon-base bx bx-right-indent me-2 align-bottom" />
                        <span className=" me-3 ">Request Type:</span>
                        <strong className="bold">
                          {" "}
                          {`${selectedRequest?.type}`.replaceAll("_", " ")}
                        </strong>
                      </p>
                      <p className="text-nowrap mb-2">
                        <i className="icon-base bx bx-calendar me-2 align-bottom" />
                        <span className=" me-3 ">Requested At:</span>
                        <strong className="bold">
                          {new Date(
                            selectedRequest?.created_at
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </strong>
                      </p>
                      <p className="text-nowrap mb-2">
                        <i className="icon-base bx bx-card me-2 align-bottom" />
                        <span className=" me-3 ">Access Period :</span>
                        <strong className="bold">
                          {selectedRequest?.date_range?.name}
                        </strong>
                      </p>
                    </div>
                  </div>
                  {selectedRequest?.request_handler && (
                    <div className="col-lg-4 col-md-4  animate__animated animate__fadeInLeft animate__fast">
                      <h5>Final Handler Detail</h5>
                      {console.log(selectedRequest)}
                      <div className="m-4">
                        <p className="text-nowrap mb-2">
                          <i className="icon-base bx bx-user me-2 align-top" />
                          <span className=" me-3 ">Name:</span>
                          <strong className="bold">
                            {selectedRequest?.request_handler?.name}
                          </strong>
                        </p>
                        <p className="text-nowrap mb-2">
                          <i className="icon-base bx bx-card me-2 align-bottom" />
                          <span className=" me-3 ">PF-Number:</span>
                          <strong className="bold">
                            {selectedRequest?.request_handler?.pf_number}
                          </strong>
                        </p>
                        <p className="text-nowrap mb-2">
                          <i className="icon-base bx bxs-layer me-2 align-bottom" />
                          <span className=" me-3 ">Email:</span>
                          <strong className="bold">
                            {selectedRequest?.request_handler?.email}
                          </strong>
                        </p>
                        {selectedRequest?.is_handled === true && (
                          <p className="text-nowrap mb-2">
                            <i className="bx bx-purchase-tag"></i>
                            <span className=" me-3 ">status:</span>
                            <strong className="bold text-bold text-success attention-grow">
                              COMPLETE
                            </strong>
                          </p>
                        )}
                        {selectedRequest?.request_handler?.guid == user?.guid &&
                          selectedRequest?.is_handled === false && (
                            <button
                              aria-label="Click me"
                              type="button"
                              className="btn btn-sm btn-outline-info me-2 attention-grow"
                              data-bs-toggle="modal"
                              data-bs-target="#approvalHandleActionModal"
                              onClick={() => {}}
                            >
                              <i className="bx bx-grid-small"></i> Write Final
                              Response
                            </button>
                          )}
                      </div>
                    </div>
                  )}
                </div>
                <hr className="my-4" />

                {selectedRequest?.handler_descriptions && (
                  <div className="p-3">
                    <ResultPanel
                      title="Request Handler Descriptions / Instructions"
                      html={selectedRequest?.handler_descriptions}
                      isViewer={
                        selectedRequest?.created_by?.guid == user.guid ||
                        selectedRequest?.request_handler?.guid == user?.guid
                      }
                      initiallyOpen={false}
                    />
                  </div>
                )}

                <div
                  className="d-flex justify-content-between align-items-center flex-wrap mb-6 gap-2 mb-2 bg-dark bg-opacity-10 rounded-3 p-3 border"
                  onClick={() => {
                    setIsViewVisible((prev) => !prev);
                  }}
                >
                  <div className="me-1">
                    <h5
                      className="mb-0 cursor-pointer"
                      onClick={() => {
                        setIsViewVisible((prev) => !prev);
                      }}
                    >
                      Approval Request Data & Attachments
                    </h5>
                    <p className="mb-0 text-muted">
                      Use Right Options Button to view Extra Infomation for
                      these Request
                    </p>
                  </div>

                  <div>
                    <span className="text-muted">Click to preview</span>&nbsp;
                    &nbsp;
                    <div
                      class=""
                      style={{
                        height: "20px",
                        display: "inline-block",
                        paddingTop: "-1.5rem",
                        marginLeft: "2rem",
                        borderRadius: "10px",
                        cursor: "pointer",
                      }}
                    >
                      <i
                        className={
                          `bx bx-lg attention-grow` +
                          (isViewVisible ? " bx-caret-up" : " bx-caret-down")
                        }
                        style={{ borderRadius: "10px" }}
                      ></i>
                    </div>
                  </div>
                </div>

                {isViewVisible &&
                  selectedRequest?.request_details?.grants &&
                  (selectedRequest?.type == "EDMS_ACCESS" ||
                    selectedRequest?.type == "JEEVA_ACCESS" ||
                    selectedRequest?.type == "WELSOFT_ACCESS") && (
                    <div
                      className="row g-4 mx-1 mt-3 mb-4"
                      style={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        padding: "1rem",
                        background: "#fafbfc",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p className="text-muted">
                          Here is the list of permissions selected for this
                          request. Please review them carefully before Perform
                          Any Action.
                        </p>

                        {selectedRequest.status !== "REJECTED" &&
                          selectedRequest.status !== "APPROVED" &&
                          isCurrentApprover && (
                            <div className="row center align-content-center">
                              <div className="d-flex align-items-center animate__animated animate__fadeInRight  animate__slow">
                                <button
                                  aria-label="dropdown action link"
                                  data-bs-toggle="modal"
                                  aria-expanded="false"
                                  data-bs-target="#approvalRequestPermissionModal"
                                  onClick={() => {
                                    setIsViewVisible((prev) => !prev);
                                  }}
                                  type="button"
                                  style={{ width: "300px", fontWeight: "800" }}
                                  className="btn btn-sm btn-outline-primary bg-info text-white bold me-3 attention-grow"
                                >
                                  <i className="bx bx-pen"></i>&nbsp; Customise
                                  Selected Permissions
                                </button>
                              </div>
                            </div>
                          )}
                      </div>

                      {selectedRequest?.request_details?.grants.map((mod) => (
                        <div
                          key={mod.codename}
                          className="col-12 col-sm-6 col-md-4 col-lg-"
                        >
                          <div className="card h-100 shadow-sm">
                            <div className="card-body d-flex flex-column">
                              <h5 className="card-title mb-3">{mod.name}</h5>

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
                                      className="list-group-item py-1 px-2"
                                    >
                                      <i
                                        className="bx bx-check-shield me-2"
                                        style={{
                                          color: "#696cff",
                                          fontSize: "1.1em",
                                        }}
                                      ></i>
                                      {perm.name}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {/* Optional: Show count of permissions */}
                              <div className="mt-2 text-end small text-muted">
                                {mod.Permissions.length} permission
                                {mod.Permissions.length > 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {isViewVisible &&
                  selectedRequest?.request_details?.grants &&
                  selectedRequest?.type == "INTERNET_EMAIL_ACCESS" && (
                    <div className="row g-4 px-4">
                      <p className="text-muted text-center py-5">
                        The user is requesting for Internet Access. Please
                        review the details carefully before Perform Any Action.
                      </p>
                    </div>
                  )}

                <hr className="my-6" />

                <h5>Description</h5>
                <p className="mb-6 align-justify">
                  {selectedRequest?.description}
                </p>
                <hr className="my-6" />
                <h5>Approval Chain</h5>
                <div
                  style={{
                    overflowX: "scroll",
                    minHeight: "150px",
                  }}
                  className="d-flex justify-content-start col-md-12"
                >
                  {selectedRequest?.module?.approval_module_levels.map(
                    (level, index) => (
                      <div
                        className="d-flex justify-content-start align-items-start user-name me-3 animate__animated animate__fadeInRight"
                        style={{
                          minWidth: "320px",
                          borderRadius: "10px",
                          borderTop:
                            selectedRequest?.current_state === index
                              ? "6px solid rgb(117, 202, 223)"
                              : "0",

                          paddingTop: "10px",
                          animationDelay: `${index * 0.25}s`,
                          WebkitAnimationDelay: `${index * 0.25}s`,
                          overflow: "clip",
                          paddingRight: "5px",
                        }}
                        key={`levels_${index}`}
                      >
                        <div
                          className="avatar me-4 mb-5 text-muted"
                          style={{
                            border: level?.step
                              ? level?.step?.is_approved
                                ? "2px solid #696cff"
                                : "2px solid rgb(247, 55, 55)"
                              : "0.5px solid rgb(163, 169, 190)",
                            borderRadius: "100%",
                            width: "50px",
                            height: "50px",
                            textAlign: "center",
                            justifyContent: "center",
                            alignContent: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "50px",
                              fontSize: "30px",
                              fontWeight: "800",
                              color: level?.step
                                ? level?.step?.is_approved
                                  ? "#696cff"
                                  : "rgb(247, 55, 55)"
                                : "rgb(163, 169, 190)",
                            }}
                          >
                            {index + 1}
                          </div>
                        </div>
                        <div
                          className="d-flex flex-column"
                          style={{ width: "280px" }}
                        >
                          {(level?.step &&
                            selectedRequest?.current_state !== index) ||
                          (level?.step &&
                            (selectedRequest.status === "REJECTED" ||
                              selectedRequest.status === "APPROVED")) ? (
                            <>
                              <h6
                                className="mb-1"
                                style={{
                                  color: level?.step
                                    ? level?.step?.is_approved
                                      ? "#696cff"
                                      : "rgb(247, 55, 55)"
                                    : "rgb(163, 169, 190)",
                                }}
                              >
                                {" "}
                                {level?.step?.is_approved
                                  ? `${level?.action?.name} By `
                                  : `Rejected By `}
                                &nbsp;
                                {level?.step && level.level
                                  ? `${level?.level?.name}`
                                  : "Approver N/S"}
                              </h6>
                              <strong>
                                <span
                                  className="text-capitalize"
                                  style={{ fontWeight: "300" }}
                                >
                                  {level?.step && level?.step?.approved_by
                                    ? `${level?.step?.approved_by.name}`
                                    : "Approver N/S"}
                                </span>{" "}
                                {level?.step?.is_acting ||
                                level?.step?.approved_by?.position
                                  ?.department_uid !== level.department.uid ||
                                level.level?.uid !==
                                  level?.step?.approved_by?.position?.level_uid
                                  ? `( Act )`
                                  : ""}
                              </strong>
                              {level?.step && level?.step?.created_at && (
                                <div className="d-flex align-items-center justify-content-between comment-date-row my-1">
                                  {/* Left: Date */}
                                  <span className="comment-date-text">
                                    {new Date(
                                      level?.step?.created_at
                                    ).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                  {/* Center: Vertical Line */}
                                  <div className="vr py-0 text-"></div>
                                  {/* Right: Comment Icon with hover label */}
                                  <span
                                    className="comment-icon-hover text-info"
                                    title="View Comment"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                      setOpenCommentIndex(
                                        openCommentIndex === index
                                          ? null
                                          : index
                                      );
                                      setTimeout(() => {
                                        if (commentBoxRef.current) {
                                          commentBoxRef.current.scrollIntoView({
                                            behavior: "smooth",
                                            block: "center",
                                          });
                                        }
                                      }, 100); // slight delay to ensure render
                                    }}
                                  >
                                    <i className="bx bx-comment"></i>
                                    <span className="comment-label-hover">
                                      Comment
                                    </span>
                                  </span>
                                </div>
                              )}

                              {level?.step &&
                              level?.step?.approved_by?.signature &&
                              level?.step?.approved_by?.signature.trim() !==
                                "" ? (
                                <img
                                  src={level?.step?.approved_by?.signature}
                                  alt="Avatar"
                                  className="img-fluid rounded mb-4 shadow"
                                  height="100px"
                                  width="85%"
                                  style={{ height: "40px", width: "150px" }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "/assets/img/avatars/signature.png";
                                  }}
                                />
                              ) : (
                                <TextSignature
                                  text={level?.step?.approved_by?.name}
                                />
                              )}
                            </>
                          ) : (
                            <>
                              <h6
                                className="mb-1"
                                style={{
                                  color:
                                    selectedRequest?.current_state === index &&
                                    isCurrentApprover
                                      ? "rgb(117, 202, 223)"
                                      : "gray",
                                }}
                              >{`Wait to be ${level?.action?.name} by`}</h6>
                              <small>{level?.level?.name}</small>
                              <small className="mb-1 text-secondary">
                                <strong>From :</strong>{" "}
                                {`${level?.department?.name}`}
                              </small>
                            </>
                          )}
                          {selectedRequest?.current_state === index &&
                            !(
                              selectedRequest.status === "REJECTED" ||
                              selectedRequest.status === "APPROVED"
                            ) &&
                            ((level.level?.uid === user.position?.level_uid &&
                              level.department?.uid ===
                                user.position?.department_uid) ||
                              isActing) && (
                              <div className="d-flex justify-content-end mt-2">
                                <button
                                  aria-label="Click me"
                                  type="button"
                                  className="btn btn-sm btn-outline-info me-2 attention-grow"
                                  data-bs-toggle="modal"
                                  data-bs-target="#approvalActionSetModal"
                                  onClick={() => {
                                    if (
                                      selectedRequest?.module
                                        ?.approval_module_levels &&
                                      selectedRequest?.current_state ===
                                        selectedRequest?.module
                                          ?.approval_module_levels.length -
                                          1
                                    ) {
                                      setIsLastStep(true);
                                    } else {
                                      setIsLastStep(false);
                                    }

                                    setSelectedModuleLevel({
                                      module_level_uid: level.uid,
                                      action: {
                                        name: level.action.name,
                                        code: level.action.code,
                                      },
                                      level: {
                                        name: level.level.name,
                                        code: level.level.code,
                                      },
                                      department: {
                                        name: level.department.name,
                                        code: level.department.code,
                                      },
                                      is_acting: isActing,
                                    });
                                  }}
                                >
                                  <i className="bx bx-grid-small"></i> Take your
                                  Action
                                </button>
                              </div>
                            )}
                          {/* show loading if system validate for acting user */}
                          {selectedRequest?.current_state === index &&
                            loadingIsActing && (
                              <div className="d-flex align-items-center gap-2 mt-2">
                                <ReactLoading
                                  type="cylon"
                                  color="#03C3EC"
                                  height="30px"
                                  width="40px"
                                />
                                <span className="mt-2">
                                  Verifying Acting role
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    )
                  )}
                </div>
                {openCommentIndex !== null &&
                  selectedRequest?.module?.approval_module_levels[
                    openCommentIndex
                  ]?.step && (
                    <div
                      ref={commentBoxRef}
                      className="comment-popup animate__animated animate__fadeIn"
                      style={{
                        marginTop: "24px",
                        marginBottom: "16px",
                        minWidth: "400px",
                        maxWidth: "80%",
                        background: "#fff",
                        color: "#222",
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        padding: "16px",
                        zIndex: 10,
                        overflowY: "auto",
                        width: "100%",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="d-flex align-items-center mb-2">
                        <i className="bx bx-comment text-info me-2"></i>
                        <span> Comment From</span>
                        <strong>
                          &nbsp;
                          {selectedRequest.module.approval_module_levels[
                            openCommentIndex
                          ]?.level?.name || "Approver"}
                        </strong>
                        <button
                          type="button"
                          className="btn-close ms-auto"
                          style={{ fontSize: "0.9em" }}
                          aria-label="Close"
                          onClick={() => setOpenCommentIndex(null)}
                        ></button>
                      </div>
                      <div
                        style={{ fontSize: "0.98em", whiteSpace: "pre-line" }}
                      >
                        {selectedRequest.module.approval_module_levels[
                          openCommentIndex
                        ].step.comment || "No comment provided."}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ActionModal loadOnlyModal={false} />
      <HandlerActionModal loadOnlyModal={false} />
      <RequestHistoryModal loadOnlyModal={false} />
    </ApprovalRequestsContext.Provider>
  );
};
