import React, { useState, useEffect } from "react";
import "animate.css";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Card,
  CardBody,
  Row,
  Col,
  Progress,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";
import BreadCumb from "../../../../layouts/BreadCumb";
import { API_BASE_URL } from "../../../../Costants";
import {
  getReports,
  updateReportStatus,
  submitReport,
  getReportAttachmentUrl,
  downloadReportAttachment,
  updateReportProgress,
  getReportComments,
  addReportComment,
  getReportAuditTrail,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  DEADLINE_STATE_OPTIONS,
  SCOPE_OPTIONS,
} from "../Queries";
import { formatDate, formatDateTime } from "../../../../helpers/DateFormater";
import showToast from "../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../hooks/AccessHandler";
import Swal from "sweetalert2";
import ReportModal from "./ReportModal";

const ReportDetailPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [comments, setComments] = useState([]);
  const [auditTrail, setAuditTrail] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressNotes, setProgressNotes] = useState("");
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitFile, setSubmitFile] = useState(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [attachmentPresignedUrl, setAttachmentPresignedUrl] = useState(null);
  const [attachmentUrlLoading, setAttachmentUrlLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [attachmentTargetUid, setAttachmentTargetUid] = useState(null);
  const [attachmentTargetFilename, setAttachmentTargetFilename] = useState(null);

  useEffect(() => {
    return () => {
      if (attachmentPresignedUrl) {
        window.URL.revokeObjectURL(attachmentPresignedUrl);
      }
    };
  }, [attachmentPresignedUrl]);

  useEffect(() => {
    fetchReport();
  }, [uid]);

  useEffect(() => {
    fetchAuditTrail();
  }, [uid]);

  useEffect(() => {
    if (activeTab === "comments") fetchComments();
    if (activeTab === "audit") fetchAuditTrail();
  }, [activeTab]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await getReports({ uid });
      if (response.status === 8000) {
        setReport(response.data);
        setProgressValue(response.data.progress_percentage || 0);
      } else {
        showToast("Report not found", "error");
        navigate("/report-management/reports");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      showToast("Failed to load report", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await getReportComments(uid);
      if (response.status === 8000) {
        setComments(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchAuditTrail = async () => {
    try {
      const response = await getReportAuditTrail(uid);
      if (response.status === 8000) {
        setAuditTrail(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching audit trail:", error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    const result = await Swal.fire({
      title: "Change Status?",
      html: `Change report status to <strong>${STATUS_OPTIONS.find(o => o.value === newStatus)?.label}</strong>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, change it",
      input: "textarea",
      inputPlaceholder: "Add notes (optional)",
    });

    if (result.isConfirmed) {
      try {
        const response = await updateReportStatus(uid, newStatus, result.value || "");
        if (response.status === 8000) {
          showToast("Status updated successfully", "success");
          fetchReport();
        } else {
          showToast(response.message || "Failed to update status", "error");
        }
      } catch (error) {
        showToast("Failed to update status", "error");
      }
    }
  };

  const handleProgressUpdate = async () => {
    if (progressValue === report.progress_percentage && !progressNotes) {
      showToast("No changes to save", "info");
      return;
    }

    setUpdatingProgress(true);
    try {
      const response = await updateReportProgress(uid, progressValue, progressNotes);
      if (response.status === 8000) {
        showToast("Progress updated successfully", "success");
        setProgressNotes("");
        fetchReport();
      } else {
        showToast(response.message || "Failed to update progress", "error");
      }
    } catch (error) {
      showToast("Failed to update progress", "error");
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleSubmitReport = async () => {
    // User has already confirmed in the modal card; just submit
    setSubmitting(true);
    try {
      const data = { notes: submitNotes };
      if (submitFile) data.attachment = submitFile;

      const response = await submitReport(uid, data);
      if (response.status === 8000) {
        showToast("Report submitted successfully!", "success");
        setShowSubmitModal(false);
        setSubmitFile(null);
        setSubmitNotes("");
        fetchReport();
      } else {
        showToast(response.message || "Failed to submit report", "error");
      }
    } catch (error) {
      showToast("Failed to submit report", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSendingComment(true);
    try {
      const response = await addReportComment(uid, newComment);
      if (response.status === 8000) {
        setNewComment("");
        fetchComments();
        showToast("Comment added", "success");
      } else {
        showToast(response.message || "Failed to add comment", "error");
      }
    } catch (error) {
      showToast("Failed to add comment", "error");
    } finally {
      setSendingComment(false);
    }
  };

  const getDeadlineStateConfig = (state) => {
    const configs = {
      on_track: { color: "success", icon: "bx-check-circle", bg: "bg-success" },
      due_soon: { color: "warning", icon: "bx-time-five", bg: "bg-warning" },
      due_today: { color: "info", icon: "bx-calendar-event", bg: "bg-info" },
      overdue: { color: "danger", icon: "bx-error-circle", bg: "bg-danger" },
      completed: { color: "primary", icon: "bx-check-double", bg: "bg-primary" },
    };
    return configs[state] || { color: "secondary", icon: "bx-help-circle", bg: "bg-secondary" };
  };

  const computeReminderDate = (deadlineDate, reminderDays, reminderTiming) => {
    if (!deadlineDate || reminderDays == null) return null;
    const base = new Date(deadlineDate);
    if (Number.isNaN(base.getTime())) return null;
    const days = Number(reminderDays);
    if (!Number.isFinite(days)) return null;
    const multiplier = reminderTiming === "after" ? 1 : -1;
    base.setDate(base.getDate() + multiplier * days);
    return base;
  };

  const getAuditActionConfig = (action) => {
    const configs = {
      created: { color: "success", icon: "bx-plus-circle" },
      updated: { color: "info", icon: "bx-edit" },
      status_changed: { color: "warning", icon: "bx-refresh" },
      submitted: { color: "success", icon: "bx-check-double" },
      progress_updated: { color: "primary", icon: "bx-trending-up" },
      comment_added: { color: "info", icon: "bx-message" },
      deleted: { color: "danger", icon: "bx-trash" },
    };
    return configs[action] || { color: "secondary", icon: "bx-info-circle" };
  };

  if (loading) {
    return (
      <div className="container-fluid flex-grow-1 container-p-y px-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container-fluid flex-grow-1 container-p-y px-4">
        <div className="text-center py-5">
          <i className="bx bx-error-circle fs-1 text-danger mb-3"></i>
          <h4>Report Not Found</h4>
          <button className="btn btn-primary mt-3" onClick={() => navigate("/report-management/reports")}>
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  const deadlineConfig = getDeadlineStateConfig(report.deadline_state);
  const statusOption = STATUS_OPTIONS.find(o => o.value === report.status);
  const priorityOption = PRIORITY_OPTIONS.find(o => o.value === report.priority);

  const hasAttachment = !!report.attachment;

  const isQuarterlyOrBiannual =
    report?.report_type?.frequency === "quarterly" || report?.report_type?.frequency === "biannual";
  const quarterlyRequiredCount = Array.isArray(report?.quarter_submissions)
    ? report.quarter_submissions.length
    : 0;
  const quarterlySubmittedCount = Array.isArray(report?.quarter_submissions)
    ? report.quarter_submissions.filter((q) => q?.status === "submitted").length
    : 0;
  const periodicCompletionProgressPercentage =
    isQuarterlyOrBiannual && quarterlyRequiredCount > 0
      ? Math.round((quarterlySubmittedCount / quarterlyRequiredCount) * 100)
      : null;

  const displayProgressPercentage =
    isQuarterlyOrBiannual && periodicCompletionProgressPercentage != null
      ? periodicCompletionProgressPercentage
      : (report.progress_percentage || 0);
  const isReadyForSubmission =
    report.status !== "submitted" && displayProgressPercentage >= 100;
  const commentCount = Math.max(report?.comments_count || 0, comments.length || 0);

  const handleOpenAttachmentModal = async (targetUid = uid, filename = null) => {
    setAttachmentUrlLoading(true);
    if (attachmentPresignedUrl) {
      window.URL.revokeObjectURL(attachmentPresignedUrl);
    }
    setAttachmentPresignedUrl(null);
    setShowAttachmentModal(true);
    try {
      setAttachmentTargetUid(targetUid);
      setAttachmentTargetFilename(filename);
      const response = await getReportAttachmentUrl(targetUid);
      if (response.status === 8000 && response.data?.url) {
        setAttachmentPresignedUrl(response.data.url);
      } else {
        showToast(response.message || "Could not load document", "error");
        setShowAttachmentModal(false);
      }
    } catch (error) {
      showToast("Failed to load document", "error");
      setShowAttachmentModal(false);
    } finally {
      setAttachmentUrlLoading(false);
    }
  };

  const handleCloseAttachmentModal = () => {
    setShowAttachmentModal(false);
    if (attachmentPresignedUrl) {
      window.URL.revokeObjectURL(attachmentPresignedUrl);
    }
    setAttachmentPresignedUrl(null);
    setAttachmentTargetUid(null);
    setAttachmentTargetFilename(null);
  };

  const handleDownloadWithWatermark = async (targetUid = uid, filenameOverride = null) => {
    const att = report?.attachment;
    const filenameFromReport =
      typeof att === "string" && att.includes("/") ? att.split("/").pop() : "report-document";
    const filename = filenameOverride || filenameFromReport || "report-document";
    setDownloading(true);
    try {
      await downloadReportAttachment(targetUid, filename);
      showToast("Document downloaded (with security watermark)", "success");
    } catch (err) {
      showToast(err.message || "Download failed", "error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container-fluid flex-grow-1 container-p-y px-4">
      <BreadCumb pageList={["Report Management System (RMS)", "Reports", "Details"]} />

      {/* Header Section */}
      <Card className="border-0 shadow-sm mb-4">
        <CardBody>
          <Row className="align-items-start">
            <Col lg={8}>
              <div className="d-flex align-items-start mb-3">
                <div className={`rounded-circle p-3 bg-label-${deadlineConfig.color} me-3`}>
                  <i className={`bx ${deadlineConfig.icon} fs-3 text-${deadlineConfig.color}`}></i>
                </div>
                <div>
                  <h4 className="mb-1">{report.title}</h4>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <span className="badge bg-label-primary">{report.reference_number}</span>
                    <span className={`badge bg-label-${statusOption?.color || 'secondary'}`}>
                      {statusOption?.label || report.status}
                    </span>
                    <span className={`badge bg-${deadlineConfig.color}`}>
                      <i className={`bx ${deadlineConfig.icon} me-1`}></i>
                      {DEADLINE_STATE_OPTIONS.find(o => o.value === report.deadline_state)?.label}
                    </span>
                    <span className={`badge bg-label-${priorityOption?.color || 'secondary'}`}>
                      {priorityOption?.label || report.priority} Priority
                    </span>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={4} className="text-lg-end">
              <div className="d-flex gap-2 justify-content-lg-end">
                {report.status !== 'submitted' && hasAccess(user, ['change_report']) && (
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => setShowEditModal(true)}
                  >
                    <i className="bx bx-edit me-1"></i>Edit
                  </button>
                )}
                {report.status !== 'submitted' && hasAccess(user, ['submit_report']) && (
                  <button
                    className={`btn ${displayProgressPercentage >= 100 ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => setShowSubmitModal(true)}
                    disabled={displayProgressPercentage < 100}
                    title={displayProgressPercentage < 100 ? 'Progress must be 100% to submit' : 'Submit Report'}
                  >
                    <i className="bx bx-check-double me-1"></i>Submit Report
                  </button>
                )}
              </div>
            </Col>
          </Row>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="d-flex justify-content-between mb-2">
              <span className="fw-medium">Progress</span>
                <span className="text-muted">{displayProgressPercentage}%</span>
            </div>
            <Progress
                value={displayProgressPercentage}
                color={displayProgressPercentage === 100 ? 'success' : displayProgressPercentage > 50 ? 'primary' : 'warning'}
              style={{ height: '10px' }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Quick Stats Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-file fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Report Type</small>
                  <h6 className="mb-0 text-truncate">{report.report_type?.name || 'N/A'}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-info">
                    <i className="bx bx-calendar fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Financial Year</small>
                  <h6 className="mb-0">{report.financial_year?.name || 'N/A'}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className={`card shadow-sm h-100 border-0 ${report.deadline_state === 'overdue' ? 'bg-danger bg-opacity-10' : ''}`}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className={`avatar-initial rounded bg-label-${deadlineConfig.color}`}>
                    <i className={`bx ${deadlineConfig.icon} fs-4`}></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Deadline</small>
                  <h6 className={`mb-0 ${report.deadline_state === 'overdue' ? 'text-danger' : ''}`}>
                    {formatDate(report.deadline_date)}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100 border-0">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-success">
                    <i className="bx bx-building fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Reminder Date</small>
                  {(() => {
                    const reminderDays = report.report_type?.before_reminder_days;
                    const reminderTiming = "before";
                    const reminderDate = computeReminderDate(report.deadline_date, reminderDays, reminderTiming);
                    return (
                      <>
                        <h6 className="mb-0 text-truncate">
                          {reminderDate ? formatDate(reminderDate) : "N/A"}
                        </h6>
                        <small className="text-muted">
                          {reminderDays != null
                            ? `${reminderDays} day(s) before deadline`
                            : ""}
                        </small>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert for Overdue */}
      {report.deadline_state === 'overdue' && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bx bx-error-circle fs-3 me-3"></i>
          <div>
            <strong>This report is overdue!</strong>
            <br />
            The deadline was {formatDate(report.deadline_date)} ({Math.abs(report.days_until_deadline)} days ago).
            Please submit as soon as possible.
          </div>
        </div>
      )}

      <Row className="g-4">
        {/* Main Content */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <CardBody>
              <Nav tabs className="mb-4">
                <NavItem>
                  <NavLink
                    className={activeTab === "details" ? "active" : ""}
                    onClick={() => setActiveTab("details")}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="bx bx-info-circle me-1"></i>Details
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === "progress" ? "active" : ""}
                    onClick={() => setActiveTab("progress")}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="bx bx-trending-up me-1"></i>Progress
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === "comments" ? "active" : ""}
                    onClick={() => setActiveTab("comments")}
                    style={{ cursor: "pointer" }}
                  >
                    <i className="bx bx-message me-1"></i>
                    Comments ({commentCount})
                  </NavLink>
                </NavItem>
              </Nav>

              <TabContent activeTab={activeTab}>
                {/* Details Tab - Basic Info & Organization Only */}
                <TabPane tabId="details">
                  <div className="animate__animated animate__fadeIn animate__faster">
                    <Row>
                      {/* Basic Information */}
                      <Col md={6}>
                        <h5 className="mb-3 fw-semibold">
                          <i className="bx bx-info-circle text-primary me-2"></i>
                          Basic Information
                        </h5>
                        <table className="table table-borderless">
                          <tbody>
                            <tr>
                              <td className="fw-medium text-muted" style={{ width: "40%" }}>Reference Number:</td>
                              <td>
                                <span className="badge bg-primary">{report.reference_number}</span>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium text-muted">Report Type:</td>
                              <td>{report.report_type?.name || "-"}</td>
                            </tr>
                            <tr>
                              <td className="fw-medium text-muted">Category:</td>
                              <td>
                                <span className="badge bg-label-info">{report.category?.name?.toUpperCase() || "-"}</span>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium text-muted">Financial Year:</td>
                              <td className="fw-semibold">{report.financial_year?.name || "-"}</td>
                            </tr>
                            {report.financial_period?.display_name && (
                              <tr>
                                <td className="fw-medium text-muted">Quarter / Period:</td>
                                <td>
                                  <span className="badge bg-label-info">
                                    {report.financial_period.display_name}
                                  </span>
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td className="fw-medium text-muted">Scope:</td>
                              <td>
                                <span className={`badge bg-label-${report.scope === 'internal' ? 'info' : 'warning'}`}>
                                  <i className={`bx ${report.scope === 'internal' ? 'bx-home' : 'bx-globe'} me-1`}></i>
                                  {report.scope === 'internal' ? 'INTERNAL' : 'EXTERNAL'}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium text-muted">Status:</td>
                              <td>
                                <span className={`badge bg-${statusOption?.color || 'secondary'}`}>
                                  {statusOption?.label || report.status}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium text-muted">Priority:</td>
                              <td>
                                <span className={`badge bg-label-${priorityOption?.color || 'secondary'}`}>
                                  {priorityOption?.label || report.priority}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Col>

                      {/* Organization Details */}
                      <Col md={6}>
                        <h5 className="mb-3 fw-semibold">
                          <i className="bx bx-building text-primary me-2"></i>
                          Organization Details
                        </h5>
                        <table className="table table-borderless">
                          <tbody>
                            <tr>
                              <td className="fw-medium text-muted" style={{ width: "40%" }}>Department:</td>
                              <td className="fw-semibold text-uppercase">
                                {report.department?.code || report.department?.name || report.directory?.code || report.directory?.name || '-'}
                              </td>
                            </tr>
                            {report.scope === 'external' && (
                              <tr>
                                <td className="fw-medium text-muted">Stakeholder:</td>
                                <td>
                                  <span className="badge bg-label-warning">
                                    <i className="bx bx-globe me-1"></i>
                                    {report.effective_stakeholder_name || '-'}
                                  </span>
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td className="fw-medium text-muted">Created By:</td>
                              <td>
                                <span className="d-flex align-items-center">
                                  <span className="avatar avatar-xs me-2 bg-label-primary">
                                    <span className="avatar-initial rounded-circle">{report.created_by_name?.charAt(0) || '?'}</span>
                                  </span>
                                  {report.created_by_name || '-'}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-medium text-muted">Assigned To:</td>
                              <td>
                                {report.assigned_to_name ? (
                                  <span className="d-flex align-items-center">
                                    <span className="avatar avatar-xs me-2 bg-label-success">
                                      <span className="avatar-initial rounded-circle">{report.assigned_to_name?.charAt(0)}</span>
                                    </span>
                                    {report.assigned_to_name}
                                  </span>
                                ) : (
                                  <span className="text-muted">Not Assigned</span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Col>
                    </Row>

                    {/* Description Section */}
                    {report.description && (
                      <div className="mt-4">
                        <h5 className="mb-3 fw-semibold">
                          <i className="bx bx-text text-primary me-2"></i>
                          Description
                        </h5>
                        <div className="alert alert-light border mb-0">
                          <p className="mb-0">{report.description}</p>
                        </div>
                      </div>
                    )}

                    {/* Internal Notes Section */}
                    {report.notes && (
                      <div className="mt-4">
                        <h5 className="mb-3 fw-semibold">
                          <i className="bx bx-note text-warning me-2"></i>
                          Internal Notes
                        </h5>
                        <div className="alert alert-warning mb-0">
                          <p className="mb-0 fst-italic">{report.notes}</p>
                        </div>
                      </div>
                    )}

                  </div>
                </TabPane>

                {/* Progress Tab */}
                <TabPane tabId="progress">
                  {/* Quarterly submissions list (Q1-Q4) - show only for quarterly report types */}
                  {isQuarterlyOrBiannual &&
                    Array.isArray(report?.quarter_submissions) &&
                    report.quarter_submissions.length > 0 && (
                      <Card className="border-0 shadow-sm mb-4">
                        <CardBody>
                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                            <div>
                              <h5 className="mb-0 fw-semibold">
                                <i className="bx bx-calendar-check text-primary me-2"></i>
                                {report?.report_type?.frequency === "biannual" ? "Half-Year Periods to Submit" : "Quarters to Submit"}
                              </h5>
                              <small className="text-muted">
                                {report?.report_type?.frequency === "biannual"
                                  ? "Submit progress and final submission per half-year."
                                  : "Submit progress and final submission per quarter."}
                              </small>
                            </div>
                            <span className="badge bg-label-info">
                              {report.quarter_submissions.length} period(s)
                            </span>
                          </div>

                          <div className="table-responsive">
                            <table className="table align-middle mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th style={{ width: "220px" }}>
                                    {report?.report_type?.frequency === "biannual" ? "Half Year" : "Quarter"}
                                  </th>
                                  <th style={{ width: "180px" }}>Status</th>
                                  <th style={{ width: "140px" }}>Progress</th>
                                  <th style={{ width: "180px" }}>Deadline</th>
                                  <th className="text-end" style={{ width: "280px" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.quarter_submissions.map((q) => {
                                  const statusCfg =
                                    STATUS_OPTIONS.find((o) => o.value === q.status) || null;
                                  const isCurrent = String(q.uid) === String(report.uid);
                                  const hasDoc = !!q.has_attachment;
                                  const canViewDoc = q.status === "submitted" && hasDoc;
                                  const filename =
                                    typeof q.attachment_name === "string" && q.attachment_name.includes("/")
                                      ? q.attachment_name.split("/").pop()
                                      : (q.attachment_name || "report-document");
                                  return (
                                    <tr key={q.uid} className={isCurrent ? "table-primary" : ""}>
                                      <td className="fw-medium">
                                        <div>
                                          <span className={`badge ${isCurrent ? "bg-primary" : "bg-label-primary"}`}>
                                            {q.period_name || "N/A"}
                                          </span>
                                          {q.period_start_date && q.period_end_date && (
                                            <div className="small text-muted mt-1">
                                              {formatDate(q.period_start_date)} - {formatDate(q.period_end_date)}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td>
                                        <span className={`badge bg-label-${statusCfg?.color || "secondary"}`}>
                                          {q.status_display || statusCfg?.label || q.status}
                                        </span>
                                      </td>
                                      <td>
                                        <span className="fw-medium">{q.progress_percentage ?? 0}%</span>
                                      </td>
                                      <td>
                                        <span className="text-muted">{q.deadline_date ? formatDate(q.deadline_date) : "N/A"}</span>
                                      </td>
                                      <td className="text-end">
                                        <div className="d-flex justify-content-end">
                                          <UncontrolledDropdown>
                                            <DropdownToggle
                                              color="link"
                                              className="p-0 text-muted"
                                              title="More options"
                                            >
                                              <i className="bx bx-dots-vertical-rounded fs-4" />
                                            </DropdownToggle>
                                            <DropdownMenu end>
                                              <DropdownItem
                                                disabled={isCurrent}
                                                onClick={() => {
                                                  if (!isCurrent) navigate(`/report-management/reports/${q.uid}`);
                                                }}
                                              >
                                                <i className="bx bx-link-external me-2" />
                                                {isCurrent ? "Current period" : "Open"}
                                              </DropdownItem>

                                              <DropdownItem divider />

                                              <DropdownItem
                                                disabled={!canViewDoc}
                                                title={
                                                  !canViewDoc
                                                    ? "Available after submission (with uploaded document)"
                                                    : "View submitted document"
                                                }
                                                onClick={() => handleOpenAttachmentModal(q.uid, filename)}
                                              >
                                                <i className="bx bx-show me-2" />
                                                View document
                                              </DropdownItem>

                                              <DropdownItem
                                                disabled={!canViewDoc || downloading}
                                                title={
                                                  !canViewDoc
                                                    ? "Available after submission (with uploaded document)"
                                                    : "Download submitted document"
                                                }
                                                onClick={() => handleDownloadWithWatermark(q.uid, filename)}
                                              >
                                                <i className="bx bx-download me-2" />
                                                Download document
                                              </DropdownItem>
                                            </DropdownMenu>
                                          </UncontrolledDropdown>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                  {/* Quarterly context note */}
                  {isQuarterlyOrBiannual && report?.financial_period?.display_name && (
                    <div className="alert alert-info d-flex align-items-center" role="alert">
                      <i className="bx bx-info-circle fs-4 me-2"></i>
                      <div>
                        You are updating progress for{" "}
                        <span className="badge bg-primary ms-1">{report.financial_period.display_name}</span>.
                        {report?.financial_period?.start_date && report?.financial_period?.end_date && (
                          <span className="ms-1">
                            ({formatDate(report.financial_period.start_date)} - {formatDate(report.financial_period.end_date)})
                          </span>
                        )}
                        {" "}Use the list above to switch periods.
                      </div>
                    </div>
                  )}

                  {report.status !== 'submitted' && hasAccess(user, ['change_report']) && (
                    <div className="mb-4">
                      {/* Progress Update Card */}
                      <Card className={`border-2 ${progressValue >= 100 ? 'border-success bg-label-success' : 'border-primary'}`}>
                        <CardBody>
                          <div className="d-flex align-items-center mb-3">
                            <div className={`rounded-circle ${progressValue >= 100 ? 'bg-success' : 'bg-primary'} text-white d-flex align-items-center justify-content-center me-3`} style={{ width: '50px', height: '50px' }}>
                              {progressValue >= 100 ? (
                                <i className="bx bx-check fs-3"></i>
                              ) : (
                                <i className="bx bx-trending-up fs-4"></i>
                              )}
                            </div>
                            <div>
                              <h5 className="mb-0">Update Progress</h5>
                              <small className="text-muted">
                                {progressValue >= 100 ? 'Report is ready for submission!' : 'Track your report completion'}
                              </small>
                            </div>
                          </div>

                          {/* Progress Slider */}
                          <div className="mb-4">
                            <div className="d-flex justify-content-between mb-2">
                              <label className="form-label fw-medium mb-0">Progress</label>
                              <span className={`badge ${progressValue >= 100 ? 'bg-success' : progressValue >= 50 ? 'bg-primary' : 'bg-warning'} fs-6`}>
                                {progressValue}%
                              </span>
                            </div>
                            <input
                              type="range"
                              className="form-range"
                              min="0"
                              max="100"
                              step="5"
                              value={progressValue}
                              onChange={(e) => setProgressValue(parseInt(e.target.value))}
                            />
                            <div className="d-flex justify-content-between mt-1">
                              <small className="text-muted">0%</small>
                              <small className="text-muted">50%</small>
                              <small className="text-muted">100%</small>
                            </div>
                          </div>

                          {/* File Upload - Only show when progress is 100% */}
                          {progressValue >= 100 && (
                            <div className="mb-3 p-3 bg-white rounded border border-success">
                              <label className="form-label fw-medium text-success">
                                <i className="bx bx-upload me-1"></i>Upload Report Document
                              </label>
                              <input
                                type="file"
                                className="form-control"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                onChange={(e) => setSubmitFile(e.target.files[0])}
                              />
                              {submitFile && (
                                <div className="mt-2 d-flex align-items-center text-success">
                                  <i className="bx bx-check-circle me-1"></i>
                                  <small
                                    className="d-inline-block"
                                    title={submitFile.name}
                                    style={{
                                      maxWidth: "100%",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {submitFile.name}
                                  </small>
                                </div>
                              )}
                              <small className="text-muted d-block mt-1">
                                Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
                              </small>
                            </div>
                          )}

                          {/* Progress Notes */}
                          <div className="mb-3">
                            <label className="form-label fw-medium">Progress Notes</label>
                            <textarea
                              className="form-control"
                              rows="2"
                              placeholder="Describe what has been accomplished..."
                              value={progressNotes}
                              onChange={(e) => setProgressNotes(e.target.value)}
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-primary"
                              onClick={handleProgressUpdate}
                              disabled={updatingProgress}
                            >
                              {updatingProgress ? (
                                <span className="spinner-border spinner-border-sm me-2"></span>
                              ) : (
                                <i className="bx bx-save me-1"></i>
                              )}
                              Save Progress
                            </button>
                            {progressValue >= 100 && (
                              <button
                                className="btn btn-success"
                                onClick={() => setShowSubmitModal(true)}
                              >
                                <i className="bx bx-check-double me-1"></i>
                                Submit Report
                              </button>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  )}

                  <h6 className="mb-3">Progress History</h6>
                  {report.progress_updates?.length > 0 ? (
                    <div className="timeline">
                      {report.progress_updates.map((update, index) => (
                        <div key={index} className="d-flex mb-3">
                          <div className="flex-shrink-0 me-3">
                            <div className={`rounded-circle bg-primary text-white d-flex align-items-center justify-content-center`} style={{ width: '40px', height: '40px' }}>
                              {update.percentage}%
                            </div>
                          </div>
                          <div>
                            <p className="mb-1">{update.notes || "Progress updated"}</p>
                            <small className="text-muted">
                              {update.created_by_name} • {formatDateTime(update.created_at)}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No progress updates yet</p>
                  )}
                </TabPane>

                {/* Comments Tab */}
                <TabPane tabId="comments">
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                      <div>
                        <h5 className="mb-1 fw-semibold">
                          <i className="bx bx-message-detail text-primary me-2"></i>
                          Discussion
                        </h5>
                        <small className="text-muted">
                          {commentCount} comment{commentCount === 1 ? "" : "s"} on this report
                        </small>
                      </div>
                      <span className="badge bg-label-primary px-3 py-2">
                        <i className="bx bx-chat me-1"></i>
                        {commentCount}
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleAddComment}
                        disabled={sendingComment || !newComment.trim()}
                      >
                        {sendingComment ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          <i className="bx bx-send"></i>
                        )}
                      </button>
                    </div>
                  </div>

                  {comments.length > 0 ? (
                    <div className="comments-list">
                      {comments.map((comment, index) => (
                        <div
                          key={index}
                          className="d-flex mb-3 p-3 rounded-4 bg-white shadow-sm border border-light-subtle"
                          style={{
                            boxShadow: "0 10px 24px rgba(67, 89, 113, 0.08)",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <div className="avatar me-3">
                            <div
                              className="rounded-circle text-white d-flex align-items-center justify-content-center fw-semibold shadow-sm"
                              style={{
                                width: "48px",
                                height: "48px",
                                background: "linear-gradient(135deg, #696cff 0%, #8c7bff 100%)",
                                fontSize: "1rem",
                              }}
                            >
                              {comment.created_by_name?.[0] || "U"}
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                              <div>
                                <div className="fw-bold text-dark fs-5 lh-sm">
                                  {comment.created_by_name || "User"}
                                </div>
                                <div className="d-flex flex-wrap gap-2 mt-2">
                                  {comment.sender_designation && (
                                    <span className="badge bg-label-info px-3 py-2 rounded-pill">
                                      <i className="bx bx-briefcase me-1"></i>
                                      {comment.sender_designation}
                                    </span>
                                  )}
                                  {(comment.sender_directory_code || comment.sender_directory_name) && (
                                    <span className="badge bg-label-secondary px-3 py-2 rounded-pill">
                                      <i className="bx bx-buildings me-1"></i>
                                      {comment.sender_directory_code || comment.sender_directory_name}
                                    </span>
                                  )}
                                  {comment.mentions_directory && comment.directory_name && (
                                    <span className="badge bg-label-warning px-3 py-2 rounded-pill">
                                      <i className="bx bx-send me-1"></i>
                                      Sent to Department: {comment.directory_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <small
                                className="text-muted px-2 py-1 rounded-pill bg-label-secondary"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {formatDateTime(comment.created_at)}
                              </small>
                            </div>
                            <div
                              className="mt-3 px-3 py-3 rounded-3"
                              style={{
                                background: "linear-gradient(180deg, #f8f9ff 0%, #f4f5ff 100%)",
                                border: "1px solid rgba(105, 108, 255, 0.12)",
                              }}
                            >
                              <p className="mb-0 text-dark fs-5" style={{ lineHeight: 1.6 }}>
                                {comment.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-center py-4">No comments yet. Be the first to comment!</p>
                  )}
                </TabPane>

              </TabContent>
            </CardBody>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Deadline Countdown Card */}
          <Card className={`border-0 shadow-sm mb-4 overflow-hidden`}>
            <div className={`bg-${deadlineConfig.color} text-white p-4 text-center`}>
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className={`bx ${deadlineConfig.icon} fs-1`}></i>
              </div>
              <div className="display-4 fw-bold">{Math.abs(report.days_until_deadline)}</div>
              <div className="text-uppercase small fw-medium opacity-75">
                {report.deadline_state === 'completed' 
                  ? 'Completed' 
                  : report.days_until_deadline < 0 
                    ? 'Days Overdue' 
                    : report.days_until_deadline === 0 
                      ? 'Due Today' 
                      : 'Days Left'}
              </div>
            </div>
            <CardBody className="text-center py-3">
              <small className="text-muted">
                <i className="bx bx-calendar me-1"></i>
                Deadline: <strong>{formatDate(report.deadline_date)}</strong>
              </small>
            </CardBody>
          </Card>

          {/* Report Summary Card */}
          <Card className="border-0 shadow-sm mb-4">
            <CardBody>
              <h6 className="mb-3 text-primary">
                <i className="bx bx-file me-2"></i>Report Summary
              </h6>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Type</span>
                <span className="fw-medium small">{report.report_type?.name}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Category</span>
                <span className="fw-medium small">{report.category?.name || '-'}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Financial Year</span>
                <span className="fw-medium small">{report.financial_year?.name}</span>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Department</span>
                <span className="fw-medium small text-uppercase">{report.department?.code || report.department?.name || report.directory?.code || report.directory?.name || '-'}</span>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted small">Scope</span>
                <span className={`badge bg-label-${report.scope === 'internal' ? 'info' : 'warning'}`}>
                  {report.scope === 'internal' ? 'Internal' : 'External'}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Submit Report Card - Show when progress is 100% */}
                {isReadyForSubmission && (
            <Card className="border-0 shadow-sm border-success border-2">
              <CardBody>
                <div className="text-center mb-3">
                  <div className="rounded-circle bg-success text-white mx-auto mb-2 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <i className="bx bx-check fs-3"></i>
                  </div>
                  <h6 className="text-success mb-1">Ready to Submit!</h6>
                  <small className="text-muted">Progress is 100% complete</small>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-medium">
                    <i className="bx bx-upload me-1"></i>Upload Final Report
                  </label>
                  <input
                    type="file"
                    className="form-control form-control-sm"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setSubmitFile(e.target.files[0])}
                  />
                  {submitFile && (
                    <div className="text-success mt-1 d-flex align-items-center">
                      <i className="bx bx-check-circle me-1"></i>
                      <small
                        className="d-inline-block"
                        title={submitFile.name}
                        style={{
                          maxWidth: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {submitFile.name}
                      </small>
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-success w-100"
                  onClick={() => setShowSubmitModal(true)}
                >
                  <i className="bx bx-check-double me-1"></i>
                  Submit Report
                </button>
              </CardBody>
            </Card>
          )}

          {/* Progress Indicator - Show when progress < 100% */}
          {report.status !== 'submitted' && !isReadyForSubmission && (
            <Card className="border-0 shadow-sm border-warning border-2">
              <CardBody className="text-center">
                <div className="mb-3">
                  <div className="position-relative d-inline-flex">
                    <div 
                      className="rounded-circle border border-4 border-warning d-flex align-items-center justify-content-center"
                      style={{ width: '80px', height: '80px' }}
                    >
                      <span className="h4 mb-0 text-warning">{displayProgressPercentage}%</span>
                    </div>
                  </div>
                </div>
                <h6 className="text-warning mb-1">In Progress</h6>
                {isQuarterlyOrBiannual && quarterlyRequiredCount > 0 ? (
                  <small className="text-muted">
                    Submitted {quarterlySubmittedCount}/{quarterlyRequiredCount} period(s)
                  </small>
                ) : (
                  <small className="text-muted">Complete to 100% to submit</small>
                )}
              </CardBody>
            </Card>
          )}
        </Col>
      </Row>

      {/* Edit Modal */}
      {showEditModal && (
        <ReportModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchReport();
          }}
          report={report}
        />
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="bx bx-check-double me-2"></i>Submit Report
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSubmitModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="d-flex align-items-start">
                  <div className="me-3">
                    <div className="rounded-circle bg-label-warning d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                      <i className="bx bx-error fs-3 text-warning"></i>
                    </div>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-2">Confirm Report Submission</h6>
                    <p className="mb-1">
                      You are about to <span className="fw-semibold">submit this report</span>. After submission,
                      further edits will not be allowed.
                    </p>
                    <small className="text-muted">
                      Please make sure all details and attached documents are correct before continuing.
                    </small>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                <button className="btn btn-success" onClick={handleSubmitReport} disabled={submitting}>
                  {submitting ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bx bx-check-double me-1"></i>
                  )}
                  Confirm Submission
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment View Modal */}
      {showAttachmentModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bx bx-file me-2" />
                  View Report Document
                  {attachmentTargetFilename ? (
                    <span className="text-muted ms-2" style={{ fontSize: "0.9rem" }}>
                      ({attachmentTargetFilename})
                    </span>
                  ) : null}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseAttachmentModal}
                ></button>
              </div>
              <div className="modal-body" style={{ minHeight: "60vh" }}>
                {attachmentUrlLoading ? (
                  <div className="d-flex flex-column align-items-center justify-content-center py-5">
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mb-0">Loading document...</p>
                  </div>
                ) : attachmentPresignedUrl ? (
                  <>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <span className="text-muted small">
                        The document will open inside this window if your browser supports it.
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => window.open(attachmentPresignedUrl, "_blank")}
                      >
                        <i className="bx bx-link-external me-1" />
                        Open in New Tab
                      </button>
                    </div>
                    <div style={{ border: "1px solid #e0e0e0", borderRadius: "0.5rem", overflow: "hidden" }}>
                      <iframe
                        title="Report Document"
                        src={attachmentPresignedUrl}
                        style={{ width: "100%", height: "60vh", border: "none" }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-muted text-center py-5 mb-0">Could not load document.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseAttachmentModal}
                >
                  Close
                </button>
                {attachmentPresignedUrl && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      handleDownloadWithWatermark(
                        attachmentTargetUid || uid,
                        attachmentTargetFilename || null
                      )
                    }
                    disabled={downloading}
                  >
                    {downloading ? (
                      <span className="spinner-border spinner-border-sm me-1" role="status" />
                    ) : (
                      <i className="bx bx-download me-1" />
                    )}
                    Download (with watermark)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetailPage;
