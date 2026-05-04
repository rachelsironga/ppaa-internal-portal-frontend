import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import "animate.css";
import { formatDate } from "../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { getAllSuggestions, getDepartments } from "../../PPAA-MAONI/Queries";
import {
  buildMonthlyTrend,
  getDashboardRange,
  inDashboardRange,
  suggestionActivityDate,
  toLocalDateString,
} from "./maoniDashboardDateRange";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { isMaoniAdmin } from "../../../../utils/maoniRoles";
import MaoniThreadAttentionBanner from "../../../../components/maoni/MaoniThreadAttentionBanner";
import {
  buildMaoniReviewerAttentionSummary,
  maoniSuggestionNeedsReviewerAttention,
} from "../../../../utils/maoniThreadAttention";
import {
  maoniUnderHandlerReviewBadgeClasses,
  getMaoniUnderHandlerReviewBadgeStyle,
} from "../../../../utils/maoniUnderHandlerReviewBadge";

// Chart components (using simple div-based charts for demo)
const BarChart = ({ data, labels, colors, height = 200 }) => {
  const safeData = Array.isArray(data) ? data : [];
  const maxValue = safeData.length ? Math.max(...safeData) : 0;

  return (
    <div className="d-flex align-items-end" style={{ height: `${height}px` }}>
      {safeData.map((value, index) => (
        <div
          key={index}
          className="d-flex flex-column align-items-center mx-1"
          style={{ flex: 1 }}
        >
          <div
            className="rounded-top"
            style={{
              width: "80%",
              height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`,
              backgroundColor: colors[index % colors.length],
              minHeight: "10px",
            }}
            title={`${labels[index]}: ${value}`}
          ></div>
          <div
            className="mt-2 text-center"
            style={{
              fontSize: "0.7rem",
              transform: "rotate(-45deg)",
              transformOrigin: "left top",
            }}
          >
            {labels[index].substring(0, 8)}
          </div>
        </div>
      ))}
    </div>
  );
};

const PieChart = ({ data, labels, colors, size = 150 }) => {
  const safeData = Array.isArray(data) ? data : [];
  const total = safeData.reduce((sum, value) => sum + (Number(value) || 0), 0);
  let cumulativePercent = 0;

  return (
    <div
      className="position-relative"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        {total <= 0 ? (
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#e9ecef"
            strokeWidth="40"
          />
        ) : (
          safeData.map((value, index) => {
          const percent = (value / total) * 100;
          const startPercent = cumulativePercent;
          cumulativePercent += percent;

          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={colors[index % colors.length]}
              strokeWidth="40"
              strokeDasharray={`${percent} ${100 - percent}`}
              strokeDashoffset={`${100 - startPercent}`}
              transform="rotate(-90 50 50)"
            />
          );
          })
        )}
      </svg>
      <div className="position-absolute top-50 start-50 translate-middle text-center">
        <div className="fw-bold">{total}</div>
        <div className="small text-muted">Total</div>
      </div>
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
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {pointCount > 1 && (
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
          />
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

export const MaoniDashboardPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const navigate = useNavigate();
  const location = useLocation();
  const [timeRange, setTimeRange] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  const isAdmin = isMaoniAdmin(user);
  const userRoles = (user?.groups || []).map((g) => String(g).toLowerCase().trim());
  const hasReviewerDashboardRole =
    userRoles.includes("maoni_reviewer") ||
    userRoles.includes("maoni_reviewe") ||
    userRoles.includes("ppaa_maoni_reviewer") ||
    userRoles.includes("hr");
  const canAccessDashboard = Boolean(
    isAdmin || user?.is_superuser || hasReviewerDashboardRole
  );

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

  const [loading, setLoading] = useState(true);
  const [allSuggestionsRaw, setAllSuggestionsRaw] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalContributions: 0,
    newThisMonth: 0,
    pendingReview: 0,
    implemented: 0,
    underConsideration: 0,
    rejected: 0,
    uniqueContributors: 0,
    avgResponseTime: "—",
    engagementRate: "—",
    satisfactionScore: "—",
  });

  // Chart data (computed from backend)
  const [contributionTrend, setContributionTrend] = useState({
    labels: [],
    data: [],
  });

  const [statusDistribution, setStatusDistribution] = useState({
    labels: ["Submitted", "Draft"],
    data: [0, 0],
    colors: ["#0d6efd", "#f59e0b"],
  });

  const [categoryDistribution, setCategoryDistribution] = useState({
    labels: [],
    data: [],
    colors: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  });

  const [departmentPerformance, setDepartmentPerformance] = useState({
    labels: [],
    data: [],
    colors: ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  });

  const [monthlyEngagement, setMonthlyEngagement] = useState({
    labels: [],
    data: [],
  });

  // Real data for contributions tab (mapped from backend)
  const [allContributions, setAllContributions] = useState([]);
  const [contribSearch, setContribSearch] = useState("");
  const [contribPage, setContribPage] = useState(1);

  const CONTRIB_PAGE_SIZE = 10;

  const visibleContributions = useMemo(() => {
    const query = (contribSearch || "").trim().toLowerCase();
    if (!query) return allContributions;
    return allContributions.filter((c) => {
      const haystack = [
        c.title,
        c.category,
        c.status,
        c.priority,
        c.submittedBy,
        c.department,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [allContributions, contribSearch]);

  const contribTotalPages = Math.max(1, Math.ceil(visibleContributions.length / CONTRIB_PAGE_SIZE));
  const contribPageClamped = Math.min(Math.max(1, contribPage), contribTotalPages);
  const visibleContributionsPaginated = useMemo(() => {
    const start = (contribPageClamped - 1) * CONTRIB_PAGE_SIZE;
    return visibleContributions.slice(start, start + CONTRIB_PAGE_SIZE);
  }, [visibleContributions, contribPageClamped]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setContribPage(1);
  }, [contribSearch]);

  // Report configuration (Reports tab) – controls which sections appear in exported PDF
  const [reportIncludeCharts, setReportIncludeCharts] = useState(true);
  const [reportIncludeDetails, setReportIncludeDetails] = useState(true);
  const [reportIncludeRecommendations, setReportIncludeRecommendations] = useState(true);
  const [lastReportGenerated, setLastReportGenerated] = useState(null);

  // When returning from suggestion detail (Back to list), open the requested tab (e.g. contributions)
  useEffect(() => {
    const tab = location?.state?.activeTab;
    if (tab && ["overview", "analytics", "contributions", "moderation", "reports"].includes(tab)) {
      setActiveTab(tab);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location?.state?.activeTab, location?.pathname, navigate]);

  // Keep the visible "From" / "To" date inputs in sync with the selected time range.
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
    // For "custom" and "all" we do NOT override the inputs.
  }, [timeRange]);

  // Access control: Executive dashboard is reviewer/admin only.
  useEffect(() => {
    if (!user) return;
    if (canAccessDashboard) return;
    if (userRoles.includes("maoni_handler")) {
      navigate("/ppaa-maoni/handler-dashboard", { replace: true });
      return;
    }
    Swal.fire({
      icon: "warning",
      title: "Access Denied",
      text: "You don't have permission to access the Maoni Management Dashboard.",
      confirmButtonText: "Go Back",
    }).then(() => navigate(-1));
  }, [user, userRoles, canAccessDashboard, navigate]);

  // Helper: extract array from API response (handles { status, message, data: [] } and other shapes)
  const extractList = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    // Backend returns { status: 8000, message: "Success", data: [...] }
    if (res.data !== undefined && Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    if (res.data && Array.isArray(res.data.results)) return res.data.results;
    if (res.results !== undefined && Array.isArray(res.results)) return res.results;
    return [];
  };

  // Load backend data and compute dashboard metrics
  useEffect(() => {
    const load = async () => {
      if (!canAccessDashboard) return;
      setLoading(true);
      let suggestions = [];
      let depts = [];
      try {
        const suggestionsRes = await getAllSuggestions();
        suggestions = extractList(suggestionsRes);
        setAllSuggestionsRaw(suggestions);
      } catch (e) {
        console.error("Failed to load Maoni suggestions:", e);
        Swal.fire({
          icon: "error",
          title: "Failed to load suggestions",
          text: "Unable to fetch Maoni suggestions. Please refresh and try again.",
        });
        setAllSuggestionsRaw([]);
      }
      try {
        const departmentsRes = await getDepartments();
        depts = extractList(departmentsRes);
        setDepartments(depts);
      } catch (e) {
        console.error("Failed to load departments:", e);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canAccessDashboard]);

  const deptByUid = useMemo(() => {
    return new Map((departments || []).map((d) => [d.uid, d]));
  }, [departments]);

  useEffect(() => {
    if (!canAccessDashboard) return;
    const suggestions = allSuggestionsRaw || [];

    // Time filtering (used by Analytics & Overview)
    const now = new Date();
    const parseDate = (s) => {
      const d = new Date(s || 0);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const { start: rangeStart, end: rangeEnd } = getDashboardRange(
      timeRange,
      customDateRange,
      now
    );
    const inRange = (s) => inDashboardRange(s, rangeStart, rangeEnd);
    const isNotDraft = (s) => normalizeWorkflowStatus(s.status) !== "DRAFT";

    // Exclude drafts from dashboard: leads/admins do not see draft suggestions
    const scoped = suggestions.filter(inRange).filter(isNotDraft);

    // Basic stats (all scoped are non-draft)
    const total = scoped.length;
    const submitted = scoped.filter((s) => {
      const st = normalizeWorkflowStatus(s.status);
      return (
        st === "SUBMITTED" ||
        st === "UNDER_HANDLER_REVIEW" ||
        st === "ESCALATED_TO_REVIEWER" ||
        st === "RETURNED_TO_HANDLER" ||
        st === "HANDLER_RESPONDED_TO_REVIEWER"
      );
    }).length;
    const drafts = 0;

    const contributorIds = new Set(
      scoped.map((s) => s.submitted_by_id).filter((x) => x != null)
    );

    // New this month: within current KPI set (scoped), activity in current calendar month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = scoped.filter((s) => {
      const d = suggestionActivityDate(s);
      return d && d >= monthStart && d <= now;
    }).length;

    setDashboardStats((prev) => ({
      ...prev,
      totalContributions: total,
      newThisMonth,
      pendingReview: 0,
      implemented: 0,
      underConsideration: 0,
      rejected: 0,
      uniqueContributors: contributorIds.size,
      engagementRate: total > 0 ? `${Math.round((contributorIds.size / total) * 100)}%` : "0%",
    }));

    // Status distribution (Submitted vs Draft)
    setStatusDistribution((prev) => ({
      ...prev,
      data: [submitted, drafts],
    }));

    // Category distribution (top 5 by category_name)
    const byCategory = new Map();
    for (const s of scoped) {
      const name = s.category_name || "Uncategorized";
      byCategory.set(name, (byCategory.get(name) || 0) + 1);
    }
    const topCats = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    setCategoryDistribution((prev) => ({
      ...prev,
      labels: topCats.map(([k]) => k),
      data: topCats.map(([, v]) => v),
    }));

    // Department performance (top 5 by count)
    const byDept = new Map();
    for (const s of scoped) {
      const deptName = s.department_uid
        ? deptByUid.get(s.department_uid)?.name || "Unknown"
        : "—";
      byDept.set(deptName, (byDept.get(deptName) || 0) + 1);
    }
    const topDepts = Array.from(byDept.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    setDepartmentPerformance((prev) => ({
      ...prev,
      labels: topDepts.map(([k]) => k),
      data: topDepts.map(([, v]) => v),
    }));

    const trend = buildMonthlyTrend(scoped, rangeStart, rangeEnd, now);
    setContributionTrend({ labels: trend.labels, data: trend.data });
    setMonthlyEngagement({ labels: trend.labels, data: trend.data });

    // Contributions table data (map + sort)
    const mapped = scoped
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((s) => ({
        id: s.uid,
        title: s.title,
        category: s.category_name || "Uncategorized",
        status: String(s.status || "").toLowerCase(),
        date: s.submitted_at || s.created_at,
        submittedBy: s.submitted_by_name || "Anonymous",
        votes: 0,
        comments: s.comment_count || 0,
        priority: String(s.priority || "MEDIUM").toLowerCase(),
        lastAction: s.updated_at ? formatDate(s.updated_at, "DD/MM/YYYY") : "—",
        department: s.department_uid
          ? deptByUid.get(s.department_uid)?.name || "Unknown"
          : "—",
        description: s.description || "",
      }));
    setAllContributions(mapped);

    // Department stats table (based on scoped data)
    const deptAgg = new Map();
    for (const s of scoped) {
      const name = s.department_uid
        ? deptByUid.get(s.department_uid)?.name || "Unknown"
        : "—";
      const key = name;
      const entry = deptAgg.get(key) || { name: key, contributions: 0, submitted: 0, drafts: 0 };
      entry.contributions += 1;
      const st = String(s.status || "").toUpperCase();
      if (st === "DRAFT") entry.drafts += 1;
      else entry.submitted += 1;
      deptAgg.set(key, entry);
    }
    const deptRows = Array.from(deptAgg.values())
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 10)
      .map((d) => ({
        ...d,
        submitRate: d.contributions > 0 ? Math.round((d.submitted / d.contributions) * 100) : 0,
      }));
    setDepartmentStats(deptRows);

    // Top contributors (based on submitted_by_id)
    const contributorAgg = new Map();
    for (const s of scoped) {
      const id = s.submitted_by_id != null ? String(s.submitted_by_id) : "anonymous";
      const name = s.submitted_by_name || "Anonymous";
      const key = `${id}`;
      const entry = contributorAgg.get(key) || {
        id: key,
        name,
        contributions: 0,
        submitted: 0,
        drafts: 0,
        lastContribution: null,
      };
      entry.contributions += 1;
      const st = String(s.status || "").toUpperCase();
      if (st === "DRAFT") entry.drafts += 1;
      else entry.submitted += 1;
      const d = parseDate(s.created_at || s.submitted_at || s.updated_at);
      if (d && (!entry.lastContribution || d > entry.lastContribution)) {
        entry.lastContribution = d;
      }
      contributorAgg.set(key, entry);
    }
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const top = Array.from(contributorAgg.values())
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 10)
      .map((c) => ({
        displayName: c.name || c.id,
        submittedById: c.id !== "anonymous" ? c.id : null,
        contributions: c.contributions,
        implemented: 0,
        successRate: c.contributions > 0 ? Math.round((c.submitted / c.contributions) * 100) : 0,
        avgRating: null,
        lastContribution: c.lastContribution ? c.lastContribution.toISOString() : null,
        active: c.lastContribution ? c.lastContribution >= thirtyDaysAgo : false,
      }));
    setTopContributors(top);

    // Moderation queue (latest submitted, top 5 by newest)
    const moderation = scoped
      .filter((s) => normalizeWorkflowStatus(s.status) === "UNDER_HANDLER_REVIEW")
      .slice()
      .sort(
        (a, b) =>
          new Date(b.submitted_at || b.created_at) -
          new Date(a.submitted_at || a.created_at)
      )
      .slice(0, 10)
      .map((s) => {
        const created = parseDate(s.submitted_at || s.created_at) || now;
        const ageHours = Math.round((now - created) / (1000 * 60 * 60));
        const urgency = ageHours >= 72 ? "Overdue" : ageHours >= 24 ? "Normal" : "New";
        return {
          id: s.uid,
          title: s.title,
          category: s.category_name || "Uncategorized",
          date: s.submitted_at || s.created_at,
          submittedBy: s.submitted_by_name || "Anonymous",
          priority: String(s.priority || "medium").toLowerCase(),
          urgency,
          flags: [String(s.priority || "MEDIUM").toUpperCase(), urgency],
          reviewTime: `${ageHours}h`,
        };
      });
    setModerationQueue(moderation);
  }, [allSuggestionsRaw, canAccessDashboard, deptByUid, timeRange, customDateRange.start, customDateRange.end]);

  const [topContributors, setTopContributors] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([]);

  // Moderation stats derived from queue (backend only has SUBMITTED/DRAFT; no approve/reject yet)
  const moderationStats = useMemo(() => {
    const total = moderationQueue.length;
    const high = moderationQueue.filter((i) => (i.priority || "").toLowerCase() === "high").length;
    const medium = moderationQueue.filter((i) => (i.priority || "").toLowerCase() === "medium").length;
    const low = moderationQueue.filter((i) => (i.priority || "").toLowerCase() === "low").length;
    const urgent = moderationQueue.filter((i) => (i.priority || "").toLowerCase() === "urgent").length;
    const highTotal = high + urgent;
    return {
      pending: total,
      high: highTotal,
      medium,
      low,
      highPct: total > 0 ? Math.round((highTotal / total) * 100) : 0,
      mediumPct: total > 0 ? Math.round((medium / total) * 100) : 0,
      lowPct: total > 0 ? Math.round((low / total) * 100) : 0,
    };
  }, [moderationQueue]);

  const [systemSettings, setSystemSettings] = useState({
    anonymity: true,
    moderationRequired: true,
    votingEnabled: true,
    commentsEnabled: true,
    categories: [
      "HR Processes",
      "ICT Infrastructure",
      "Work Environment",
      "Administration",
      "Employee Welfare",
    ],
    responseDeadline: 7,
    autoArchiveDays: 90,
    notificationSettings: {
      newSubmission: true,
      statusChange: true,
      moderationAlert: true,
      weeklyDigest: true,
    },
  });

  const getStatusBadgeClass = (status) => {
    const s = String(normalizeWorkflowStatus(status) || "").toLowerCase();
    switch (s) {
      case "submitted":
        return "bg-primary-subtle text-primary border-primary";
      case "under_handler_review":
        return maoniUnderHandlerReviewBadgeClasses;
      case "returned_to_handler":
      case "handler_responded_to_reviewer":
        return "bg-warning-subtle text-warning border-warning";
      case "escalated_to_reviewer":
        return "bg-info-subtle text-info border-info";
      case "closed_approved":
        return "bg-success-subtle text-success border-success";
      case "closed_rejected":
        return "bg-danger-subtle text-danger border-danger";
      case "draft":
        return "bg-warning-subtle text-warning border-warning";
      default:
        return "bg-secondary-subtle text-secondary border-secondary";
    }
  };

  const getStatusBadgeStyle = (status) => {
    const s = String(normalizeWorkflowStatus(status) || "").toLowerCase();
    if (s === "under_handler_review") {
      return getMaoniUnderHandlerReviewBadgeStyle();
    }
    return undefined;
  };

  const getStatusText = (status) => {
    const s = String(normalizeWorkflowStatus(status) || "").toLowerCase();
    switch (s) {
      case "submitted":
        return "Submitted";
      case "under_handler_review":
        return "Under Handler Review";
      case "escalated_to_reviewer":
        return "Escalated to Reviewer";
      case "returned_to_handler":
        return "Returned to Handler";
      case "handler_responded_to_reviewer":
        return "Handler Responded to Reviewer";
      case "handler_responded_to_contributor":
        return "Handler Responded to Contributor";
      case "closed_approved":
        return "Closed - Approved";
      case "closed_rejected":
        return "Closed - Rejected";
      case "draft":
        return "Draft";
      default:
        return String(status || "").replaceAll("_", " ").toUpperCase();
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <span className="badge bg-danger">High</span>;
      case "medium":
        return <span className="badge bg-warning">Medium</span>;
      case "low":
        return <span className="badge bg-secondary">Low</span>;
      default:
        return <span className="badge bg-light text-dark">{priority}</span>;
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "New":
        return <span className="badge bg-primary">New</span>;
      case "Overdue":
        return <span className="badge bg-danger">Overdue</span>;
      case "Normal":
        return <span className="badge bg-secondary">Normal</span>;
      default:
        return <span className="badge bg-light text-dark">{urgency}</span>;
    }
  };

  // Export only the Top Contributors list as a PDF table
  const handleExportTopContributors = () => {
    try {
      if (!topContributors || topContributors.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No data to export",
          text: "There are no top contributors to export for the selected period.",
        });
        return;
      }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 14;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Maoni Top Contributors List", pageWidth / 2, y, { align: "center" });
      y += 10;

      // Period and generated time
      const rangeLabel =
        timeRange === "month"
          ? "This Month"
          : timeRange === "quarter"
          ? "This Quarter"
          : timeRange === "year"
          ? "This Year"
          : timeRange === "all"
          ? "All time"
          : "Custom";
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Period: ${rangeLabel} (${customDateRange.start} to ${customDateRange.end})`,
        14,
        y
      );
      y += 6;
      doc.text(
        `Generated: ${formatDate(new Date().toISOString(), "DD/MM/YYYY HH:mm")}`,
        14,
        y
      );
      y += 10;

      // Table
      const body = topContributors.map((c) => {
        const submittedCount = Math.round(
          (c.contributions * (c.successRate || 0)) / 100
        );
        return [
          c.displayName || "—",
          String(c.contributions ?? "0"),
          String(submittedCount ?? "0"),
          `${c.successRate || 0}%`,
          c.lastContribution ? formatDate(c.lastContribution, "DD/MM/YY") : "—",
          c.active ? "Active" : "Inactive",
        ];
      });

      doc.autoTable({
        startY: y,
        head: [
          [
            "Contributor",
            "Total Contributions",
            "Submitted",
            "Success Rate",
            "Last Active",
            "Status",
          ],
        ],
        body,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [13, 110, 253] },
        columnStyles: {
          0: { cellWidth: 55 }, // Contributor
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
          5: { cellWidth: 25 },
        },
        margin: { left: 14 },
      });

      const fileName = `maoni-top-contributors-${formatDate(
      new Date().toISOString(),
      "YYYY-MM-DD"
      )}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: "success",
        title: "Top contributors exported",
        text: "The top contributors list has been downloaded as PDF.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Top contributors PDF export error:", err);
      Swal.fire({
        icon: "error",
        title: "Export failed",
        text: err?.message || "Could not generate the top contributors PDF.",
      });
    }
  };

  const handleExportData = (options = {}) => {
    let includeCharts = options.includeCharts ?? reportIncludeCharts;
    let includeDetails = options.includeDetails ?? reportIncludeDetails;
    let includeRecommendations = options.includeRecommendations ?? reportIncludeRecommendations;
    if (!includeCharts && !includeDetails && !includeRecommendations) {
      Swal.fire({
        icon: "info",
        title: "Select sections",
        text: "Include at least one section (Key Statistics, Detailed list, or Recommendations) for the report.",
      });
      return;
    }

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 14;

      const rangeLabel =
        timeRange === "month"
          ? "This Month"
          : timeRange === "quarter"
          ? "This Quarter"
          : timeRange === "year"
          ? "This Year"
          : timeRange === "all"
          ? "All time"
          : "Custom";

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Maoni Management Report", pageWidth / 2, y, { align: "center" });
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Period: ${rangeLabel} (${customDateRange.start} to ${customDateRange.end})`,
        14,
        y
      );
      y += 6;
      doc.text(
        `Generated: ${formatDate(new Date().toISOString(), "DD/MM/YYYY HH:mm")}`,
        14,
        y
      );
      y += 12;

      if (includeCharts) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Key Statistics", 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Total Contributions: ${dashboardStats.totalContributions}`, 14, y);
        y += 6;
        doc.text(`New This Month: ${dashboardStats.newThisMonth}`, 14, y);
        y += 6;
        doc.text(`Unique Contributors: ${dashboardStats.uniqueContributors}`, 14, y);
        y += 6;
        doc.text(`Engagement Rate: ${dashboardStats.engagementRate}`, 14, y);
        y += 14;
      }

      if (includeDetails) {
        if (y > 240) {
          doc.addPage();
          y = 14;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("All Contributions", 14, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const contribRows = allContributions.length
          ? allContributions.map((c) => [
              c.title || "—",
              c.category || "—",
              c.status || "—",
              formatDate(c.date, "DD/MM/YY"),
              c.submittedBy || "—",
            ])
          : [["No contributions in this period.", "—", "—", "—", "—"]];
        doc.autoTable({
          startY: y,
          head: [["Title", "Category", "Status", "Date", "Submitted By"]],
          body: contribRows,
          theme: "grid",
          styles: { fontSize: 8 },
          headStyles: { fillColor: [13, 110, 253] },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 28 },
            2: { cellWidth: 22 },
            3: { cellWidth: 22 },
            4: { cellWidth: 28 },
          },
          margin: { left: 14 },
        });
        y = doc.lastAutoTable.finalY + 12;

        if (y > 240) {
          doc.addPage();
          y = 14;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Top Contributors", 14, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const topRows = topContributors.slice(0, 10).map((t) => [
          t.displayName || "—",
          t.contributions,
          `${t.successRate || 0}%`,
          t.lastContribution ? formatDate(t.lastContribution, "DD/MM/YY") : "—",
        ]);
        doc.autoTable({
          startY: y,
          head: [["Name", "Contributions", "Success Rate", "Last Active"]],
          body: topRows.length ? topRows : [["No data"]],
          theme: "grid",
          styles: { fontSize: 9 },
          headStyles: { fillColor: [13, 110, 253] },
        });
        y = doc.lastAutoTable.finalY + 12;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Department Summary", 14, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        const deptRows = departmentStats.slice(0, 10).map((d) => [
          d.name || "—",
          d.contributions,
          d.submitted,
          d.drafts,
          `${d.submitRate || 0}%`,
        ]);
        doc.autoTable({
          startY: y,
          head: [["Department", "Total", "Submitted", "Drafts", "Submit Rate"]],
          body: deptRows.length ? deptRows : [["No data"]],
          theme: "grid",
          styles: { fontSize: 9 },
          headStyles: { fillColor: [13, 110, 253] },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      if (includeRecommendations) {
        if (y > 250) {
          doc.addPage();
          y = 14;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Recommendations", 14, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const bullets = [];
        if (moderationQueue.length > 0) {
          bullets.push(`• Review ${moderationQueue.length} item(s) in the Moderation queue.`);
        }
        if (dashboardStats.totalContributions > 0) {
          bullets.push(`• Engagement rate this period: ${dashboardStats.engagementRate}.`);
        }
        bullets.push("• Use the Suggestions detail page to reply to contributors.");
        bullets.push("• Export this report regularly for records.");
        bullets.forEach((line) => {
          if (y > 270) {
            doc.addPage();
            y = 14;
          }
          doc.text(line, 14, y);
          y += 6;
        });
      }

      const fileName = `maoni-report-${formatDate(new Date().toISOString(), "YYYY-MM-DD")}.pdf`;
      doc.save(fileName);
      setLastReportGenerated({
        name: options.reportName || "Custom Report",
        type: options.reportName || "Custom",
        range: `${customDateRange.start} to ${customDateRange.end}`,
        generated: new Date().toISOString(),
      });
      Swal.fire({
        icon: "success",
        title: "Report exported",
        text: `PDF (${rangeLabel}) downloaded. Data from current Maoni backend.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("PDF export error:", err);
      Swal.fire({
        icon: "error",
        title: "Export failed",
        text: err?.message || "Could not generate PDF. Please try again.",
      });
    }
  };

  const handleGenerateReport = (type = "detailed") => {
    const presets = {
      detailed: {
        includeCharts: true,
        includeDetails: true,
        includeRecommendations: true,
        reportName: "Detailed Analytics Report",
      },
      executive: {
        includeCharts: true,
        includeDetails: false,
        includeRecommendations: true,
        reportName: "Executive Summary",
      },
      operational: {
        includeCharts: true,
        includeDetails: true,
        includeRecommendations: true,
        reportName: "Operational Report",
      },
    };
    const preset = presets[type] || presets.detailed;
    handleExportData(preset);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case "review_pending":
        navigate("/mnh-connect/admin/maoni/pending");
        break;
      case "add_category":
        navigate("/mnh-connect/admin/maoni/categories/new");
        break;
      case "generate_report":
        handleExportData();
        break;
      case "settings":
        navigate("/mnh-connect/admin/maoni/settings");
        break;
      case "view_analytics":
        setActiveTab("analytics");
        break;
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setCustomDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Switch to custom when either date changes so getRange() uses customDateRange
      setTimeRange("custom");
  };

  const handleModerationBulkAction = (action) => {
    Swal.fire({
      icon: "info",
      title: "Review individually",
      text:
        action === "approve"
          ? "Backend currently supports DRAFT and SUBMITTED only. Use 'Review' on each row to open the suggestion and reply. Approve/reject status can be added when the backend supports it."
          : "Use 'Review' on each row to open the suggestion. Reject/approve status will be available when the backend adds those statuses.",
    });
  };

  const currentUserId = user?.id ?? user?.user_id ?? user?.pk ?? null;

  const reviewerAttentionItems = useMemo(() => {
    if (currentUserId == null || !canAccessDashboard) return [];
    const raw = allSuggestionsRaw || [];
    return raw
      .filter((s) => maoniSuggestionNeedsReviewerAttention(s, currentUserId))
      .sort(
        (a, b) =>
          new Date(b.last_comment_at || b.updated_at || 0) -
          new Date(a.last_comment_at || a.updated_at || 0)
      );
  }, [allSuggestionsRaw, currentUserId, canAccessDashboard]);

  const reviewerAttentionSig = useMemo(
    () =>
      reviewerAttentionItems
        .map((s) => `${String(s.uid)}:${String(s.last_comment_at || "")}:${String(s.updated_at || "")}`)
        .join("|"),
    [reviewerAttentionItems]
  );

  const reviewerAttentionInitRef = useRef(false);
  const reviewerAttentionPrevSigRef = useRef("");

  useEffect(() => {
    if (!canAccessDashboard || loading) return;
    if (!reviewerAttentionInitRef.current) {
      reviewerAttentionInitRef.current = true;
      reviewerAttentionPrevSigRef.current = reviewerAttentionSig;
      return;
    }
    if (
      reviewerAttentionItems.length > 0 &&
      reviewerAttentionSig !== reviewerAttentionPrevSigRef.current
    ) {
      const n = reviewerAttentionItems.length;
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: n === 1 ? "New Maoni message for you" : `${n} new Maoni messages`,
        text: "Someone posted in a suggestion that needs your review.",
        showConfirmButton: true,
        confirmButtonText: "Open latest",
        showCancelButton: true,
        cancelButtonText: "Dismiss",
        timer: 20000,
        timerProgressBar: true,
      }).then((res) => {
        if (!res.isConfirmed) return;
        const uid = reviewerAttentionItems[0]?.uid;
        if (uid) {
          navigate(`/ppaa-maoni/suggestions/${uid}`, {
            state: { fromDashboard: true, returnTab: activeTab },
          });
        }
      });
    }
    reviewerAttentionPrevSigRef.current = reviewerAttentionSig;
  }, [
    reviewerAttentionSig,
    reviewerAttentionItems,
    canAccessDashboard,
    loading,
    navigate,
    activeTab,
  ]);

  useEffect(() => {
    if (!canAccessDashboard) return;
    const id = window.setInterval(async () => {
      try {
        const suggestionsRes = await getAllSuggestions();
        const list = extractList(suggestionsRes);
        setAllSuggestionsRaw(list);
      } catch {
        /* keep existing data */
      }
    }, 90_000);
    return () => window.clearInterval(id);
  }, [canAccessDashboard]);

  // ✅ Important: do NOT return early before hooks above have been declared.
  // Access control: Maoni leads, admins, superusers
  if (!canAccessDashboard) {
    return null;
  }

  // Loading UI while we fetch backend suggestions for analytics
  if (loading) {
    return (
      <div className="w-100 py-4">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-5 text-center">
            <i className="bx bx-loader-circle bx-spin fs-1 text-primary mb-3"></i>
            <h5 className="mb-1">Loading dashboard...</h5>
            <p className="text-muted mb-0">
              Fetching Maoni analytics from the system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-100 py-4">
      {/* Dashboard Header */}
      <div className="row align-items-center mb-6">
        <div className="col-lg-6 col-md-6 mb-4 mb-md-0">
          <div className="d-flex align-items-center mb-3">
            <div className="me-3">
              <i className="bx bx-bar-chart-alt-2 text-primary fs-1"></i>
            </div>
            <div>
              <h1 className="h2 mb-1">Maoni Management Dashboard</h1>
              <p className="text-muted mb-0">
                Analytics and administration for employee suggestions system
              </p>
            </div>
          </div>
        </div>

        <div className="col-lg-6 col-md-6">
          <div className="d-flex flex-wrap gap-2 justify-content-end">
            {/* Date Range Filter */}
            <div className="d-flex align-items-center gap-2 me-3">
              <small className="text-muted">From:</small>
              <input
                type="date"
                name="start"
                value={customDateRange.start}
                onChange={handleDateRangeChange}
                className="form-control form-control-sm"
                style={{ width: "130px" }}
              />
              <small className="text-muted">To:</small>
              <input
                type="date"
                name="end"
                value={customDateRange.end}
                onChange={handleDateRangeChange}
                className="form-control form-control-sm"
                style={{ width: "130px" }}
              />
            </div>

            {/* Time Range Dropdown */}
            <div className="dropdown me-2">
              <button
                className="btn btn-outline-primary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bx bx-calendar me-2"></i>
                {timeRange === "month"
                  ? "This Month"
                  : timeRange === "quarter"
                  ? "This Quarter"
                  : timeRange === "year"
                  ? "This Year"
                  : timeRange === "all"
                  ? "All time"
                  : "Custom"}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => setTimeRange("all")}
                  >
                    All time
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => setTimeRange("month")}
                  >
                    This Month
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => setTimeRange("quarter")}
                  >
                    This Quarter
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => setTimeRange("year")}
                  >
                    This Year
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => setTimeRange("custom")}
                  >
                    Custom Range
                  </button>
                </li>
              </ul>
            </div>

            {/* Export Button */}
            <button onClick={handleExportData} className="btn btn-primary">
              <i className="bx bx-download me-2"></i>
              Export Report
            </button>
          </div>
        </div>
      </div>

      {reviewerAttentionItems.length > 0 && (
        <div className="row mb-3">
          <div className="col-12">
            <MaoniThreadAttentionBanner
              items={reviewerAttentionItems}
              onOpenSuggestion={(uid) =>
                navigate(`/ppaa-maoni/suggestions/${uid}`, {
                  state: { fromDashboard: true, returnTab: activeTab },
                })
              }
              title="New messages for your review"
              summary={buildMaoniReviewerAttentionSummary(reviewerAttentionItems.length)}
              overflowNote={
                reviewerAttentionItems.length > 6
                  ? `+${reviewerAttentionItems.length - 6} more — open All Contributions or the suggestions list.`
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-tabs nav-tabs-bordered">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "overview" ? "active" : ""
                }`}
                onClick={() => setActiveTab("overview")}
              >
                <i className="bx bx-home me-2"></i>
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "analytics" ? "active" : ""
                }`}
                onClick={() => setActiveTab("analytics")}
              >
                <i className="bx bx-bar-chart me-2"></i>
                Analytics & Charts
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "contributions" ? "active" : ""
                }`}
                onClick={() => setActiveTab("contributions")}
              >
                <i className="bx bx-message-rounded me-2"></i>
                All Contributions ({allContributions.length})
              </button>
            </li>
            {/* <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "moderation" ? "active" : ""
                }`}
                onClick={() => setActiveTab("moderation")}
              >
                <i className="bx bx-check-shield me-2"></i>
                Moderation
                <span className="badge bg-danger ms-2">
                  {moderationQueue.length}
                </span>
              </button>
            </li> */}
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "reports" ? "active" : ""
                }`}
                onClick={() => setActiveTab("reports")}
              >
                <i className="bx bx-file me-2"></i>
                Reports
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Key Metrics */}
          <div className="row mb-4 g-3">
            <div className="col-xl-3 col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-1">Total Contributions</h6>
                      <h2 className="mb-0">
                        {dashboardStats.totalContributions}
                      </h2>
                    </div>
                    <div className="p-3 rounded-circle bg-primary-subtle">
                      <i className="bx bx-message-rounded text-primary fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="badge bg-success">
                      <i className="bx bx-up-arrow-alt me-1"></i>
                      {dashboardStats.newThisMonth} new this month
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-1">Engagement Rate</h6>
                      <h2 className="mb-0 text-info">
                        {dashboardStats.engagementRate}
                      </h2>
                    </div>
                    <div className="p-3 rounded-circle bg-info-subtle">
                      <i className="bx bx-trending-up text-info fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      {dashboardStats.uniqueContributors} unique contributors
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-1">Implementation Rate</h6>
                      <h2 className="mb-0 text-success">
                        {(
                          (dashboardStats.implemented /
                            dashboardStats.totalContributions) *
                          100
                        ).toFixed(1)}
                        %
                      </h2>
                    </div>
                    <div className="p-3 rounded-circle bg-success-subtle">
                      <i className="bx bx-check-circle text-success fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      {dashboardStats.implemented} implemented suggestions
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-1">Avg. Response Time</h6>
                      <h2 className="mb-0 text-warning">
                        {dashboardStats.avgResponseTime} days
                      </h2>
                    </div>
                    <div className="p-3 rounded-circle bg-warning-subtle">
                      <i className="bx bx-time text-warning fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <small className="text-muted">
                      {dashboardStats.pendingReview} pending review
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="row g-4 mb-4">
            {/* Contribution Trend Chart */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Contribution Trend</h5>
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-primary active">
                      Monthly
                    </button>
                    <button className="btn btn-outline-primary">
                      Quarterly
                    </button>
                    <button className="btn btn-outline-primary">Yearly</button>
                  </div>
                </div>
                <div className="card-body">
                  <LineChart
                    data={contributionTrend.data}
                    labels={contributionTrend.labels}
                    height={250}
                  />
                  <div className="mt-3 text-center">
                    <small className="text-muted">
                      Monthly contributions showing seasonal trends
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Distribution Pie Chart */}
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
                    {statusDistribution.labels.map((label, index) => (
                      <div
                        key={index}
                        className="d-flex justify-content-between align-items-center mb-1"
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className="rounded-circle me-2"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor: statusDistribution.colors[index],
                            }}
                          ></div>
                          <small>{label}</small>
                        </div>
                        <small className="fw-medium">
                          {statusDistribution.data[index]}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="row g-4">
            {/* Recent Contributions Table */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Contributions</h5>
                  <button
                    onClick={() => setActiveTab("contributions")}
                    className="btn btn-sm btn-outline-primary"
                  >
                    View All
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allContributions.slice(0, 5).map((contribution) => (
                          <tr key={contribution.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="me-2">
                                  <i className="bx bx-message-rounded text-muted"></i>
                                </div>
                                <div>
                                  <div className="fw-medium">
                                    {contribution.title}
                                  </div>
                                  <small className="text-muted">
                                    By: {contribution.submittedBy}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark">
                                {contribution.category}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${getStatusBadgeClass(
                                  contribution.status
                                )}`}
                                style={getStatusBadgeStyle(contribution.status)}
                              >
                                {getStatusText(contribution.status)}
                              </span>
                            </td>
                            <td>
                              <small>
                                {formatDate(contribution.date, "DD/MM/YY")}
                              </small>
                            </td>
                            <td>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/ppaa-maoni/suggestions/${contribution.id}`,
                                    { state: { fromDashboard: true, returnTab: "contributions" } }
                                  )
                                }
                                className="btn btn-sm btn-outline-primary"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0">
                  <h5 className="mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-3">
                    <button
                      onClick={() => handleQuickAction("review_pending")}
                      className="btn btn-warning d-flex align-items-center justify-content-start p-3 text-start"
                    >
                      <div className="p-2 bg-warning-subtle rounded-circle me-3">
                        <i className="bx bx-time text-warning"></i>
                      </div>
                      <div>
                        <div className="fw-medium">Review Pending</div>
                        <small className="text-muted">
                          {dashboardStats.pendingReview} items need attention
                        </small>
                      </div>
                    </button>

                    <button
                      onClick={() => handleQuickAction("generate_report")}
                      className="btn btn-primary d-flex align-items-center justify-content-start p-3 text-start"
                    >
                      <div className="p-2 bg-primary-subtle rounded-circle me-3">
                        <i className="bx bx-bar-chart text-primary"></i>
                      </div>
                      <div>
                        <div className="fw-medium">Generate Report</div>
                        <small className="text-muted">
                          Create detailed analytics report
                        </small>
                      </div>
                    </button>

                    <button
                      onClick={() => handleQuickAction("view_analytics")}
                      className="btn btn-info d-flex align-items-center justify-content-start p-3 text-start"
                    >
                      <div className="p-2 bg-info-subtle rounded-circle me-3">
                        <i className="bx bx-line-chart text-info"></i>
                      </div>
                      <div>
                        <div className="fw-medium">View Analytics</div>
                        <small className="text-muted">
                          Detailed charts and insights
                        </small>
                      </div>
                    </button>

           
                      </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === "analytics" && (
        <div className="row g-4">
          {/* Category Analysis */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">Contributions by Category</h5>
              </div>
              <div className="card-body">
                <BarChart
                  data={categoryDistribution.data}
                  labels={categoryDistribution.labels}
                  colors={categoryDistribution.colors}
                  height={200}
                />
                <div className="mt-4">
                  {categoryDistribution.labels.map((label, index) => (
                    <div
                      key={index}
                      className="d-flex justify-content-between align-items-center mb-2"
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle me-2"
                          style={{
                            width: "12px",
                            height: "12px",
                            backgroundColor: categoryDistribution.colors[index],
                          }}
                        ></div>
                        <span>{label}</span>
                      </div>
                      <div>
                        <span className="fw-medium me-2">
                          {categoryDistribution.data[index]}
                        </span>
                        <small className="text-muted">
                          (
                          {(
                            (categoryDistribution.data[index] /
                              dashboardStats.totalContributions) *
                            100
                          ).toFixed(1)}
                          %)
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Department Performance */}
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">Department Contribution Summary</h5>
              </div>
              <div className="card-body">
                <BarChart
                  data={departmentPerformance.data}
                  labels={departmentPerformance.labels}
                  colors={departmentPerformance.colors}
                  height={200}
                />
                <div className="mt-4">
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th className="text-center">Contributions</th>
                          <th className="text-center">Submitted</th>
                          <th className="text-center">Drafts</th>
                          <th className="text-center">Submit Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentStats.map((dept, index) => (
                          <tr key={dept.name}>
                            <td>{dept.name}</td>
                            <td className="text-center">
                              {dept.contributions}
                            </td>
                            <td className="text-center">
                              <span className="badge bg-primary">
                                {dept.submitted}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-warning">
                                {dept.drafts}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark">
                                {dept.submitRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Engagement Trend */}
          <div className="col-lg-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">Monthly Engagement Trend</h5>
              </div>
              <div className="card-body">
                <LineChart
                  data={monthlyEngagement.data}
                  labels={monthlyEngagement.labels}
                  color="#10b981"
                  height={150}
                />
                <div className="row mt-4">
                  <div className="col-md-3 text-center">
                    <div className="p-3 bg-light rounded">
                      <div className="h4 mb-0">
                        {dashboardStats.engagementRate}
                      </div>
                      <small className="text-muted">Overall Engagement</small>
                    </div>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="p-3 bg-light rounded">
                      <div className="h4 mb-0">
                        {dashboardStats.uniqueContributors}
                      </div>
                      <small className="text-muted">Active Contributors</small>
                    </div>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="p-3 bg-light rounded">
                      <div className="h4 mb-0">
                        {dashboardStats.satisfactionScore}/5
                      </div>
                      <small className="text-muted">Satisfaction Score</small>
                    </div>
                  </div>
                  <div className="col-md-3 text-center">
                    <div className="p-3 bg-light rounded">
                      <div className="h4 mb-0">
                        {dashboardStats.avgResponseTime} days
                      </div>
                      <small className="text-muted">Avg Response Time</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Contributors Analysis */}
          <div className="col-lg-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Top Contributors Analysis</h5>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleExportTopContributors}
                  disabled={!topContributors || topContributors.length === 0}
                  title={
                    !topContributors || topContributors.length === 0
                      ? "No data to export"
                      : "Download top contributors as PDF"
                  }
                >
                  <i className="bx bx-download me-1"></i>
                  Export List
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Contributor ID</th>
                        <th className="text-center">Total Contributions</th>
                        <th className="text-center">Submitted</th>
                        <th className="text-center">Success Rate</th>
                        <th className="text-center">Avg. Rating</th>
                        <th className="text-center">Last Active</th>
                        <th className="text-center">Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topContributors.map((contributor) => (
                        <tr key={`${contributor.submittedById || "anonymous"}-${contributor.displayName}`}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-2">
                                <i className="bx bx-user-circle text-primary"></i>
                              </div>
                              <span className="font-monospace">
                                {contributor.displayName}
                              </span>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-primary">
                              {contributor.contributions}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-success">
                              {Math.round(
                                (contributor.contributions * contributor.successRate) /
                                  100
                              )}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-info-subtle text-info">
                              {contributor.successRate}%
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-warning-subtle text-warning">
                              — ⭐
                            </span>
                          </td>
                          <td className="text-center">
                            <small>
                              {formatDate(
                                contributor.lastContribution || new Date().toISOString(),
                                "DD/MM/YY"
                              )}
                            </small>
                          </td>
                          <td className="text-center">
                            {contributor.active ? (
                              <span className="badge bg-success-subtle text-success">
                                <i className="bx bx-check me-1"></i>
                                Active
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary">
                                <i className="bx bx-time me-1"></i>
                                Inactive
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              disabled={!contributor.submittedById}
                              title={
                                contributor.submittedById
                                  ? "View this user's submitted suggestions"
                                  : "User ID not available"
                              }
                              onClick={() => {
                                if (!contributor.submittedById) return;
                                navigate("/ppaa-maoni/suggestions", {
                                  state: {
                                    filter: "user",
                                    userId: contributor.submittedById,
                                    userName: contributor.displayName,
                                    submittedOnly: true,
                                  },
                                });
                              }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contributions Tab Content */}
      {activeTab === "contributions" && (
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  All Contributions ({visibleContributions.length}
                  {visibleContributions.length !== allContributions.length
                    ? ` of ${allContributions.length}`
                    : ""}
                  )
                </h5>
                <div className="d-flex gap-2">
                  <div
                    className="input-group input-group-sm"
                    style={{ width: "200px" }}
                  >
                    <span className="input-group-text">
                      <i className="bx bx-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by title, category, status, department..."
                      value={contribSearch}
                      onChange={(e) => setContribSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "150px" }}
                  >
                    <option>All Status</option>
                    <option>Pending Review</option>
                    <option>Under Consideration</option>
                    <option>Implemented</option>
                    <option>Rejected</option>
                  </select>
                  <button className="btn btn-sm btn-primary">
                    <i className="bx bx-filter me-1"></i>
                    Filter
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th width="25%">Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Submitted</th>
                        <th>Comments</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleContributionsPaginated.map((contribution) => (
                        <tr key={contribution.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-3">
                                <i className="bx bx-message-rounded text-muted"></i>
                              </div>
                              <div>
                                <div className="fw-medium">
                                  {contribution.title}
                                </div>
                                <small className="text-muted">
                                  By {contribution.submittedBy} •{" "}
                                  {contribution.department}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {contribution.category}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${getStatusBadgeClass(
                                contribution.status
                              )}`}
                              style={getStatusBadgeStyle(contribution.status)}
                            >
                              {getStatusText(contribution.status)}
                            </span>
                          </td>
                          <td>{getPriorityBadge(contribution.priority)}</td>
                          <td>
                            <small>
                              {formatDate(contribution.date, "DD/MM/YY")}
                            </small>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                             
                              <i className="bx bx-message text-primary me-1"></i>
                              <span>{contribution.comments}</span>
                            </div>
                          </td>
                          <td>
                            <div className="btn-group">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/ppaa-maoni/suggestions/${contribution.id}`,
                                    { state: { fromDashboard: true, returnTab: "contributions" } }
                                  )
                                }
                                className="btn btn-sm btn-outline-primary"
                              >
                                Review
                              </button>
                           
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer bg-white border-0">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <small className="text-muted">
                    Showing{" "}
                    {visibleContributions.length === 0
                      ? "0"
                      : `${(contribPageClamped - 1) * CONTRIB_PAGE_SIZE + 1}-${Math.min(
                          contribPageClamped * CONTRIB_PAGE_SIZE,
                          visibleContributions.length
                        )}`}{" "}
                    of {visibleContributions.length} contributions
                  </small>
                  <nav aria-label="Contributions pagination">
                    <ul className="pagination pagination-sm mb-0">
                      <li
                        className={`page-item ${contribPageClamped <= 1 ? "disabled" : ""}`}
                      >
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setContribPage((p) => Math.max(1, p - 1))}
                          disabled={contribPageClamped <= 1}
                          aria-label="Previous page"
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: contribTotalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (contribTotalPages <= 7) return true;
                          return (
                            p === 1 ||
                            p === contribTotalPages ||
                            Math.abs(p - contribPageClamped) <= 2
                          );
                        })
                        .map((p, idx, arr) => (
                          <React.Fragment key={p}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <li className="page-item disabled">
                                <span className="page-link">…</span>
                      </li>
                            )}
                            <li
                              className={`page-item ${p === contribPageClamped ? "active" : ""}`}
                            >
                              <button
                                type="button"
                                className="page-link"
                                onClick={() => setContribPage(p)}
                                aria-label={`Page ${p}`}
                                aria-current={p === contribPageClamped ? "page" : undefined}
                              >
                                {p}
                              </button>
                      </li>
                          </React.Fragment>
                        ))}
                      <li
                        className={`page-item ${contribPageClamped >= contribTotalPages ? "disabled" : ""}`}
                      >
                        <button
                          type="button"
                          className="page-link"
                          onClick={() =>
                            setContribPage((p) =>
                              Math.min(contribTotalPages, p + 1)
                            )
                          }
                          disabled={contribPageClamped >= contribTotalPages}
                          aria-label="Next page"
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Tab Content */}
      {/* {activeTab === "moderation" && (
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  Moderation Queue ({moderationQueue.length} items)
                </h5>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={() => handleModerationBulkAction("approve")}
                    title="Backend supports DRAFT/SUBMITTED only; review each item via Review"
                  >
                    <i className="bx bx-check-circle me-1"></i>
                    Approve All
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => handleModerationBulkAction("reject")}
                    title="Review each suggestion individually"
                  >
                    <i className="bx bx-x-circle me-1"></i>
                    Reject All
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th width="30%">Contribution</th>
                        <th>Category</th>
                        <th>Urgency</th>
                        <th>Flags</th>
                        <th>Submitted</th>
                        <th>Review Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {moderationQueue.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-4">
                            <i className="bx bx-check-double fs-2 d-block mb-2"></i>
                            No suggestions pending review. All submitted items in the selected period are shown here.
                          </td>
                        </tr>
                      ) : (
                        moderationQueue.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-3">
                                <i className="bx bx-message-rounded text-warning"></i>
                              </div>
                              <div>
                                <div className="fw-medium">{item.title}</div>
                                <small className="text-muted">
                                  By {item.submittedBy}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {item.category}
                            </span>
                          </td>
                          <td>{getUrgencyBadge(item.urgency)}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {item.flags.map((flag, index) => (
                                <span
                                  key={index}
                                  className="badge bg-info-subtle text-info"
                                >
                                  {flag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <small>{formatDate(item.date, "DD/MM/YY")}</small>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                item.urgency === "Overdue"
                                  ? "bg-danger"
                                  : "bg-warning"
                              }`}
                            >
                              {item.reviewTime}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={() =>
                                    navigate(
                                      `/ppaa-maoni/suggestions/${item.id}`,
                                      {
                                        state: {
                                          fromDashboard: true,
                                          returnTab: "moderation",
                                        },
                                      }
                                    )}
                                  title="Open suggestion to review and reply"
                                >
                                  <i className="bx bx-show me-0" aria-hidden="true"></i>
                                  <span className="d-none d-sm-inline ms-1">Review</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Moderation Statistics - from real queue (backend: SUBMITTED = pending) */}
          {/* <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">Moderation Stats</h5>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <div className="h1 text-primary">{moderationStats.pending}</div>
                  <small className="text-muted">Pending Review</small>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small>High / Urgent</small>
                    <small className="fw-medium">{moderationStats.high}</small>
                  </div>
                  <div className="progress" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-danger"
                      style={{
                        width: `${moderationStats.pending > 0 ? moderationStats.highPct : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small>Medium Priority</small>
                    <small className="fw-medium">{moderationStats.medium}</small>
                  </div>
                  <div className="progress" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-warning"
                      style={{
                        width: `${moderationStats.mediumPct}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <small>Low Priority</small>
                    <small className="fw-medium">{moderationStats.low}</small>
                  </div>
                  <div className="progress" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-secondary"
                      style={{
                        width: `${moderationStats.lowPct}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Recent Moderation Actions - placeholder until backend supports audit log */}
          {/* <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">Recent Moderation Actions</h5>
              </div>
              <div className="card-body">
                <div className="text-center text-muted py-4">
                  <i className="bx bx-history fs-1 d-block mb-2"></i>
                  <p className="mb-0 small">
                    Moderation history will appear here when the backend supports
                    audit logging of approve/reject actions. For now, use Review on
                    each row to open the suggestion and reply.
                  </p>
                        </div>
                      </div>
                      </div>
          </div> */}
        {/* </div>
      )} */} 

      {/* Reports Tab Content */}
      {activeTab === "reports" && (
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">Generate Reports</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-4 mb-4">
                    <div className="card border-primary border-2 h-100">
                      <div className="card-body text-center">
                        <div className="p-3 bg-primary-subtle rounded-circle d-inline-flex mb-3">
                          <i className="bx bx-file text-primary fs-2"></i>
                        </div>
                        <h5>Detailed Analytics Report</h5>
                        <p className="text-muted mb-4">
                          Comprehensive report with all metrics, charts, and
                          detailed analysis
                        </p>
                        <button
                          onClick={() => handleGenerateReport("detailed")}
                          className="btn btn-primary w-100"
                        >
                          <i className="bx bx-download me-2"></i>
                          Generate Detailed Report
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-4 mb-4">
                    <div className="card border-success border-2 h-100">
                      <div className="card-body text-center">
                        <div className="p-3 bg-success-subtle rounded-circle d-inline-flex mb-3">
                          <i className="bx bx-bar-chart-alt text-success fs-2"></i>
                        </div>
                        <h5>Executive Summary</h5>
                        <p className="text-muted mb-4">
                          High-level overview for leadership with key insights
                          and recommendations
                        </p>
                        <button
                          onClick={() => handleGenerateReport("executive")}
                          className="btn btn-success w-100"
                        >
                          <i className="bx bx-download me-2"></i>
                          Generate Executive Report
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-lg-4 mb-4">
                    <div className="card border-warning border-2 h-100">
                      <div className="card-body text-center">
                        <div className="p-3 bg-warning-subtle rounded-circle d-inline-flex mb-3">
                          <i className="bx bx-trending-up text-warning fs-2"></i>
                        </div>
                        <h5>Operational Report</h5>
                        <p className="text-muted mb-4">
                          Focus on moderation queue, response times, and
                          operational metrics
                        </p>
                        <button
                          onClick={() => handleGenerateReport("operational")}
                          className="btn btn-warning w-100"
                        >
                          <i className="bx bx-download me-2"></i>
                          Generate Operational Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Report Configuration – uses dashboard date range and Maoni data */}
                <div className="card border-0 bg-light mt-4">
                  <div className="card-body">
                    <h6 className="mb-3">Report Configuration</h6>
                    <p className="text-muted small mb-3">
                      Reports use the dashboard date range and current Maoni data from the backend.
                    </p>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Date Range</label>
                        <div className="d-flex gap-2">
                          <input
                            type="date"
                            className="form-control"
                            value={customDateRange.start}
                            onChange={handleDateRangeChange}
                            name="start"
                          />
                          <input
                            type="date"
                            className="form-control"
                            value={customDateRange.end}
                            onChange={handleDateRangeChange}
                            name="end"
                          />
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Include Sections</label>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="includeCharts"
                            checked={reportIncludeCharts}
                            onChange={(e) => setReportIncludeCharts(e.target.checked)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="includeCharts"
                          >
                            Key Statistics
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="includeDetails"
                            checked={reportIncludeDetails}
                            onChange={(e) => setReportIncludeDetails(e.target.checked)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="includeDetails"
                          >
                            Detailed Contribution List, Top Contributors & Department Summary
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="includeRecommendations"
                            checked={reportIncludeRecommendations}
                            onChange={(e) => setReportIncludeRecommendations(e.target.checked)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="includeRecommendations"
                          >
                            Recommendations
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => handleExportData()}
                        className="btn btn-primary px-5"
                      >
                        <i className="bx bx-download me-2"></i>
                        Generate Custom Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recently Generated Report – on-demand from Maoni backend (no stored history) */}
                <div className="mt-4">
                  <h6 className="mb-3">Recently Generated Report</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Report Name</th>
                          <th>Type</th>
                          <th>Date Range</th>
                          <th>Generated</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastReportGenerated ? (
                          <tr>
                            <td>{lastReportGenerated.name}</td>
                            <td>
                              <span className="badge bg-light text-dark">
                                {lastReportGenerated.type}
                              </span>
                            </td>
                            <td>
                              <small>{lastReportGenerated.range}</small>
                            </td>
                            <td>
                              <small>
                                {formatDate(lastReportGenerated.generated, "DD/MM/YYYY HH:mm")}
                              </small>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleExportData()}
                                title="Generate same report again with current data"
                              >
                                <i className="bx bx-download"></i>
                              </button>
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan="5" className="text-center text-muted py-3">
                              <small>
                                Reports are generated on demand from current Maoni data. No history is stored. Generate a report above to download a PDF.
                              </small>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Footer */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-0 bg-light">
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">
                    <i className="bx bx-info-circle me-1"></i>
                    Data for: {customDateRange.start} to {customDateRange.end} •
                    Last updated:{" "}
                    {formatDate(new Date().toISOString(), "DD/MM/YYYY HH:mm")}
                  </small>
                </div>
                <div>
                  <small className="text-muted">
                    Showing {allContributions.length} contributions •
                    Auto-refresh: 15 minutes
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .nav-tabs .nav-link {
          border: none;
          border-bottom: 3px solid transparent;
          color: #6c757d;
          font-weight: 500;
          padding: 0.75rem 1rem;
        }

        .nav-tabs .nav-link.active {
          color: #0d6efd;
          border-bottom-color: #0d6efd;
          background-color: transparent;
        }

        .nav-tabs .nav-link:hover {
          color: #0d6efd;
          border-bottom-color: rgba(13, 110, 253, 0.3);
        }

        .card-hover:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08) !important;
        }

        .table-hover tbody tr:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }

        .progress {
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-bar {
          border-radius: 10px;
        }

        .timeline .d-flex:not(:last-child) {
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};
