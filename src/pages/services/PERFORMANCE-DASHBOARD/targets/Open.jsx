import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { spismCan } from "../../../../utils/spismPermissions";
import BreadCumb from "../../../../layouts/BreadCumb";
import {
  getTargets,
  createUpdateTarget,
  targetApproval,
  deleteTarget,
  getPerformanceAuditLogs,
  postConversationComment,
  getActivities,
  assignTargetOfficer
} from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import Swal from "sweetalert2";
import TargetModal from "./Modal";
import ActivityModal from "../activities/Modal";

const STATUS_BADGE = {
  DRAFT: "bg-label-secondary",
  PENDING: "bg-label-warning",
  APPROVED: "bg-label-success",
  RETURNED: "bg-label-danger"
};

export const TargetOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location?.pathname || "";
  const user = useSelector((state) => state.userReducer?.data);
  const canEditTarget = spismCan(user, "can_edit_spism_target");
  const canDeleteTarget = spismCan(user, "can_delete_spism_target");
  const canApprovePlanningTarget = spismCan(user, "can_approve_spism_planning");
  const canAddActivityHere = spismCan(user, "can_add_spism_activity");

  const [obj, setObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [selectedTargetForModal, setSelectedTargetForModal] = useState(null);
  const [modalRefresh, setModalRefresh] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [replyComment, setReplyComment] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityTableRefresh, setActivityTableRefresh] = useState(0);
  const [assigningOfficer, setAssigningOfficer] = useState(false);
  const [officerIdInput, setOfficerIdInput] = useState("");

  const isApprovalContext = pathname.startsWith("/performance-dashboard/approval/");
  const breadcrumb = isApprovalContext
    ? ["SPISM", "Approval", "View Target"]
    : ["SPISM", "Targets", "View"];

  const backPath = isApprovalContext
    ? "/performance-dashboard/approval"
    : "/performance-dashboard/targets";

  const fetchOne = useCallback(async () => {
    try {
      const result = await getTargets({ uid });
      const data = result?.data ?? result;

      if (data && (result?.status === 200 || result?.status === 8000)) {
        setObj(data);
      } else {
        setObj(null);
      }
    } catch (err) {
      setObj(null);
      showToast("Failed to load target", "danger", "Error");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    setLoading(true);
    fetchOne();
  }, [fetchOne]);

  useEffect(() => {
    if (!selectedTargetForModal) return;
    const el = document.getElementById("targetEditModal");
    if (!el) return;

    const modal = window.bootstrap?.Modal?.getOrCreateInstance(el);
    modal?.show();
  }, [selectedTargetForModal]);

  useEffect(() => {
    if (obj && isApprovalContext && (obj.status === "RETURNED" || obj.status === "PENDING")) {
      setActiveTab("conversations");
    }
  }, [obj, isApprovalContext]);

  useEffect(() => {
    if (!uid) return;

    getPerformanceAuditLogs({
      entity_type: "target",
      entity_id: uid,
      pagination: { page_size: 50 }
    })
      .then((res) => {
        const data = res?.data ?? res?.results ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
        setConversations(list);
      })
      .catch(() => setConversations([]));
  }, [uid]);

  useEffect(() => {
    if (!obj?.uid) return;

    if (!(obj.objective_status === "APPROVED" && obj.status === "APPROVED")) {
      setActivities([]);
      return;
    }

    setActivitiesLoading(true);

    getActivities({ target: obj.uid, pagination: { page_size: 200 } })
      .then((res) => {
        const data = res?.data ?? res?.results ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
        setActivities(list);
      })
      .catch(() => setActivities([]))
      .finally(() => setActivitiesLoading(false));
  }, [obj?.uid, obj?.status, obj?.objective_status, activityTableRefresh]);

  const conversationLogs = useMemo(() => {
    if (!Array.isArray(conversations)) return [];

    // Conversations should show only real chat/comments (not system actions).
    return conversations.filter((log) => (log.action || "").toLowerCase() === "comment");
  }, [conversations]);

  const showConversationsTab =
    obj?.status === "RETURNED" ||
    obj?.status === "APPROVED" ||
    (isApprovalContext && obj?.status === "PENDING") ||
    conversationLogs.length > 0;

  const handleSendReply = async () => {
    const comment = replyComment.trim();

    if (!comment) {
      showToast("Enter a comment to send", "warning", "Validation");
      return;
    }

    setSendingReply(true);

    try {
      const result = await postConversationComment({
        entity_type: "target",
        entity_id: uid,
        comment
      });

      if (result?.status === 200 || result?.status === 8000) {
        showToast("Comment sent", "success", "Done");
        setReplyComment("");

        getPerformanceAuditLogs({
          entity_type: "target",
          entity_id: uid,
          pagination: { page_size: 50 }
        }).then((res) => {
          const data = res?.data ?? res?.results ?? res;
          const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
          setConversations(list);
        });
      } else {
        showToast(result?.message || "Failed to send", "warning", "Error");
      }
    } catch {
      showToast("Failed to send comment", "danger", "Error");
    } finally {
      setSendingReply(false);
    }
  };

  const handleSubmitForApproval = async () => {
    setApprovalLoading(true);

    try {
      const result = await createUpdateTarget({ uid: obj.uid, status: "PENDING" });

      if (result?.status === 200 || result?.status === 8000) {
        showToast("Submitted for approval", "success", "Done");
        await fetchOne();
      } else {
        showToast(result?.message || "Failed", "warning", "Error");
      }
    } catch {
      showToast("Failed to submit", "danger", "Error");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApprove = async () => {
    setApprovalLoading(true);

    try {
      const result = await targetApproval(uid, { action: "approve" });

      if (result?.status === 200 || result?.status === 8000) {
        showToast("Target approved", "success", "Done");
        await fetchOne();
      } else {
        showToast(result?.message || "Failed", "warning", "Error");
      }
    } catch {
      showToast("Approval failed", "danger", "Error");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleReturn = async () => {
    const { value: comment } = await Swal.fire({
      title: "Return target",
      input: "textarea",
      inputLabel: "Comment (required)",
      showCancelButton: true,
      confirmButtonText: "Return",
      inputValidator: (v) => (!v || !v.trim() ? "Comment is required" : null)
    });

    if (!comment) return;

    setApprovalLoading(true);

    try {
      const result = await targetApproval(uid, {
        action: "return",
        comment: comment.trim()
      });

      if (result?.status === 200 || result?.status === 8000) {
        showToast("Target returned", "success", "Done");
        await fetchOne();
      } else {
        showToast(result?.message || "Failed", "warning", "Error");
      }
    } catch {
      showToast("Return failed", "danger", "Error");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await Swal.fire({
      title: "Delete target?",
      text: "This will remove the target and may affect linked activities.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete"
    });

    if (!confirmed.isConfirmed) return;

    try {
      const result = await deleteTarget(uid);

      if (result?.status === 200 || result?.status === 8000) {
        showToast("Target deleted", "success", "Done");
        navigate(backPath);
      } else {
        showToast(result?.message || "Delete failed", "warning", "Error");
      }
    } catch {
      showToast("Failed to delete target", "danger", "Error");
    }
  };

  if (loading) {
    return (
      <>
        <BreadCumb pageList={breadcrumb} />
        <div className="card">
          <div className="card-body text-center">
            <ReactLoading type="cylon" color="#696cff" height={30} width={50} />
            <h6 className="text-muted mt-2">Loading Target Details...</h6>
          </div>
        </div>
      </>
    );
  }

  if (!obj) {
    return (
      <>
        <BreadCumb pageList={breadcrumb} />
        <div className="card">
          <div className="card-body text-center">
            <div className="alert alert-danger">
              Unable to load Target.
              <br />
              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={() => navigate(backPath)}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BreadCumb pageList={breadcrumb} />

      {/* Target Header Card (restore previous look) */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-success">
                      <i className="bx bx-trending-up bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                      <h4 className="mb-1 fw-bold">{obj.title}</h4>
                      {obj.objective_title && (
                        <p className="mb-0 text-muted small">
                          Under objective:&nbsp;<strong>{obj.objective_title}</strong>
                          {obj.objective_financial_year && (
                            <span className="ms-1">({obj.objective_financial_year})</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <span className={`badge ${STATUS_BADGE[obj.status] || "bg-label-secondary"}`}>
                        {obj.status}
                      </span>
                      {obj.weight != null && (
                        <span className="badge bg-label-warning text-warning">
                          Weight {obj.weight}%
                        </span>
                      )}
                      {obj.kpi_name && <span className="badge bg-label-info">{obj.kpi_name}</span>}
                      {obj.kpi_planned_value != null && (
                        <span className="badge bg-label-primary">
                          KPI planned: {obj.kpi_planned_value}
                          {obj.kpi_unit ? ` ${obj.kpi_unit}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  {(obj.responsible_officer_name || obj.responsible_officer) && (
                    <div className="mt-2 small text-muted">
                      Responsible officer:{" "}
                      <strong className="text-body">
                        {obj.responsible_officer_name || obj.responsible_officer}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex flex-wrap gap-2 justify-content-end align-items-center">
              {(obj.status === "DRAFT" || obj.status === "RETURNED") && (
                <>
                  {canEditTarget && (
                  <button
                    type="button"
                    className="btn btn-sm btn-warning d-flex align-items-center gap-1"
                    onClick={handleSubmitForApproval}
                    disabled={approvalLoading}
                  >
                    <i className="bx bx-send"></i>
                    <span>Submit for approval</span>
                  </button>
                  )}
                  {canEditTarget && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => setSelectedTargetForModal(obj)}
                  >
                    <i className="bx bx-edit me-1"></i> Edit
                  </button>
                  )}
                  {canDeleteTarget && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={handleDelete}
                  >
                    <i className="bx bx-trash me-1"></i> Delete
                  </button>
                  )}
                </>
              )}
              {obj.status === "PENDING" && isApprovalContext && canApprovePlanningTarget && (
                <>
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={handleApprove}
                    disabled={approvalLoading}
                  >
                    <i className="bx bx-check me-1"></i> Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={handleReturn}
                    disabled={approvalLoading}
                  >
                    <i className="bx bx-undo me-1"></i> Return
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => navigate(backPath)}
              >
                <i className="bx bx-arrow-back me-1"></i> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {obj.status === "RETURNED" && obj.approval_comment && (
        <div className="alert alert-warning mb-3">
          <strong>Return comment:</strong> {obj.approval_comment}
        </div>
      )}
      {obj.status === "PENDING" && (
        <div className="alert alert-info mb-3">
          <strong>This target has been submitted for approval.</strong>
          <p className="mb-0 small">Approval actions are handled by ES.</p>
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
        <div className="card mb-4 shadow-sm animate__animated animate__fadeIn">
          <div className="card-header bg-light">
            <h5 className="mb-0 fw-semibold">
              <i className="bx bx-message-detail me-2 text-primary"></i>
              Conversations
            </h5>
          </div>
          <div className="card-body">
            {conversationLogs.length === 0 ? (
              <p className="text-muted small mb-0">No conversation history for this target.</p>
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
                        <small className="text-muted">
                          {formatDate(log.timestamp, "DD/MM/YYYY HH:mm")}
                        </small>
                      </div>
                      {log.comment && <p className="mb-0 mt-1 small">{log.comment}</p>}
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
                  canEditTarget
                    ? "Type your reply or comment..."
                    : "You do not have permission to post comments."
                }
                value={replyComment}
                onChange={(e) => setReplyComment(e.target.value)}
                disabled={sendingReply || !canEditTarget}
              />
              {canEditTarget && (
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
          {/* Target Details Card (collapsible) */}
          <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
            <div className="card-header bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 className="mb-0 fw-semibold">
                <i className="bx bx-info-circle me-2 text-primary"></i>
                Target & KPI Information
              </h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() => setShowDetails((prev) => !prev)}
              >
                <i className={`bx ${showDetails ? "bx-chevron-up" : "bx-chevron-down"}`}></i>
                <span>{showDetails ? "Hide details" : "Show details"}</span>
              </button>
            </div>
            {showDetails && (
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
                          <td><strong>{obj.title}</strong></td>
                        </tr>
                        <tr>
                          <td className="fw-medium">
                            <i className="bx bx-detail me-2 text-info"></i>
                            Description:
                          </td>
                          <td>
                            <div className="alert alert-light mb-0">
                              <p className="mb-0">{obj.description || "—"}</p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-medium">
                            <i className="bx bx-pie-chart-alt me-2 text-warning"></i>
                            Weight %:
                          </td>
                          <td><strong>{obj.weight != null ? `${obj.weight}%` : "—"}</strong></td>
                        </tr>
                        <tr>
                          <td className="fw-medium">
                            <i className="bx bx-bar-chart me-2 text-primary"></i>
                            Target planned value:
                          </td>
                          <td><strong>{obj.planned_value != null ? obj.planned_value : "—"}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <h6 className="mb-3 fw-semibold text-primary">KPI & Status</h6>
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td className="fw-medium" style={{ width: "40%" }}>
                            <i className="bx bx-line-chart me-2 text-info"></i>
                            KPI Name:
                          </td>
                          <td><strong>{obj.kpi_name || "—"}</strong></td>
                        </tr>
                        <tr>
                          <td className="fw-medium">
                            <i className="bx bx-layer me-2 text-secondary"></i>
                            KPI Mode:
                          </td>
                          <td>
                            <strong>
                              {(obj.kpi_source_type || "DERIVED") === "DIRECT"
                                ? "Direct KPI"
                                : "Activity-Driven KPI"}
                            </strong>
                          </td>
                        </tr>

                        {(obj.kpi_source_type || "DERIVED") === "DIRECT" ? (
                          <>
                            <tr>
                              <td className="fw-medium">
                                <i className="bx bx-cube me-2 text-warning"></i>
                                KPI Unit:
                              </td>
                              <td><strong>{obj.kpi_unit || "—"}</strong></td>
                            </tr>
                            <tr>
                              <td className="fw-medium">
                                <i className="bx bx-target-lock me-2 text-primary"></i>
                                Annual KPI Target:
                              </td>
                              <td>
                                <strong>
                                  {obj.kpi_planned_value != null ? obj.kpi_planned_value : "—"}
                                  {obj.kpi_unit ? ` ${obj.kpi_unit}` : ""}
                                </strong>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium">
                                <i className="bx bx-calculator me-2 text-info"></i>
                                Calculation Method:
                              </td>
                              <td><strong>{obj.kpi_calculation_method || "—"}</strong></td>
                            </tr>
                            <tr>
                              <td className="fw-medium">
                                <i className="bx bx-trending-up me-2 text-info"></i>
                                KPI Direction:
                              </td>
                              <td><strong>{obj.kpi_direction || "—"}</strong></td>
                            </tr>
                          </>
                        ) : (
                          <tr>
                            <td className="fw-medium" colSpan="2">
                              <div className="alert alert-info mb-0">
                                <strong>Activity-Driven KPI:</strong> KPI performance is derived from approved activity implementation progress.
                              </div>
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="fw-medium">
                            <i className="bx bx-check-circle me-2 text-success"></i>
                            Status:
                          </td>
                          <td>
                            <span className={`badge ${STATUS_BADGE[obj.status] || "bg-label-secondary"}`}>
                              {obj.status}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-medium">
                            <i className="bx bx-time me-2 text-info"></i>
                            Created:
                          </td>
                          <td>{formatDate(obj.created_at, "DD/MM/YYYY HH:mm") || "—"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activities under this target (restore table) */}
          <div className="card mt-4 shadow-sm animate__animated animate__fadeInUp animate__fast">
            <div className="card-header bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 className="mb-0 fw-semibold">
                <i className="bx bx-task me-2 text-primary"></i>
                Activities under this target
              </h5>
              {obj.objective_status === "APPROVED" && obj.status === "APPROVED" && canAddActivityHere && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#activityUnderTargetModal"
                  onClick={() => setSelectedActivity({ target: obj.uid })}
                >
                  <i className="bx bx-plus me-1"></i>
                  Add Activity
                </button>
              )}
            </div>
            <div className="card-body">
              {!(obj.objective_status === "APPROVED" && obj.status === "APPROVED") ? (
                <p className="text-muted small mb-0">
                  Activities will be available after both the objective and this target are approved.
                </p>
              ) : activitiesLoading ? (
                <div className="d-flex align-items-center justify-content-center py-3">
                  <ReactLoading type="cylon" color="#696cff" height={24} width={40} />
                  <span className="ms-2 text-muted small">Loading activities...</span>
                </div>
              ) : activities.length === 0 ? (
                <p className="text-muted small mb-0">
                  No activities have been created under this target yet. Use the{" "}
                  <strong>Add Activity</strong> button to create one.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ minWidth: 220 }}>Activity</th>
                        <th style={{ minWidth: 120 }}>Period</th>
                        <th style={{ minWidth: 200 }}>Quarter Progress</th>
                        <th style={{ minWidth: 100 }}>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((act) => {
                        const fy = act.planned_financial_year || "";
                        const plannedQs =
                          Array.isArray(act.planned_quarters) && act.planned_quarters.length > 0
                            ? act.planned_quarters
                            : act.planned_quarter != null
                              ? [act.planned_quarter]
                              : [];
                        const qLabel =
                          plannedQs.length === 4
                            ? "All quarters"
                            : plannedQs.length > 0
                              ? plannedQs.map((q) => `Q${q}`).join(", ")
                              : "";
                        const plannedPeriod = fy && qLabel ? `${fy} — ${qLabel}` : fy || qLabel || "—";

                        // Quarter progress from quarterly_summary
                        const summary = Array.isArray(act.quarterly_summary) ? act.quarterly_summary : [];
                        const submittedQs = summary.filter((s) => s.is_locked).map((s) => s.quarter);
                        const isFullyLocked = !!act.implementation_submitted_at;

                        return (
                          <tr
                            key={act.uid}
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              navigate(`/performance-dashboard/activities/open/${act.uid}`, {
                                state: { fromTarget: { uid: obj.uid, title: obj.title } },
                              })
                            }
                          >
                            <td>
                              <div className="fw-semibold text-body mb-1">{act.title}</div>
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                {act.weight != null && (
                                  <span className="badge bg-label-warning text-warning px-2 py-1" style={{ fontSize: "0.72rem" }}>
                                    <i className="bx bx-pie-chart-alt me-1"></i>{act.weight}%
                                  </span>
                                )}
                                {act.planned_value_label && (
                                  <span className="badge bg-label-secondary text-body px-2 py-1" style={{ fontSize: "0.72rem" }}>
                                    {act.planned_value != null ? `${act.planned_value} ` : ""}{act.planned_value_label}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              {plannedPeriod !== "—" && (
                                <span className="badge bg-label-info text-info px-2 py-1" style={{ fontSize: "0.72rem" }}>
                                  <i className="bx bx-calendar me-1"></i>{plannedPeriod}
                                </span>
                              )}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              {isFullyLocked ? (
                                <span className="badge bg-success px-2 py-1">
                                  <i className="bx bx-lock-alt me-1"></i>All submitted
                                </span>
                              ) : act.status !== "APPROVED" ? (
                                <span className="text-muted small">—</span>
                              ) : plannedQs.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1">
                                  {plannedQs.map((q) => {
                                    const submitted = submittedQs.includes(q);
                                    return (
                                      <span key={q}
                                        className={`badge px-2 py-1 ${submitted ? "bg-success" : "bg-label-warning text-warning"}`}
                                        style={{ fontSize: "0.72rem" }}>
                                        <i className={`bx ${submitted ? "bx-check" : "bx-time"} me-1`}></i>
                                        Q{q}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : summary.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1">
                                  {summary.map((s) => (
                                    <span key={s.quarter}
                                      className={`badge px-2 py-1 ${s.is_locked ? "bg-success" : "bg-label-warning text-warning"}`}
                                      style={{ fontSize: "0.72rem" }}>
                                      <i className={`bx ${s.is_locked ? "bx-check" : "bx-time"} me-1`}></i>
                                      Q{s.quarter}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted small">No data yet</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${STATUS_BADGE[act.status] || "bg-label-secondary"}`}>
                                {act.status}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/performance-dashboard/activities/open/${act.uid}`, {
                                    state: { fromTarget: { uid: obj.uid, title: obj.title } },
                                  });
                                }}
                              >
                                <i className="bx bx-show me-1"></i>View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <TargetModal
        modalId="targetEditModal"
        selectedTarget={selectedTargetForModal}
        setSelectedTarget={setSelectedTargetForModal}
        tableRefresh={modalRefresh}
        setTableRefresh={setModalRefresh}
        onSuccess={() => {
          setSelectedTargetForModal(null);
          fetchOne();
        }}
      />

      <ActivityModal
        modalId="activityUnderTargetModal"
        selectedActivity={selectedActivity}
        setSelectedActivity={setSelectedActivity}
        tableRefresh={activityTableRefresh}
        setTableRefresh={setActivityTableRefresh}
        onSuccess={() => {
          setSelectedActivity(null);
          setActivityTableRefresh((prev) => prev + 1);
        }}
      />
    </>
  );
};