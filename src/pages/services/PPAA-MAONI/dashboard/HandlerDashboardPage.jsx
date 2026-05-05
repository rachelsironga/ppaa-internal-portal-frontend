import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { formatDate, formatDateTime } from "../../../../helpers/DateFormater";
import { getAllSuggestions, getDepartments, getMaoniSettings } from "../../PPAA-MAONI/Queries";
import { isMaoniAdmin, isMaoniHandler } from "../../../../utils/maoniRoles";
import {
  buildMonthlyTrend,
  buildQuarterlyTrend,
  buildYearlyTrend,
  getDashboardRange,
  inDashboardRange,
  toLocalDateString,
} from "./maoniDashboardDateRange";
import MaoniThreadAttentionBanner from "../../../../components/maoni/MaoniThreadAttentionBanner";
import { maoniSuggestionHasUnhandledThreadMessage } from "../../../../utils/maoniThreadAttention";
import {
  maoniUnderHandlerReviewBadgeClasses,
  getMaoniUnderHandlerReviewBadgeStyle,
} from "../../../../utils/maoniUnderHandlerReviewBadge";

const extractList = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data !== undefined && Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.data && Array.isArray(res.data.results)) return res.data.results;
  if (res.results !== undefined && Array.isArray(res.results)) return res.results;
  return [];
};

const normalizeWorkflowStatus = (status) => {
  const raw = String(status || "").toUpperCase();
  const legacy = {
    PENDING_REVIEW: "UNDER_HANDLER_REVIEW",
    UNDER_CONSIDERATION: "ESCALATED_TO_REVIEWER",
    APPROVED: "CLOSED_APPROVED",
    IMPLEMENTED: "CLOSED_APPROVED",
    REJECTED: "CLOSED_REJECTED",
  };
  return legacy[raw] || raw;
};

const OPEN_HANDLER_STATUSES = new Set([
  "SUBMITTED",
  "UNDER_HANDLER_REVIEW",
  "RETURNED_TO_HANDLER",
  "HANDLER_RESPONDED_TO_REVIEWER",
  "HANDLER_RESPONDED_TO_CONTRIBUTOR",
]);

/** Distinct badge styles per workflow status (handler queue table). */
const statusPillClass = (status) => {
  const s = normalizeWorkflowStatus(status);
  const base = "badge rounded-pill border";
  switch (s) {
    case "DRAFT":
      return `${base} bg-secondary-subtle text-secondary border-secondary`;
    case "SUBMITTED":
      return `${base} bg-success-subtle text-success border-success`;
    case "UNDER_HANDLER_REVIEW":
      return `badge ${maoniUnderHandlerReviewBadgeClasses} text-uppercase`;
    case "RETURNED_TO_HANDLER":
      return `${base} bg-secondary-subtle text-dark border-secondary`;
    case "ESCALATED_TO_REVIEWER":
      return `${base} bg-info-subtle text-info border-info`;
    case "HANDLER_RESPONDED_TO_REVIEWER":
      return `${base} bg-primary-subtle text-primary border-primary`;
    case "HANDLER_RESPONDED_TO_CONTRIBUTOR":
      return `${base} bg-dark-subtle text-dark border-dark`;
    case "CLOSED_APPROVED":
      return `${base} bg-success text-white border-success`;
    case "CLOSED_REJECTED":
      return `${base} bg-danger-subtle text-danger border-danger`;
    default:
      return `${base} bg-secondary-subtle text-secondary border-secondary`;
  }
};

const statusPillStyle = (status) => {
  const s = normalizeWorkflowStatus(status);
  if (s === "UNDER_HANDLER_REVIEW") {
    return getMaoniUnderHandlerReviewBadgeStyle();
  }
  return undefined;
};

const statusText = (status) =>
  normalizeWorkflowStatus(status).replaceAll("_", " ");

/** Tab labels, hints, and accent colors for navigation + table header. */
const HANDLER_QUEUE_TAB_CONFIG = {
  overview: {
    label: "Overview",
    hint: "Department queue",
    description: "Suggestions routed to your department that still need handler attention.",
    icon: "bx-grid-alt",
    accent: "primary",
    headerClass: "bg-primary-subtle border-bottom border-primary border-opacity-25",
  },
  escalated: {
    label: "Escalated",
    hint: "With reviewer",
    description: "Items already escalated from your department to a Maoni reviewer.",
    icon: "bx-transfer-alt",
    accent: "info",
    headerClass: "bg-info-subtle border-bottom border-info border-opacity-25",
  },
  contribution: {
    label: "Contributions",
    hint: "Suggestions submitted under your department",
    description:
      "Suggestions submitted under your department for the selected filters, newest activity first.",
    icon: "bx-message-square-detail",
    accent: "primary",
    headerClass: "bg-primary-subtle border-bottom border-primary border-opacity-25",
  },
  analytics: {
    label: "Analytics & charts",
    hint: "Trends & mix",
    description: "Contribution trend and status distribution for the current filters.",
    icon: "bx-bar-chart-alt-2",
    accent: "success",
    headerClass: "bg-success-subtle border-bottom border-success border-opacity-25",
  },
};

const ACCENT_ICON_CLASS = {
  primary: "text-primary",
  info: "text-info",
  warning: "text-warning",
  success: "text-success",
};

const HANDLER_TAB_ORDER = ["overview", "contribution", "escalated", "analytics"];

const BarChart = ({ data, labels, color = "#2563eb", height = 220 }) => {
  const safe = Array.isArray(data) ? data : [];
  const max = safe.length ? Math.max(...safe) : 0;
  return (
    <div className="d-flex align-items-end" style={{ height }}>
      {safe.map((v, i) => (
        <div key={labels[i] || i} className="d-flex flex-column align-items-center mx-1" style={{ flex: 1 }}>
          <div
            className="rounded-top"
            style={{
              width: "75%",
              minHeight: 8,
              height: `${max > 0 ? (v / max) * 100 : 0}%`,
              backgroundColor: color,
            }}
            title={`${labels[i]}: ${v}`}
          />
          <small className="text-muted mt-2">{String(labels[i] || "").slice(0, 3)}</small>
        </div>
      ))}
    </div>
  );
};

const LineChart = ({ data, labels, color = "#0d6efd", height = 200 }) => {
  const safeData = Array.isArray(data) ? data : [];
  const maxValue = safeData.length ? Math.max(...safeData) : 0;
  const pointCount = safeData.length;
  const pointWidth = pointCount > 1 ? 100 / (pointCount - 1) : 0;

  const points = safeData
    .map((value, index) => {
      const x = index * pointWidth;
      const y = maxValue > 0 ? 100 - (value / maxValue) * 100 : 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div style={{ height: `${height}px`, position: "relative" }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {pointCount > 1 && (
          <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        )}
        {safeData.map((value, index) => {
          const x = index * pointWidth;
          const y = maxValue > 0 ? 100 - (value / maxValue) * 100 : 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              stroke="#fff"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );
};

const PieChart = ({ data, labels, colors, size = 180 }) => {
  const safeData = Array.isArray(data) ? data : [];
  const total = safeData.reduce((a, b) => a + (Number(b) || 0), 0);
  let cumulative = 0;
  return (
    <div className="d-flex justify-content-center">
      <div className="position-relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          {total <= 0 ? (
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e5e7eb" strokeWidth="40" />
          ) : (
            safeData.map((v, i) => {
              const pct = (v / total) * 100;
              const start = cumulative;
              cumulative += pct;
              return (
                <circle
                  key={`${labels[i]}-${i}`}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={colors[i % colors.length]}
                  strokeWidth="40"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={`${100 - start}`}
                  transform="rotate(-90 50 50)"
                />
              );
            })
          )}
        </svg>
        <div className="position-absolute top-50 start-50 translate-middle text-center">
          <div className="fw-bold">{total}</div>
          <small className="text-muted">Total</small>
        </div>
      </div>
    </div>
  );
};

export const HandlerDashboardPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [escalationDays, setEscalationDays] = useState(3);
  const [timeRange, setTimeRange] = useState("all");
  /** Overview contribution chart bucket size (matches executive dashboard toggle). */
  const [chartGranularity, setChartGranularity] = useState("month");
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });
  /** Contribution tab: filters + local table paging */
  const [contributionStatusFilter, setContributionStatusFilter] = useState("");
  const [contributionCategoryFilter, setContributionCategoryFilter] = useState("");
  const [contributionSearchInput, setContributionSearchInput] = useState("");
  const [contributionPageSize, setContributionPageSize] = useState(10);
  const [contributionPageIndex, setContributionPageIndex] = useState(0);
  /** Set when user clicks an overview KPI card — narrows the Contributions table. */
  const [contributionKpiFilter, setContributionKpiFilter] = useState(null);

  const isAdmin = isMaoniAdmin(user);
  const canAccess = Boolean(isMaoniHandler(user) || isAdmin);
  const userDepartmentUid =
    user?.department?.uid ||
    user?.department_uid ||
    user?.position?.department_uid ||
    user?.current_department_uid ||
    null;

  useEffect(() => {
    if (!user) return;
    if (canAccess) return;
    Swal.fire({
      icon: "warning",
      title: "Access Denied",
      text: "You do not have access to the Handler Dashboard.",
      confirmButtonText: "Go Back",
    }).then(() => navigate(-1));
  }, [user, canAccess, navigate]);

  useEffect(() => {
    if (!canAccess) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [suggestionsRes, departmentsRes, settingsRes] = await Promise.all([
          getAllSuggestions(),
          getDepartments(),
          getMaoniSettings().catch(() => null),
        ]);
        if (cancelled) return;
        setSuggestions(extractList(suggestionsRes));
        setDepartments(extractList(departmentsRes));
        const days = Number(settingsRes?.data?.escalation_days ?? 3);
        setEscalationDays(Number.isFinite(days) && days > 0 ? days : 3);
      } catch (e) {
        console.error("Failed to load handler dashboard:", e);
        if (!cancelled) {
          setSuggestions([]);
          setDepartments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLastLoadedAt(new Date());
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [canAccess, refreshTick]);

  // Keep From / To inputs aligned with Month / Quarter / Year presets (same as executive dashboard).
  useEffect(() => {
    const now = new Date();
    if (timeRange === "month") {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      setCustomDateRange({
        start: toLocalDateString(startDate),
        end: toLocalDateString(now),
      });
    } else if (timeRange === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      const startDate = new Date(now.getFullYear(), q * 3, 1);
      setCustomDateRange({
        start: toLocalDateString(startDate),
        end: toLocalDateString(now),
      });
    } else if (timeRange === "year") {
      const startDate = new Date(now.getFullYear(), 0, 1);
      setCustomDateRange({
        start: toLocalDateString(startDate),
        end: toLocalDateString(now),
      });
    }
  }, [timeRange]);

  const deptByUid = useMemo(
    () => new Map((departments || []).map((d) => [d.uid, d.name])),
    [departments]
  );

  /** Only non-draft suggestions explicitly routed to the signed-in user's department (all tabs / charts). */
  const departmentScopedBase = useMemo(() => {
    if (!userDepartmentUid) return [];
    return (suggestions || []).filter((s) => {
      if (normalizeWorkflowStatus(s.status) === "DRAFT") return false;
      const dept = s.department_uid;
      if (dept == null || String(dept).trim() === "") return false;
      return String(dept) === String(userDepartmentUid);
    });
  }, [suggestions, userDepartmentUid]);

  const currentUserId = user?.id ?? user?.user_id ?? user?.pk ?? null;

  /** Suggestions routed to this department whose latest thread message was not from the signed-in user. */
  const threadAttentionItems = useMemo(() => {
    if (currentUserId == null) return [];
    return departmentScopedBase
      .filter((s) => maoniSuggestionHasUnhandledThreadMessage(s, currentUserId))
      .sort(
        (a, b) =>
          new Date(b.last_comment_at || b.updated_at || 0) -
          new Date(a.last_comment_at || a.updated_at || 0)
      );
  }, [departmentScopedBase, currentUserId]);

  const openSuggestionFromBanner = useCallback(
    (uid) => {
      navigate(`/ppaa-maoni/suggestions/${uid}`);
    },
    [navigate]
  );

  const departmentScoped = useMemo(() => {
    const now = new Date();
    const { start, end } = getDashboardRange(timeRange, customDateRange, now);
    if (!start || !end) return departmentScopedBase;
    return departmentScopedBase.filter((s) => inDashboardRange(s, start, end));
  }, [departmentScopedBase, timeRange, customDateRange.start, customDateRange.end]);

  const submittedToDepartment = useMemo(
    () => departmentScoped.filter((s) => OPEN_HANDLER_STATUSES.has(normalizeWorkflowStatus(s.status))),
    [departmentScoped]
  );

  const escalatedToReviewer = useMemo(
    () =>
      departmentScoped.filter(
        (s) => normalizeWorkflowStatus(s.status) === "ESCALATED_TO_REVIEWER"
      ),
    [departmentScoped]
  );

  const dueItems = useMemo(() => {
    const now = Date.now();
    const dueMs = escalationDays * 24 * 60 * 60 * 1000;
    return submittedToDepartment
      .map((s) => {
        const baseDate = new Date(s.updated_at || s.submitted_at || s.created_at || 0).getTime();
        const dueAt = baseDate + dueMs;
        return {
          ...s,
          dueAt,
          overdue: now > dueAt,
        };
      })
      .sort((a, b) => a.dueAt - b.dueAt);
  }, [submittedToDepartment, escalationDays]);

  const dueTodayUidSet = useMemo(() => {
    const set = new Set();
    const n = new Date();
    dueItems.forEach((d) => {
      const dDate = new Date(d.dueAt);
      if (
        dDate.getFullYear() === n.getFullYear() &&
        dDate.getMonth() === n.getMonth() &&
        dDate.getDate() === n.getDate()
      ) {
        set.add(d.uid);
      }
    });
    return set;
  }, [dueItems]);

  const overdueUidSet = useMemo(() => {
    const set = new Set();
    dueItems.forEach((d) => {
      if (d.overdue) set.add(d.uid);
    });
    return set;
  }, [dueItems]);

  const contributionRows = useMemo(
    () =>
      departmentScoped
        .slice()
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.submitted_at || b.created_at || 0) -
            new Date(a.updated_at || a.submitted_at || a.created_at || 0)
        ),
    [departmentScoped]
  );

  const contributionStatusOptions = useMemo(() => {
    const uniq = new Set();
    contributionRows.forEach((s) => uniq.add(normalizeWorkflowStatus(s.status)));
    return Array.from(uniq).sort();
  }, [contributionRows]);

  const contributionCategoryOptions = useMemo(() => {
    const uniq = new Set();
    contributionRows.forEach((s) => {
      const c = String(s.category_name || "").trim();
      uniq.add(c || "Uncategorized");
    });
    return Array.from(uniq).sort((a, b) => a.localeCompare(b));
  }, [contributionRows]);

  const contributionFilteredRows = useMemo(() => {
    const q = contributionSearchInput.trim().toLowerCase();
    return contributionRows.filter((s) => {
      const st = normalizeWorkflowStatus(s.status);
      if (contributionStatusFilter && st !== contributionStatusFilter) return false;
      if (contributionKpiFilter === "department_queue" && !OPEN_HANDLER_STATUSES.has(st)) {
        return false;
      }
      if (contributionKpiFilter === "due_today" && !dueTodayUidSet.has(s.uid)) return false;
      if (contributionKpiFilter === "overdue" && !overdueUidSet.has(s.uid)) return false;
      const catRaw = String(s.category_name || "").trim();
      const cat = catRaw || "Uncategorized";
      if (contributionCategoryFilter && cat !== contributionCategoryFilter) return false;
      if (q) {
        const title = (s.title || "").toLowerCase();
        if (
          !title.includes(q) &&
          !cat.toLowerCase().includes(q) &&
          !statusText(s.status).toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    contributionRows,
    contributionStatusFilter,
    contributionCategoryFilter,
    contributionSearchInput,
    contributionKpiFilter,
    dueTodayUidSet,
    overdueUidSet,
  ]);

  const contributionPagedRows = useMemo(() => {
    const start = contributionPageIndex * contributionPageSize;
    return contributionFilteredRows.slice(start, start + contributionPageSize);
  }, [contributionFilteredRows, contributionPageIndex, contributionPageSize]);

  const resetContributionFilters = useCallback(() => {
    setContributionStatusFilter("");
    setContributionCategoryFilter("");
    setContributionSearchInput("");
    setContributionPageSize(10);
    setContributionPageIndex(0);
    setContributionKpiFilter(null);
  }, []);

  const goToContributionKpi = useCallback((kpi) => {
    setContributionStatusFilter("");
    setContributionCategoryFilter("");
    setContributionSearchInput("");
    setContributionPageIndex(0);
    setContributionKpiFilter(kpi);
    setActiveTab("contribution");
  }, []);

  useEffect(() => {
    setContributionPageIndex(0);
  }, [
    contributionStatusFilter,
    contributionCategoryFilter,
    contributionSearchInput,
    contributionPageSize,
    contributionKpiFilter,
  ]);

  useEffect(() => {
    if (activeTab !== "contribution") {
      setContributionKpiFilter(null);
    }
  }, [activeTab]);

  const contributionPageCount = Math.max(
    1,
    Math.ceil(contributionFilteredRows.length / Math.max(1, contributionPageSize))
  );

  useEffect(() => {
    if (contributionPageIndex > contributionPageCount - 1) {
      setContributionPageIndex(Math.max(0, contributionPageCount - 1));
    }
  }, [contributionPageCount, contributionPageIndex]);

  const overview = {
    assigned: submittedToDepartment.length,
    escalated: escalatedToReviewer.length,
    overdue: dueItems.filter((d) => d.overdue).length,
    dueToday: dueItems.filter((d) => {
      const dDate = new Date(d.dueAt);
      const n = new Date();
      return (
        dDate.getFullYear() === n.getFullYear() &&
        dDate.getMonth() === n.getMonth() &&
        dDate.getDate() === n.getDate()
      );
    }).length,
  };

  const contributionTrend = useMemo(() => {
    const now = new Date();
    const { start, end } = getDashboardRange(timeRange, customDateRange, now);
    return buildMonthlyTrend(departmentScoped, start, end, now);
  }, [departmentScoped, timeRange, customDateRange.start, customDateRange.end]);

  const overviewLineTrend = useMemo(() => {
    const now = new Date();
    const { start, end } = getDashboardRange(timeRange, customDateRange, now);
    if (chartGranularity === "quarter") {
      return buildQuarterlyTrend(departmentScoped, start, end, now);
    }
    if (chartGranularity === "year") {
      return buildYearlyTrend(departmentScoped, start, end, now);
    }
    return buildMonthlyTrend(departmentScoped, start, end, now);
  }, [
    departmentScoped,
    timeRange,
    customDateRange.start,
    customDateRange.end,
    chartGranularity,
  ]);

  const statusDistribution = useMemo(() => {
    const counts = {};
    departmentScoped.forEach((s) => {
      const st = normalizeWorkflowStatus(s.status);
      counts[st] = (counts[st] || 0) + 1;
    });
    const labels = Object.keys(counts).sort();
    const data = labels.map((l) => counts[l]);
    const colors = ["#2563eb", "#0ea5e9", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6"];
    return { labels, data, colors };
  }, [departmentScoped]);

  const tableRows = useMemo(() => {
    if (activeTab === "overview") return submittedToDepartment;
    if (activeTab === "escalated") return escalatedToReviewer;
    if (activeTab === "contribution") return contributionRows;
    return [];
  }, [activeTab, submittedToDepartment, escalatedToReviewer, contributionRows]);

  const queueTabConfig =
    HANDLER_QUEUE_TAB_CONFIG[activeTab] || HANDLER_QUEUE_TAB_CONFIG.overview;

  const queueDisplayCount =
    activeTab === "contribution" ? contributionFilteredRows.length : tableRows.length;

  const rowsForTable =
    activeTab === "contribution" ? contributionPagedRows : tableRows;

  const userDisplayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || "User";
  const departmentDisplayName =
    user?.department?.name || (userDepartmentUid ? deptByUid.get(userDepartmentUid) : null) || null;

  if (!canAccess) return null;

  return (
    <div className="w-100 py-4">
      <div className="d-flex justify-content-end mb-3">
        <div className="d-flex align-items-center flex-wrap gap-3 gap-md-4 justify-content-end rounded px-3 py-2 bg-body-secondary bg-opacity-25">
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="handler-dash-from" className="small text-muted mb-0 text-nowrap">
              From:
            </label>
            <input
              id="handler-dash-from"
              type="date"
              className="form-control form-control-sm bg-white border-secondary-subtle text-secondary"
              style={{ width: "9.75rem", maxWidth: "100%" }}
              value={customDateRange.start}
              onChange={(e) => {
                setCustomDateRange((p) => ({ ...p, start: e.target.value }));
                setTimeRange("custom");
              }}
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="handler-dash-to" className="small text-muted mb-0 text-nowrap">
              To:
            </label>
            <input
              id="handler-dash-to"
              type="date"
              className="form-control form-control-sm bg-white border-secondary-subtle text-secondary"
              style={{ width: "9.75rem", maxWidth: "100%" }}
              value={customDateRange.end}
              onChange={(e) => {
                setCustomDateRange((p) => ({ ...p, end: e.target.value }));
                setTimeRange("custom");
              }}
            />
          </div>
          <div className="dropdown">
            <button
              type="button"
              className="btn btn-sm bg-light text-success border border-2 border-success rounded d-inline-flex align-items-center gap-2 px-3 dropdown-toggle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bx bx-calendar" aria-hidden />
              <span className="fw-medium">
                {timeRange === "month"
                  ? "Monthly"
                  : timeRange === "quarter"
                  ? "Quarterly"
                  : timeRange === "year"
                  ? "Yearly"
                  : timeRange === "custom"
                  ? "Custom"
                  : "All time"}
              </span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button type="button" className="dropdown-item" onClick={() => setTimeRange("all")}>
                  All time
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button type="button" className="dropdown-item" onClick={() => setTimeRange("month")}>
                  Monthly
                </button>
              </li>
              <li>
                <button type="button" className="dropdown-item" onClick={() => setTimeRange("quarter")}>
                  Quarterly
                </button>
              </li>
              <li>
                <button type="button" className="dropdown-item" onClick={() => setTimeRange("year")}>
                  Yearly
                </button>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button type="button" className="dropdown-item" onClick={() => setTimeRange("custom")}>
                  Custom range
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {threadAttentionItems.length > 0 && (
        <div className="row mb-3">
          <div className="col-12">
            <MaoniThreadAttentionBanner
              items={threadAttentionItems}
              onOpenSuggestion={openSuggestionFromBanner}
            />
          </div>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="d-flex align-items-end row g-0">
              <div className="col-md-8">
                <div className="card-body">
                  <h5 className="card-title text-success text-uppercase fw-bold mb-2">
                    Welcome, {userDisplayName}!
                  </h5>
                  <p className="mb-3 text-muted">
                    Track Maoni suggestions submitted to{" "}
                    <span className="fw-medium text-body">
                      {departmentDisplayName || "your department"}
                    </span>
                    , monitor response deadlines, and review{" "}
                    <span className="fw-medium">approved</span> (closed) items — all in one place
                    {escalationDays ? ` (${escalationDays}-day escalation window).` : "."}
                  </p>
                  <div className="d-flex gap-2 flex-wrap align-items-center">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() =>
                        navigate("/ppaa-maoni/suggestions", {
                          state: userDepartmentUid ? { departmentUid: userDepartmentUid } : {},
                        })
                      }
                    >
                      <i className="bx bx-list-ul me-1" aria-hidden />
                      View all suggestions
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => setActiveTab("overview")}
                    >
                      <i className="bx bx-check-circle me-1" aria-hidden />
                      Submitted to department
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => setActiveTab("contribution")}
                    >
                      <i className="bx bx-message-square-detail me-1" aria-hidden />
                      Contributions
                      {contributionRows.length > 0 && (
                        <span className="badge bg-light text-success ms-1">{contributionRows.length}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      disabled={loading}
                      onClick={() => setRefreshTick((t) => t + 1)}
                    >
                      <i className={`bx bx-refresh me-1 ${loading ? "bx-spin" : ""}`} aria-hidden />
                      Refresh data
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center d-none d-md-block">
                <div className="card-body pb-0 pt-4 px-3">
                  <img
                    src="/assets/img/illustrations/man-with-laptop-light.png"
                    height="140"
                    alt=""
                    data-app-dark-img="illustrations/man-with-laptop-dark.png"
                    data-app-light-img="illustrations/man-with-laptop-light.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h2 className="h5 mb-0 text-body">Handler workspace</h2>
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0"
          onClick={() =>
            navigate("/ppaa-maoni/suggestions", {
              state: userDepartmentUid ? { departmentUid: userDepartmentUid } : {},
            })
          }
        >
          Open full list
        </button>
      </div>

      <div className="mb-3">
        <ul
          className="nav nav-tabs flex-nowrap flex-md-wrap mb-0 rounded-top overflow-hidden bg-body-secondary bg-opacity-50"
          role="tablist"
        >
          {HANDLER_TAB_ORDER.map((tabId) => {
            const cfg = HANDLER_QUEUE_TAB_CONFIG[tabId];
            const isActive = activeTab === tabId;
            const iconTone = ACCENT_ICON_CLASS[cfg.accent] || "text-primary";
            return (
              <li className="nav-item flex-grow-1 flex-md-grow-0" key={tabId}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`nav-link w-100 h-100 d-flex align-items-center gap-2 py-3 px-2 px-md-3 ${
                    isActive ? "active fw-semibold" : "text-secondary"
                  }`}
                  onClick={() => setActiveTab(tabId)}
                >
                  <span
                    className={`rounded-3 p-2 d-inline-flex align-items-center justify-content-center flex-shrink-0 ${
                      isActive ? "bg-white shadow-sm" : "bg-white bg-opacity-50"
                    }`}
                  >
                    <i className={`bx ${cfg.icon} fs-5 ${isActive ? iconTone : "text-muted"}`} aria-hidden />
                  </span>
                  <span className="text-start lh-sm d-none d-sm-block min-w-0">
                    <span className={`d-block small ${isActive ? "text-body" : ""}`}>{cfg.label}</span>
                    <small
                      className={`text-muted d-block ${tabId === "contribution" ? "" : "text-truncate"}`}
                      style={{
                        maxWidth: tabId === "contribution" ? "min(20rem, 32vw)" : "9rem",
                        fontSize: "0.7rem",
                        whiteSpace: tabId === "contribution" ? "normal" : undefined,
                      }}
                    >
                      {cfg.hint}
                    </small>
                  </span>
                  <span className="text-start lh-sm d-sm-none">
                    <span className={`d-block small ${isActive ? "text-body" : ""}`}>{cfg.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-xl-3 col-lg-6 col-md-6">
              <button
                type="button"
                className="card border-0 shadow-sm h-100 text-start w-100 p-0 bg-white handler-kpi-card"
                onClick={() => goToContributionKpi("department_queue")}
                aria-label="Open contributions filtered to department queue"
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="text-muted mb-1">Assigned To Department</h6>
                      <h2 className="mb-0">{overview.assigned}</h2>
                    </div>
                    <div className="p-3 rounded-circle bg-primary-subtle">
                      <i className="bx bx-buildings text-primary fs-4"></i>
                    </div>
                  </div>
                  <small className="text-muted">Department queue — click to view</small>
                </div>
              </button>
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <button
                type="button"
                className="card border-0 shadow-sm h-100 text-start w-100 p-0 bg-white handler-kpi-card"
                onClick={() => {
                  setContributionKpiFilter(null);
                  setActiveTab("escalated");
                }}
                aria-label="Open escalated suggestions tab"
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="text-muted mb-1">Escalated To Reviewer</h6>
                      <h2 className="mb-0 text-info">{overview.escalated}</h2>
                    </div>
                    <div className="p-3 rounded-circle bg-info-subtle">
                      <i className="bx bx-transfer-alt text-info fs-4"></i>
                    </div>
                  </div>
                  <small className="text-muted">Already escalated — click to view</small>
                </div>
              </button>
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <button
                type="button"
                className="card border-0 shadow-sm h-100 text-start w-100 p-0 bg-white handler-kpi-card"
                onClick={() => goToContributionKpi("due_today")}
                aria-label="Open contributions due today"
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="text-muted mb-1">Due Today</h6>
                      <h2 className="mb-0 text-warning">{overview.dueToday}</h2>
                    </div>
                    <div className="p-3 rounded-circle bg-warning-subtle">
                      <i className="bx bx-time-five text-warning fs-4"></i>
                    </div>
                  </div>
                  <small className="text-warning fw-medium">Needs attention today — click to view</small>
                </div>
              </button>
            </div>
            <div className="col-xl-3 col-lg-6 col-md-6">
              <button
                type="button"
                className="card border-0 shadow-sm h-100 text-start w-100 p-0 bg-white handler-kpi-card"
                onClick={() => goToContributionKpi("overdue")}
                aria-label="Open overdue contributions"
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="text-muted mb-1">Overdue</h6>
                      <h2 className="mb-0 text-danger">{overview.overdue}</h2>
                    </div>
                    <div className="p-3 rounded-circle bg-danger-subtle">
                      <i className="bx bx-error-circle text-danger fs-4"></i>
                    </div>
                  </div>
                  <small className="text-danger fw-medium">Past escalation window — click to view</small>
                </div>
              </button>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h5 className="mb-0">Contribution Trend</h5>
                  <div className="btn-group btn-group-sm" role="group" aria-label="Trend period">
                    <button
                      type="button"
                      className={`btn ${chartGranularity === "month" ? "btn-success" : "btn-outline-primary"}`}
                      onClick={() => setChartGranularity("month")}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      className={`btn ${chartGranularity === "quarter" ? "btn-success" : "btn-outline-primary"}`}
                      onClick={() => setChartGranularity("quarter")}
                    >
                      Quarterly
                    </button>
                    <button
                      type="button"
                      className={`btn ${chartGranularity === "year" ? "btn-success" : "btn-outline-primary"}`}
                      onClick={() => setChartGranularity("year")}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <LineChart
                    data={overviewLineTrend.data}
                    labels={overviewLineTrend.labels}
                    height={250}
                  />
                  <div className="mt-3 text-center">
                    <small className="text-muted">
                      {chartGranularity === "month" &&
                        "Contributions over time for your department (current filters)."}
                      {chartGranularity === "quarter" &&
                        "Quarterly contribution counts for your department."}
                      {chartGranularity === "year" &&
                        "Yearly contribution counts for your department."}
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0">
                  <h5 className="mb-0">Status Distribution</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-center">
                    <PieChart
                      data={statusDistribution.data}
                      labels={statusDistribution.labels}
                      colors={statusDistribution.colors}
                      size={180}
                    />
                  </div>
                  <div className="mt-3">
                    {statusDistribution.labels.map((label, i) => (
                      <div
                        key={label}
                        className="d-flex justify-content-between align-items-center mb-1"
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle me-2"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor: statusDistribution.colors[i % statusDistribution.colors.length],
                            }}
                          />
                          <small>{statusText(label)}</small>
                        </div>
                        <small className="fw-medium">{statusDistribution.data[i]}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "analytics" && (
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm h-100 overflow-hidden">
              <div className="card-header border-0 bg-primary-subtle bg-opacity-50 py-3">
                <h5 className="mb-0">Contribution trend</h5>
                <small className="text-muted">Counts by month for the selected filters</small>
              </div>
              <div className="card-body">
                <BarChart data={contributionTrend.data} labels={contributionTrend.labels} />
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100 overflow-hidden">
              <div className="card-header border-0 bg-info-subtle bg-opacity-50 py-3">
                <h5 className="mb-0">Status distribution</h5>
                <small className="text-muted">Share of each workflow status</small>
              </div>
              <div className="card-body">
                <PieChart
                  data={statusDistribution.data}
                  labels={statusDistribution.labels}
                  colors={statusDistribution.colors}
                />
                <div className="mt-3">
                  {statusDistribution.labels.map((label, i) => (
                    <div key={label} className="d-flex justify-content-between align-items-center mb-1">
                      <small className="text-muted">
                        <span
                          className="d-inline-block rounded-circle me-2"
                          style={{ width: 8, height: 8, backgroundColor: statusDistribution.colors[i % statusDistribution.colors.length] }}
                        />
                        {statusText(label)}
                      </small>
                      <small className="fw-semibold">{statusDistribution.data[i]}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "overview" && (
        <div className="row g-4 align-items-stretch mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm overflow-hidden h-100">
              <div className="card-header border-0 bg-white border-bottom py-3 px-3 px-md-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="min-w-0">
                  <h5 className="mb-1 text-body">Recent contributions</h5>
                  <p className="mb-0 small text-muted">
                    Suggestions routed to your department that still need handler attention.
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={() =>
                      navigate("/ppaa-maoni/suggestions", {
                        state: userDepartmentUid ? { departmentUid: userDepartmentUid } : {},
                      })
                    }
                  >
                    View all
                  </button>
                  <span className="badge rounded-pill bg-white text-body border shadow-sm px-3 py-2 text-uppercase small">
                    {queueDisplayCount} {queueDisplayCount === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>
              <div className="card-body p-0 d-flex flex-column">
                {loading ? (
                  <div className="text-center py-5">
                    <i className="bx bx-loader-circle bx-spin fs-1 text-primary d-block mb-2"></i>
                    <div className="text-muted">Loading handler queue…</div>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive flex-grow-1">
                      <table className="table table-hover align-middle mb-0 border-0">
                        <thead className="bg-white">
                          <tr className="small text-uppercase text-muted border-bottom">
                            <th className="ps-4 py-3 border-0 fw-semibold">Title</th>
                            <th className="py-3 border-0 fw-semibold">Category</th>
                            <th className="py-3 border-0 fw-semibold">Status</th>
                            <th className="py-3 border-0 fw-semibold">Date</th>
                            <th className="text-end pe-4 py-3 border-0 fw-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="border-0">
                          {!userDepartmentUid ? (
                            <tr>
                              <td colSpan={5} className="border-0 p-0">
                                <div className="text-center py-5 px-4">
                                  <div
                                    className="d-inline-block rounded-3 border bg-light bg-opacity-50 px-4 py-4 mx-auto text-start"
                                    style={{ maxWidth: "28rem" }}
                                  >
                                    <div className="d-flex align-items-start gap-3">
                                      <span className="rounded-circle bg-white border shadow-sm p-3 text-primary flex-shrink-0">
                                        <i className="bx bx-buildings fs-4" aria-hidden />
                                      </span>
                                      <div>
                                        <div className="fw-semibold text-body">No department assigned</div>
                                        <p className="text-muted small mb-0 mt-2">
                                          This dashboard only lists suggestions submitted to your department. Add a
                                          department to your profile to continue.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : rowsForTable.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-5 text-muted border-0">
                                <span className="fw-semibold text-body d-block">No suggestions in this view</span>
                                <small className="d-block mt-1">
                                  Try widening the date range or check back later.
                                </small>
                              </td>
                            </tr>
                          ) : (
                            rowsForTable.map((s) => {
                              const baseDate = new Date(
                                s.updated_at || s.submitted_at || s.created_at || 0
                              ).getTime();
                              const computedDueAtMs = Number.isNaN(baseDate)
                                ? null
                                : baseDate + escalationDays * 24 * 60 * 60 * 1000;
                              const dueAt = computedDueAtMs ? new Date(computedDueAtMs) : null;
                              const isOverdue = computedDueAtMs ? Date.now() > computedDueAtMs : false;
                              const author =
                                (s.submitted_by_name || s.contributor_name || "Anonymous").trim() ||
                                "Anonymous";
                              return (
                                <tr key={s.uid} className="border-bottom border-light">
                                  <td className="ps-4 py-3 border-0">
                                    <div className="d-flex gap-2 align-items-start min-w-0">
                                      <span className="rounded-3 bg-success-subtle text-success p-2 d-inline-flex flex-shrink-0">
                                        <i className="bx bx-message-dots fs-5" aria-hidden />
                                      </span>
                                      <div className="min-w-0">
                                        <div className="fw-semibold text-body text-break">{s.title}</div>
                                        <small className="text-muted d-block text-break">
                                          By: {author.toUpperCase()}
                                        </small>
                                        <small className="text-muted d-block text-truncate">
                                          {deptByUid.get(s.department_uid) || "Your department"}
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 border-0 align-middle">
                                    <span className="small text-secondary text-uppercase fw-medium">
                                      {s.category_name || "General"}
                                    </span>
                                  </td>
                                  <td className="py-3 border-0 align-middle">
                                    <span
                                      className={statusPillClass(s.status)}
                                      style={statusPillStyle(s.status)}
                                    >
                                      {statusText(s.status)}
                                    </span>
                                  </td>
                                  <td className="py-3 border-0 align-middle">
                                    <div className="small text-body">
                                      {formatDate(s.submitted_at || s.created_at)}
                                    </div>
                                    {dueAt && (
                                      <small
                                        className={`d-block mt-1 ${
                                          isOverdue ? "text-danger fw-medium" : "text-muted"
                                        }`}
                                      >
                                        Due {formatDate(dueAt.toISOString())}
                                        {isOverdue && (
                                          <span className="badge bg-danger text-white ms-1">Overdue</span>
                                        )}
                                      </small>
                                    )}
                                  </td>
                                  <td className="text-end pe-4 py-3 border-0 align-middle">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() => navigate(`/ppaa-maoni/suggestions/${s.uid}`)}
                                    >
                                      Review
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    {!loading && (
                      <div className="d-flex flex-column flex-md-row flex-md-wrap align-items-md-center justify-content-between gap-2 border-top px-3 py-2 px-md-4 bg-body-tertiary bg-opacity-25 small text-muted mt-auto">
                        <span className="d-flex align-items-start align-items-md-center gap-2">
                          <i className="bx bx-time-five mt-1 mt-md-0 flex-shrink-0" aria-hidden />
                          <span>
                            Data for: {customDateRange.start} to {customDateRange.end}
                            {lastLoadedAt && (
                              <>
                                {" "}
                                • Last updated: {formatDateTime(lastLoadedAt.toISOString())}
                              </>
                            )}
                          </span>
                        </span>
                        <span className="text-md-end">
                          Showing {userDepartmentUid ? rowsForTable.length : 0}{" "}
                          {userDepartmentUid && rowsForTable.length === 1 ? "item" : "items"} in queue
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body p-4 d-flex flex-column h-100">
                <h6 className="fw-semibold text-body mb-3">Quick Actions</h6>
                <div className="d-flex flex-column gap-3 flex-grow-1">
                  <button
                    type="button"
                    className="btn d-flex align-items-center gap-3 w-100 text-start text-white py-3 px-3 rounded-3 border-0 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #fd7e14 0%, #e8590c 100%)",
                    }}
                    onClick={() =>
                      navigate("/ppaa-maoni/suggestions", {
                        state: userDepartmentUid ? { departmentUid: userDepartmentUid } : {},
                      })
                    }
                  >
                    <span className="rounded-circle border border-2 border-white p-2 d-inline-flex align-items-center justify-content-center flex-shrink-0">
                      <i className="bx bx-time-five fs-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="fw-semibold d-block lh-sm">
                        Overdue suggestion responses that pass the escalation window
                      </span>
                      <small className="d-block opacity-90 mt-1">
                        {userDepartmentUid
                          ? `${overview.assigned} ${overview.assigned === 1 ? "item needs" : "items need"} attention in this queue.`
                          : "Assign a department to filter suggestions for your queue."}
                      </small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn d-flex align-items-center gap-3 w-100 text-start text-white py-3 px-3 rounded-3 border-0 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #198754 0%, #146c43 100%)",
                    }}
                    onClick={() => setActiveTab("contribution")}
                  >
                    <span className="rounded-circle border border-2 border-white p-2 d-inline-flex align-items-center justify-content-center flex-shrink-0">
                      <i className="bx bx-message-square-detail fs-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="fw-semibold d-block">All contributions</span>
                      <small className="d-block opacity-90">
                        {userDepartmentUid
                          ? "Browse every suggestion for your department."
                          : "Available once a department is linked to your profile."}
                      </small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn d-flex align-items-center gap-3 w-100 text-start text-white py-3 px-3 rounded-3 border-0 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg, #0dcaf0 0%, #0aa2c0 100%)",
                    }}
                    onClick={() => setActiveTab("analytics")}
                  >
                    <span className="rounded-circle border border-2 border-white p-2 d-inline-flex align-items-center justify-content-center flex-shrink-0">
                      <i className="bx bx-line-chart fs-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="fw-semibold d-block">View analytics</span>
                      <small className="d-block opacity-90">Trends and status mix for current filters.</small>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== "analytics" && activeTab !== "overview" && (
      <div className="card border-0 shadow-sm overflow-hidden">
        <div
          className={`card-header border-0 py-3 px-3 px-md-4 d-flex flex-wrap align-items-center justify-content-between gap-2 ${queueTabConfig.headerClass}`}
        >
          <div className="min-w-0">
            <h5 className="mb-1 text-body">{queueTabConfig.label}</h5>
            <p className="mb-0 small text-muted">{queueTabConfig.description}</p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
            <span className="badge rounded-pill bg-white text-body border shadow-sm px-3 py-2 text-uppercase small">
              {queueDisplayCount} {queueDisplayCount === 1 ? "item" : "items"}
            </span>
            {activeTab === "contribution" &&
              queueDisplayCount !== contributionRows.length &&
              contributionRows.length > 0 && (
                <small className="text-muted">of {contributionRows.length} in range</small>
              )}
          </div>
        </div>
        <div className="card-body p-0">
          {activeTab === "contribution" && !loading && userDepartmentUid && (
            <div className="border-bottom bg-light bg-opacity-50 px-3 px-md-4 py-3">
              {contributionKpiFilter && (
                <div className="alert alert-success border-0 py-2 px-3 mb-3 mb-md-3 d-flex flex-wrap align-items-center justify-content-between gap-2 shadow-sm">
                  <span className="small mb-0">
                    <i className="bx bx-filter-alt me-1" aria-hidden />
                    <span className="fw-semibold">KPI filter:</span>{" "}
                    {contributionKpiFilter === "department_queue" &&
                      "Department queue — open handler statuses in your department."}
                    {contributionKpiFilter === "due_today" &&
                      "Due today — escalation deadline falls on today."}
                    {contributionKpiFilter === "overdue" &&
                      "Overdue — past the escalation window for department queue items."}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success text-nowrap"
                    onClick={() => setContributionKpiFilter(null)}
                  >
                    Clear KPI filter
                  </button>
                </div>
              )}
              <div className="d-flex flex-column flex-lg-row align-items-stretch justify-content-between gap-3">
                <div className="d-flex flex-wrap align-items-end gap-2 gap-md-3">
                  <div>
                    <label htmlFor="handler-contribution-status" className="form-label small text-muted mb-1">
                      Status:
                    </label>
                    <select
                      id="handler-contribution-status"
                      className="form-select form-select-sm bg-white border-secondary-subtle text-secondary"
                      style={{ minWidth: "11rem" }}
                      value={contributionStatusFilter}
                      onChange={(e) => setContributionStatusFilter(e.target.value)}
                    >
                      <option value="">All statuses</option>
                      {contributionStatusOptions.map((st) => (
                        <option key={st} value={st}>
                          {statusText(st)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="handler-contribution-category" className="form-label small text-muted mb-1">
                      Category:
                    </label>
                    <select
                      id="handler-contribution-category"
                      className="form-select form-select-sm bg-white border-secondary-subtle text-secondary"
                      style={{ minWidth: "11rem" }}
                      value={contributionCategoryFilter}
                      onChange={(e) => setContributionCategoryFilter(e.target.value)}
                    >
                      <option value="">All categories</option>
                      {contributionCategoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary align-self-end d-inline-flex align-items-center gap-1"
                    onClick={resetContributionFilters}
                  >
                    <i className="bx bx-refresh" aria-hidden />
                    Reset all
                  </button>
                </div>
                <div className="flex-grow-1" style={{ maxWidth: "28rem", minWidth: "12rem" }}>
                  <label htmlFor="handler-contribution-search" className="form-label small text-muted mb-1">
                    Search:
                  </label>
                  <div className="position-relative">
                    <i
                      className="bx bx-search position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
                      style={{ fontSize: "1rem", pointerEvents: "none" }}
                      aria-hidden
                    />
                    <input
                      id="handler-contribution-search"
                      type="search"
                      className="form-control form-control-sm ps-4 bg-white border-secondary-subtle text-secondary"
                      placeholder="Search title, category, or status…"
                      value={contributionSearchInput}
                      onChange={(e) => setContributionSearchInput(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2 gap-md-3 mt-3">
                <label htmlFor="handler-contribution-page-size" className="form-label small text-muted mb-0">
                  Rows per page
                </label>
                <select
                  id="handler-contribution-page-size"
                  className="form-select form-select-sm bg-white border-secondary-subtle text-secondary"
                  style={{ width: "4.5rem" }}
                  value={String(contributionPageSize)}
                  onChange={(e) => setContributionPageSize(Number(e.target.value) || 10)}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          )}
          {loading ? (
            <div className="text-center py-5">
              <i className="bx bx-loader-circle bx-spin fs-1 text-primary d-block mb-2"></i>
              <div className="text-muted">Loading handler queue…</div>
            </div>
          ) : !userDepartmentUid ? (
            <div className="text-center py-5 px-3">
              <div className="fw-semibold text-body">No department assigned</div>
              <div className="text-muted small mt-1">
                This dashboard only lists suggestions submitted to your department. Add a department to your
                profile to continue.
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-uppercase text-muted">
                    <th className="ps-4 border-0">Suggestion</th>
                    <th className="border-0">Department</th>
                    <th className="border-0">Status</th>
                    <th className="border-0">Submitted</th>
                    <th className="border-0">Due</th>
                    <th className="text-end pe-4 border-0">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsForTable.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        <span className="fw-semibold text-body d-block">No suggestions in this view</span>
                        <small className="d-block mt-1">
                          {activeTab === "contribution" && contributionRows.length > 0
                            ? "No rows match your filters — try clearing status, category, or search."
                            : activeTab === "contribution"
                            ? "No suggestions were routed to your department in this date range."
                            : "Try another tab or widen the date range."}
                        </small>
                      </td>
                    </tr>
                  ) : (
                    rowsForTable.map((s) => {
                      const baseDate = new Date(
                        s.updated_at || s.submitted_at || s.created_at || 0
                      ).getTime();
                      const computedDueAtMs = Number.isNaN(baseDate)
                        ? null
                        : baseDate + escalationDays * 24 * 60 * 60 * 1000;
                      const dueAt = computedDueAtMs ? new Date(computedDueAtMs) : null;
                      const isOverdue = computedDueAtMs ? Date.now() > computedDueAtMs : false;
                      return (
                        <tr key={s.uid}>
                          <td className="ps-4">
                            <div className="min-w-0">
                              <div className="fw-semibold text-body text-break">{s.title}</div>
                              <small className="text-muted">{s.category_name || "Uncategorized"}</small>
                            </div>
                          </td>
                          <td>
                            <span className="small fw-medium text-body text-break">
                              {deptByUid.get(s.department_uid) || "Unassigned"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={statusPillClass(s.status)}
                              style={statusPillStyle(s.status)}
                            >
                              {statusText(s.status)}
                            </span>
                          </td>
                          <td>
                            <span className="text-body small">
                              {formatDate(s.submitted_at || s.created_at)}
                            </span>
                          </td>
                          <td>
                            {dueAt ? (
                              <span
                                className={`small fw-medium ${isOverdue ? "text-danger" : "text-muted"}`}
                              >
                                {formatDate(dueAt.toISOString())}
                                {isOverdue && (
                                  <span className="badge bg-danger text-white ms-2">Overdue</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="text-end pe-4">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/ppaa-maoni/suggestions/${s.uid}`)}
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "contribution" && !loading && userDepartmentUid && contributionFilteredRows.length > 0 && (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-top px-3 px-md-4 py-2 bg-body-tertiary bg-opacity-25">
              <small className="text-muted mb-0">
                Showing{" "}
                <span className="fw-medium text-body">
                  {contributionFilteredRows.length === 0
                    ? 0
                    : contributionPageIndex * contributionPageSize + 1}
                  –
                  {Math.min(
                    (contributionPageIndex + 1) * contributionPageSize,
                    contributionFilteredRows.length
                  )}
                </span>{" "}
                of {contributionFilteredRows.length}
              </small>
              {contributionPageCount > 1 && (
                <div className="btn-group btn-group-sm">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={contributionPageIndex <= 0}
                    onClick={() => setContributionPageIndex((i) => Math.max(0, i - 1))}
                  >
                    Previous
                  </button>
                  <span className="btn btn-outline-secondary disabled px-3">
                    Page {contributionPageIndex + 1} of {contributionPageCount}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={contributionPageIndex >= contributionPageCount - 1}
                    onClick={() =>
                      setContributionPageIndex((i) => Math.min(contributionPageCount - 1, i + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}
      <style>{`
        .handler-kpi-card {
          transition: box-shadow 0.18s ease, transform 0.18s ease;
          cursor: pointer;
        }
        .handler-kpi-card:hover {
          box-shadow: 0 0.4rem 1.1rem rgba(15, 23, 42, 0.12) !important;
          transform: translateY(-2px);
        }
        .handler-kpi-card:focus-visible {
          outline: 2px solid #15803d;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

export default HandlerDashboardPage;
