import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { spismCan } from "../../../../utils/spismPermissions";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getObjectives, getTargets, deleteObjective, createUpdateObjective, objectiveApproval, submitObjectivePackage, getPerformanceAuditLogs, postConversationComment } from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import ObjectiveModal from "./Modal";
import TargetModal from "../targets/Modal";
import Swal from "sweetalert2";

const STATUS_BADGE = {
  DRAFT: "bg-label-secondary",
  PENDING: "bg-label-warning",
  APPROVED: "bg-label-success",
  RETURNED: "bg-label-danger",
};

const STATUS_STRIPE = {
  DRAFT: "border-start border-3 border-secondary",
  PENDING: "border-start border-3 border-warning",
  APPROVED: "border-start border-3 border-success",
  RETURNED: "border-start border-3 border-danger",
};

export const ObjectiveOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location?.pathname || "";
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.userReducer?.data);
  const canEditObjective = spismCan(user, "can_edit_spism_objective");
  const canDeleteObjective = spismCan(user, "can_delete_spism_objective");
  const canAddTargetHere = spismCan(user, "can_add_spism_target");
  const canApprovePlanningOpen = spismCan(user, "can_approve_spism_planning");
  const [selectedObj, setSelectedObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tableRefresh, setTableRefresh] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [packageLoading, setPackageLoading] = useState(false);
  const [targets, setTargets] = useState([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetsRefresh, setTargetsRefresh] = useState(0);
  const [selectedTargetForModal, setSelectedTargetForModal] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [replyComment, setReplyComment] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const isApprovalContext = pathname.startsWith("/performance-dashboard/approval/");
  const isESView =
    isApprovalContext ||
    location.state?.fromApproval ||
    searchParams.get("es") === "1" ||
    searchParams.get("es") === "true";
  const breadcrumb = isApprovalContext ? ["SPISM", "Approval", "View Objective"] : ["SPISM", "Objectives", "View"];
  const backPath = isApprovalContext ? "/performance-dashboard/approval" : "/performance-dashboard/objectives";
  const showConversationsTab =
    selectedObj?.status === "RETURNED" ||
    selectedObj?.status === "APPROVED" ||
    (isApprovalContext && selectedObj?.status === "PENDING") ||
    conversations.length > 0;

  const conversationLogs = React.useMemo(
    () =>
      Array.isArray(conversations)
        ? conversations.filter((log) => (log.action || "").toLowerCase() === "comment")
        : [],
    [conversations]
  );

  const handleFetch = async () => {
    setLoading(true);
    try {
      const result = await getObjectives({ uid });
      const data = result?.data ?? result;
      if (data && (result?.status === 200 || result?.status === 8000)) {
        setSelectedObj(data);
      } else {
        setSelectedObj(null);
        showToast("Objective not found", "warning", "Error");
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Failed to load objective", "danger", "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, [uid, tableRefresh]);

  useEffect(() => {
    if (selectedObj && isApprovalContext && (selectedObj.status === "RETURNED" || selectedObj.status === "PENDING")) {
      setActiveTab("conversations");
    }
  }, [uid, selectedObj?.status, isApprovalContext]);

  useEffect(() => {
    if (!uid) return;
    getPerformanceAuditLogs({
      entity_type: "objective",
      entity_id: uid,
      pagination: { page_size: 50 },
    })
      .then((res) => {
        const data = res?.data ?? res?.results ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
        setConversations(Array.isArray(list) ? list : []);
      })
      .catch(() => setConversations([]));
  }, [uid]);

  useEffect(() => {
    if (!selectedObj?.uid) {
      setTargets([]);
      return;
    }
    let cancelled = false;
    setTargetsLoading(true);
    getTargets({ objective: selectedObj.uid })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? res?.results ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
        setTargets(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setTargets([]);
      })
      .finally(() => {
        if (!cancelled) setTargetsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedObj?.uid, targetsRefresh]);

  const handleSendReply = async () => {
    const comment = (replyComment || "").trim();
    if (!comment) {
      showToast("Enter a comment to send", "warning", "Validation");
      return;
    }
    setSendingReply(true);
    try {
      const result = await postConversationComment({
        entity_type: "objective",
        entity_id: uid,
        comment,
      });
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Comment sent", "success", "Done");
        setReplyComment("");
        getPerformanceAuditLogs({
          entity_type: "objective",
          entity_id: uid,
          pagination: { page_size: 50 },
        })
          .then((res) => {
            const data = res?.data ?? res?.results ?? res;
            const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
            setConversations(Array.isArray(list) ? list : []);
          })
          .catch(() => {});
      } else {
        showToast(result?.message || "Failed to send", "warning", "Error");
      }
    } catch (err) {
      showToast("Failed to send comment", "danger", "Error");
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await Swal.fire({
      title: "Delete Objective?",
      text: "This will remove the objective and may affect linked targets and activities. Continue?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete",
    });
    if (!confirmed.isConfirmed) return;
    setDeleting(true);
    try {
      const result = await deleteObjective(uid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Objective deleted successfully", "success", "Done");
        navigate(backPath);
      } else {
        showToast(result?.message || "Delete failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Failed to delete objective", "danger", "Error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setApprovalLoading(true);
    try {
      const result = await createUpdateObjective({ uid: selectedObj.uid, status: "PENDING" });
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Submitted for approval", "success", "Done");
        setTableRefresh((r) => r + 1);
        handleFetch();
      } else {
        showToast(result?.message || "Failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Failed to submit for approval", "danger", "Error");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleSubmitPackage = async () => {
    setPackageLoading(true);
    try {
      const result = await submitObjectivePackage(selectedObj.uid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast(result?.message || "Package submitted for approval", "success", "Done");
        setTableRefresh((r) => r + 1);
        handleFetch();
      } else {
        showToast(result?.message || "Failed to submit package", "warning", "Error");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit package";
      showToast(msg, "danger", "Error");
    } finally {
      setPackageLoading(false);
    }
  };

  const handleApprove = async () => {
    setApprovalLoading(true);
    try {
      const result = await objectiveApproval(uid, { action: "approve" });
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Objective approved", "success", "Done");
        setSelectedObj(result?.data ?? selectedObj);
        setTableRefresh((r) => r + 1);
      } else {
        showToast(result?.message || "Failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Approval failed", "danger", "Error");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleReturn = async () => {
    const { value: comment } = await Swal.fire({
      title: "Return objective",
      input: "textarea",
      inputLabel: "Comment (required)",
      inputPlaceholder: "Reason for return and recommendations...",
      showCancelButton: true,
      confirmButtonText: "Return",
      inputValidator: (v) => (!v || !v.trim() ? "Comment is required" : null),
    });
    if (!comment) return;
    setApprovalLoading(true);
    try {
      const result = await objectiveApproval(uid, { action: "return", comment: comment.trim() });
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Objective returned", "success", "Done");
        setSelectedObj(result?.data ?? selectedObj);
        setTableRefresh((r) => r + 1);
      } else {
        showToast(result?.message || "Failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Return failed", "danger", "Error");
    } finally {
      setApprovalLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <BreadCumb pageList={breadcrumb} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type="cylon" color="#696cff" height={30} width={50} />
              <h6 className="text-muted mt-2">Loading Objective Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!selectedObj) {
    return (
      <>
        <BreadCumb pageList={breadcrumb} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Objective Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate(backPath)}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to {isApprovalContext ? "Approval" : "Objectives"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const totalTargets = (selectedObj.targets_count ?? targets.length ?? 0);
  const hasTargets = totalTargets > 0;

  return (
    <>
      <BreadCumb pageList={breadcrumb} />

      {/* Objective Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-target-lock bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold">{selectedObj.title}</h4>
                
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${STATUS_BADGE[selectedObj.status] || "bg-label-secondary"}`}>
                      {selectedObj.status}
                    </span>
                    {selectedObj.financial_year && (
                      <span className="badge bg-label-info">{selectedObj.financial_year}</span>
                    )}
                    {selectedObj.weight != null && (
                      <span className="badge bg-label-warning">Weight {selectedObj.weight}%</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex flex-wrap justify-content-end align-items-center gap-2">
                {(selectedObj.status === "DRAFT" || selectedObj.status === "RETURNED") && (
                  <>
                    <div className="d-flex flex-wrap justify-content-end gap-2">
                      {hasTargets && canEditObjective && (
                        <button
                          type="button"
                          className="btn btn-sm btn-warning d-flex align-items-center"
                          onClick={handleSubmitPackage}
                          disabled={packageLoading}
                        >
                          {packageLoading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-1"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <i className="bx bx-package me-1"></i>
                              <span>Submit package</span>
                            </>
                          )}
                        </button>
                      )}
                      {canEditObjective && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary d-flex align-items-center"
                        onClick={handleSubmitForApproval}
                        disabled={approvalLoading}
                      >
                        <i className="bx bx-send me-1"></i>
                        <span>
                          {approvalLoading
                            ? "Submitting..."
                            : hasTargets
                            ? "Submit objective only"
                            : "Submit objective"}
                        </span>
                      </button>
                      )}
                    </div>
                    <div className="d-flex flex-wrap justify-content-end gap-2">
                      {canEditObjective && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm d-flex align-items-center"
                        data-bs-toggle="modal"
                        data-bs-target="#objectiveModal"
                        onClick={() => setSelectedObj(selectedObj)}
                      >
                        <i className="bx bx-edit-alt me-1"></i>
                        <span>Edit Objective</span>
                      </button>
                      )}
                      {canDeleteObjective && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm d-flex align-items-center"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-1"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <i className="bx bx-trash me-1"></i>
                            <span>Delete Objective</span>
                          </>
                        )}
                      </button>
                      )}
                    </div>
                  </>
                )}
                {selectedObj.status === "PENDING" && isESView && canApprovePlanningOpen && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-success d-flex align-items-center"
                      onClick={handleApprove}
                      disabled={approvalLoading}
                    >
                      {approvalLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-1"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <i className="bx bx-check me-1"></i>
                          <span>Approve</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-warning d-flex align-items-center"
                      onClick={handleReturn}
                      disabled={approvalLoading}
                    >
                      <i className="bx bx-undo me-1"></i>
                      <span>Return for revision</span>
                    </button>
                  </>
                )}
                {selectedObj.status === "PENDING" && isESView && !canApprovePlanningOpen && (
                  <button
                    type="button"
                    className="btn btn-sm btn-label-secondary d-flex align-items-center"
                    disabled
                    title="You do not have planning approval permission"
                  >
                    <i className="bx bx-shield-x me-1"></i>
                    <span>Approval not permitted</span>
                  </button>
                )}
                {selectedObj.status === "PENDING" && !isESView && (
                  <button
                    type="button"
                    className="btn btn-sm btn-label-warning d-flex align-items-center"
                    disabled
                  >
                    <i className="bx bx-time-five me-1"></i>
                    <span>Sent to ES for approval</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-label-secondary btn-sm d-flex align-items-center"
                  onClick={() => navigate(backPath)}
                >
                  <i className="bx bx-arrow-back me-1"></i>
                  <span>Back</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedObj.status === "RETURNED" && selectedObj.approval_comment && (
        <div className="alert alert-warning mb-3">
          <strong>Return comment:</strong> {selectedObj.approval_comment}
        </div>
      )}
      {selectedObj.status === "PENDING" && (
        <div className="alert alert-info mb-3">
          <strong>This objective has been submitted to the Executive Secretariat (ES) for approval.</strong>
          <p className="mb-0 small">
            Further approval actions are handled by ES.
          </p>
        </div>
      )}

      {/* Tabs: Details | Conversations */}
      {showConversationsTab && (
        <ul className="nav nav-tabs mb-3" role="tablist">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              <i className="bx bx-info-circle me-1"></i> Details
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === "conversations" ? "active" : ""}`}
              onClick={() => setActiveTab("conversations")}
            >
              <i className="bx bx-message-detail me-1"></i> Conversations
              {conversationLogs.length > 0 && (
                <span className="badge bg-label-primary ms-1">{conversationLogs.length}</span>
              )}
            </button>
          </li>
        </ul>
      )}

      {activeTab === "conversations" && showConversationsTab ? (
        /* Conversations Tab */
        <div className="card mb-4 shadow-sm animate__animated animate__fadeIn">
          <div className="card-header bg-light">
            <h5 className="mb-0 fw-semibold">
              <i className="bx bx-message-detail me-2 text-primary"></i>
              Conversations
            </h5>
          </div>
          <div className="card-body">
            {selectedObj.status === "RETURNED" && selectedObj.approval_comment && (
              <div className="alert alert-warning mb-4">
                <strong><i className="bx bx-undo me-1"></i> Return comment from approver:</strong>
                <p className="mb-0 mt-2">{selectedObj.approval_comment}</p>
              </div>
            )}
            {conversationLogs.length === 0 ? (
              <p className="text-muted small mb-0">
                {selectedObj.status === "RETURNED"
                  ? "No additional audit history. The return comment is shown above."
                  : selectedObj.status === "PENDING"
                    ? "This objective is awaiting approval. No prior conversation history."
                    : "No conversation history for this objective."}
              </p>
            ) : (
              <div className="list-group list-group-flush">
                {[...conversationLogs]
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                  .map((log) => (
                    <div
                      key={log.uid || log.id || log.timestamp}
                      className="list-group-item d-flex flex-column align-items-start px-0 py-3"
                    >
                      <div className="d-flex w-100 justify-content-between align-items-center mb-1 flex-wrap gap-2">
                        {log.user_name && (
                          <small className="text-primary fw-medium">Sender: {log.user_name}</small>
                        )}
                        <small className="text-muted">{formatDate(log.timestamp, "DD/MM/YYYY HH:mm")}</small>
                      </div>
                      {log.comment && (
                        <p className="mb-0 mt-1 small">{log.comment}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
            <hr className="my-4" />
            <div className="d-flex gap-2 align-items-start">
              <textarea
                className="form-control"
                rows={3}
                placeholder={
                  canEditObjective
                    ? "Type your reply or comment..."
                    : "You do not have permission to post comments."
                }
                value={replyComment}
                onChange={(e) => setReplyComment(e.target.value)}
                disabled={sendingReply || !canEditObjective}
              />
              {canEditObjective && (
              <button
                type="button"
                className="btn btn-primary flex-shrink-0"
                onClick={handleSendReply}
                disabled={sendingReply || !(replyComment || "").trim()}
              >
                {sendingReply ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="bx bx-send me-1"></i>
                    Send
                  </>
                )}
              </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-calendar fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Financial Year</small>
                  <h6 className="mb-0">{selectedObj.financial_year || "—"}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-warning">
                    <i className="bx bx-pie-chart-alt fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Weight</small>
                  <h6 className="mb-0">{selectedObj.weight != null ? `${selectedObj.weight}%` : "—"}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-success">
                    <i className="bx bx-check-circle fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Status</small>
                  <div className="mb-0">
                    <span className={`badge ${STATUS_BADGE[selectedObj.status] || "bg-label-secondary"}`}>
                      {selectedObj.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-info">
                    <i className="bx bx-time fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Created</small>
                  <h6 className="mb-0">{formatDate(selectedObj.created_at, "DD/MM/YYYY HH:mm") || "—"}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Objective Details Card */}
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            Objective Information
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Basic Information</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className="bx bx-target-lock me-2 text-primary"></i>
                      Title:
                    </td>
                    <td><strong>{selectedObj.title}</strong></td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-detail me-2 text-info"></i>
                      Description:
                    </td>
                    <td>
                      <div className="alert alert-light mb-0">
                        <p className="mb-0">{selectedObj.description || "—"}</p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-pie-chart-alt me-2 text-warning"></i>
                      Weight %:
                    </td>
                    <td><strong>{selectedObj.weight != null ? `${selectedObj.weight}%` : "—"}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Schedule & Status</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className="bx bx-calendar me-2 text-primary"></i>
                      Financial Year:
                    </td>
                    <td><strong className="text-primary">{selectedObj.financial_year || "—"}</strong></td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-check-circle me-2 text-success"></i>
                      Status:
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[selectedObj.status] || "bg-label-secondary"}`}>
                        {selectedObj.status}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-time me-2 text-info"></i>
                      Created:
                    </td>
                    <td>{formatDate(selectedObj.created_at, "DD/MM/YYYY HH:mm") || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Targets in this objective */}
      <div className="mt-4">
        <div className="card shadow-sm mb-4 animate__animated animate__fadeInUp animate__fast">
          <div className="card-header bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h5 className="mb-0 fw-semibold">
                <i className="bx bx-list-ul me-2 text-primary"></i>
                Targets in this objective
                {!targetsLoading && (
                  <span className="badge bg-label-primary ms-2">{targets.length}</span>
                )}
              </h5>
              <p className="mb-0 text-muted small">
                Define and review all targets that contribute to this objective.
              </p>
            </div>
            {canAddTargetHere && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              data-bs-toggle="modal"
              data-bs-target="#objectiveTargetModal"
              onClick={() => setSelectedTargetForModal(null)}
            >
              <i className="bx bx-plus me-1"></i> Add target
            </button>
            )}
          </div>
          <div className="card-body">
          {targetsLoading ? (
            <div className="text-center py-3">
              <ReactLoading type="cylon" color="#696cff" height={24} width={40} />
              <p className="text-muted small mb-0 mt-2">Loading targets...</p>
            </div>
          ) : targets.length === 0 ? (
            <div className="alert alert-light border d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-0">
              <div className="d-flex align-items-center mb-2 mb-md-0">
                <i className="bx bx-info-circle me-2 text-primary fs-4"></i>
                <div>
                  <p className="mb-1 fw-semibold">No targets configured yet</p>
                  <p className="mb-0 text-muted small">
                    Add at least one target under this objective, then submit the package for approval.
                  </p>
                </div>
              </div>
              {canAddTargetHere && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#objectiveTargetModal"
                onClick={() => setSelectedTargetForModal(null)}
              >
                <i className="bx bx-plus me-1"></i> Add first target
              </button>
              )}
            </div>
          ) : (
            <ul className="list-group list-group-flush list-group-borderless">
              {targets.map((t) => (
                <li
                  key={t.uid}
                  className="list-group-item px-0 py-2"
                >
                  <div
                    className={`p-3 rounded-3 bg-light d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 shadow-sm ${STATUS_STRIPE[t.status] || "border-start border-3 border-secondary"}`}
                  >
                    <div>
                      <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                        <span className={`badge ${STATUS_BADGE[t.status] || "bg-label-secondary"}`}>
                          {t.status}
                        </span>
                        <span className="fw-semibold">{t.title}</span>
                      </div>
                      <div className="small">
                        {t.kpi_name && (
                          <span className="badge bg-label-info me-2">
                            KPI: <span className="fw-semibold ms-1">{t.kpi_name}</span>
                          </span>
                        )}
                        {t.kpi_planned_value != null && (
                          <span className="badge bg-label-success me-2">
                            Planned
                            <span className="fw-semibold ms-1">
                              {t.kpi_planned_value}{t.kpi_unit === "%" ? "%" : ""}
                            </span>
                          </span>
                        )}
                        {t.weight != null && (
                          <span className="badge bg-label-warning">
                            Weight
                            <span className="fw-semibold ms-1">
                              {t.weight}%
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 justify-content-start justify-content-md-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          navigate(
                            isApprovalContext
                              ? `/performance-dashboard/approval/targets/${t.uid}`
                              : `/performance-dashboard/targets/open/${t.uid}`
                          )
                        }
                      >
                        <i className="bx bx-show me-1"></i> View details
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          </div>
        </div>
      </div>
        </>
      )}

      <ObjectiveModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
      <TargetModal
        modalId="objectiveTargetModal"
        selectedTarget={selectedTargetForModal}
        setSelectedTarget={setSelectedTargetForModal}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
        preselectedObjectiveUid={selectedObj?.uid}
        preselectedObjectiveTitle={selectedObj?.title}
        onSuccess={() => {
          setTargetsRefresh((r) => r + 1);
          handleFetch();
        }}
      />
    </>
  );
};
