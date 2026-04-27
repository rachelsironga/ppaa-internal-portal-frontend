import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getPendingApprovals, objectiveApproval, targetApproval, activityApproval } from "./Queries";
import {
  getImplementationActivities,
  getFinancialYears,
  activityImplementationApproval,
} from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { hasPermission } from "../../../../utils/permissions";
import {
  getPendingImplementationQuartersFromRow,
  formatActivityTitleForDisplay,
} from "../implementationQuarterUtils";
import { ActivityPlanningContext } from "../ActivityPlanningContext";

const STATUS_BADGE = {
  DRAFT: "bg-label-secondary",
  PENDING: "bg-label-warning",
  APPROVED: "bg-label-success",
  RETURNED: "bg-label-danger",
};

const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1–12
  if (month >= 7) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

const ApprovalView = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("type") === "implementation" ? "implementation" : "planning";
  const user = useSelector((state) => state.userReducer?.data);
  const canApprovePlanning = hasPermission(
    ["can_approve_spism_planning"],
    [],
    user?.user_permissions,
    user?.groups,
    user
  );
  // Same ES users often have only planning permission assigned; allow either codename for implementation review.
  const canApproveImplementation = hasPermission(
    ["can_approve_spism_implementation", "can_approve_spism_planning"],
    [],
    user?.user_permissions,
    user?.groups,
    user
  );
  const [status, setStatus] = useState("PENDING");
  const [financialYear, setFinancialYear] = useState("");
  const [entityType, setEntityType] = useState("");
  const [data, setData] = useState({ objectives: [], targets: [], activities: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [implFinancialYear, setImplFinancialYear] = useState(getCurrentFinancialYear());
  const [implFinancialYears, setImplFinancialYears] = useState([]);
  const [implSearch, setImplSearch] = useState("");
  const [implQuarter, setImplQuarter] = useState("");
  const [implApprovalFilter, setImplApprovalFilter] = useState("");
  const [implActivities, setImplActivities] = useState([]);
  const [implLoading, setImplLoading] = useState(true);
  const navigate = useNavigate();

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await getPendingApprovals({ entity_type: entityType, status, financial_year: financialYear });
      const payload = res?.data?.data ?? res?.data ?? res;
      if (payload && (payload.objectives || payload.targets || payload.activities)) {
        setData({
          objectives: payload.objectives || [],
          targets: payload.targets || [],
          activities: payload.activities || [],
        });
      } else {
        setData({ objectives: [], targets: [], activities: [] });
      }
    } catch (e) {
      showToast("Failed to load approvals", "warning", "Error");
      setData({ objectives: [], targets: [], activities: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "planning") {
      fetchApprovals();
    }
  }, [status, financialYear, entityType, mode]);

  const fetchImplementationApprovals = async () => {
    setImplLoading(true);
    try {
      const res = await getImplementationActivities({
        financial_year: implFinancialYear.trim(),
        queue: "implementation_approval",
        search: implSearch.trim(),
        quarter: implQuarter,
        implementation_approval_filter: implApprovalFilter || undefined,
      });
      const resData = res?.data ?? res;
      const list = Array.isArray(resData) ? resData : resData?.data ?? resData?.results ?? [];
      setImplActivities(Array.isArray(list) ? list : []);
    } catch (e) {
      showToast("Failed to load implementation approvals", "warning", "Error");
      setImplActivities([]);
    } finally {
      setImplLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== "implementation") return;
    getFinancialYears()
      .then((res) => {
        const raw = res?.data ?? res?.results ?? res;
        const list = Array.isArray(raw) ? raw : raw?.data ?? raw?.results ?? [];
        setImplFinancialYears(Array.isArray(list) ? list : []);
      })
      .catch(() => setImplFinancialYears([]));
  }, [mode]);

  useEffect(() => {
    if (mode === "implementation") {
      fetchImplementationApprovals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, implFinancialYear]);

  const applyImplFilters = () => {
    if (mode === "implementation") fetchImplementationApprovals();
  };

  const quickImplementationDecision = async (row, quarter, action) => {
    let comment = "";
    if (action === "return") {
      const c = await Swal.fire({
        title:
          quarter != null && quarter !== ""
            ? `Return Q${quarter} implementation?`
            : "Return implementation?",
        input: "textarea",
        inputLabel: "Comment (required)",
        inputPlaceholder: "Explain what must be revised before resubmission…",
        showCancelButton: true,
        confirmButtonColor: "#ffab00",
        confirmButtonText: "Return",
        inputValidator: (v) => (!v || !String(v).trim() ? "Comment is required" : null),
      });
      if (!c.value) return;
      comment = String(c.value).trim();
    } else {
      const ok = await Swal.fire({
        title:
          quarter != null && quarter !== ""
            ? `Approve Q${quarter} implementation?`
            : "Approve implementation?",
        text: "This confirms the submitted implementation for the selected scope.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Approve",
        confirmButtonColor: "#28a745",
      });
      if (!ok.isConfirmed) return;
    }

    setActionLoading(row.uid);
    try {
      const res = await activityImplementationApproval(row.uid, {
        action,
        comment,
        ...(quarter != null && quarter !== "" ? { quarter: Number(quarter) } : {}),
      });
      if (res?.status === 200 || res?.status === 8000) {
        showToast(res?.message || (action === "approve" ? "Approved" : "Returned"), "success");
        fetchImplementationApprovals();
      } else {
        showToast(res?.message || "Action failed", "warning", "Error");
      }
    } catch (e) {
      showToast(e?.response?.data?.message || "Action failed", "danger", "Error");
    } finally {
      setActionLoading(null);
    }
  };

  const runImplementationReview = async (row) => {
    const label = row.title || "Activity";
    const pending = getPendingImplementationQuartersFromRow(row);

    if (pending.length === 0) {
      showToast("No quarters are awaiting implementation approval.", "info", "Queue");
      fetchImplementationApprovals();
      return;
    }

    const sortedQ = [
      ...new Set(pending.map((p) => p.quarter).filter((q) => q != null && q !== "")),
    ].sort((a, b) => a - b);
    const pendingLabel = pending.map((p) => (p.quarter != null ? `Q${p.quarter}` : p.label)).join(", ");

    const pick = await Swal.fire({
      title: "Implementation review",
      html:
        `<p class="text-start mb-2"><strong>${label.length > 120 ? `${label.slice(0, 120)}…` : label}</strong></p>` +
        `<p class="text-start small text-muted">Pending approval: <strong>${pendingLabel}</strong></p>` +
        `<p class="text-start small">Choose <strong>Approve</strong> to accept implementation, or <strong>Return</strong> to send back for revision (you will add a comment).</p>`,
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Approve…",
      denyButtonText: "Return…",
      confirmButtonColor: "#28a745",
      denyButtonColor: "#ffab00",
      cancelButtonColor: "#6c757d",
    });

    if (pick.isDismissed) return;
    const isApprove = pick.isConfirmed;
    const isReturn = pick.isDenied;

    const scopeOpts = {
      all: `All pending (${pendingLabel})`,
    };
    sortedQ.forEach((q) => {
      scopeOpts[String(q)] = `Quarter Q${q} only`;
    });

    const { value: scope } = await Swal.fire({
      title: isApprove ? "Approve which quarter(s)?" : "Return which quarter(s)?",
      input: "select",
      inputOptions: scopeOpts,
      showCancelButton: true,
      confirmButtonText: "Next",
      inputValidator: (v) => (!v ? "Please select an option" : null),
    });
    if (!scope) return;

    const quarterParam = scope === "all" ? null : parseInt(scope, 10);
    const scopeText = scope === "all" ? `all pending (${pendingLabel})` : `Q${quarterParam} only`;

    let comment = "";
    if (isReturn) {
      const c = await Swal.fire({
        title: `Return ${scopeText}`,
        input: "textarea",
        inputLabel: "Comment (required)",
        inputPlaceholder: "Explain what must be revised before resubmission…",
        showCancelButton: true,
        confirmButtonColor: "#ffab00",
        confirmButtonText: "Return",
        inputValidator: (v) => (!v || !String(v).trim() ? "Comment is required" : null),
      });
      if (!c.value) return;
      comment = String(c.value).trim();
    } else {
      const ok = await Swal.fire({
        title: `Approve ${scopeText}?`,
        text: "This will lock in the approved implementation for the selected quarter(s).",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, approve",
        confirmButtonColor: "#28a745",
      });
      if (!ok.isConfirmed) return;
    }

    setActionLoading(row.uid);
    try {
      const res = await activityImplementationApproval(row.uid, {
        action: isApprove ? "approve" : "return",
        comment,
        quarter: quarterParam,
      });
      if (res?.status === 200 || res?.status === 8000) {
        showToast(res?.message || (isApprove ? "Approved" : "Returned"), "success");
        fetchImplementationApprovals();
      } else {
        showToast(res?.message || "Action failed", "warning", "Error");
      }
    } catch (e) {
      showToast(e?.response?.data?.message || "Action failed", "danger", "Error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (type, uid, label) => {
    const typeLabel =
      type === "objective" ? "objective" : type === "target" ? "target" : "activity";
    const result = await Swal.fire({
      title: `Approve ${typeLabel}?`,
      text: label
        ? `Are you sure you want to approve "${label}"?`
        : "Are you sure you want to approve this item?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00853f",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, approve",
    });
    if (!result.isConfirmed) return;
    setActionLoading(uid);
    try {
      if (type === "objective") await objectiveApproval(uid, { action: "approve" });
      else if (type === "target") await targetApproval(uid, { action: "approve" });
      else await activityApproval(uid, { action: "approve" });
      showToast("Approved successfully", "success");
      fetchApprovals();
    } catch (e) {
      showToast(e?.response?.data?.message || "Approve failed", "danger");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (type, uid) => {
    const { value: comment } = await Swal.fire({
      title: "Return for revision",
      input: "textarea",
      inputLabel: "Comment (required)",
      inputPlaceholder: "Explain what needs to be revised...",
      showCancelButton: true,
      confirmButtonColor: "#ffab00",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Return",
      inputValidator: (v) => (!v || !v.trim() ? "Comment is required" : null),
    });
    if (!comment) return;
    setActionLoading(uid);
    try {
      if (type === "objective") await objectiveApproval(uid, { action: "return", comment: comment.trim() });
      else if (type === "target") await targetApproval(uid, { action: "return", comment: comment.trim() });
      else await activityApproval(uid, { action: "return", comment: comment.trim() });
      showToast("Returned successfully", "success");
      fetchApprovals();
    } catch (e) {
      showToast(e?.response?.data?.message || "Return failed", "danger");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPending =
    data.objectives.length + data.targets.length + data.activities.length;

  const formatActivityPlannedQuarters = (row) => {
    const pq = row?.planned_quarters;
    if (Array.isArray(pq) && pq.length > 0) {
      return [...pq].sort((a, b) => a - b).map((q) => `Q${q}`).join(", ");
    }
    if (row?.planned_quarter != null) return `Q${row.planned_quarter}`;
    return "—";
  };

  /** Row still needs ES implementation review (approve / return). */
  const rowNeedsImplementationReview = (row) => {
    const pending = Number(
      row.pending_implementation_approval_count ?? row.pendingImplementationApprovalCount ?? 0
    );
    const status = row.implementation_review_status;
    if (status === "APPROVED") return false;
    return pending > 0 || status === "PENDING_APPROVAL";
  };

  const implementationReviewBadge = (row) => {
    const s = row.implementation_review_status;
    const pending = row.pending_implementation_approval_count ?? 0;
    if (s === "PENDING_APPROVAL") {
      return (
        <span className="badge bg-label-warning text-warning">
          <i className="bx bx-time-five me-1"></i>
          Pending approval
          {pending > 0 ? ` (${pending})` : ""}
        </span>
      );
    }
    if (s === "APPROVED") {
      return (
        <span className="badge bg-label-success">
          <i className="bx bx-check-shield me-1"></i>
          Approved
        </span>
      );
    }
    return (
      <span className="badge bg-label-secondary text-muted">
        <i className="bx bx-loader-alt me-1"></i>
        In progress
      </span>
    );
  };

  // Implementation mode tab
  if (mode === "implementation") {
    return (
      <>
        <style>{`
          .implementation-approvals-table thead th { white-space: nowrap; font-size: 0.8125rem; vertical-align: middle; }
          .implementation-approvals-table td.impl-review-td { vertical-align: middle; }
          .implementation-approvals-table .impl-review-dropdown { min-width: 15.5rem; max-width: min(22rem, 92vw); }
          .implementation-approvals-table .impl-review-dropdown .impl-q-row { padding: 0.35rem 0.75rem; }
          .implementation-approvals-table .impl-review-dropdown .impl-q-row .btn { padding-top: 0.2rem; padding-bottom: 0.2rem; font-size: 0.75rem; font-weight: 600; }
        `}</style>
        <BreadCumb pageList={["SPISM", "Approval", "Implementation"]} />
        <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
          <div className="card-header bg-light">
            <h5 className="mb-0 fw-semibold">
              <i className="bx bx-check-double me-2 text-primary"></i>
              Implementation Approvals
            </h5>
            <p className="text-muted small mb-0 mt-1">
              Review activities with quarterly implementation submitted for approval. Use filters to narrow the list.
            </p>
          </div>
          <div className="card-body">
            <div className="row g-2 align-items-end mb-3">
              <div className="col-sm-auto">
                <label className="form-label small text-muted mb-0">Financial year</label>
                <select
                  className="form-select form-select-sm"
                  style={{ minWidth: "140px" }}
                  value={implFinancialYear}
                  onChange={(e) => setImplFinancialYear(e.target.value)}
                >
                  {implFinancialYears.length === 0 ? (
                    <option value={implFinancialYear}>{implFinancialYear}</option>
                  ) : (
                    <>
                      {!implFinancialYears.some((f) => f.name === implFinancialYear) && implFinancialYear ? (
                        <option value={implFinancialYear}>{implFinancialYear}</option>
                      ) : null}
                      {implFinancialYears.map((fy) => (
                        <option key={fy.uid} value={fy.name}>
                          {fy.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div className="col-sm">
                <label className="form-label small text-muted mb-0">Search activity / target / objective</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Type to search…"
                  value={implSearch}
                  onChange={(e) => setImplSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyImplFilters())}
                />
              </div>
              <div className="col-sm-auto">
                <label className="form-label small text-muted mb-0">Quarter</label>
                <select
                  className="form-select form-select-sm"
                  style={{ minWidth: "110px" }}
                  value={implQuarter}
                  onChange={(e) => setImplQuarter(e.target.value)}
                >
                  <option value="">All quarters</option>
                  <option value="1">Q1</option>
                  <option value="2">Q2</option>
                  <option value="3">Q3</option>
                  <option value="4">Q4</option>
                </select>
              </div>
              <div className="col-sm-auto">
                <label className="form-label small text-muted mb-0">Approval status</label>
                <select
                  className="form-select form-select-sm"
                  style={{ minWidth: "150px" }}
                  value={implApprovalFilter}
                  onChange={(e) => setImplApprovalFilter(e.target.value)}
                >
                  <option value="">All in queue</option>
                  <option value="pending">Pending approval</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
              <div className="col-sm-auto d-flex gap-1">
                <button type="button" className="btn btn-primary btn-sm" onClick={applyImplFilters}>
                  <i className="bx bx-filter-alt me-1"></i>
                  Apply
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchImplementationApprovals}>
                  Refresh
                </button>
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigate("/performance-dashboard/approval")}
              >
                Planning approvals
              </button>
              {canApproveImplementation ? (
                <span className="text-muted small">
                  <i className="bx bx-info-circle me-1"></i>
                  Use the <strong>⋯</strong> menu: choose <strong>Open activity</strong>, then <strong>Approve</strong> / <strong>Return</strong> per quarter.{" "}
                  <strong>Batch review</strong> appears when multiple quarters are pending.
                </span>
              ) : (
                <span className="text-muted small">
                  <i className="bx bx-lock-alt me-1"></i>
                  Implementation review requires the <strong>SPISM: Approve/return implementation</strong> permission.
                </span>
              )}
            </div>
            {implLoading ? (
              <p className="text-muted mb-0">Loading…</p>
            ) : implActivities.length === 0 ? (
              <p className="text-muted mb-0">
                No activities match this queue for the selected financial year and filters.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle implementation-approvals-table">
                  <thead>
                    <tr>
                      <th>Activity</th>
                      <th>Target / Objective</th>
                      <th>FY / Quarters</th>
                      <th>Status</th>
                      <th>Qtr. data</th>
                      <th>Docs</th>
                      <th>Submitted</th>
                      <th className="text-end" style={{ minWidth: "88px" }}>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {implActivities.map((row) => {
                      const pendingImplQuarters = getPendingImplementationQuartersFromRow(row);
                      return (
                      <tr key={row.uid}>
                        <td>
                          <span className="text-primary fw-semibold">
                            {formatActivityTitleForDisplay(row.title, 80)}
                          </span>
                          {row.weight != null && (
                            <span className="badge bg-label-warning ms-1">Weight {row.weight}%</span>
                          )}
                        </td>
                        <td>
                          <div className="small">
                            <span className="text-primary">{row.target_title}</span>
                            {row.objective_title && (
                              <div className="text-muted">{row.objective_title}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <small className="text-muted d-block">{row.planned_financial_year || "—"}</small>
                          <small className="text-body">{formatActivityPlannedQuarters(row)}</small>
                        </td>
                        <td>{implementationReviewBadge(row)}</td>
                        <td>
                          {row.quarterly_data_count > 0 ? (
                            <span className="badge bg-label-success">{row.quarterly_data_count}</span>
                          ) : (
                            <span className="badge bg-label-secondary">0</span>
                          )}
                        </td>
                        <td>
                          {row.documents_count > 0 ? (
                            <span className="badge bg-label-success">{row.documents_count}</span>
                          ) : (
                            <span className="badge bg-label-secondary">0</span>
                          )}
                        </td>
                        <td>
                          {row.implementation_submitted_at ? (
                            <small className="text-success">
                              {formatDate(row.implementation_submitted_at, "DD/MM/YYYY HH:mm")}
                            </small>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-end impl-review-td">
                          <div className="d-inline-flex flex-column align-items-end gap-1">
                            <div className="dropdown d-inline-block text-start">
                              <button
                                type="button"
                                className="btn btn-sm btn-icon btn-outline-secondary"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                aria-haspopup="true"
                                title={
                                  canApproveImplementation && rowNeedsImplementationReview(row)
                                    ? "Open activity, Approve, Return"
                                    : "Open activity"
                                }
                                disabled={canApproveImplementation && actionLoading !== null}
                              >
                                <i className="bx bx-dots-vertical"></i>
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end shadow-sm impl-review-dropdown">
                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item d-flex align-items-center"
                                    onClick={() =>
                                      navigate(`/performance-dashboard/activities/open/${row.uid}?es=1`)
                                    }
                                  >
                                    <i className="bx bx-link-external me-2 text-primary"></i>
                                    Open activity
                                  </button>
                                </li>
                                {canApproveImplementation &&
                                rowNeedsImplementationReview(row) &&
                                pendingImplQuarters.length > 0 ? (
                                  <>
                                    <li>
                                      <h6 className="dropdown-header text-uppercase small mb-0 py-2">
                                        By quarter
                                      </h6>
                                    </li>
                                    {pendingImplQuarters.map((p) => (
                                      <li key={`${row.uid}-${p.label}-${p.quarter ?? "all"}`}>
                                        <span className="dropdown-item-text impl-q-row">
                                          <div className="d-flex flex-wrap align-items-center gap-2">
                                            <span className="badge bg-label-primary rounded-pill px-2 py-1 flex-shrink-0">
                                              {p.quarter != null ? `Q${p.quarter}` : "All"}
                                            </span>
                                            <div
                                              className="btn-group btn-group-sm ms-auto"
                                              role="group"
                                              aria-label={`Review ${p.label}`}
                                            >
                                              <button
                                                type="button"
                                                className="btn btn-success text-white"
                                                disabled={actionLoading !== null}
                                                onClick={() => quickImplementationDecision(row, p.quarter, "approve")}
                                                title={
                                                  p.quarter != null
                                                    ? `Approve implementation for quarter ${p.quarter}`
                                                    : "Approve full activity implementation"
                                                }
                                              >
                                                Approve
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-warning text-dark"
                                                disabled={actionLoading !== null}
                                                onClick={() => quickImplementationDecision(row, p.quarter, "return")}
                                                title="Return for revision (comment required)"
                                              >
                                                Return
                                              </button>
                                            </div>
                                          </div>
                                        </span>
                                      </li>
                                    ))}
                                    {pendingImplQuarters.length > 1 ? (
                                      <>
                                        <li>
                                          <hr className="dropdown-divider my-1" />
                                        </li>
                                        <li>
                                          <button
                                            type="button"
                                            className="dropdown-item d-flex align-items-center fw-semibold text-primary"
                                            disabled={actionLoading !== null}
                                            onClick={() => runImplementationReview(row)}
                                          >
                                            <i className="bx bx-list-check me-2"></i>
                                            Batch review…
                                          </button>
                                        </li>
                                      </>
                                    ) : null}
                                  </>
                                ) : null}
                              </ul>
                            </div>
                            {canApproveImplementation && actionLoading === row.uid ? (
                              <small className="text-muted d-flex align-items-center justify-content-end gap-1">
                                <span
                                  className="spinner-border spinner-border-sm"
                                  style={{ width: "0.65rem", height: "0.65rem" }}
                                  role="status"
                                  aria-hidden="true"
                                />
                                Working…
                              </small>
                            ) : null}
                          </div>
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
    );
  }

  // Planning mode
  return (
    <>
      <style>{`.targets-approval-table tbody td { padding-top: 0.75rem; padding-bottom: 0.75rem; }`}</style>
      <BreadCumb pageList={["SPISM", "Approval"]} />
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-check-double me-2 text-primary"></i>
            Pending & Returned Items — Approve or Return with comment
          </h5>
        </div>
        <div className="card-body">
          <div className="alert alert-info mb-3">
            <strong><i className="bx bx-git-branch me-2"></i>Hierarchical approval workflow (ES)</strong>
            <p className="mb-0 mt-1 small">
              As the Executive Secretariat (ES), review and decide in this order:
              <strong> Objectives first</strong>, then their Targets, then Activities.
              A target can only be approved after its parent objective is approved.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <select
              className="form-select form-select-sm"
              style={{ width: "140px" }}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="PENDING">Pending</option>
              <option value="RETURNED">Returned</option>
            </select>
            <input
              type="text"
              placeholder="Financial Year"
              className="form-control form-control-sm"
              style={{ width: "130px" }}
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
            />
            <select
              className="form-select form-select-sm"
              style={{ width: "160px" }}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="">All (Objectives, Targets, Activities)</option>
              <option value="objective">Objectives only</option>
              <option value="target">Targets only</option>
              <option value="activity">Activities only</option>
            </select>
            <button type="button" className="btn btn-primary btn-sm" onClick={fetchApprovals}>
              Refresh
            </button>
            <a
              href="/performance-dashboard/approval?type=implementation"
              className="btn btn-outline-secondary btn-sm"
              onClick={(e) => {
                e.preventDefault();
                navigate("/performance-dashboard/approval?type=implementation");
              }}
            >
              Implementation approvals
            </a>
          </div>
          {loading ? (
            <p className="text-muted mb-0">Loading…</p>
          ) : totalPending === 0 ? (
            <p className="text-muted mb-0">No items with status &quot;{status}&quot;.</p>
          ) : (
            <>
              {data.objectives.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold text-primary">
                    Objectives
                    <span className="badge bg-label-primary ms-2">{data.objectives.length}</span>
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Objective</th>
                          <th>FY</th>
                          <th className="pe-3 text-end" style={{ minWidth: "100px" }}>Updated</th>
                          <th className="ps-3" style={{ width: "100px", minWidth: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.objectives.map((row) => (
                          <tr key={row.uid}>
                            <td>
                              <span
                                className="text-primary fw-semibold cursor-pointer"
                                onClick={() => navigate(`/performance-dashboard/approval/objectives/${row.uid}`)}
                              >
                                {row.title && row.title.length > 80
                                  ? `${row.title.substring(0, 80)}...`
                                  : row.title}
                              </span>
                              <div className="mt-1 small">
                                {row.weight != null && (
                                  <span className="badge bg-label-warning me-1">Weight {row.weight}%</span>
                                )}
                                {row.status && (
                                  <span className={`badge ${STATUS_BADGE[row.status] || "bg-label-secondary"}`}>
                                    {row.status}
                                  </span>
                                )}
                              </div>
                              {row.approval_comment && (
                                <small className="d-block text-muted mt-1">
                                  {row.approval_comment.length > 100
                                    ? `${row.approval_comment.substring(0, 100)}...`
                                    : row.approval_comment}
                                </small>
                              )}
                            </td>
                            <td>{row.financial_year}</td>
                            <td className="pe-3 text-end">{formatDate(row.updated_at, "DD/MM/YYYY")}</td>
                            <td className="ps-3">
                              <div className="dropdown d-flex justify-content-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-outline-secondary"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  aria-haspopup="true"
                                  title="Actions"
                                >
                                  <i className="bx bx-dots-vertical"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center"
                                      onClick={() => navigate(`/performance-dashboard/approval/objectives/${row.uid}`)}
                                    >
                                      <i className="bx bx-show me-2 text-primary"></i>
                                      View
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {data.targets.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold text-info">
                    Targets
                    <span className="badge bg-label-info ms-2">{data.targets.length}</span>
                  </h6>
                  <p className="text-muted small mb-2">
                    Approve the parent objective first; only then can these targets be approved.
                  </p>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle targets-approval-table">
                      <thead>
                        <tr>
                          <th>Target</th>
                          <th className="pe-3 text-end" style={{ minWidth: "100px" }}>Planned value</th>
                          <th className="ps-3" style={{ width: "100px", minWidth: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.targets.map((row) => (
                          <tr key={row.uid}>
                            <td>
                              <span
                                className="text-primary fw-semibold cursor-pointer"
                                onClick={() => navigate(`/performance-dashboard/approval/targets/${row.uid}`)}
                              >
                                {row.title && row.title.length > 80
                                  ? `${row.title.substring(0, 80)}...`
                                  : row.title}
                              </span>
                              <div className="mt-1 small">
                                {row.weight != null && (
                                  <span className="badge bg-label-warning me-1">
                                    Weight {row.weight}%
                                  </span>
                                )}
                                {row.kpi_name && (
                                  <span className="badge bg-label-info me-1">
                                    KPI:{" "}
                                    <span className="fw-semibold">
                                      {row.kpi_name.length > 50
                                        ? `${row.kpi_name.substring(0, 50)}...`
                                        : row.kpi_name}
                                    </span>
                                  </span>
                                )}
                                {row.objective_title && (
                                  <span className="badge bg-label-secondary">
                                    Obj:{" "}
                                    <span className="fw-semibold">
                                      {row.objective_title.length > 40
                                        ? `${row.objective_title.substring(0, 40)}...`
                                        : row.objective_title}
                                    </span>
                                  </span>
                                )}
                              </div>
                              {row.approval_comment && (
                                <small className="d-block text-muted mt-1">
                                  {row.approval_comment.length > 100
                                    ? `${row.approval_comment.substring(0, 100)}...`
                                    : row.approval_comment}
                                </small>
                              )}
                            </td>
                            <td className="pe-3 text-end">
                              {row.planned_value != null
                                ? row.kpi_unit === "%"
                                  ? `${row.planned_value}%`
                                  : String(row.planned_value)
                                : "—"}
                            </td>
                            <td className="ps-3">
                              <div className="dropdown d-flex justify-content-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-outline-secondary"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  aria-haspopup="true"
                                  title="Actions"
                                  disabled={actionLoading !== null}
                                >
                                  <i className="bx bx-dots-vertical"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center"
                                      onClick={() => navigate(`/performance-dashboard/approval/targets/${row.uid}`)}
                                    >
                                      <i className="bx bx-show me-2 text-primary"></i>
                                      View
                                    </button>
                                  </li>
                                  {canApprovePlanning && (
                                    <>
                                      <li><hr className="dropdown-divider" /></li>
                                      <li>
                                        <button
                                          type="button"
                                          className="dropdown-item d-flex align-items-center"
                                          disabled={row.objective_status !== "APPROVED"}
                                          onClick={() => handleApprove("target", row.uid, row.title)}
                                        >
                                          <i className="bx bx-check me-2 text-success"></i>
                                          Approve
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          type="button"
                                          className="dropdown-item d-flex align-items-center"
                                          disabled={row.objective_status !== "APPROVED"}
                                          onClick={() => handleReturn("target", row.uid)}
                                        >
                                          <i className="bx bx-undo me-2 text-warning"></i>
                                          Return
                                        </button>
                                      </li>
                                    </>
                                  )}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {data.activities.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold text-success">
                    Activities
                    <span className="badge bg-label-success ms-2">{data.activities.length}</span>
                  </h6>
                  <p className="text-muted small mb-2">
                    Approve the parent objective and target first; only then can these activities be approved.
                  </p>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle targets-approval-table">
                      <thead>
                        <tr>
                          <th>Activity</th>
                          <th className="pe-3 text-end" style={{ minWidth: "100px" }}>Planned value</th>
                          <th className="pe-3 text-end" style={{ minWidth: "100px" }}>Updated</th>
                          <th className="ps-3" style={{ width: "100px", minWidth: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.activities.map((row) => (
                          <tr key={row.uid}>
                            <td>
                              <span
                                className="text-primary fw-semibold cursor-pointer"
                                onClick={() => navigate(`/performance-dashboard/approval/activities/${row.uid}`)}
                              >
                                {row.title && row.title.length > 80
                                  ? `${row.title.substring(0, 80)}...`
                                  : row.title}
                              </span>
                              <div className="mt-1 small">
                                {row.weight != null && (
                                  <span className="badge bg-label-warning me-1">
                                    Weight {row.weight}%
                                  </span>
                                )}
                                {row.planned_value != null && (
                                  <>
                                    {row.planned_value}
                                    {row.planned_value_label && (
                                      <span className="text-muted small ms-1">({row.planned_value_label})</span>
                                    )}
                                  </>
                                )}
                                {(row.planned_financial_year || row.planned_quarter) && (
                                  <div className="small text-muted mt-1">
                                    {[row.planned_financial_year, row.planned_quarter ? `Q${row.planned_quarter}` : null]
                                      .filter(Boolean)
                                      .join(" ")}
                                  </div>
                                )}
                              </div>
                              <ActivityPlanningContext row={row} />
                              {row.status === "RETURNED" && row.approval_comment ? (
                                <div className="small mt-2 text-break" title={row.approval_comment}>
                                  <span className="text-danger fw-semibold">
                                    <i className="bx bx-message-square-detail me-1" aria-hidden="true" />
                                    Return note:
                                  </span>{" "}
                                  {row.approval_comment.length > 160
                                    ? `${row.approval_comment.slice(0, 160)}…`
                                    : row.approval_comment}
                                </div>
                              ) : null}
                            </td>
                            <td className="pe-3 text-end">
                              {row.planned_value != null ? (
                                <>
                                  {row.planned_value}
                                  {row.planned_value_label && (
                                    <span className="text-muted small ms-1">({row.planned_value_label})</span>
                                  )}
                                  {(row.planned_financial_year || row.planned_quarter) && (
                                    <div className="small text-muted mt-1">
                                      {[row.planned_financial_year, row.planned_quarter ? `Q${row.planned_quarter}` : null]
                                        .filter(Boolean)
                                        .join(" ")}
                                    </div>
                                  )}
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="pe-3 text-end">{formatDate(row.updated_at, "DD/MM/YYYY")}</td>
                            <td className="ps-3">
                              <div className="dropdown d-flex justify-content-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-outline-secondary"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  aria-haspopup="true"
                                  title="Actions"
                                  disabled={actionLoading !== null}
                                >
                                  <i className="bx bx-dots-vertical"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center"
                                      onClick={() => navigate(`/performance-dashboard/approval/activities/${row.uid}`)}
                                    >
                                      <i className="bx bx-show me-2 text-primary"></i>
                                      View
                                    </button>
                                  </li>
                                  {canApprovePlanning && (
                                    <>
                                      <li><hr className="dropdown-divider" /></li>
                                      <li>
                                        <button
                                          type="button"
                                          className="dropdown-item d-flex align-items-center"
                                          onClick={() => handleApprove("activity", row.uid, row.title)}
                                        >
                                          <i className="bx bx-check me-2 text-success"></i>
                                          Approve
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          type="button"
                                          className="dropdown-item d-flex align-items-center"
                                          onClick={() => handleReturn("activity", row.uid)}
                                        >
                                          <i className="bx bx-undo me-2 text-warning"></i>
                                          Return
                                        </button>
                                      </li>
                                    </>
                                  )}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ApprovalView;
