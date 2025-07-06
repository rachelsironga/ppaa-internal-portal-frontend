import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import usePagination from "../../hooks/usePagination";
import ReactPaginate from "react-paginate";
import { useParams } from "react-router-dom";
import "animate.css";
import { getApprovalRequests, deleteApprovalRequest } from "./Queries";
import { ApprovalRequestsContext } from "../../utils/context";
import ApprovalRequestModal from "./Modal";
import AccordionContainer from "../../components/accordion/AccordionContainer";
import ActionModal from "./ActionModal";
import TextSignature from "../../components/common/TextSignature";
import ApprovalRequestOpenShimmer from "../../components/loaders/ApprovalRequestOpenShimmer";

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
  const pageSizeData = [5, 10, 20, 50, 70, 100];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewVisible, setIsViewVisible] = useState(false);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [selectedModuleLevel, setSelectedModuleLevel] = useState(null);

  const {
    currentPage,
    totalCount,
    pageSize,
    updatePage,
    updatePageSize,
    updatePagination,
    updateTotalCount,
  } = usePagination(10, 1, true);

  const handlePageClick = (event) => {
    updatePage(event.selected + 1);
  };

  const viewSignature = ({ signature = null }) => {
    sign =
      signature && signature.trim() !== ""
        ? signature
        : "/assets/img/avatars/signature.png";
    return sign;
  };

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getApprovalRequests({
        search: searchQuery,
        uid: uid,
        full_details: true,
      });
      if (result.status === 200 || result.status === 8000) {
        setSelectedRequest(result.data);
      } else {
        setError(true);
        showToast("No Approval Request Found", "warning", "Fetch Completed");
      }
    } catch (err) {
      setError(true);
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

  // Fetch ApprovalRequests on initial load
  useEffect(() => {
    handleFetchData();
  }, []); // Fetch when search query changes

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
      }}
    >
      <h4 className="py-3 mb-4 animate__animated animate__fadeInDown animate__faster">
        <span className="text-muted fw-light">Approval Requests /</span> view
      </h4>

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
              <div className="d-flex align-items-center">
                <button
                  aria-label="Click me"
                  type="button"
                  className="btn btn-sm btn-outline-info bg-primary text-white  dropdown-toggle me-3"
                >
                  <i className="bx bxs-file-pdf"></i> Print preview
                </button>

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
                    <li>
                      <button
                        aria-label="dropdown action link"
                        className="dropdown-item d-flex align-items-center"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="bx bx-pencil mx-2"></i>Edit Request
                      </button>
                    </li>
                    <li>
                      <button
                        aria-label="dropdown action link"
                        className="dropdown-item d-flex align-items-center"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="bx bx-transfer mx-2"></i>Tract Request
                      </button>
                    </li>
                    <li>
                      <button
                        aria-label="dropdown action link"
                        className="dropdown-item d-flex align-items-center"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="bx bx-transfer mx-2"></i>Preview Approval
                        Flow
                      </button>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card academy-content shadow-none border">
              <div className="p-2"></div>
              <div className="card-body pt-4">
                <div className="row">
                  <div className="col-sm-4 col-md-4 animate__animated animate__fadeInLeft animate__fast">
                    <h5>Requester Detail</h5>
                    {console.log(selectedRequest)}
                    <div className="m-4">
                      <p className="text-nowrap mb-2">
                        <i className="icon-base bx bx-user me-2 align-top" />
                        <span className=" me-3 ">Requester Name:</span>
                        <strong className="bold">
                          {selectedRequest?.created_by?.first_name} &nbsp;
                          {selectedRequest?.created_by?.middle_name}&nbsp;
                          {selectedRequest?.created_by?.last_name}
                        </strong>
                      </p>
                      <p className="text-nowrap mb-2">
                        <i className="icon-base bx bx-card me-2 align-bottom" />
                        <span className=" me-3 ">Requester PF-Number:</span>
                        <strong className="bold">
                          {selectedRequest?.created_by?.pf_number}
                        </strong>
                      </p>
                      <p className="text-nowrap mb-2 ">
                        <i className="icon-base bx bx-trophy me-2 align-bottom" />
                        <span className=" me-3 ">Position:</span>
                        <strong className="bold">
                          {selectedRequest?.created_by?.position?.level_name}
                        </strong>
                      </p>
                      <p className="text-nowrap mb-2">
                        <i className="icon-base bx bxs-layer me-2 align-bottom" />
                        <span className=" me-3 ">Departments:</span>
                        <strong className="bold">
                          {
                            selectedRequest?.created_by?.position
                              ?.department_name
                          }{" "}
                          (
                          {
                            selectedRequest?.created_by?.position
                              ?.department_code
                          }
                          )
                        </strong>
                      </p>
                    </div>
                  </div>
                  <div className="col-sm-8 col-md-8   animate__animated animate__fadeInRight animate__fast">
                    <h5>About This Requester</h5>
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
                          {selectedRequest?.type}
                        </strong>
                      </p>
                      <p className="text-nowrap mb-2">
                        <i className="icon-base bx bx-calendar me-2 align-bottom" />
                        <span className=" me-3 ">Request Date:</span>
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
                        <span className=" me-3 ">
                          Requested Access Period :
                        </span>
                        <strong className="bold">
                          {selectedRequest?.date_range?.name}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
                <hr className="my-4" />
                <div className="d-flex justify-content-between align-items-center flex-wrap mb-6 gap-2 mb-2">
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
                  <div className="d-flex align-items-center animate__animated animate__fadeInRight  animate__slow">
                    <button
                      aria-label="Click me"
                      onClick={() => {
                        setIsViewVisible((prev) => !prev);
                      }}
                      type="button"
                      style={{ width: "300px", fontWeight: "800" }}
                      className="btn btn-sm btn-outline-primary bg-info text-white bold me-3 attention-grow"
                    >
                      <i className="bx bx-caret-down"></i>&nbsp; Preview Request
                      Attached Details
                    </button>
                  </div>
                </div>

                {isViewVisible && selectedRequest?.request_details?.grants && (
                  <div className="row g-4">
                    <p className="text-muted">
                      Here is the list of permissions selected for this request.
                      Please review them carefully before Perform Any Action.
                    </p>
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
                  }}
                  className="d-flex justify-content-start col-md-12"
                >
                  {selectedRequest?.module?.approval_module_levels.map(
                    (level, index) => (
                      <div
                        className="d-flex justify-content-start align-items-start user-name me-3 animate__animated animate__fadeInRight"
                        style={{
                          minWidth: "300px",
                          borderRadius: "10px",
                          borderTop:
                            selectedRequest?.current_state === index
                              ? "3px solid rgb(117, 202, 223)"
                              : "0",
                          paddingTop: "10px",
                          animationDelay: `${index * 0.25}s`, // Staggered animation
                          WebkitAnimationDelay: `${index * 0.25}s`,
                        }}
                        key={`levels_${index}`}
                      >
                        <div
                          className="avatar me-4 mb-5 text-muted"
                          style={{
                            border: level.step
                              ? level.step.is_approved
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
                          <span
                            style={{
                              fontSize: "30px",
                              fontWeight: "800",
                              color: level.step
                                ? level.step.is_approved
                                  ? "#696cff"
                                  : "rgb(247, 55, 55)"
                                : "rgb(163, 169, 190)",
                            }}
                          >
                            {index + 1}
                          </span>
                        </div>
                        <div className="d-flex flex-column">
                          {level.step &&
                          selectedRequest?.current_state !== index ? (
                            <>
                              <h6
                                className="mb-1"
                                style={{
                                  color: level.step
                                    ? level.step.is_approved
                                      ? "#696cff"
                                      : "rgb(247, 55, 55)"
                                    : "rgb(163, 169, 190)",
                                }}
                              >
                                {" "}
                                {level.step.is_approved
                                  ? `${level.action.name} By `
                                  : `Rejected By `}
                                &nbsp;
                                {level.step && level.step.approved_by.position
                                  ? `${level.step.approved_by.position.level_name}`
                                  : "Approver N/S"}
                              </h6>
                              <strong>
                                <span
                                  className="text-capitalize"
                                  style={{ fontWeight: "300" }}
                                >
                                  {level.step && level.step.approved_by
                                    ? `${level.step.approved_by.name}`
                                    : "Approver N/S"}
                                </span>{" "}
                                {level.step?.is_acting ||
                                level.step?.position?.department_uid !==
                                  level.department.uid ||
                                level.level?.uid !==
                                  level.step?.position?.level_uid
                                  ? `( Act )`
                                  : ""}
                              </strong>
                              {level.step && level.step.created_at && (
                                <small>
                                  {new Date(
                                    level.step.created_at
                                  ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </small>
                              )}

                              {level.step &&
                              level.step.approved_by.signature &&
                              level.step.approved_by.signature.trim() !== "" ? (
                                <img
                                  src={level.step.approved_by.signature}
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
                                  text={level.step.approved_by.name}
                                />
                              )}
                            </>
                          ) : (
                            <>
                              <h6 className="mb-1">{`Wait for/(to be) ${level.action.name} by`}</h6>
                              <small>
                                {level.level.code}&nbsp;-&nbsp;(&nbsp;
                                {level.department.code}&nbsp;)
                              </small>
                            </>
                          )}
                          {selectedRequest?.current_state === index && (
                            <div className="d-flex justify-content-end mt-2">
                              <button
                                aria-label="Click me"
                                type="button"
                                className="btn btn-sm btn-outline-info me-2 attention-grow"
                                data-bs-toggle="modal"
                                data-bs-target="#approvalActionSetModal"
                                onClick={() => {
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
                                    is_acting:
                                      level.step?.is_acting ||
                                      level.step?.position?.department_uid !==
                                        level.department.uid ||
                                      level.level?.uid !==
                                        level.step?.position?.level_uid
                                        ? true
                                        : false,
                                  });
                                }}
                              >
                                <i className="bx bx-grid-small"></i> Take your
                                Action
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ActionModal loadOnlyModal={false} />
    </ApprovalRequestsContext.Provider>
  );
};
