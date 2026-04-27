import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../../../api";
import { spismCan } from "../../../../utils/spismPermissions";
import BreadCumb from "../../../../layouts/BreadCumb";
import {
  getActivities,
  getQuarterlyData,
  createUpdateQuarterlyData,
  getActivityDocuments,
  uploadActivityDocument,
  updateActivityDocument,
  deleteActivityDocument,
  createUpdateActivity,
  deleteActivity,
  activityApproval,
  activityImplementationApproval,
  getPerformanceAuditLogs,
  postConversationComment,
  submitActivityImplementation,
} from "./Queries";
import {
  formatActivityTitleForDisplay,
  getPendingImplementationQuartersFromRow,
} from "../implementationQuarterUtils";
import { getKpiActuals } from "../Queries";
import ActivityModal from "./Modal";
import { ActivityPlanningContext } from "../ActivityPlanningContext";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import Swal from "sweetalert2";

const STATUS_BADGE = {
  DRAFT: "bg-label-secondary",
  PENDING: "bg-label-warning",
  APPROVED: "bg-label-success",
  RETURNED: "bg-label-danger",
};

const QUARTERS = [
  { value: 1, label: "Q1" },
  { value: 2, label: "Q2" },
  { value: 3, label: "Q3" },
  { value: 4, label: "Q4" },
];

/** Activity open page: shorten long titles; full text available via native tooltip. */
const OPEN_ACTIVITY_PAGE_TITLE_MAX = 120;

/** Quarters available for implementation: only those selected when creating the activity (planned_quarters). */
function getImplementationQuarterOptions(activity) {
  const planned = activity?.planned_quarters;
  if (!Array.isArray(planned) || planned.length === 0) return QUARTERS;
  const allowed = new Set(planned.map((q) => Number(q)).filter((q) => q >= 1 && q <= 4));
  if (allowed.size === 0) return QUARTERS;
  return QUARTERS.filter((q) => allowed.has(q.value));
}

/** Quarters that can be linked to a supporting document: only quarters that already have Quarterly Data filled in (for the same financial year). */
function getDocumentQuarterOptions(quarterlyData, financialYear) {
  if (!Array.isArray(quarterlyData) || quarterlyData.length === 0) return [];
  const fy = (financialYear || "").trim();
  const list = fy ? quarterlyData.filter((q) => (q.financial_year || "").trim() === fy) : quarterlyData;
  const withData = [...new Set(list.map((q) => Number(q.quarter)).filter((q) => q >= 1 && q <= 4))].sort((a, b) => a - b);
  return QUARTERS.filter((q) => withData.includes(q.value));
}

export const ActivityOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location?.pathname || "";
  const user = useSelector((state) => state.userReducer?.data);
  const [obj, setObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quarterly, setQuarterly] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [financialYear, setFinancialYear] = useState("");
  const [quarterModal, setQuarterModal] = useState(null);
  const [savingQuarter, setSavingQuarter] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [replyComment, setReplyComment] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [docUploadModal, setDocUploadModal] = useState(false);
  const [docEditModal, setDocEditModal] = useState(null);
  const [docUploadFile, setDocUploadFile] = useState(null);
  const [docUploadDesc, setDocUploadDesc] = useState("");
  const [docUploadQuarter, setDocUploadQuarter] = useState(null);
  const [docEditDesc, setDocEditDesc] = useState("");
  const [docEditQuarter, setDocEditQuarter] = useState(null);
  const [docEditFile, setDocEditFile] = useState(null);
  const [implementationSubmitting, setImplementationSubmitting] = useState(false);
  const [implReviewLoading, setImplReviewLoading] = useState(false);
  const [kpiActualsForTarget, setKpiActualsForTarget] = useState([]);

  /** Whole-activity legacy submit (sets implementation_submitted_at) without per-quarter JSON keys. */
  const hasPerQuarterImplementationState =
    obj?.implementation_quarters_state &&
    typeof obj.implementation_quarters_state === "object" &&
    Object.keys(obj.implementation_quarters_state).some((k) => /^[1-4]$/.test(String(k)));
  const isLegacyBulkImplementationLocked =
    !!obj?.implementation_submitted_at && !hasPerQuarterImplementationState;
  // For DIRECT KPI targets, submissions are blocked until at least one KPI actual exists
  const directKpiBlocked =
    obj?.target_kpi_source_type === "DIRECT" && kpiActualsForTarget.length === 0;

  const loadActivity = async () => {
    try {
      const result = await getActivities({ uid });
      const data = result?.data ?? result;
      if (data && (result?.status === 200 || result?.status === 8000)) {
        setObj(data);
      } else {
        setObj(null);
      }
    } catch (err) {
      setObj(null);
      showToast("Failed to load activity", "danger", "Error");
    }
  };

  /** True when this quarter's implementation is submitted or approved (not editable / no re-submit). */
  const isQImplementationLocked = (q) => {
    if (q?.is_locked === true) return true;
    const rowSt = String(q?.implementation_status || "").toUpperCase();
    if (rowSt === "RETURNED") return false;
    if (rowSt === "SUBMITTED" || rowSt === "PENDING" || rowSt === "APPROVED") return true;

    const st = obj?.implementation_quarters_state;
    if (!st || typeof st !== "object") return false;
    const entry = st[String(q?.quarter)];
    if (!entry || typeof entry !== "object") return false;
    const s = String(entry.status || "").toUpperCase();
    if (s === "RETURNED") return false;
    return s === "PENDING" || s === "APPROVED" || s === "SUBMITTED";
  };

  const getQuarterImplementationEntry = (quarter) => {
    const st = obj?.implementation_quarters_state;
    if (!st || typeof st !== "object") return null;
    const e = st[String(quarter)];
    return e && typeof e === "object" ? e : null;
  };

  /** Documents tagged to a submitted quarter cannot be edited or deleted. */
  const isDocLockedByQuarter = (doc) => {
    if (isLegacyBulkImplementationLocked) return true;
    if (doc.quarter == null || doc.quarter === "") return false;
    const row = quarterly.find(
      (r) =>
        Number(r.quarter) === Number(doc.quarter) &&
        (!doc.financial_year || r.financial_year === doc.financial_year)
    );
    return row ? isQImplementationLocked(row) : false;
  };

  const loadQuarterly = async (fyOverride) => {
    if (!uid) return;
    const fy = fyOverride !== undefined ? fyOverride : financialYear;
    try {
      const res = await getQuarterlyData({
        activity: uid,
        financial_year: fy || "",
        pagination: { page_size: 100 },
      });
      const raw = res?.data ?? res?.results ?? res;
      const list = Array.isArray(raw) ? raw : raw?.data ?? raw?.results ?? [];
      setQuarterly(Array.isArray(list) ? list : []);
    } catch {
      setQuarterly([]);
    }
  };

  const loadDocuments = async () => {
    if (!uid) return;
    try {
      const res = await getActivityDocuments(uid);
      const list = res?.data ?? res;
      setDocuments(Array.isArray(list) ? list : []);
    } catch {
      setDocuments([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      await loadActivity();
      if (mounted) setLoading(false);
    };
    run();
    return () => { mounted = false; };
  }, [uid]);

  useEffect(() => {
    if (obj?.planned_financial_year && !financialYear) {
      setFinancialYear(obj.planned_financial_year);
    }
  }, [obj?.planned_financial_year]);

  // Implementation year is fixed from activity (derived from target/objective)
  const implementationYear = obj?.planned_financial_year || financialYear;

  /** At least one supporting document linked to this quarter (and FY when known). */
  const hasEvidenceForQuarter = (quarter, financialYear) => {
    const q = Number(quarter);
    const fy = (financialYear || implementationYear || "").trim();
    if (!Array.isArray(documents) || documents.length === 0) return false;
    return documents.some((doc) => {
      if (doc.quarter == null || doc.quarter === "") return false;
      if (Number(doc.quarter) !== q) return false;
      const dfy = (doc.financial_year || "").trim();
      if (!fy) return true;
      return !dfy || dfy === fy;
    });
  };

  useEffect(() => {
    if (uid) {
      loadQuarterly();
    }
  }, [uid, financialYear]);

  useEffect(() => {
    if (uid) loadDocuments();
  }, [uid]);

  // Load KPI actuals for Direct KPI targets so we can warn before submission
  useEffect(() => {
    const isDirectKpi = obj?.target_kpi_source_type === "DIRECT";
    const fy = obj?.planned_financial_year;
    const targetUid = obj?.target;
    if (!isDirectKpi || !fy || !targetUid) {
      setKpiActualsForTarget([]);
      return;
    }
    getKpiActuals({ target: targetUid, financial_year: fy, pagination: { page_size: 10 } })
      .then((res) => {
        const data = res?.data ?? res?.results ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
        setKpiActualsForTarget(Array.isArray(list) ? list : []);
      })
      .catch(() => setKpiActualsForTarget([]));
  }, [obj?.uid, obj?.target_kpi_source_type, obj?.planned_financial_year]);

  useEffect(() => {
    if (!editModalOpen || !obj) return;
    const el = document.getElementById("activityEditModal");
    if (el) window.bootstrap?.Modal?.getOrCreateInstance(el).show();
  }, [editModalOpen, obj?.uid]);

  useEffect(() => {
    const isApproval = pathname.startsWith("/performance-dashboard/approval/");
    if (obj && isApproval && (obj.status === "RETURNED" || obj.status === "PENDING")) {
      setActiveTab("conversations");
    }
  }, [pathname, obj?.status]);

  useEffect(() => {
    if (!uid) return;
    getPerformanceAuditLogs({
      entity_type: "activity",
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

  const handleSaveQuarter = async (e) => {
    e.preventDefault();
    const form = e.target;
    const quarter = Number(form.quarter?.value);
    const fy = (quarterModal?.financial_year || implementationYear || obj?.planned_financial_year || "").trim();
    const actual_value = Number(form.actual_value?.value) || 0;
    if (!fy) {
      showToast("Implementation year is set from the activity’s target. Cannot add quarterly data without it.", "warning", "Validation");
      return;
    }
    const existing = quarterly.find((q) => q.quarter === quarter && q.financial_year === fy);
    setSavingQuarter(true);
    try {
      const payload = {
        activity: uid,
        quarter,
        financial_year: fy,
        actual_value,
      };
      if (existing?.uid) payload.uid = existing.uid;
      const result = await createUpdateQuarterlyData(payload);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Quarterly data saved", "success", "Done");
        setQuarterModal(null);
        await loadQuarterly(fy);
        loadActivity();
      } else {
        showToast(result?.message || "Save failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Failed to save quarterly data", "danger", "Error");
    } finally {
      setSavingQuarter(false);
    }
  };

  const openDocUploadModal = () => {
    setDocUploadFile(null);
    setDocUploadDesc("");
    setDocUploadQuarter(null);
    setDocUploadModal(true);
  };

  const docQuarterOptions = getDocumentQuarterOptions(quarterly, obj?.planned_financial_year || financialYear);

  /** For edit modal: include document's current quarter in options even if no longer in quarterly data. */
  const docEditQuarterOptions =
    docEditModal?.quarter != null && docEditModal.quarter !== ""
      ? docQuarterOptions.some((q) => q.value === Number(docEditModal.quarter))
        ? docQuarterOptions
        : [...QUARTERS.filter((q) => q.value === Number(docEditModal.quarter)), ...docQuarterOptions]
      : docQuarterOptions;

  const handleDocUpload = async () => {
    if (!docUploadFile || !uid) {
      showToast("Select a file to upload", "warning", "Validation");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const payload = {
          activity: uid,
          file_name: docUploadFile.name,
          file_size: docUploadFile.size,
          file_type: docUploadFile.type || "",
          description: (docUploadDesc || "").trim() || null,
          file_base64: reader.result,
          quarter: docUploadQuarter != null && docUploadQuarter !== "" ? Number(docUploadQuarter) : null,
          financial_year: (obj?.planned_financial_year || "").trim() || null,
        };
        const result = await uploadActivityDocument(payload);
        if (result?.status === 200 || result?.status === 8000) {
          showToast("Document uploaded", "success", "Done");
          setDocUploadModal(false);
          setDocUploadFile(null);
          setDocUploadDesc("");
          loadDocuments();
        } else {
          showToast(result?.message || "Upload failed", "warning", "Error");
        }
        setUploading(false);
      };
      reader.readAsDataURL(docUploadFile);
    } catch (err) {
      showToast("Upload failed", "danger", "Error");
      setUploading(false);
    }
  };

  const handleDocView = async (doc) => {
    if (!doc.download_url) {
      showToast("Download URL not available", "warning", "Error");
      return;
    }
    try {
      const res = await api.get(doc.download_url, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      showToast("Could not open document. Please try again.", "danger", "Error");
    }
  };

  const handleDocDownload = async (doc) => {
    if (!doc.download_url) {
      showToast("Download URL not available", "warning", "Error");
      return;
    }
    try {
      const res = await api.get(doc.download_url, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = doc.file_name || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch {
      showToast("Could not download document. Please try again.", "danger", "Error");
    }
  };

  const openDocEditModal = (doc) => {
    setDocEditModal(doc);
    setDocEditDesc(doc.description || "");
    setDocEditQuarter(doc.quarter ?? null);
    setDocEditFile(null);
  };

  const handleDocEdit = async () => {
    if (!docEditModal?.uid) return;
    setUploading(true);
    try {
      const payload = {
        description: (docEditDesc || "").trim() || null,
        quarter: docEditQuarter != null && docEditQuarter !== "" ? Number(docEditQuarter) : null,
        financial_year: (obj?.planned_financial_year || "").trim() || null,
      };
      if (docEditFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          payload.file_base64 = reader.result;
          payload.file_name = docEditFile.name;
          payload.file_size = docEditFile.size;
          const result = await updateActivityDocument(docEditModal.uid, payload);
          if (result?.status === 200 || result?.status === 8000) {
            showToast("Document updated", "success", "Done");
            setDocEditModal(null);
            loadDocuments();
          } else {
            showToast(result?.message || "Update failed", "warning", "Error");
          }
          setUploading(false);
        };
        reader.readAsDataURL(docEditFile);
      } else {
        const result = await updateActivityDocument(docEditModal.uid, payload);
        if (result?.status === 200 || result?.status === 8000) {
          showToast("Document updated", "success", "Done");
          setDocEditModal(null);
          loadDocuments();
        } else {
          showToast(result?.message || "Update failed", "warning", "Error");
        }
        setUploading(false);
      }
    } catch (err) {
      showToast("Update failed", "danger", "Error");
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (doc) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete document?",
      text: "This will remove the document from the activity. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6e7d88",
      confirmButtonText: "Yes, delete",
    });
    if (!isConfirmed) return;
    try {
      const result = await deleteActivityDocument(doc.uid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Document deleted", "success", "Done");
        loadDocuments();
      } else {
        showToast(result?.message || "Delete failed", "warning", "Error");
      }
    } catch {
      showToast("Delete failed", "danger", "Error");
    }
  };

  const handleSubmitForApproval = async () => {
    setApprovalLoading(true);
    try {
      const result = await createUpdateActivity({ uid: obj.uid, status: "PENDING" });
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Submitted for approval", "success", "Done");
        loadActivity();
      } else {
        showToast(result?.message || "Failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Failed to submit for approval", "danger", "Error");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApprove = async () => {
    setApprovalLoading(true);
    try {
      const result = await activityApproval(uid, { action: "approve" });
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Activity approved", "success", "Done");
        setObj(result?.data ?? obj);
      } else {
        showToast(result?.message || "Failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Approval failed", "danger", "Error");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleDeleteActivity = async () => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete activity?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6e7d88",
      confirmButtonText: "Yes, delete",
    });
    if (!isConfirmed) return;
    try {
      const result = await deleteActivity(uid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Activity deleted", "success", "Done");
        navigate(backPath);
      } else {
        showToast(result?.message || "Delete failed", "warning", "Error");
      }
    } catch {
      showToast("Delete failed", "danger", "Error");
    }
  };

  const handleSendReply = async () => {
    const comment = (replyComment || "").trim();
    if (!comment) {
      showToast("Enter a comment to send", "warning", "Validation");
      return;
    }
    setSendingReply(true);
    try {
      const result = await postConversationComment({
        entity_type: "activity",
        entity_id: uid,
        comment,
      });
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Comment sent", "success", "Done");
        setReplyComment("");
        getPerformanceAuditLogs({
          entity_type: "activity",
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

  const handleReturn = async () => {
    const { value: comment } = await Swal.fire({
      title: "Return activity",
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
      const result = await activityApproval(uid, { action: "return", comment: comment.trim() });
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Activity returned", "success", "Done");
        setObj(result?.data ?? obj);
      } else {
        showToast(result?.message || "Failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Return failed", "danger", "Error");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleSubmitImplementation = async (quarter = null) => {
    const kpiSourceType = obj?.target_kpi_source_type ?? "DERIVED";
    const isDirect = kpiSourceType === "DIRECT";

    // For Direct KPI targets: block submission if no KPI actual is recorded.
    if (isDirect) {
      const hasActual = kpiActualsForTarget.length > 0;
      if (!hasActual) {
        const qLabel = quarter != null ? `Q${quarter}` : "this activity";
        const confirmed = await Swal.fire({
          title: "KPI actual required",
          html:
            `<p>The target for this activity uses a <strong>Direct KPI</strong>.</p>` +
            `<p>You must record at least one <strong>KPI actual value</strong> for ` +
            `<strong>${obj?.planned_financial_year || "this financial year"}</strong> ` +
            `before submitting ${qLabel}.</p>`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Go to KPI Actuals",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#00853f",
        });
        if (confirmed.isConfirmed) {
          navigate("/performance-dashboard/kpi-actuals");
        }
        return;
      }
    }

    if (quarter != null) {
      const row = quarterly.find((r) => Number(r.quarter) === Number(quarter));
      if (!row) return;
      if (!hasEvidenceForQuarter(quarter, row.financial_year)) {
        showToast(
          "Upload at least one supporting document linked to this quarter before submitting.",
          "warning",
          "Validation"
        );
        return;
      }
    } else {
      const groupable = quarterly.filter(
        (q) => !isQImplementationLocked(q) && parseFloat(q.actual_value || 0) > 0
      );
      if (groupable.length === 0) return;
      const missingEvidence = groupable.filter(
        (q) => !hasEvidenceForQuarter(q.quarter, q.financial_year)
      );
      if (missingEvidence.length > 0) {
        showToast(
          `Upload supporting documents for ${missingEvidence.map((q) => `Q${q.quarter}`).join(", ")} before submitting.`,
          "warning",
          "Validation"
        );
        return;
      }
    }

    setImplementationSubmitting(quarter ?? "bulk");
    try {
      const result = await submitActivityImplementation(uid, quarter);
      if (result?.status === 200 || result?.status === 8000) {
        showToast(
          quarter != null
            ? `Q${quarter} implementation submitted for Executive Secretariat approval.`
            : "Implementation submitted for Executive Secretariat approval.",
          "success",
          "Done"
        );
        const fy = obj?.planned_financial_year || financialYear;
        await loadActivity();
        await loadQuarterly(fy);
        loadDocuments();
      } else {
        showToast(result?.message || "Submit failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Failed to submit implementation", "danger", "Error");
    } finally {
      setImplementationSubmitting(false);
    }
  };

  const handleImplementationReviewDecision = async (quarter, action) => {
    if (!obj?.uid) return;
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
        text: "This confirms the submitted quarterly implementation for the selected scope.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Approve",
        confirmButtonColor: "#28a745",
      });
      if (!ok.isConfirmed) return;
    }

    setImplReviewLoading(true);
    try {
      const res = await activityImplementationApproval(obj.uid, {
        action,
        comment,
        ...(quarter != null && quarter !== "" ? { quarter: Number(quarter) } : {}),
      });
      if (res?.status === 200 || res?.status === 8000) {
        showToast(res?.message || (action === "approve" ? "Approved" : "Returned"), "success", "Done");
        await loadActivity();
        const fy = obj?.planned_financial_year || financialYear;
        await loadQuarterly(fy);
        loadDocuments();
      } else {
        showToast(res?.message || "Action failed", "warning", "Error");
      }
    } catch (e) {
      showToast(e?.response?.data?.message || "Action failed", "danger", "Error");
    } finally {
      setImplReviewLoading(false);
    }
  };

  const runImplementationBulkReview = async () => {
    if (!obj?.uid) return;
    const label = formatActivityTitleForDisplay(obj.title, 120);
    const pending = getPendingImplementationQuartersFromRow(obj);

    if (pending.length === 0) {
      showToast("No quarters are awaiting implementation approval.", "info", "Queue");
      await loadActivity();
      return;
    }

    const sortedQ = [
      ...new Set(pending.map((p) => p.quarter).filter((q) => q != null && q !== "")),
    ].sort((a, b) => a - b);
    const pendingLabel = pending.map((p) => (p.quarter != null ? `Q${p.quarter}` : p.label)).join(", ");

    const pick = await Swal.fire({
      title: "Implementation review",
      html:
        `<p class="text-start mb-2"><strong>${label}</strong></p>` +
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

    setImplReviewLoading(true);
    try {
      const res = await activityImplementationApproval(obj.uid, {
        action: isApprove ? "approve" : "return",
        comment,
        quarter: quarterParam,
      });
      if (res?.status === 200 || res?.status === 8000) {
        showToast(res?.message || (isApprove ? "Approved" : "Returned"), "success", "Done");
        await loadActivity();
        const fy = obj?.planned_financial_year || financialYear;
        await loadQuarterly(fy);
        loadDocuments();
      } else {
        showToast(res?.message || "Action failed", "warning", "Error");
      }
    } catch (e) {
      showToast(e?.response?.data?.message || "Action failed", "danger", "Error");
    } finally {
      setImplReviewLoading(false);
    }
  };

  const isApprovalContext = pathname.startsWith("/performance-dashboard/approval/");
  const fromTarget = location.state?.fromTarget;
  const breadcrumb = isApprovalContext
    ? ["SPISM", "Approval", "View Activity"]
    : fromTarget
      ? ["SPISM", "Targets", "View Target", "Activity"]
      : ["SPISM", "Activities", "View"];
  const backPath = isApprovalContext
    ? "/performance-dashboard/approval"
    : fromTarget
      ? `/performance-dashboard/targets/open/${fromTarget.uid}`
      : "/performance-dashboard/activities";
  const draftOrReturned = obj?.status === "DRAFT" || obj?.status === "RETURNED";
  const canEditActivity = draftOrReturned && spismCan(user, "can_edit_spism_activity");
  const canDeleteActivity = draftOrReturned && spismCan(user, "can_delete_spism_activity");
  const canApprovePlanningAct = spismCan(user, "can_approve_spism_planning");
  const canApproveImplementation = spismCan(
    user,
    "can_approve_spism_implementation",
    "can_approve_spism_planning"
  );
  const canQuarterlyWrite = spismCan(
    user,
    "can_add_spism_quarterly_data",
    "can_edit_spism_quarterly_data"
  );
  const canAddDoc = spismCan(user, "can_add_spism_supporting_document");
  const canEditDoc = spismCan(user, "can_edit_spism_supporting_document");
  const canDeleteDocPerm = spismCan(user, "can_delete_spism_supporting_document");
  const canRecordKpiNav = spismCan(
    user,
    "can_add_spism_kpi_actual",
    "can_edit_spism_kpi_actual"
  );
  const canPostActivityComment = spismCan(
    user,
    "can_edit_spism_activity",
    "can_approve_spism_planning"
  );

  const pendingImplementationQuarters = React.useMemo(
    () => (obj ? getPendingImplementationQuartersFromRow(obj) : []),
    [obj]
  );

  /** Quarter number for API, or `null` for bulk pending; `undefined` if this row has no ES review menu. */
  const esReviewQuarterParamForRow = (q) => {
    if (!canApproveImplementation || !obj || obj.status !== "APPROVED") {
      return undefined;
    }
    const pending = pendingImplementationQuarters;
    if (pending.length === 0) return undefined;
    const qn = Number(q.quarter);
    if (pending.some((p) => p.quarter === qn)) return qn;
    if (
      pending.length === 1 &&
      pending[0].quarter == null &&
      String(q.implementation_status || "").toUpperCase() === "SUBMITTED"
    ) {
      return null;
    }
    return undefined;
  };

  const conversationLogs = React.useMemo(
    () =>
      Array.isArray(conversations)
        ? conversations.filter((log) => (log.action || "").toLowerCase() === "comment")
        : [],
    [conversations]
  );

  const showConversationsTab =
    obj?.status === "RETURNED" ||
    obj?.status === "APPROVED" ||
    (isApprovalContext && obj?.status === "PENDING") ||
    conversationLogs.length > 0;

  const activityOpenTitle = React.useMemo(() => {
    const raw = obj?.title != null ? String(obj.title) : "";
    const display = formatActivityTitleForDisplay(obj?.title, OPEN_ACTIVITY_PAGE_TITLE_MAX);
    const looksLikeSavedError =
      raw.trim().startsWith("{") &&
      raw.includes('"status"') &&
      raw.includes('"message"');
    const hint =
      looksLikeSavedError || raw.length > OPEN_ACTIVITY_PAGE_TITLE_MAX
        ? raw.length > 500
          ? `${raw.slice(0, 500)}…`
          : raw || undefined
        : undefined;
    return { display, hint };
  }, [obj?.title]);

  if (loading) {
    return (
      <>
        <BreadCumb pageList={breadcrumb} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type="cylon" color="#00853f" height={30} width={50} />
              <h6 className="text-muted mt-2">Loading Activity Details...</h6>
            </center>
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
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Activity Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate(backPath)}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to {isApprovalContext ? "Approval" : "Activities"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <BreadCumb pageList={breadcrumb} />

      {/* Activity Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-info">
                      <i className="bx bx-task bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold text-break" title={activityOpenTitle.hint}>
                    {activityOpenTitle.display}
                  </h4>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${STATUS_BADGE[obj.status] || "bg-label-secondary"}`}>
                      {obj.status}
                    </span>
                    {obj.weight != null && <span className="badge bg-label-warning">Weight {obj.weight}%</span>}
                  </div>
                  <ActivityPlanningContext row={obj} variant="detail" />
                  {obj.status === "RETURNED" && (
                    <div
                      className={`alert mt-3 mb-0 py-3 ${
                        obj.approval_comment ? "alert-warning border-warning" : "alert-secondary border"
                      }`}
                      role="status"
                    >
                      <div className="d-flex align-items-start gap-2">
                        <i className="bx bx-error-circle fs-4 text-danger flex-shrink-0 mt-1" aria-hidden="true" />
                        <div>
                          <strong className="d-block mb-1">Planning return — why this was sent back</strong>
                          {obj.approval_comment ? (
                            <p className="mb-0 text-body">{obj.approval_comment}</p>
                          ) : (
                            <p className="mb-0 text-muted small">
                              No return comment is on file for this version. If this was returned before comments
                              were stored, check the <strong>Conversations</strong> tab or contact the approver.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {obj?.target && spismCan(user, "can_view_spism_target") && (
                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/performance-dashboard/targets/open/${obj.target}`)}
                      >
                        <i className="bx bx-link-external me-1" />
                        Open parent target
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex flex-wrap gap-2 justify-content-end align-items-center">
              {canEditActivity && !isLegacyBulkImplementationLocked && (
                <button
                  type="button"
                  className="btn btn-sm btn-warning d-flex align-items-center gap-1"
                  onClick={handleSubmitForApproval}
                  disabled={approvalLoading}
                >
                  {approvalLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <i className="bx bx-send"></i>
                      <span>Submit for approval</span>
                    </>
                  )}
                </button>
              )}
              {canEditActivity && !isLegacyBulkImplementationLocked && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                  onClick={() => setEditModalOpen(true)}
                >
                  <i className="bx bx-edit-alt"></i>
                  <span>Edit</span>
                </button>
              )}
              {canDeleteActivity && !isLegacyBulkImplementationLocked && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                  onClick={handleDeleteActivity}
                >
                  <i className="bx bx-trash"></i>
                  <span>Delete</span>
                </button>
              )}
              <button
                type="button"
                className="btn btn-label-secondary btn-sm d-flex align-items-center gap-1"
                onClick={() => navigate(backPath)}
              >
                <i className="bx bx-arrow-back"></i>
                <span>
                  {isApprovalContext ? "Back to Approval" : fromTarget ? "Back to Target" : "Back to Activities"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
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
                  <h6 className="mb-0">{obj.weight != null ? `${obj.weight}%` : "—"}</h6>
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
                    <span className={`badge ${STATUS_BADGE[obj.status] || "bg-label-secondary"}`}>
                      {obj.status}
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
                  <h6 className="mb-0">{formatDate(obj.created_at, "DD/MM/YYYY HH:mm") || "—"}</h6>
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
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-bar-chart fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Planned value</small>
                  <h6 className="mb-0">
                    {obj.planned_value != null ? obj.planned_value : "—"}
                    {obj.planned_value_label && (
                      <span className="text-muted fw-normal ms-1">({obj.planned_value_label})</span>
                    )}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {obj.status === "PENDING" && canApprovePlanningAct && (
        <div className="mb-3 d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-sm btn-success d-flex align-items-center gap-1"
            onClick={handleApprove}
            disabled={approvalLoading}
          >
            {approvalLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <i className="bx bx-check"></i>
                <span>Approve</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-danger d-flex align-items-center gap-1"
            onClick={handleReturn}
            disabled={approvalLoading}
          >
            <i className="bx bx-undo"></i>
            <span>Return with comment</span>
          </button>
        </div>
      )}

      {/* Tabs: Details | Conversations (when returned) */}
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
            {obj.status === "RETURNED" && obj.approval_comment && (
              <div className="alert alert-warning mb-4">
                <strong><i className="bx bx-undo me-1"></i> Return comment from approver:</strong>
                <p className="mb-0 mt-2">{obj.approval_comment}</p>
              </div>
            )}
            {conversationLogs.length === 0 ? (
              <p className="text-muted small mb-0">
                {obj.status === "RETURNED"
                  ? "No additional audit history. The return comment is shown above."
                  : obj.status === "PENDING"
                    ? "This activity is awaiting approval. No prior conversation history."
                    : "No conversation history for this activity."}
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
                  canPostActivityComment
                    ? "Type your reply or comment..."
                    : "You do not have permission to post comments."
                }
                value={replyComment}
                onChange={(e) => setReplyComment(e.target.value)}
                disabled={sendingReply || !canPostActivityComment}
              />
              {canPostActivityComment && (
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
      {/* Activity Details Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            Activity Information
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
                      <i className="bx bx-task me-2 text-primary"></i>
                      Title:
                    </td>
                    <td className="text-break">
                      <strong>{formatActivityTitleForDisplay(obj.title, false)}</strong>
                    </td>
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
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Status & Metadata</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className="bx bx-bar-chart me-2 text-primary"></i>
                      Planned Value:
                    </td>
                    <td>
                      {obj.planned_value != null ? obj.planned_value : "—"}
                      {obj.planned_value_label && (
                        <span className="text-muted ms-1">({obj.planned_value_label})</span>
                      )}
                    </td>
                  </tr>
                  {(obj.planned_financial_year || obj.planned_quarter != null || (Array.isArray(obj.planned_quarters) && obj.planned_quarters.length > 0)) && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-calendar me-2 text-info"></i>
                        Planned period:
                      </td>
                      <td>
                        {[
                          obj.planned_financial_year,
                          Array.isArray(obj.planned_quarters) && obj.planned_quarters.length > 0
                            ? (obj.planned_quarters.length === 4 ? "All quarters" : obj.planned_quarters.map((q) => `Q${q}`).join(", "))
                            : obj.planned_quarter != null ? `Q${obj.planned_quarter}` : null,
                        ]
                          .filter(Boolean)
                          .join(" — ")}
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
      </div>

      {/* Quarterly Data & Documents - only when activity is approved by ES */}
      {obj.status === "APPROVED" && (
        <>
      {/* Implementation status / progress banner */}
      {isLegacyBulkImplementationLocked ? (
        <div className="alert alert-success mb-4 d-flex align-items-center gap-3 flex-wrap">
          <i className="bx bx-lock-alt fs-4 flex-shrink-0"></i>
          <div>
            <strong>Implementation fully locked</strong>
            <span className="ms-2 text-muted small">
              (submitted on {formatDate(obj.implementation_submitted_at, "DD/MM/YYYY HH:mm")})
            </span>
            <p className="mb-0 small text-muted mt-1">
              Quarterly data and supporting documents for this activity are now locked from further changes.
            </p>
          </div>
        </div>
      ) : (() => {
        const plannedQs = Array.isArray(obj.planned_quarters) && obj.planned_quarters.length > 0
          ? obj.planned_quarters
          : obj.planned_quarter != null ? [obj.planned_quarter] : [];
        const summary = Array.isArray(obj.quarterly_summary) ? obj.quarterly_summary : [];
        const submittedQs = summary
          .filter(
            (s) =>
              s.is_locked ||
              String(s.implementation_status || "").toUpperCase() === "SUBMITTED"
          )
          .map((s) => s.quarter);

        const implStMap =
          obj.implementation_quarters_state && typeof obj.implementation_quarters_state === "object"
            ? obj.implementation_quarters_state
            : {};
        const implQuarterStatus = (qn) => {
          const e = implStMap[String(qn)];
          if (!e || typeof e !== "object") return "";
          return String(e.status || "").toUpperCase();
        };

        const filledQuarters = quarterly
          .filter((q) => parseFloat(q.actual_value || 0) > 0)
          .map((q) => q.quarter);

        return (
          <div className="card mb-4 border-0 shadow-sm" style={{ background: "#f8f9fa" }}>
            <div className="card-body py-3">
              <p className="mb-2 fw-semibold small text-uppercase text-muted" style={{ letterSpacing: "0.05em" }}>
                <i className="bx bx-bar-chart-alt-2 me-2 text-primary"></i>
                Implementation Progress
              </p>
              {plannedQs.length > 0 ? (
                <div className="d-flex flex-wrap align-items-center gap-2 w-100">
                  <div className="d-flex flex-wrap gap-2 me-auto">
                    {plannedQs.map((q) => {
                      const st = implQuarterStatus(q);
                      const approved = st === "APPROVED";
                      const inReview = st === "PENDING" || st === "SUBMITTED";
                      const submitted = submittedQs.includes(q) || inReview || approved;
                      const hasFilled = filledQuarters.includes(q);
                      const badgeClass = approved
                        ? "bg-label-success text-success"
                        : submitted
                          ? "bg-success"
                          : hasFilled
                            ? "bg-label-warning text-warning"
                            : "bg-label-secondary text-muted";
                      const label = approved
                        ? "Approved"
                        : submitted
                          ? inReview
                            ? "In review"
                            : "Submitted"
                          : hasFilled
                            ? "Ready"
                            : "No data";
                      const icon = approved
                        ? "bx-badge-check"
                        : submitted
                          ? "bx-check-circle"
                          : hasFilled
                            ? "bx-time"
                            : "bx-minus-circle";
                      return (
                        <span key={q}
                          className={`badge px-3 py-2 ${badgeClass}`}
                          style={{ fontSize: "0.8rem" }}>
                          <i className={`bx ${icon} me-1`}></i>
                          Q{q} {label}
                        </span>
                      );
                    })}
                  </div>
                  {canApproveImplementation && pendingImplementationQuarters.length > 1 ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary flex-shrink-0"
                      onClick={runImplementationBulkReview}
                      disabled={implReviewLoading}
                      title="Guided approve or return for multiple pending quarters"
                    >
                      {implReviewLoading ? (
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                      ) : (
                        <i className="bx bx-list-check me-1"></i>
                      )}
                      Batch review…
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="text-muted small mb-0">
                  Record quarterly data and attach supporting documents for each quarter, then use{" "}
                  <strong>Submit Q{"{n}"}</strong> to submit.
                </p>
              )}
            </div>
          </div>
        );
      })()}
      {/* Direct KPI notice — warn when KPI actuals are missing */}
      {obj?.target_kpi_source_type === "DIRECT" && !obj?.implementation_submitted_at && (
        <div className={`alert d-flex align-items-start gap-3 mb-4 ${kpiActualsForTarget.length > 0 ? "alert-success" : "alert-warning"}`}>
          <i className={`bx ${kpiActualsForTarget.length > 0 ? "bx-check-shield" : "bx-error"} fs-4 flex-shrink-0 mt-1`}></i>
          <div className="flex-grow-1">
            <strong>Direct KPI target</strong>
            {kpiActualsForTarget.length > 0 ? (
              <p className="mb-0 small mt-1">
                KPI actual recorded for <strong>{obj?.planned_financial_year}</strong>.
                You may submit quarterly implementation.
              </p>
            ) : (
              <>
                <p className="mb-1 small mt-1">
                  This activity&apos;s target uses a <strong>Direct KPI</strong>. You must record at least one
                  KPI actual value for <strong>{obj?.planned_financial_year}</strong> before any quarter
                  can be submitted for implementation.
                </p>
                {canRecordKpiNav && (
                <button
                  className="btn btn-sm btn-warning mt-1"
                  onClick={() => navigate("/performance-dashboard/kpi-actuals")}
                >
                  <i className="bx bx-edit-alt me-1"></i>
                  Record KPI Actual
                </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Quarterly Data */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-calendar-alt me-2 text-primary"></i>
            Quarterly Data
          </h5>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small">Implementation year:</span>
            <strong className="text-body me-2">{implementationYear || "—"}</strong>
            {!isLegacyBulkImplementationLocked && implementationYear && canQuarterlyWrite && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setQuarterModal({ financial_year: implementationYear })}
                >
                  <i className="bx bx-plus me-1"></i>Add quarter
                </button>
                {(() => {
                  const groupable = quarterly.filter(
                    (q) =>
                      !isQImplementationLocked(q) &&
                      parseFloat(q.actual_value || 0) > 0 &&
                      hasEvidenceForQuarter(q.quarter, q.financial_year)
                  );
                  const handleGroupSubmit = async () => {
                    if (groupable.length === 0) return;
                    const qList = groupable.map((q) => `Q${q.quarter}`).join(", ");
                    const res = await Swal.fire({
                      title: "Submit group",
                      html: `<p class="mb-2">The following quarters will be submitted:</p><div class="d-flex flex-wrap gap-2 justify-content-center">${groupable.map((q) => `<span class="badge bg-label-primary px-3 py-2">Q${q.quarter} — ${q.financial_year}</span>`).join("")}</div>`,
                      icon: "question",
                      showCancelButton: true,
                      confirmButtonText: `Submit ${qList}`,
                      cancelButtonText: "Cancel",
                    });
                    if (res.isConfirmed) handleSubmitImplementation(null);
                  };
                  return groupable.length >= 2 ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={handleGroupSubmit}
                      disabled={implementationSubmitting !== false || directKpiBlocked}
                      title={
                        directKpiBlocked
                          ? "Record a KPI actual value before submitting"
                          : `Submit group: ${groupable.map((q) => `Q${q.quarter}`).join(", ")}`
                      }
                    >
                      {implementationSubmitting === "bulk"
                        ? <><span className="spinner-border spinner-border-sm me-1" />Submitting...</>
                        : <><i className="bx bx-send me-1"></i>Submit group ({groupable.map((q) => `Q${q.quarter}`).join(", ")})</>}
                    </button>
                  ) : null;
                })()}
              </>
            )}
          </div>
        </div>
        <div className="card-body">
          {!implementationYear && (
            <p className="text-muted small mb-2">Implementation year comes from the activity’s target. Save the activity with a target to see quarterly data here.</p>
          )}
          {quarterly.length === 0 ? (
            <p className="text-muted small mb-0">No quarterly data yet. Click &quot;Add quarter&quot; to report implementation for each quarter (Q1–Q4) you selected for this activity.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Quarter</th>
                    <th>Financial Year</th>
                    <th>Actual Value</th>
                    <th>AI %</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quarterly.map((q) => {
                    const isSubmitting = implementationSubmitting === q.quarter;
                    const hasData = parseFloat(q.actual_value || 0) > 0;
                    const qLocked = isQImplementationLocked(q);
                    const hasEvidence = hasEvidenceForQuarter(q.quarter, q.financial_year);
                    const esReviewQ = esReviewQuarterParamForRow(q);
                    const qImplEntry = getQuarterImplementationEntry(q.quarter);
                    const qImplStatus = String(
                      qImplEntry?.status || q?.implementation_status || ""
                    ).toUpperCase();
                    return (
                      <tr key={q.uid}>
                        <td><span className="badge bg-label-primary">Q{q.quarter}</span></td>
                        <td className="text-muted small">{q.financial_year}</td>
                        <td>
                          {hasData
                            ? <strong>{q.actual_value}</strong>
                            : <span className="text-danger small"><i className="bx bx-error-circle me-1"></i>Not filled</span>}
                        </td>
                        <td>
                          {q.computed_ai_percent != null
                            ? <span className="badge bg-label-info">{Number(q.computed_ai_percent).toFixed(2)}%</span>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          {qLocked ? (
                            qImplStatus === "APPROVED" ? (
                              <div className="d-flex flex-column gap-1">
                                <span className="badge bg-label-success align-self-start">
                                  <i className="bx bx-badge-check me-1"></i>Approved
                                </span>
                                <span className="small text-muted">
                                  <i className="bx bx-info-circle me-1"></i>
                                  Final for this quarter. Add data or submit other planned quarters as needed.
                                </span>
                              </div>
                            ) : (
                              <div className="d-flex flex-column gap-1">
                                <span className="badge bg-success align-self-start">
                                  <i className="bx bx-check-circle me-1"></i>Submitted
                                </span>
                                <span className="small text-muted">
                                  <i className="bx bx-lock-alt me-1"></i>
                                  Locked — awaiting approval
                                </span>
                              </div>
                            )
                          ) : hasData && !hasEvidence ? (
                            <span className="badge bg-label-secondary text-secondary">
                              <i className="bx bx-file-find me-1"></i>Add evidence to submit
                            </span>
                          ) : hasData ? (
                            <span className="badge bg-label-warning text-warning">
                              <i className="bx bx-time me-1"></i>Ready to submit
                            </span>
                          ) : (
                            <span className="badge bg-label-secondary text-muted">
                              <i className="bx bx-minus-circle me-1"></i>No data
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end align-items-center">
                            {qLocked ? (
                              esReviewQ !== undefined ? (
                                <div className="dropdown d-inline-block">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-icon btn-outline-secondary"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    aria-haspopup="true"
                                    title="Approve or return this quarter’s implementation"
                                    disabled={implReviewLoading}
                                  >
                                    <i className="bx bx-dots-vertical"></i>
                                  </button>
                                  <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                    <li>
                                      <button
                                        type="button"
                                        className="dropdown-item d-flex align-items-center text-success"
                                        disabled={implReviewLoading}
                                        onClick={() => handleImplementationReviewDecision(esReviewQ, "approve")}
                                      >
                                        <i className="bx bx-check me-2"></i>
                                        {esReviewQ != null ? `Approve Q${esReviewQ}` : "Approve"}
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        type="button"
                                        className="dropdown-item d-flex align-items-center"
                                        disabled={implReviewLoading}
                                        onClick={() => handleImplementationReviewDecision(esReviewQ, "return")}
                                      >
                                        <i className="bx bx-undo me-2"></i>
                                        Return with comment
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              ) : (
                                <span className="small text-muted">
                                  <i className="bx bx-lock me-1"></i>No actions
                                </span>
                              )
                            ) : !isLegacyBulkImplementationLocked && canQuarterlyWrite ? (
                              <>
                                <button type="button" className="btn btn-sm btn-outline-secondary"
                                  onClick={() => setQuarterModal(q)} title="Edit actual data">
                                  <i className="bx bx-edit"></i>
                                </button>
                                {hasData && hasEvidence && !directKpiBlocked ? (
                                <button type="button"
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleSubmitImplementation(q.quarter)}
                                  disabled={implementationSubmitting !== false}
                                  title={`Submit Q${q.quarter}`}>
                                  {isSubmitting
                                    ? <span className="spinner-border spinner-border-sm" />
                                    : <><i className="bx bx-send me-1"></i>Submit Q{q.quarter}</>}
                                </button>
                                ) : hasData && !hasEvidence && !directKpiBlocked ? (
                                  <span className="small text-muted text-end" style={{ maxWidth: "160px" }}>
                                    Upload a document linked to Q{q.quarter} below to submit.
                                  </span>
                                ) : directKpiBlocked && hasData ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled
                                    title="Record a KPI actual value before submitting"
                                  >
                                    <i className="bx bx-send me-1"></i>Submit Q{q.quarter}
                                  </button>
                                ) : null}
                              </>
                            ) : !isLegacyBulkImplementationLocked ? (
                              <span className="small text-muted">No permission to edit quarterly data</span>
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

      {/* Supporting Documents - improved for audit */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-file me-2 text-primary"></i>
            Supporting Documents
          </h5>
          {!isLegacyBulkImplementationLocked && canAddDoc && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={openDocUploadModal}
            >
              <i className="bx bx-upload me-1"></i>
              Upload document
            </button>
          )}
        </div>
        <div className="card-body">
          <p className="text-muted small mb-3">
            <i className="bx bx-info-circle me-1"></i>
            Add implementation evidence before submission. Include a description of what each document holds for audit purposes. You can view, download, or edit documents before the activity implementation is finalized.
          </p>
          {documents.length === 0 ? (
            <p className="text-muted small mb-0">No documents yet. Click &quot;Upload document&quot; to add supporting evidence.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Document / Description</th>
                    <th>Quarter</th>
                    <th>File</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.uid}>
                      <td>
                        <div>
                          <strong className="text-body">
                            {doc.description || "—"}
                          </strong>
                          {!doc.description && doc.file_name && (
                            <span className="text-muted small ms-1">(no description)</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-muted">
                          {doc.quarter ? `Q${doc.quarter}` : "—"}
                        </span>
                      </td>
                      <td>
                        <span className="text-primary">
                          <i className="bx bx-file-blank me-1"></i>
                          {doc.file_name}
                        </span>
                      </td>
                      <td>{doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "—"}</td>
                      <td>
                        <small className="text-muted">
                          {formatDate(doc.created_at, "DD/MM/YYYY HH:mm") || "—"}
                        </small>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleDocView(doc)}
                            title="View"
                          >
                            <i className="bx bx-show"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleDocDownload(doc)}
                            title="Download"
                          >
                            <i className="bx bx-download"></i>
                          </button>
                          {!isLegacyBulkImplementationLocked && !isDocLockedByQuarter(doc) && (
                            <>
                              {canEditDoc && (
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => openDocEditModal(doc)}
                                title="Edit"
                              >
                                <i className="bx bx-edit"></i>
                              </button>
                              )}
                              {canDeleteDocPerm && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() => handleDeleteDoc(doc)}
                                title="Delete"
                              >
                                <i className="bx bx-trash"></i>
                              </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Document Upload Modal */}
      {docUploadModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">
                  <i className="bx bx-upload me-2"></i>
                  Upload supporting document
                </h6>
                <button type="button" className="btn-close" onClick={() => setDocUploadModal(false)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Quarter (optional)</label>
                  <select
                    className="form-select"
                    value={docUploadQuarter ?? ""}
                    onChange={(e) => setDocUploadQuarter(e.target.value === "" ? null : Number(e.target.value))}
                  >
                    <option value="">— Not linked to a quarter —</option>
                    {docQuarterOptions.map((q) => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                  <small className="text-muted d-block mt-1">
                    {docQuarterOptions.length === 0
                      ? "Add quarterly data first to link a document to a quarter."
                      : "Only quarters that already have quarterly data can be selected."}
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Document name / What it contains <span className="text-muted">(for audit)</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Q1 implementation report, Training attendance sheet, Evidence of completion..."
                    value={docUploadDesc}
                    onChange={(e) => setDocUploadDesc(e.target.value)}
                  />
                  <small className="text-muted">Briefly describe what this document holds for audit and reporting.</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">File *</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setDocUploadFile(e.target?.files?.[0] || null)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setDocUploadModal(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDocUpload}
                  disabled={!docUploadFile || uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-upload me-1"></i>
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Edit Modal */}
      {docEditModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">
                  <i className="bx bx-edit me-2"></i>
                  Edit document
                </h6>
                <button type="button" className="btn-close" onClick={() => setDocEditModal(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Quarter (optional)</label>
                  <select
                    className="form-select"
                    value={docEditQuarter ?? ""}
                    onChange={(e) => setDocEditQuarter(e.target.value === "" ? null : Number(e.target.value))}
                  >
                    <option value="">— Not linked to a quarter —</option>
                    {docEditQuarterOptions.map((q) => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                  <small className="text-muted d-block mt-1">
                    {docQuarterOptions.length === 0
                      ? "Only quarters with quarterly data can be linked. Add quarterly data first if needed."
                      : "Only quarters that have quarterly data can be selected."}
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Document name / What it contains</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Q1 implementation report..."
                    value={docEditDesc}
                    onChange={(e) => setDocEditDesc(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Replace file (optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setDocEditFile(e.target?.files?.[0] || null)}
                  />
                  <small className="text-muted">Leave empty to keep the current file. Upload a new file to replace.</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setDocEditModal(null)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDocEdit}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-check me-1"></i>
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      <ActivityModal
        modalId="activityEditModal"
        selectedActivity={editModalOpen ? obj : null}
        setSelectedActivity={() => setEditModalOpen(false)}
        tableRefresh={0}
        setTableRefresh={() => {}}
        onSuccess={loadActivity}
      />

      {/* Quarter modal */}
      {quarterModal !== null && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">{quarterModal.uid ? "Edit" : "Add"} Quarterly Data</h6>
                <button type="button" className="btn-close" onClick={() => setQuarterModal(null)} aria-label="Close" />
              </div>
              <form onSubmit={handleSaveQuarter}>
                <div className="modal-body">
                  {(quarterModal?.financial_year || quarterModal?.uid) && (
                    <p className="text-muted small mb-3">
                      Implementation year (from target): <strong>{quarterModal.financial_year || implementationYear}</strong>
                    </p>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Quarter *</label>
                    <select name="quarter" className="form-select" required defaultValue={quarterModal.quarter}>
                      {getImplementationQuarterOptions(obj).map((q) => (
                        <option key={q.value} value={q.value}>{q.label}</option>
                      ))}
                    </select>
                    <small className="text-muted d-block mt-1">
                      {Array.isArray(obj?.planned_quarters) && obj.planned_quarters.length > 0
                        ? "Only quarters selected for this activity are shown."
                        : "Select which quarter you are reporting implementation for."}
                    </small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Actual Value</label>
                    <input
                      name="actual_value"
                      type="number"
                      step="any"
                      min="0"
                      className="form-control"
                      defaultValue={quarterModal.actual_value ?? 0}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setQuarterModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={savingQuarter}>{savingQuarter ? "Saving..." : "Save"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )}
  </>
  );
};
