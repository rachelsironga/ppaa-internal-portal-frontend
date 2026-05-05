import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import DOMPurify from "dompurify";
import {
  getSuggestion,
  replyToSuggestion,
  getSuggestionForPrint,
  updateSuggestion,
  getMaoniSettings,
  getDepartments,
} from "./Queries";
import { formatDate } from "../../../helpers/DateFormater";
import LinearIndeterminate from "../../../LinearIndeterminate";
import MaoniPortalBreadcrumb from "../../../layouts/MaoniPortalBreadcrumb";
import {
  isMaoniAdmin,
  isMaoniDepartmentHandler,
  isMaoniHandler,
  isMaoniPrimaryReviewerGroup,
  isMaoniReviewer,
} from "../../../utils/maoniRoles";
import {
  maoniUnderHandlerReviewBadgeClasses,
  getMaoniUnderHandlerReviewBadgeStyle,
} from "../../../utils/maoniUnderHandlerReviewBadge";

const isMaoniApiSuccess = (res) => res && (res.status === 8000 || res.status === 200);

// Strip HTML but keep paragraph/line breaks by turning block elements into newlines
const stripHtml = (html) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  let s = html
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n");
  tmp.innerHTML = s;
  const text = tmp.textContent || tmp.innerText || "";
  return text.replace(/\n{3,}/g, "\n\n").trim();
};

const flattenMaoniComments = (nodes, acc = []) => {
  if (!nodes || !Array.isArray(nodes)) return acc;
  for (const n of nodes) {
    acc.push(n);
    flattenMaoniComments(n.replies || [], acc);
  }
  return acc;
};

const sortCommentsByDate = (flat) =>
  [...flat].sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return ta - tb;
  });

/** Synthetic toolbar action: one button → user picks approve vs reject in a dialog. */
const MAONI_CLOSE_SUBMISSION_ACTION = "CLOSE_SUBMISSION";

const WORKFLOW_ACTION_ICONS = {
  RETURNED_TO_HANDLER: "bx-revision",
  CLOSED_APPROVED: "bx-check-circle",
  CLOSED_REJECTED: "bx-x-circle",
  [MAONI_CLOSE_SUBMISSION_ACTION]: "bx-check-shield",
  UNDER_HANDLER_REVIEW: "bx-play-circle",
  ESCALATED_TO_REVIEWER: "bx-trending-up",
  HANDLER_RESPONDED_TO_CONTRIBUTOR: "bx-message-rounded-dots",
  HANDLER_RESPONDED_TO_REVIEWER: "bx-message-dots",
  CLARIFICATION_REQUESTED: "bx-help-circle",
};

/** Panel under original message when a workflow pill is selected — tint follows action type. */
const workflowPendingPanelShellStyle = (status) => {
  switch (status) {
    case "RETURNED_TO_HANDLER":
      return {
        background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
        border: "1px solid #64748b",
        borderRadius: "12px",
      };
    case "ESCALATED_TO_REVIEWER":
      return {
        background: "linear-gradient(180deg, #fffbeb 0%, #fde68a 100%)",
        border: "1px solid #d97706",
        borderRadius: "12px",
      };
    case MAONI_CLOSE_SUBMISSION_ACTION:
      return {
        background: "linear-gradient(180deg, #eff6ff 0%, #bfdbfe 100%)",
        border: "1px solid #2563eb",
        borderRadius: "12px",
      };
    case "HANDLER_RESPONDED_TO_REVIEWER":
      return {
        background: "linear-gradient(180deg, #faf5ff 0%, #e9d5ff 100%)",
        border: "1px solid #9333ea",
        borderRadius: "12px",
      };
    case "UNDER_HANDLER_REVIEW":
      return {
        background: "linear-gradient(180deg, #ecfdf5 0%, #bbf7d0 100%)",
        border: "1px solid #16a34a",
        borderRadius: "12px",
      };
    default:
      return {
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        border: "1px solid #94a3b8",
        borderRadius: "12px",
      };
  }
};

/** True when the stored description likely contains charts, figures, or embeds worth viewing as HTML. */
const descriptionHasEmbeddableCharts = (html) => {
  const s = String(html || "");
  if (!s.trim()) return false;
  const lower = s.toLowerCase();
  if (/<img[\s/>]/.test(lower)) return true;
  if (/<svg[\s>]/.test(lower)) return true;
  if (/<iframe[\s>]/.test(lower)) return true;
  if (/<canvas[\s>]/.test(lower)) return true;
  if (/data:image\/(png|jpeg|gif|webp|svg\+xml)/i.test(s)) return true;
  if (/plotly|apexcharts|chart\.js|echarts|highcharts|chartjs/i.test(s)) return true;
  return false;
};

const workflowActionIconClass = (status) =>
  WORKFLOW_ACTION_ICONS[status] || "bx-wrench";

/** Workflow transitions are logged as comments like `[STATUS] reason`. */
const WORKFLOW_COMMENT_REGEX = /^\[([^\]]+)\]\s*([\s\S]*)$/;

const parseWorkflowCommentBody = (text) => {
  const m = String(text || "").trim().match(WORKFLOW_COMMENT_REGEX);
  if (!m) return { isWorkflow: false };
  const rawTag = m[1].trim();
  return {
    isWorkflow: true,
    rawTag,
    reason: (m[2] || "").trim(),
    label: rawTag.replace(/_/g, " ").replace(/\s+/g, " ").toUpperCase(),
  };
};

/**
 * Thread card title: show who the step is for (not raw enum text).
 * Individual assignees are not stored on workflow comments; return uses linked department name.
 */
const formatWorkflowTimelineTitle = (workflowStatusKey, defaultLabel, departmentName) => {
  const key = String(workflowStatusKey || "").toUpperCase();
  if (key === "ESCALATED_TO_REVIEWER") {
    return "ESCALATED TO EXECUTIVE SECRETARY (ES)";
  }
  if (key === "RETURNED_TO_HANDLER") {
    const dept = String(departmentName || "").trim();
    if (dept) return `RETURNED TO ${dept.toUpperCase()}`;
    return "RETURNED TO DEPARTMENT HANDLER";
  }
  return defaultLabel;
};

/** Ordered milestones for a simple progress strip (frontend only). */
const SUGGESTION_FLOW_STEPS = [
  {
    key: "submitted",
    label: "Submitted",
    icon: "bx-send",
    hint: "In the department queue, waiting to be picked up.",
    statuses: ["SUBMITTED"],
  },
  {
    key: "department",
    label: "Department",
    icon: "bx-buildings",
    hint: "Department is working on the case. Contributors can post follow-ups in the thread while it stays open.",
    statuses: [
      "UNDER_HANDLER_REVIEW",
      "RETURNED_TO_HANDLER",
      "HANDLER_RESPONDED_TO_CONTRIBUTOR",
      "HANDLER_RESPONDED_TO_REVIEWER",
    ],
  },
  {
    key: "reviewer",
    label: "Reviewer",
    icon: "bx-shield-quarter",
    hint: "Escalated to the PPAA reviewer team.",
    statuses: ["ESCALATED_TO_REVIEWER"],
  },
  {
    key: "resolved",
    label: "Resolved",
    icon: "bx-check-shield",
    hint: "Closed as approved or rejected.",
    statuses: ["CLOSED_APPROVED", "CLOSED_REJECTED"],
  },
];

const getSuggestionFlowIndex = (normalizedStatus) => {
  if (!normalizedStatus || normalizedStatus === "DRAFT") return -1;
  const idx = SUGGESTION_FLOW_STEPS.findIndex((step) =>
    step.statuses.includes(normalizedStatus)
  );
  return idx >= 0 ? idx : 1;
};

const SuggestionDetail = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.userReducer?.data);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [workflowNote, setWorkflowNote] = useState("");
  /** Which workflow pill was chosen; reason field shows below original message only when set. */
  const [pendingWorkflowAction, setPendingWorkflowAction] = useState(null);
  const workflowReasonTextareaRef = useRef(null);
  const [escalationDays, setEscalationDays] = useState(3);
  const [departmentLabel, setDepartmentLabel] = useState(null);
  const [chartsModalOpen, setChartsModalOpen] = useState(false);
  /** Main reply composer is hidden until opened from the original message row. */
  const [replyComposeOpen, setReplyComposeOpen] = useState(false);
  /** Staff-only channel: not shown to the contributor (API thread_scope STAFF). */
  const [composeThreadScope, setComposeThreadScope] = useState("CONTRIBUTOR");
  /** When there are more than two thread entries, user can collapse the whole replies block below the original message. */
  const [repliesBelowOriginalExpanded, setRepliesBelowOriginalExpanded] = useState(true);
  /** For reviewers with a staff channel: handler–contributor messages start collapsed so escalation is visible first. */
  const [contributorFollowUpsExpanded, setContributorFollowUpsExpanded] = useState(true);
  /** When staff internal entries exceed threshold, false = entire timeline body hidden (toggle from header only). */
  const [staffInternalTimelineExpanded, setStaffInternalTimelineExpanded] = useState(true);

  const isMaoniReviewerUser =
    isMaoniReviewer(user) || user?.is_superuser;
  const isAdmin = isMaoniAdmin(user);
  const isHandler = isMaoniHandler(user);
  const fromDashboard =
    (isMaoniReviewerUser || isAdmin) && location?.state?.fromDashboard === true;

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

  const statusLabel = (status) =>
    String(normalizeWorkflowStatus(status)).replaceAll("_", " ").toUpperCase();

  /** Badge copy: map technical status to clearer “in progress” for department review. */
  const statusBadgeLabel = (status) => {
    const s = normalizeWorkflowStatus(status);
    if (s === "UNDER_HANDLER_REVIEW") return "IN PROGRESS";
    return statusLabel(status);
  };

  const statusBadgeClass = (status) => {
    const s = normalizeWorkflowStatus(status);
    if (s === "UNDER_HANDLER_REVIEW") {
      return `badge ${maoniUnderHandlerReviewBadgeClasses}`;
    }
    if (s === "SUBMITTED") {
      return "badge text-success border";
    }
    return "badge text-secondary border";
  };

  const statusBadgeStyle = (status) => {
    const s = normalizeWorkflowStatus(status);
    if (s === "UNDER_HANDLER_REVIEW") {
      return getMaoniUnderHandlerReviewBadgeStyle();
    }
    if (s === "SUBMITTED") {
      return { backgroundColor: "#dcfce7" };
    }
    return { backgroundColor: "#f1f5f9" };
  };

  const currentStatus = normalizeWorkflowStatus(suggestion?.status);
  const flowIndex = suggestion ? getSuggestionFlowIndex(currentStatus) : -1;
  const flowHint =
    flowIndex >= 0 && flowIndex < SUGGESTION_FLOW_STEPS.length
      ? SUGGESTION_FLOW_STEPS[flowIndex].hint
      : "";

  const canReply =
    !!suggestion &&
    currentStatus !== "CLOSED_APPROVED" &&
    currentStatus !== "CLOSED_REJECTED" &&
    (isHandler || currentStatus !== "HANDLER_RESPONDED_TO_CONTRIBUTOR");

  // Contributor-facing "Seek clarification" is a department-handler action, not institutional reviewer UI.
  const canSeekClarificationFromSender =
    !!suggestion &&
    canReply &&
    (isMaoniDepartmentHandler(user) || isAdmin);
  // Primary Maoni reviewers should not see the top-level "Add reply" composer action.
  const canOpenMainReplyComposer = canReply && !isMaoniPrimaryReviewerGroup(user);

  const openMainReplyCompose = () => {
    setReplyComposeOpen(true);
    setReplyingTo(null);
    setReplyText("");
    setComposeThreadScope("CONTRIBUTOR");
  };

  const closeMainReplyCompose = () => {
    setReplyComposeOpen(false);
    setReplyText("");
    setReplyingTo(null);
    setComposeThreadScope("CONTRIBUTOR");
  };

  const suggestionHasCharts = useMemo(
    () => descriptionHasEmbeddableCharts(suggestion?.description),
    [suggestion?.description]
  );

  const workflowActions = (() => {
    if (!suggestion) return [];

    const mergeUniqueByStatus = (lists) => {
      const seen = new Set();
      const out = [];
      for (const list of lists) {
        for (const a of list) {
          if (!seen.has(a.status)) {
            seen.add(a.status);
            out.push(a);
          }
        }
      }
      return out;
    };

    if (isAdmin) {
      return [
        { status: "RETURNED_TO_HANDLER", label: "Return To Handler" },
        { status: MAONI_CLOSE_SUBMISSION_ACTION, label: "Close suggestion" },
      ];
    }

    // Reviewer (ES): return to handler only — closing the case is a department handler action, not reviewer UI.
    const reviewerByStatus = {
      ESCALATED_TO_REVIEWER: [{ status: "RETURNED_TO_HANDLER", label: "Return To Handler" }],
      HANDLER_RESPONDED_TO_REVIEWER: [{ status: "RETURNED_TO_HANDLER", label: "Return To Handler" }],
      RETURNED_TO_HANDLER: [],
    };

    const handlerByStatus = {
      SUBMITTED: [{ status: "UNDER_HANDLER_REVIEW", label: "Start Handler Review" }],
      UNDER_HANDLER_REVIEW: [
        { status: "ESCALATED_TO_REVIEWER", label: "Escalate to ES for guidelines" },
        { status: MAONI_CLOSE_SUBMISSION_ACTION, label: "Close suggestion" },
      ],
      RETURNED_TO_HANDLER: [
        { status: "HANDLER_RESPONDED_TO_REVIEWER", label: "Response to ES" },
        { status: MAONI_CLOSE_SUBMISSION_ACTION, label: "Close suggestion" },
      ],
      ESCALATED_TO_REVIEWER: [{ status: MAONI_CLOSE_SUBMISSION_ACTION, label: "Close suggestion" }],
      HANDLER_RESPONDED_TO_REVIEWER: [
        { status: "ESCALATED_TO_REVIEWER", label: "Escalate to ES for guidelines" },
        { status: MAONI_CLOSE_SUBMISSION_ACTION, label: "Close suggestion" },
      ],
    };

    const reviewerActions = isMaoniReviewerUser ? reviewerByStatus[currentStatus] || [] : [];
    const handlerActions = isHandler ? handlerByStatus[currentStatus] || [] : [];

    if (!isMaoniReviewerUser && !isHandler) return [];

    // Department handlers use `maoni_handler`, which `isMaoniReviewer()` also treats as reviewer.
    // The old branch returned reviewer actions only, so UNDER_HANDLER_REVIEW showed no buttons.
    // Merge handler + reviewer lists so each role sees every transition the API allows for them.
    let merged = mergeUniqueByStatus([handlerActions, reviewerActions]);
    // "Return to handler" is for the primary Maoni reviewer (ES delegate), not department handlers.
    if (!isMaoniPrimaryReviewerGroup(user)) {
      merged = merged.filter((a) => a.status !== "RETURNED_TO_HANDLER");
    }
    // Close approved / rejected: department handlers only (not institutional reviewer / ES).
    if (!isMaoniDepartmentHandler(user)) {
      merged = merged.filter(
        (a) =>
          a.status !== "CLOSED_APPROVED" &&
          a.status !== "CLOSED_REJECTED" &&
          a.status !== MAONI_CLOSE_SUBMISSION_ACTION
      );
    }
    // "Response to ES" (and resume) from RETURNED_TO_HANDLER are handler-queue actions only; ES / reviewer
    // accounts still match isMaoniHandler but must not see these pills (API allows them only as handler role).
    if (!isMaoniDepartmentHandler(user)) {
      merged = merged.filter((a) => a.status !== "HANDLER_RESPONDED_TO_REVIEWER");
    }
    // "Escalate to ES for guidelines" is for department handlers only; reviewers share isMaoniHandler and
    // would otherwise see this on the original message row.
    if (!isMaoniDepartmentHandler(user)) {
      merged = merged.filter((a) => a.status !== "ESCALATED_TO_REVIEWER");
    }
    return merged;
  })();

  const handlerEscalationInfo = (() => {
    if (!isHandler || !suggestion) return null;
    const status = normalizeWorkflowStatus(suggestion.status);
    const trackableStatuses = new Set([
      "SUBMITTED",
      "UNDER_HANDLER_REVIEW",
      "RETURNED_TO_HANDLER",
      "HANDLER_RESPONDED_TO_REVIEWER",
      "HANDLER_RESPONDED_TO_CONTRIBUTOR",
    ]);
    if (!trackableStatuses.has(status)) return null;

    const startAtRaw = suggestion.updated_at || suggestion.submitted_at || suggestion.created_at;
    const startAt = new Date(startAtRaw || 0);
    if (Number.isNaN(startAt.getTime())) return null;

    const dueAtMs = startAt.getTime() + escalationDays * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const diffDays = Math.ceil((dueAtMs - nowMs) / (24 * 60 * 60 * 1000));
    const overdueDays = Math.max(0, Math.abs(diffDays));
    const remainingDays = Math.max(0, diffDays);

    let tone = "success";
    if (diffDays <= 0) tone = "danger";
    else if (diffDays <= 1) tone = "warning";
    else if (diffDays <= 3) tone = "info";

    return {
      dueDate: new Date(dueAtMs),
      remainingDays,
      overdueDays,
      isOverdue: diffDays <= 0,
      tone,
    };
  })();

  const goBackToList = () => {
    if (fromDashboard) {
      navigate("/ppaa-maoni/dashboard", {
        state: { activeTab: location.state?.returnTab || "contributions" },
      });
    } else {
      navigate("/ppaa-maoni/suggestions");
    }
  };

  useEffect(() => {
    fetchSuggestion();
  }, [uid]);

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      try {
        const response = await getMaoniSettings();
        const raw = Number(response?.data?.escalation_days ?? 3);
        if (!cancelled && Number.isFinite(raw) && raw > 0) {
          setEscalationDays(raw);
        }
      } catch (e) {
        console.error("Failed to load Maoni settings in suggestion detail:", e);
      }
    };
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const uid = suggestion?.department_uid;
    if (!uid || String(uid).trim() === "") {
      setDepartmentLabel(null);
      return;
    }
    (async () => {
      try {
        const res = await getDepartments();
        let list = [];
        if (res?.status === 8000 || res?.status === 200) {
          list = Array.isArray(res.data) ? res.data : [];
        } else if (Array.isArray(res?.data)) {
          list = res.data;
        } else if (Array.isArray(res)) {
          list = res;
        }
        const match = list.find(
          (d) => String(d.uid || "").toLowerCase() === String(uid).toLowerCase()
        );
        if (!cancelled) {
          setDepartmentLabel(match?.name ? String(match.name) : null);
        }
      } catch {
        if (!cancelled) setDepartmentLabel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [suggestion?.department_uid]);

  useEffect(() => {
    if (!suggestion?.uid) return;
    const ts = suggestion.updated_at || suggestion.created_at;
    if (!ts) return;
    try {
      const key = `maoni_suggestion_last_seen_updated_${suggestion.uid}`;
      const val = typeof ts === "string" ? ts : new Date(ts).toISOString();
      localStorage.setItem(key, val);
    } catch (_) {
      /* private mode / quota */
    }
  }, [suggestion?.uid, suggestion?.updated_at]);

  const { lastOfficialReviewerName, lastDepartmentResponderName } = useMemo(() => {
    if (!suggestion?.comments) {
      return { lastOfficialReviewerName: null, lastDepartmentResponderName: null };
    }
    const flat = sortCommentsByDate(flattenMaoniComments(suggestion.comments));
    const submitterName = (suggestion.submitted_by_name || "").trim().toLowerCase();
    let lastOfficialReviewerName = null;
    let lastDepartmentResponderName = null;
    for (let idx = flat.length - 1; idx >= 0; idx--) {
      const c = flat[idx];
      if (!lastOfficialReviewerName && c.is_hr_reply && c.commented_by_name) {
        lastOfficialReviewerName = c.commented_by_name;
      }
      const nm = (c.commented_by_name || "").trim().toLowerCase();
      const looksLikeContributorOnly =
        submitterName && nm && nm === submitterName;
      if (
        !lastDepartmentResponderName &&
        !c.is_hr_reply &&
        c.commented_by_name &&
        !looksLikeContributorOnly
      ) {
        lastDepartmentResponderName = c.commented_by_name;
      }
      if (lastOfficialReviewerName && lastDepartmentResponderName) break;
    }
    return { lastOfficialReviewerName, lastDepartmentResponderName };
  }, [suggestion?.comments, suggestion?.submitted_by_name]);

  const commentDepthByUid = useMemo(() => {
    const map = {};
    const walk = (nodes, depth = 0) => {
      for (const n of nodes || []) {
        if (n?.uid) map[n.uid] = depth;
        walk(n.replies || [], depth + 1);
      }
    };
    walk(suggestion?.comments);
    return map;
  }, [suggestion?.comments]);

  const threadEntries = useMemo(() => {
    if (!suggestion) return [];
    const flat = sortCommentsByDate(flattenMaoniComments(suggestion.comments));
    return flat.map((c) => {
      const parsed = parseWorkflowCommentBody(c.comment);
      const statusKey = parsed.isWorkflow
        ? normalizeWorkflowStatus(parsed.rawTag.replace(/\s+/g, "_"))
        : null;
      return {
        uid: c.uid,
        kind: parsed.isWorkflow ? "workflow" : "message",
        comment: c,
        depth: commentDepthByUid[c.uid] ?? 0,
        workflowLabel: parsed.isWorkflow
          ? formatWorkflowTimelineTitle(statusKey, parsed.label, departmentLabel)
          : null,
        workflowReason: parsed.isWorkflow ? parsed.reason : null,
        workflowStatusKey: statusKey,
      };
    });
  }, [suggestion, commentDepthByUid, departmentLabel]);

  const staffInternalComments = suggestion?.staff_internal_comments;
  const { staffUidSet, staffInternalEntries } = useMemo(() => {
    const list = Array.isArray(staffInternalComments) ? staffInternalComments : [];
    const set = new Set(list.map((c) => String(c.uid)));
    const entries = list.map((c) => {
      const parsed = parseWorkflowCommentBody(c.comment);
      const statusKey = parsed.isWorkflow
        ? normalizeWorkflowStatus(parsed.rawTag.replace(/\s+/g, "_"))
        : null;
      return {
        uid: c.uid,
        kind: parsed.isWorkflow ? "workflow" : "message",
        comment: c,
        depth: 0,
        workflowLabel: parsed.isWorkflow
          ? formatWorkflowTimelineTitle(statusKey, parsed.label, departmentLabel)
          : null,
        workflowReason: parsed.isWorkflow ? parsed.reason : null,
        workflowStatusKey: statusKey,
      };
    });
    return { staffUidSet: set, staffInternalEntries: entries };
  }, [staffInternalComments, departmentLabel]);

  const hasStaffInternalView = staffInternalEntries.length > 0;
  /** Institutional reviewer / ES: collapse public handler–contributor thread by default when staff-only notes exist. */
  const reviewerCollapsiblePublicThread =
    hasStaffInternalView && !isMaoniDepartmentHandler(user);

  const threadRepliesKey = useMemo(
    () => threadEntries.map((e) => e.comment.uid).join("|"),
    [threadEntries]
  );

  useEffect(() => {
    setRepliesBelowOriginalExpanded(true);
  }, [threadRepliesKey]);

  useEffect(() => {
    if (!suggestion?.uid) return;
    const staff =
      Array.isArray(suggestion.staff_internal_comments) && suggestion.staff_internal_comments.length > 0;
    const flatLen = flattenMaoniComments(suggestion.comments || []).length;
    if (staff && !isMaoniDepartmentHandler(user) && flatLen > 0) {
      setContributorFollowUpsExpanded(false);
    } else {
      setContributorFollowUpsExpanded(true);
    }
  }, [suggestion?.uid, user]);

  useEffect(() => {
    setPendingWorkflowAction(null);
    setWorkflowNote("");
  }, [suggestion?.uid, suggestion?.status]);

  useEffect(() => {
    setStaffInternalTimelineExpanded(true);
  }, [suggestion?.uid]);

  useEffect(() => {
    if (!pendingWorkflowAction) return;
    const t = window.setTimeout(() => {
      workflowReasonTextareaRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [pendingWorkflowAction]);

  const fetchSuggestion = async () => {
    try {
      setLoading(true);
      const response = await getSuggestion(uid);
      if (response.status === 8000 || response.status === 200) {
        setSuggestion(response.data || response);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || error.message || "Failed to load suggestion",
      }).then(() => {
        if (fromDashboard) {
          navigate("/ppaa-maoni/dashboard", {
            state: { activeTab: location.state?.returnTab || "contributions" },
          });
        } else {
          navigate("/ppaa-maoni/suggestions");
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentCommentUid = null) => {
    if (!canReply) return;
    if (!replyText.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please enter a reply",
      });
      return;
    }

    try {
      setSubmittingReply(true);
      const parentUid = parentCommentUid ?? replyingTo ?? null;
      const useStaffThread =
        (!!parentUid && staffUidSet.has(String(parentUid))) ||
        (!parentUid && replyComposeOpen && composeThreadScope === "STAFF");
      const response = await replyToSuggestion(uid, replyText, parentCommentUid, {
        threadScope: useStaffThread ? "STAFF" : "CONTRIBUTOR",
      });
      if (isMaoniApiSuccess(response)) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text:
            response.message ||
            (useStaffThread
              ? "Posted to the internal staff channel (not visible to the contributor)."
              : "Your message was posted. The contributor can open this suggestion to read it."),
          timer: 2200,
        });
        setReplyText("");
        setReplyingTo(null);
        setReplyComposeOpen(false);
        setComposeThreadScope("CONTRIBUTOR");
        fetchSuggestion();
      } else {
        Swal.fire({
          icon: "error",
          title: "Could not send",
          text: response?.message || "The server did not accept this reply.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to send reply",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleWorkflowAction = async (nextStatus) => {
    const note = workflowNote.trim();
    if (!note) {
      Swal.fire({
        icon: "warning",
        title: "Action reason required",
        text: "Please add a comment explaining why you are taking this action.",
      });
      return;
    }

    let resolvedStatus = nextStatus;
    if (nextStatus === MAONI_CLOSE_SUBMISSION_ACTION) {
      const choice = await Swal.fire({
        title: "Close this suggestion",
        html: '<p class="text-start small text-body-secondary mb-0">Your note above is saved with the closure. Pick the outcome so the system and contributor see the correct status.</p>',
        input: "radio",
        inputOptions: {
          CLOSED_APPROVED: "Approve — accept the submission",
          CLOSED_REJECTED: "Reject — decline the submission",
        },
        inputValue: "CLOSED_APPROVED",
        showCancelButton: true,
        confirmButtonText: "Apply and close",
        cancelButtonText: "Back",
        focusConfirm: false,
        inputValidator: (v) => (!v ? "Please choose approve or reject." : undefined),
      });
      if (!choice.isConfirmed || !choice.value) {
        return;
      }
      resolvedStatus = choice.value;
    }

    try {
      setSubmittingReply(true);
      // Bind every status transition to an auditable comment/reason.
      const replyRes = await replyToSuggestion(uid, `[${statusLabel(resolvedStatus)}] ${note}`);
      if (!isMaoniApiSuccess(replyRes)) {
        Swal.fire({
          icon: "error",
          title: "Reply not posted",
          text: replyRes?.message || "Could not add the workflow note to the thread.",
        });
        return;
      }
      const response = await updateSuggestion(uid, { status: resolvedStatus });
      if (isMaoniApiSuccess(response)) {
        await Swal.fire({
          icon: "success",
          title: "Workflow Updated",
          text: response.message || "Status updated successfully",
          timer: 1200,
        });
        setWorkflowNote("");
        setPendingWorkflowAction(null);
        fetchSuggestion();
      } else {
        Swal.fire({
          icon: "error",
          title: "Update failed",
          text: response?.message || "The workflow note was posted but status could not be updated.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Action Failed",
        text:
          error.response?.data?.message ||
          "Unable to apply workflow action for this role/state.",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handlePrint = async () => {
    try {
      const response = await getSuggestionForPrint(uid);
      if (response.status === 8000 || response.status === 200) {
        const data = response.data || response;
        
        // Create print window
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Suggestion - ${data.title}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .meta { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
                .meta-item { margin: 5px 0; }
                .content { margin: 20px 0; line-height: 1.6; }
                .comment { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; background: #f9f9f9; }
                .comment-header { font-weight: bold; color: #007bff; margin-bottom: 10px; }
                .comment-reply { margin-left: 30px; margin-top: 10px; border-left-color: #28a745; }
                .hr-reply { border-left-color: #dc3545; }
                hr { margin: 30px 0; }
              </style>
            </head>
            <body>
              <h1>${data.title}</h1>
              <div class="meta">
                <div class="meta-item"><strong>Submitted by:</strong> ${data.submitted_by_name || "Anonymous"}</div>
                <div class="meta-item"><strong>Date:</strong> ${formatDate(data.submitted_at || data.created_at)}</div>
                <div class="meta-item"><strong>Status:</strong> ${data.status}</div>
                <div class="meta-item"><strong>Priority:</strong> ${data.priority}</div>
              </div>
              <div class="content">
                <h3>Description</h3>
                <p>${data.description.replace(/\n/g, "<br>")}</p>
              </div>
              <hr>
              <h2>Replies (${data.all_comments?.length || 0})</h2>
              ${(data.all_comments || []).map((comment) => `
                <div class="comment ${comment.is_hr_reply ? "hr-reply" : ""}">
                  <div class="comment-header">
                    ${comment.is_hr_reply ? "Official reply: " : ""}${comment.commented_by_name} - ${formatDate(comment.created_at)}
                  </div>
                  <div>${comment.comment.replace(/\n/g, "<br>")}</div>
                </div>
              `).join("")}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to load suggestion for printing",
      });
    }
  };

  const renderStaffInternalEmbed = (lastStaffTrailEnd) => {
    if (!hasStaffInternalView) return null;
    const staffTotal = staffInternalEntries.length;
    const showStaffTimelineBody = staffInternalTimelineExpanded;
    const staffVisibleEntries = staffInternalEntries;

    return (
      <div className="maoni-thread-staff-embed border-top border-bottom">
        <div
          className="d-flex flex-wrap justify-content-between align-items-start gap-2 px-3 py-2 px-md-4"
          style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" }}
        >
          <div className="min-w-0">
            <div className="d-flex align-items-center gap-2 flex-wrap min-w-0">
              <i className="bx bx-shield-quarter text-warning flex-shrink-0" style={{ fontSize: "1.2rem" }} aria-hidden />
              <div
                className="small fw-semibold text-dark text-truncate mb-0 text-uppercase maoni-staff-internal-title"
                style={{ letterSpacing: "0.08em" }}
                title="Internal communication between handler and reviewer"
              >
                Internal Communication between Handler and Reviewer
              </div>
            </div>
            <p className="text-muted small mb-0 mt-1" style={{ maxWidth: "40rem" }}>
              Escalation notes and staff-only messages. The contributor does not see this channel.
            </p>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2 flex-shrink-0">
            <span className="badge bg-white text-secondary border flex-shrink-0">
              {staffTotal} staff-only update{staffTotal === 1 ? "" : "s"}
            </span>
            {staffTotal > 0 && (
              <button
                type="button"
                className="maoni-staff-timeline-toggle rounded-circle d-inline-flex align-items-center justify-content-center p-0 border-0"
                style={{ width: "2.125rem", height: "2.125rem", flexShrink: 0 }}
                onClick={() => setStaffInternalTimelineExpanded((v) => !v)}
                aria-expanded={staffInternalTimelineExpanded}
                aria-controls="maoni-staff-internal-timeline"
                title={
                  staffInternalTimelineExpanded
                    ? "Collapse staff-only messages"
                    : `Expand staff-only messages (${staffTotal})`
                }
                aria-label={
                  staffInternalTimelineExpanded
                    ? "Collapse staff-only updates"
                    : `Expand staff-only updates, ${staffTotal} total`
                }
              >
                <i
                  className={`bx ${staffInternalTimelineExpanded ? "bx-chevron-up" : "bx-chevron-down"}`}
                  style={{ fontSize: "1.15rem" }}
                  aria-hidden
                />
              </button>
            )}
          </div>
        </div>
        {staffTotal > 0 && !showStaffTimelineBody && (
          <div className="px-3 px-md-4 py-2 small text-muted border-bottom bg-white bg-opacity-75">
            Staff-only messages are hidden — use the <span className="fw-semibold">chevron</span> in the header to
            show {staffTotal} update{staffTotal === 1 ? "" : "s"}.
          </div>
        )}
        {showStaffTimelineBody && (
        <div id="maoni-staff-internal-timeline" className="maoni-thread-staff-embed__steps px-0">
          {staffVisibleEntries.map((entry, entryIndex) => {
            const c = entry.comment;
            const trailEnd = entryIndex === staffVisibleEntries.length - 1 && lastStaffTrailEnd;
            const rowUid = c.uid;

            if (entry.kind === "workflow") {
              const icon = workflowActionIconClass(entry.workflowStatusKey || "UNDER_HANDLER_REVIEW");
              return (
                <div
                  key={`staff-${rowUid}`}
                  className={`maoni-thread-step maoni-thread-step--workflow ${
                    trailEnd ? "maoni-thread-step--trail-end" : ""
                  }`}
                >
                  <div className="maoni-thread-step__rail" aria-hidden>
                    <span className="maoni-thread-step__dot maoni-thread-step__dot--workflow" />
                    <span className="maoni-thread-step__connector" />
                  </div>
                  <div className="maoni-thread-step__panel">
                    <div className="d-flex flex-wrap align-items-start gap-2 mb-1 w-100">
                      <i className={`bx ${icon} maoni-thread-workflow-icon`} aria-hidden />
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex flex-wrap align-items-center gap-2 min-w-0">
                          <span className="badge rounded-pill maoni-thread-pill-workflow">Workflow action</span>
                          <strong className="text-dark">{entry.workflowLabel}</strong>
                          <small className="text-muted">{formatDate(c.created_at)}</small>
                        </div>
                        <div className="small text-muted mt-1">
                          Recorded by <span className="fw-semibold">{c.commented_by_name || "—"}</span>
                        </div>
                        {entry.workflowReason ? (
                          <div className="maoni-thread-body-text mt-2 mb-0">{entry.workflowReason}</div>
                        ) : (
                          <p className="text-muted small fst-italic mb-0 mt-2">No reason text after the tag.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`staff-${rowUid}`}
                className={`maoni-thread-step maoni-thread-step--message ${
                  c.is_hr_reply ? "maoni-thread-step--official" : ""
                } ${trailEnd ? "maoni-thread-step--trail-end" : ""}`}
              >
                <div className="maoni-thread-step__rail" aria-hidden>
                  <span
                    className={`maoni-thread-step__dot ${
                      c.is_hr_reply ? "maoni-thread-step__dot--official" : "maoni-thread-step__dot--message"
                    }`}
                  />
                  <span className="maoni-thread-step__connector" />
                </div>
                <div className="maoni-thread-step__panel">
                  <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-2">
                    <div>
                      <strong className={c.is_hr_reply ? "text-danger" : "text-primary"}>
                        {c.is_hr_reply && <span className="me-1">Official ·</span>}
                        {c.commented_by_name}
                      </strong>
                      <small className="text-muted ms-2">{formatDate(c.created_at)}</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      {canReply && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link p-0 text-decoration-none"
                          onClick={() => {
                            setReplyComposeOpen(false);
                            setReplyingTo(rowUid);
                            setReplyText("");
                          }}
                        >
                          <i className="bi bi-reply me-1"></i>
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="maoni-thread-body-text mb-2">{c.comment}</p>
                  {replyingTo === rowUid && (
                    <div className="mt-2 pt-2 border-top">
                      <textarea
                        className="form-control form-control-sm mb-2"
                        rows={3}
                        placeholder="Internal note to handler / reviewer…"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => handleReply(rowUid)}
                        disabled={submittingReply}
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LinearIndeterminate />;
  }

  if (!suggestion) {
    return null;
  }

  const publicThreadEntriesVisible = reviewerCollapsiblePublicThread
    ? contributorFollowUpsExpanded
    : repliesBelowOriginalExpanded;

  const openingUsesTrailEnd =
    !hasStaffInternalView &&
    (threadEntries.length === 0 ||
      (threadEntries.length > 2 && !publicThreadEntriesVisible));

  const publicTimelineHasVisibleEntries =
    threadEntries.length > 0 && publicThreadEntriesVisible;

  const lastStaffTrailEnd = hasStaffInternalView && !publicTimelineHasVisibleEntries;

  const showPublicThreadToggle =
    threadEntries.length > 0 &&
    (reviewerCollapsiblePublicThread || threadEntries.length > 2);

  const showPublicThreadEntries = threadEntries.length > 0 && publicThreadEntriesVisible;

  return (
    <div className="w-100 py-4">
      <MaoniPortalBreadcrumb onBack={goBackToList} tailLabel="View" />

      <div
        className="card border-0 shadow-sm mb-4 maoni-email-header-card"
        style={{ background: "linear-gradient(135deg, #f7fffb 0%, #eef8ff 100%)" }}
      >
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div className="maoni-email-title-row flex-grow-1 min-w-0">
              <div
                className="maoni-email-title-icon rounded d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #ddf8ea 0%, #d9f0ff 100%)",
                  border: "1px solid #cdeedd",
                }}
              >
                <i className="bi bi-envelope-paper text-success" style={{ fontSize: "1.35rem" }} aria-hidden />
              </div>
              <div className="maoni-email-title-block min-w-0">
                <h2 className="maoni-email-title-text mb-1 text-break">{suggestion.title}</h2>
                <p className="text-muted small mb-2">
                  Read like an email thread: original message, then every reply and workflow action in order.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span
                    className={statusBadgeClass(suggestion.status)}
                    style={statusBadgeStyle(suggestion.status)}
                    title={
                      normalizeWorkflowStatus(suggestion.status) === "UNDER_HANDLER_REVIEW"
                        ? "A handler opened this suggestion — department is now working on it. You can post follow-ups in the thread."
                        : undefined
                    }
                  >
                    {statusBadgeLabel(suggestion.status)}
                  </span>
                  <span className="badge text-warning border" style={{ backgroundColor: "#fef3c7" }}>
                    {String(suggestion.priority || "").toUpperCase()}
                  </span>
                  <span className="badge bg-light text-dark border">
                    <i className="bi bi-chat-dots me-1"></i>
                    {suggestion.comment_count || 0}{" "}
                    {suggestion.comment_count === 1 ? "reply" : "replies"}
                  </span>
                </div>
              </div>
            </div>
            <div className="maoni-email-meta-row d-flex flex-wrap align-items-stretch justify-content-end gap-3 gap-md-4 text-md-end flex-shrink-0">
              <div className="maoni-email-meta-item" style={{ maxWidth: "11rem" }}>
                <span className="maoni-email-meta-label">Follow-up</span>
                {handlerEscalationInfo ? (
                  <span
                    className={`maoni-email-meta-value small fw-semibold ${
                      handlerEscalationInfo.isOverdue
                        ? "text-danger"
                        : handlerEscalationInfo.remainingDays <= 1
                        ? "text-warning"
                        : "text-success"
                    }`}
                  >
                    {handlerEscalationInfo.isOverdue
                      ? `${handlerEscalationInfo.overdueDays}d overdue`
                      : `${handlerEscalationInfo.remainingDays}d left`}
                    <span className="d-block fw-normal text-muted" style={{ fontSize: "0.72rem" }}>
                      Due {formatDate(handlerEscalationInfo.dueDate.toISOString())}
                    </span>
                  </span>
                ) : (
                  <span className="maoni-email-meta-value small text-muted">No handler SLA on this stage</span>
                )}
              </div>
              {isMaoniReviewerUser && (
                <div className="d-flex align-items-end">
                  <button type="button" className="btn btn-sm btn-outline-success" onClick={handlePrint}>
                    <i className="bx bx-printer me-1" aria-hidden />
                    Print
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="card border-0 shadow-sm mb-0 maoni-thread-card">
            <div
              className="card-header border-0 d-flex flex-wrap justify-content-between align-items-center gap-2 py-3"
              style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)" }}
            >
              <div>
                <h5 className="mb-0 d-flex align-items-center text-dark">
                  <i className="bi bi-envelope-open me-2 text-primary"></i>
                  {hasStaffInternalView ? "Contributor-visible thread" : "Communication thread"}
                </h5>
                {hasStaffInternalView ? (
                  <p className="text-muted small mb-0 mt-1" style={{ maxWidth: "36rem" }}>
                    Messages the contributor can see (clarifications and official replies to them).
                  </p>
                ) : null}
              </div>
              <span className="badge bg-white text-secondary border">
                {threadEntries.length} update{threadEntries.length === 1 ? "" : "s"} after submission
              </span>
            </div>
            <div className="card-body p-0">
              <div className="maoni-thread-list maoni-thread-timeline">
                <div
                  className={`maoni-thread-step maoni-thread-step--opening ${
                    openingUsesTrailEnd ? "maoni-thread-step--trail-end" : ""
                  }`}
                >
                  <div className="maoni-thread-step__rail" aria-hidden>
                    <span className="maoni-thread-step__dot maoni-thread-step__dot--opening" />
                    <span className="maoni-thread-step__connector" />
                  </div>
                  <div className="maoni-thread-step__panel">
                    <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-2">
                      <div>
                        <span className="badge rounded-pill maoni-thread-pill-opening mb-1">Original message</span>
                        <div className="fw-semibold text-dark">
                          {suggestion.submitted_by_name || "Anonymous"}
                          <span className="text-muted fw-normal small ms-2">
                            {formatDate(suggestion.submitted_at || suggestion.created_at)}
                          </span>
                        </div>
                        <div className="maoni-thread-flow-eyebrow d-flex align-items-center flex-wrap gap-1 mt-1">
                          <span className="text-uppercase fw-semibold">From</span>
                          <i className="bx bx-chevrons-right text-success" style={{ fontSize: "1rem" }} aria-hidden />
                          <span className="text-uppercase fw-semibold">Thread</span>
                        </div>
                      </div>
                      <div className="d-flex flex-wrap align-items-center gap-2 justify-content-end">
                        {suggestionHasCharts && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center rounded-2 p-2"
                            title="View charts and embedded figures"
                            aria-label="View charts and embedded figures"
                            onClick={() => setChartsModalOpen(true)}
                          >
                            <i className="bx bx-bar-chart-alt-2 fs-5 lh-1" aria-hidden />
                          </button>
                        )}
                        {workflowActions.length > 0 &&
                          workflowActions.map((action) => {
                            const isWfSelected = pendingWorkflowAction === action.status;
                            return (
                            <button
                              key={action.status}
                              type="button"
                              className="btn btn-sm fw-semibold px-2 px-sm-3 rounded-pill d-inline-flex align-items-center gap-1 gap-sm-2 maoni-thread-workflow-inline-btn"
                              disabled={submittingReply}
                              onClick={() => {
                                if (pendingWorkflowAction === action.status) {
                                  setPendingWorkflowAction(null);
                                  return;
                                }
                                setWorkflowNote("");
                                setPendingWorkflowAction(action.status);
                              }}
                              title={
                                isWfSelected
                                  ? "Click again to hide the reason field"
                                  : `${action.label} — add reason below the message`
                              }
                              aria-pressed={isWfSelected}
                              style={{
                                border: isWfSelected ? "2px solid #14532d" : "1px solid #86efac",
                                background: isWfSelected
                                  ? "linear-gradient(180deg, #d1fae5 0%, #bbf7d0 100%)"
                                  : "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)",
                                color: "#14532d",
                                boxShadow: isWfSelected
                                  ? "0 0 0 3px rgba(20, 83, 45, 0.2)"
                                  : "0 1px 3px rgba(21, 128, 61, 0.1)",
                                maxWidth: "min(100%, 14rem)",
                              }}
                            >
                              <i
                                className={`bx ${workflowActionIconClass(action.status)} flex-shrink-0`}
                                style={{ fontSize: "1.05rem" }}
                                aria-hidden
                              />
                              <span className="text-truncate">{action.label}</span>
                            </button>
                            );
                          })}
                        {canOpenMainReplyComposer && (
                          <button
                            type="button"
                            className={`btn btn-sm d-inline-flex align-items-center gap-2 rounded-2 px-2 py-1 ${
                              canSeekClarificationFromSender
                                ? "btn-outline-primary"
                                : "btn-primary text-white shadow-sm maoni-reply-trigger-btn"
                            } ${replyComposeOpen && !replyingTo ? "active" : ""}`}
                            title={
                              canSeekClarificationFromSender
                                ? "Write to the contributor (opens reply below)"
                                : "Add your reply (opens below)"
                            }
                            onClick={openMainReplyCompose}
                          >
                            <i
                              className={
                                canSeekClarificationFromSender
                                  ? "bx bx-help-circle"
                                  : "bx bx-message-rounded-dots"
                              }
                              style={{ fontSize: "1.1rem" }}
                              aria-hidden
                            />
                            {canSeekClarificationFromSender
                              ? "Seek clarification"
                              : "Add reply"}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="maoni-thread-body-text">{stripHtml(suggestion.description)}</div>

                    {pendingWorkflowAction && workflowActions.some((a) => a.status === pendingWorkflowAction) && (
                      <div
                        className="mt-3 p-3"
                        style={workflowPendingPanelShellStyle(pendingWorkflowAction)}
                      >
                        <div className="small fw-semibold text-uppercase mb-2" style={{ letterSpacing: "0.04em" }}>
                          Workflow action reason
                          <span className="fw-normal text-body ms-2 text-capitalize" style={{ letterSpacing: "normal" }}>
                            —{" "}
                            {workflowActions.find((a) => a.status === pendingWorkflowAction)?.label ||
                              pendingWorkflowAction}
                          </span>
                        </div>
                        <textarea
                          ref={workflowReasonTextareaRef}
                          id="maoni-workflow-note-opening"
                          className="form-control form-control-sm bg-white mb-2"
                          rows={3}
                          placeholder="Explain your decision (e.g. why you are approving or rejecting, or why you are escalating)…"
                          value={workflowNote}
                          onChange={(e) => setWorkflowNote(e.target.value)}
                          disabled={submittingReply}
                        />
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            disabled={submittingReply || !workflowNote.trim()}
                            onClick={() => handleWorkflowAction(pendingWorkflowAction)}
                          >
                            Submit action
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            disabled={submittingReply}
                            onClick={() => {
                              setPendingWorkflowAction(null);
                              setWorkflowNote("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {canOpenMainReplyComposer && !replyingTo && replyComposeOpen && (
                      <div className="mt-3 pt-3 border-top maoni-thread-compose bg-light rounded-2 px-3 py-3">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                          <span className="small fw-semibold text-muted text-uppercase">
                            {canSeekClarificationFromSender
                              ? "Seek clarification"
                              : "Add a reply"}
                          </span>
                          {suggestionHasCharts && (
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-decoration-none"
                              onClick={() => setChartsModalOpen(true)}
                            >
                              <i className="bx bx-bar-chart-alt-2 me-1" aria-hidden />
                              View charts
                            </button>
                          )}
                        </div>
                        <textarea
                          className="form-control mb-2"
                          rows={4}
                          placeholder={
                            canSeekClarificationFromSender
                              ? "Ask the contributor for the details you need…"
                              : composeThreadScope === "STAFF"
                              ? "Internal note to handler / reviewer (not shown to contributor)…"
                              : "Write your reply…"
                          }
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        {(isHandler || isMaoniReviewerUser || isAdmin) && !canSeekClarificationFromSender && (
                            <div className="form-check form-check-inline mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="maoni-compose-internal-only"
                                checked={composeThreadScope === "STAFF"}
                                onChange={(e) =>
                                  setComposeThreadScope(e.target.checked ? "STAFF" : "CONTRIBUTOR")
                                }
                                disabled={submittingReply}
                              />
                              <label
                                className="form-check-label small text-muted"
                                htmlFor="maoni-compose-internal-only"
                              >
                                Internal only (staff channel — not visible to contributor)
                              </label>
                            </div>
                          )}
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleReply()}
                            disabled={submittingReply || !replyText.trim()}
                          >
                            {submittingReply ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" />
                                Sending…
                              </>
                            ) : (
                              <>
                                <i className="bi bi-send me-2" aria-hidden />
                                Send reply
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={closeMainReplyCompose}
                            disabled={submittingReply}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {renderStaffInternalEmbed(lastStaffTrailEnd)}

                {threadEntries.length > 0 && (
                  <div
                    className={`maoni-thread-replies-toggle-row d-flex align-items-center gap-2 px-3 py-2 ${
                      showPublicThreadToggle ? "justify-content-between" : "justify-content-start"
                    }`}
                  >
                    <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                      <i
                        className="bx bx-bar-chart-alt-2 text-success flex-shrink-0"
                        style={{ fontSize: "1.15rem" }}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <div
                          className="small fw-semibold text-dark text-truncate mb-0 text-uppercase maoni-thread-replies-toggle-title"
                          style={{ letterSpacing: "0.1em" }}
                          title="Between handler and contributor — shared visible thread"
                        >
                          Between handler and contributor
                        </div>
                        <div
                          className="text-truncate mb-0"
                          style={{ fontSize: "0.72rem", color: "#5b5675", maxWidth: "46rem" }}
                          title={
                            hasStaffInternalView
                              ? "This thread is the channel between department handlers and the contributor: replies, workflow steps, and charts/figures they can see."
                              : "Replies and workflow after the original message."
                          }
                        >
                          {currentStatus === "HANDLER_RESPONDED_TO_CONTRIBUTOR"
                            ? "Official handler replies and clarification requests to the contributor appear here."
                            : hasStaffInternalView
                            ? "Charts, replies & workflow here sit between the handler and the contributor (both sides use this visible thread)."
                            : "Replies & workflow after submission — expand to read the full thread."}
                        </div>
                      </div>
                    </div>
                    {showPublicThreadToggle && (
                      <button
                        type="button"
                        className="btn btn-light border rounded-circle shadow-sm d-inline-flex align-items-center justify-content-center maoni-thread-replies-toggle-btn flex-shrink-0"
                        onClick={() => {
                          if (reviewerCollapsiblePublicThread) {
                            setContributorFollowUpsExpanded((v) => !v);
                          } else {
                            setRepliesBelowOriginalExpanded((v) => !v);
                          }
                        }}
                        aria-expanded={publicThreadEntriesVisible}
                        title={
                          publicThreadEntriesVisible
                            ? "Hide contributor-visible messages"
                            : reviewerCollapsiblePublicThread
                            ? "Show contributor-visible messages"
                            : "Expand replies"
                        }
                        aria-label={
                          publicThreadEntriesVisible
                            ? "Hide contributor-visible messages"
                            : reviewerCollapsiblePublicThread
                            ? "Show contributor-visible messages"
                            : "Expand replies"
                        }
                      >
                        <i
                          className={`bx fs-4 text-success ${
                            publicThreadEntriesVisible ? "bx-chevron-up" : "bx-chevron-down"
                          }`}
                          aria-hidden
                        />
                      </button>
                    )}
                  </div>
                )}

                {showPublicThreadEntries && (
                  <>
                    {threadEntries.length === 0 && (
                      <div className="maoni-thread-timeline-hint px-4 py-3 text-muted small border-top">
                        No replies or workflow actions yet — only the original message appears above.
                      </div>
                    )}

                    {threadEntries.map((entry, entryIndex) => {
                  const c = entry.comment;
                  const indent = Math.min(entry.depth, 4) * 14;
                  const trailEnd = entryIndex === threadEntries.length - 1;
                  if (entry.kind === "workflow") {
                    const icon = workflowActionIconClass(entry.workflowStatusKey || "UNDER_HANDLER_REVIEW");
                    return (
                      <div
                        key={c.uid}
                        className={`maoni-thread-step maoni-thread-step--workflow ${
                          trailEnd ? "maoni-thread-step--trail-end" : ""
                        }`}
                        style={{ marginLeft: indent }}
                      >
                        <div className="maoni-thread-step__rail" aria-hidden>
                          <span className="maoni-thread-step__dot maoni-thread-step__dot--workflow" />
                          <span className="maoni-thread-step__connector" />
                        </div>
                        <div className="maoni-thread-step__panel">
                          <div className="d-flex flex-wrap align-items-start gap-2 mb-1">
                            <i className={`bx ${icon} maoni-thread-workflow-icon`} aria-hidden />
                            <div className="flex-grow-1 min-w-0">
                              <div className="d-flex flex-wrap align-items-center gap-2">
                                <span className="badge rounded-pill maoni-thread-pill-workflow">Workflow action</span>
                                <strong className="text-dark">{entry.workflowLabel}</strong>
                                <small className="text-muted">{formatDate(c.created_at)}</small>
                              </div>
                              <div className="small text-muted mt-1">
                                Recorded by <span className="fw-semibold">{c.commented_by_name || "—"}</span>
                              </div>
                              {entry.workflowReason ? (
                                <div className="maoni-thread-body-text mt-2 mb-0">{entry.workflowReason}</div>
                              ) : (
                                <p className="text-muted small fst-italic mb-0 mt-2">No reason text after the tag.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={c.uid}
                      className={`maoni-thread-step maoni-thread-step--message ${
                        c.is_hr_reply ? "maoni-thread-step--official" : ""
                      } ${trailEnd ? "maoni-thread-step--trail-end" : ""}`}
                      style={{ marginLeft: indent }}
                    >
                      <div className="maoni-thread-step__rail" aria-hidden>
                        <span
                          className={`maoni-thread-step__dot ${
                            c.is_hr_reply
                              ? "maoni-thread-step__dot--official"
                              : "maoni-thread-step__dot--message"
                          }`}
                        />
                        <span className="maoni-thread-step__connector" />
                      </div>
                      <div className="maoni-thread-step__panel">
                        <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-2">
                          <div>
                            <strong className={c.is_hr_reply ? "text-danger" : "text-primary"}>
                              {c.is_hr_reply && <span className="me-1">Official ·</span>}
                              {c.commented_by_name}
                            </strong>
                            <small className="text-muted ms-2">{formatDate(c.created_at)}</small>
                          </div>
                          {canReply && (
                            <button
                              type="button"
                              className="btn btn-sm btn-link p-0 text-decoration-none"
                              onClick={() => {
                                setReplyComposeOpen(false);
                                setReplyingTo(c.uid);
                                setReplyText("");
                              }}
                            >
                              <i className="bi bi-reply me-1"></i>
                              Reply
                            </button>
                          )}
                        </div>
                        <p className="maoni-thread-body-text mb-2">{c.comment}</p>
                        {replyingTo === c.uid && (
                          <div className="mt-2 pt-2 border-top">
                            <textarea
                              className="form-control form-control-sm mb-2"
                              rows={3}
                              placeholder="Write your reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleReply(c.uid)}
                              disabled={submittingReply}
                            >
                              Send
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

          {/* Suggestion flow (metadata + icons) */}
          <div
            className="card border-0 mt-5 mb-4"
            style={{
              borderRadius: "14px",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              boxShadow:
                "0 4px 32px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)",
              background: "#fff",
              overflow: "hidden",
            }}
          >
            <div
              className="px-3 px-md-4 pt-4 pb-3"
              style={{
                background: "linear-gradient(165deg, #f1f5f9 0%, #ffffff 50%, #f8fdfb 100%)",
              }}
            >
              <div className="mb-3 mb-md-4">
                <span
                  className="d-block text-uppercase fw-semibold mb-1"
                  style={{
                    fontSize: "0.68rem",
                    letterSpacing: "0.14em",
                    color: "#64748b",
                  }}
                >
                  Suggestion flow
                </span>
                {currentStatus === "DRAFT" ? (
                  <p className="mb-0 small" style={{ color: "#94a3b8", maxWidth: "42rem" }}>
                    Draft — not submitted yet. Submit from the suggestions list when ready.
                  </p>
                ) : (
                  <>
                    <p className="mb-0 small" style={{ color: "#64748b", maxWidth: "42rem" }}>
                      {flowHint}
                    </p>
                    <details className="mt-2 maoni-workflow-reference">
                      <summary className="small fw-semibold text-primary" style={{ cursor: "pointer" }}>
                        Maoni workflow (reference)
                      </summary>
                      <div
                        className="mt-2 small text-muted border rounded-3 p-3 bg-white"
                        style={{ maxWidth: "44rem", lineHeight: 1.55 }}
                      >
                        <p className="mb-2 fw-semibold text-dark small">
                          When a department handler opens a new <strong>Submitted</strong> suggestion, it
                          automatically moves to <strong>In progress</strong> (
                          <span className="text-nowrap">Under handler review</span>) so the contributor can
                          keep posting follow-ups in the communication thread.
                        </p>
                        <p className="mb-1 fw-semibold text-secondary text-uppercase" style={{ fontSize: "0.65rem" }}>
                          Supported path (simplified)
                        </p>
                        <ol className="mb-0 ps-3">
                          <li>
                            <strong>Submitted</strong> (contributor) → first handler open →{" "}
                            <strong>In progress</strong> / Under handler review
                          </li>
                          <li>
                            Under handler review → escalate (timer / policy) →{" "}
                            <strong>Escalated to reviewer</strong>
                          </li>
                          <li>Reviewer may return with instructions → <strong>Returned to handler</strong></li>
                          <li>
                            Handler responds to reviewer and/or contributor; may seek clarification; may close
                          </li>
                          <li>
                            <strong>Closed</strong> (approved or rejected)
                          </li>
                        </ol>
                        <p className="mb-1 mt-3 fw-semibold text-secondary text-uppercase" style={{ fontSize: "0.65rem" }}>
                          When does Maoni continue?
                        </p>
                        <ul className="mb-0 ps-3 small">
                          <li>
                            <strong className="text-dark">In progress</strong> — The case continues while the
                            department uses the workflow buttons (escalate, respond, close, etc.) and people post
                            in the <strong>communication thread</strong> below.
                          </li>
                          <li>
                            <strong className="text-dark">Submitted</strong> (before any handler has opened it) —
                            Only the queue moves forward once a <strong>handler opens this page</strong>; then it
                            becomes in progress and the thread opens for follow-ups the same way.
                          </li>
                          <li>
                            <strong className="text-dark">Escalated / returned</strong> — The flow continues when
                            the <strong>reviewer</strong> or <strong>handler</strong> records the next workflow
                            action (you will see those steps as cards in the thread and in the handler/reviewer
                            tools).
                          </li>
                          <li>
                            <strong className="text-dark">Stopped</strong> — Maoni does <em>not</em> continue after{" "}
                            <strong>Closed</strong> (approved or rejected), or if clarification was closed after a
                            direct handler response to the contributor (then new contributor replies may be
                            limited).
                          </li>
                        </ul>
                      </div>
                    </details>
                  </>
                )}
              </div>

              {currentStatus !== "DRAFT" && (
                <>
                  <div className="row g-3">
                    {SUGGESTION_FLOW_STEPS.map((step, i) => {
                      const activeIdx = flowIndex;
                      const lastIdx = SUGGESTION_FLOW_STEPS.length - 1;
                      const isDone =
                        i < activeIdx || (activeIdx === lastIdx && i <= activeIdx);
                      const isCurrent = i === activeIdx && activeIdx < lastIdx;
                      const borderColor = isDone
                        ? "#22c55e"
                        : isCurrent
                        ? "#16a34a"
                        : "#e2e8f0";
                      const flowCardTone = isCurrent ? "current" : isDone ? "done" : "pending";

                      const submittedWhen = formatDate(
                        suggestion.submitted_at || suggestion.created_at
                      );
                      const deptLine =
                        departmentLabel ||
                        (suggestion.department_uid
                          ? `Linked department (ID: ${String(suggestion.department_uid).slice(0, 8)}…)`
                          : "No department linked yet");
                      const deptActivity = lastDepartmentResponderName
                        ? `Last department-side reply: ${lastDepartmentResponderName}`
                        : "No department replies logged yet.";
                      const reviewerLine = "PPAA reviewer team";
                      const reviewerActivity = lastOfficialReviewerName
                        ? `Official reviewer reply: ${lastOfficialReviewerName}`
                        : "No official reviewer reply logged yet.";
                      const resolvedOutcome =
                        currentStatus === "CLOSED_APPROVED"
                          ? "Approved"
                          : currentStatus === "CLOSED_REJECTED"
                          ? "Rejected"
                          : null;
                      const resolvedWhen = resolvedOutcome
                        ? formatDate(suggestion.updated_at || suggestion.created_at)
                        : null;

                      let lineA = "";
                      let lineB = "";
                      if (step.key === "submitted") {
                        lineA = `Submitted by ${suggestion.submitted_by_name || "Anonymous"}`;
                        lineB = submittedWhen;
                      } else if (step.key === "department") {
                        lineA = deptLine;
                        lineB = deptActivity;
                      } else if (step.key === "reviewer") {
                        lineA = reviewerLine;
                        lineB = reviewerActivity;
                      } else {
                        lineA = resolvedOutcome || "Awaiting closure";
                        lineB = resolvedWhen || "Outcome recorded when closed";
                      }

                      return (
                        <div key={step.key} className="col-12 col-sm-6 col-xl-3">
                          <div
                            className={`maoni-flow-step-card maoni-flow-step-card--${flowCardTone} h-100 rounded-3 p-3 d-flex flex-column`}
                            style={{
                              borderLeft: `4px solid ${borderColor}`,
                              boxShadow: isCurrent
                                ? "0 4px 20px rgba(22, 163, 74, 0.12), 0 0 0 1px rgba(22, 163, 74, 0.12)"
                                : "0 1px 3px rgba(15, 23, 42, 0.05)",
                              minHeight: "168px",
                            }}
                          >
                            <div className="d-flex align-items-start gap-2 mb-2">
                              <div
                                className="maoni-flow-step-icon-wrap rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{
                                  width: 44,
                                  height: 44,
                                  background: isDone
                                    ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                                    : isCurrent
                                    ? "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
                                    : "#e2e8f0",
                                  color: isDone ? "#fff" : isCurrent ? "#14532d" : "#64748b",
                                  boxShadow: isCurrent
                                    ? "inset 0 1px 0 rgba(255,255,255,0.6)"
                                    : "none",
                                }}
                                title={step.hint}
                              >
                                <i className={`bx ${step.icon}`} style={{ fontSize: "1.35rem" }} aria-hidden />
                              </div>
                              <div className="flex-grow-1 min-w-0">
                                <div className="d-flex align-items-center justify-content-between gap-1">
                                  <span
                                    className="fw-bold text-truncate"
                                    style={{
                                      fontSize: "0.82rem",
                                      color: isCurrent ? "#14532d" : "#0f172a",
                                    }}
                                  >
                                    {step.label}
                                  </span>
                                  <span
                                    className="badge rounded-pill flex-shrink-0"
                                    style={{
                                      fontSize: "0.62rem",
                                      fontWeight: 700,
                                      letterSpacing: "0.04em",
                                      background: isDone
                                        ? "#dcfce7"
                                        : isCurrent
                                        ? "#bbf7d0"
                                        : "#f1f5f9",
                                      color: isDone ? "#166534" : isCurrent ? "#14532d" : "#64748b",
                                    }}
                                  >
                                    {isDone ? "Done" : isCurrent ? "Current" : "Upcoming"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p
                              className="mb-1 small fw-semibold"
                              style={{ color: "#334155", lineHeight: 1.45 }}
                            >
                              {lineA}
                            </p>
                            <p className="mb-0 small" style={{ color: "#64748b", lineHeight: 1.45 }}>
                              {lineB}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-1">
                    <div
                      className="rounded-pill overflow-hidden"
                      style={{ height: 6, background: "#e2e8f0" }}
                    >
                      <div
                        className="h-100 rounded-pill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(8, ((flowIndex + 1) / SUGGESTION_FLOW_STEPS.length) * 100)
                          )}%`,
                          background: "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)",
                          transition: "width 0.35s ease",
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

      {chartsModalOpen && suggestion && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="maoniChartsModalTitle"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
          onClick={() => setChartsModalOpen(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title" id="maoniChartsModalTitle">
                  <i className="bx bx-bar-chart-alt-2 me-2 text-primary" aria-hidden />
                  Charts & embedded figures
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setChartsModalOpen(false)}
                />
              </div>
              <div
                className="modal-body maoni-charts-modal-body py-3"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(suggestion.description || ""),
                }}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .maoni-email-header-card .maoni-email-title-row {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          column-gap: 0.85rem;
          row-gap: 0.35rem;
          align-items: start;
          /* Title block (icon + copy) spans at most 8/12 of the header row */
          max-width: 66.6667%;
          box-sizing: border-box;
        }
        .maoni-email-header-card .maoni-email-title-icon {
          width: 2.75rem;
          height: 2.75rem;
          min-width: 2.75rem;
          min-height: 2.75rem;
          padding: 0.45rem;
        }
        .maoni-email-header-card .maoni-email-title-text {
          font-size: clamp(0.95rem, 2.1vw, 1.15rem);
          font-weight: 600;
          line-height: 1.35;
          letter-spacing: -0.01em;
          color: #0f172a;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        @media (max-width: 767.98px) {
          .maoni-email-header-card .maoni-email-title-row {
            max-width: 100%;
          }
          .maoni-email-header-card .maoni-email-meta-row {
            width: 100%;
            justify-content: flex-start !important;
            text-align: left !important;
          }
        }
        .maoni-email-meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }
        .maoni-email-meta-label {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
        }
        .maoni-email-meta-value {
          font-size: 0.9rem;
          color: #0f172a;
          line-height: 1.35;
        }
        .maoni-thread-list.maoni-thread-timeline {
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 40%);
        }
        /* Space between contributor thread (original + charts/actions) and internal staff strip,
           and between that strip and the contributor-replies expand row — same page from exec/handler dashboards. */
        .maoni-thread-card .maoni-thread-staff-embed {
          margin-top: 1.75rem;
          margin-bottom: 1.75rem;
        }
        .maoni-thread-timeline-hint {
          background: #fff;
        }
        .maoni-thread-card--staff {
          border: 1px solid rgba(251, 191, 36, 0.45) !important;
        }
        .maoni-thread-card--staff .maoni-thread-list.maoni-thread-timeline {
          background: linear-gradient(180deg, #fffbeb 0%, #ffffff 45%);
        }
        .maoni-thread-step {
          display: flex;
          align-items: stretch;
          min-width: 0;
        }
        .maoni-thread-step__rail {
          width: 2.35rem;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 1.2rem;
        }
        .maoni-thread-step__dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
          z-index: 2;
          box-shadow: 0 0 0 3px #fff, 0 0 0 5px rgba(148, 163, 184, 0.25);
        }
        .maoni-thread-step__dot--opening {
          background: linear-gradient(145deg, #4ade80 0%, #15803d 100%);
          box-shadow: 0 0 0 3px #fff, 0 0 0 5px rgba(34, 197, 94, 0.35);
        }
        .maoni-thread-step__dot--message {
          background: linear-gradient(145deg, #93c5fd 0%, #1d4ed8 100%);
          box-shadow: 0 0 0 3px #fff, 0 0 0 5px rgba(37, 99, 235, 0.28);
        }
        .maoni-thread-step__dot--official {
          background: linear-gradient(145deg, #fca5a5 0%, #b91c1c 100%);
          box-shadow: 0 0 0 3px #fff, 0 0 0 5px rgba(220, 38, 38, 0.35);
        }
        .maoni-thread-step__dot--workflow {
          background: linear-gradient(145deg, #fdba74 0%, #c2410c 100%);
          box-shadow: 0 0 0 3px #fff, 0 0 0 5px rgba(234, 88, 12, 0.3);
        }
        .maoni-thread-step__connector {
          flex: 1 1 auto;
          width: 2px;
          min-height: 1.1rem;
          margin-top: 0.4rem;
          border-radius: 99px;
          background: linear-gradient(180deg, #94a3b8 0%, #cbd5e1 45%, #e2e8f0 100%);
          opacity: 0.9;
        }
        .maoni-thread-step--trail-end .maoni-thread-step__connector {
          display: none;
        }
        .maoni-thread-step__panel {
          flex: 1;
          min-width: 0;
          padding: 1rem 0.85rem 1.2rem 0.4rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .maoni-thread-step--trail-end .maoni-thread-step__panel {
          border-bottom: none;
          padding-bottom: 1.35rem;
        }
        .maoni-thread-step--opening .maoni-thread-step__panel {
          background: linear-gradient(100deg, rgba(240, 253, 244, 0.7) 0%, #ffffff 42%);
          border-radius: 0 12px 12px 0;
          margin-top: 0.15rem;
          margin-bottom: 0.15rem;
          border: 1px solid rgba(34, 197, 94, 0.22);
          border-left: none;
          padding-left: 1rem;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }
        .maoni-thread-replies-toggle-row {
          min-height: 2.5rem;
          background: linear-gradient(180deg, #f3f0ff 0%, #ede9fe 45%, #e9e2f8 100%);
          border-top: 1px solid rgba(124, 58, 237, 0.14);
          border-bottom: 1px solid rgba(124, 58, 237, 0.1);
        }
        .maoni-thread-replies-toggle-title {
          font-size: 0.8125rem;
          word-spacing: 0.12em;
        }
        .maoni-thread-replies-toggle-btn {
          width: 2.25rem;
          height: 2.25rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .maoni-thread-replies-toggle-btn:hover {
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12) !important;
        }
        .maoni-thread-replies-toggle-btn:focus-visible {
          outline: 2px solid var(--bs-primary);
          outline-offset: 2px;
        }
        .maoni-thread-step--message .maoni-thread-step__panel {
          background: linear-gradient(100deg, rgba(239, 246, 255, 0.55) 0%, #ffffff 38%);
          border-radius: 0 12px 12px 0;
          margin-top: 0.15rem;
          margin-bottom: 0.15rem;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-left: none;
          padding-left: 1rem;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }
        .maoni-thread-step--official .maoni-thread-step__panel {
          background: linear-gradient(100deg, rgba(254, 242, 242, 0.65) 0%, #ffffff 42%);
          border-color: rgba(248, 113, 113, 0.28);
        }
        .maoni-thread-step--workflow .maoni-thread-step__panel {
          background: linear-gradient(100deg, rgba(255, 247, 237, 0.75) 0%, #ffffff 40%);
          border-radius: 0 12px 12px 0;
          margin-top: 0.15rem;
          margin-bottom: 0.15rem;
          border: 1px solid rgba(251, 191, 36, 0.25);
          border-left: none;
          padding-left: 1rem;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }
        .maoni-thread-flow-eyebrow {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: #64748b;
        }
        .maoni-thread-body-text {
          white-space: pre-wrap;
          line-height: 1.65;
          font-size: 0.95rem;
          color: #334155;
        }
        .maoni-thread-pill-opening {
          background: #dcfce7;
          color: #166534;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .maoni-thread-pill-workflow {
          background: #ffedd5;
          color: #9a3412;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }
        .maoni-thread-workflow-icon {
          font-size: 1.5rem;
          color: #c2410c;
          margin-top: 0.1rem;
        }
        .maoni-staff-timeline-toggle {
          background: #fff !important;
          box-shadow: 0 2px 8px rgba(15, 83, 50, 0.12), 0 1px 2px rgba(35, 52, 70, 0.06);
          transition: box-shadow 0.2s ease, transform 0.15s ease;
        }
        .maoni-staff-timeline-toggle:hover {
          box-shadow: 0 3px 12px rgba(15, 83, 50, 0.18), 0 2px 4px rgba(35, 52, 70, 0.08);
        }
        .maoni-staff-timeline-toggle:focus-visible {
          outline: 2px solid #00853f;
          outline-offset: 2px;
        }
        .maoni-staff-timeline-toggle .bx {
          color: #0d4f2d;
        }
        .maoni-staff-internal-title {
          word-spacing: 0.1em;
        }
        .maoni-thread-compose textarea {
          max-width: 100%;
        }
        .maoni-charts-modal-body img,
        .maoni-charts-modal-body svg,
        .maoni-charts-modal-body canvas {
          max-width: 100%;
          height: auto;
        }
        .maoni-charts-modal-body {
          max-height: min(70vh, 720px);
          overflow: auto;
        }
        .maoni-flow-step-card {
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.28s ease,
            filter 0.28s ease, background 0.28s ease, opacity 0.28s ease;
          cursor: default;
        }
        .maoni-flow-step-card--done {
          background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
        }
        .maoni-flow-step-card--current {
          background: #ffffff;
        }
        .maoni-flow-step-card--pending {
          background: #f8fafc;
          opacity: 0.94;
        }
        .maoni-flow-step-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 14px 38px rgba(15, 23, 42, 0.11), 0 0 0 1px rgba(22, 163, 74, 0.2) !important;
          filter: saturate(1.06);
        }
        .maoni-flow-step-card--done:hover,
        .maoni-flow-step-card--current:hover {
          background: linear-gradient(165deg, #bbf7d0 0%, #ecfdf5 48%, #ffffff 100%) !important;
        }
        .maoni-flow-step-card--pending:hover {
          background: linear-gradient(165deg, #e2e8f0 0%, #ecfdf5 42%, #ffffff 100%) !important;
          opacity: 1 !important;
        }
        .maoni-flow-step-icon-wrap {
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .maoni-flow-step-card:hover .maoni-flow-step-icon-wrap {
          transform: scale(1.07);
        }
        @media (prefers-reduced-motion: reduce) {
          .maoni-flow-step-card,
          .maoni-flow-step-icon-wrap {
            transition: none !important;
          }
          .maoni-flow-step-card:hover {
            transform: none;
            filter: none;
          }
          .maoni-flow-step-card:hover .maoni-flow-step-icon-wrap {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SuggestionDetail;
