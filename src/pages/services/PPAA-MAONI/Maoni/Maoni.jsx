import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "animate.css";
import { formatDate } from "../../../../helpers/DateFormater";
import MaoniModal from "./MaoniModal";
import { MaoniContext } from "../../../../utils/context";
import { getSuggestions, getDepartments, getSuggestion } from "../../PPAA-MAONI/Queries";
import Swal from "sweetalert2";
import {
  getNormalizedGroupSlugs,
  isMaoniHandler,
  isMaoniReviewer,
} from "../../../../utils/maoniRoles";

export const Maoni = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const navigate = useNavigate();

  const userRoles = getNormalizedGroupSlugs(user);
  const isStaff = userRoles.includes("staff");
  const isMaoniReviewerUser = isMaoniReviewer(user);
  const isMaoniHandlerUser = isMaoniHandler(user);
  const isAdmin = userRoles.includes("admin");
  const hasReviewerDashboardRole =
    userRoles.includes("maoni_reviewer") ||
    userRoles.includes("maoni_reviewe") ||
    userRoles.includes("ppaa_maoni_reviewer") ||
    userRoles.includes("hr");
  const canAccessMaoni = Boolean(
    isStaff || isMaoniReviewerUser || isMaoniHandlerUser || isAdmin || user?.is_superuser
  );

  // User's personal maoni stats
  const [myMaoniStats, setMyMaoniStats] = useState({
    total: 0,
    drafts: 0,
    submitted: 0,
  });

  // User's recent maoni (only their own)
  const [myRecentMaoni, setMyRecentMaoni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaoni, setSelectedMaoni] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Restrict /ppaa-maoni to staff / Maoni_Reviewer / Admin / Superuser
  useEffect(() => {
    if (!user) return;
    if (canAccessMaoni) return;
    Swal.fire({
      icon: "warning",
      title: "Access Denied",
      text: "You don't have permission to access this Maoni dashboard.",
      confirmButtonText: "Go Back",
    }).then(() => {
      navigate(-1);
    });
  }, [user, canAccessMaoni, navigate]);

  // Default landing:
  // - Explicit reviewer/superuser roles -> Executive Dashboard
  // - Maoni admin/handler/staff can access /ppaa-maoni from sidebar "Maoni" tab
  useEffect(() => {
    if (!user) return;
    if (hasReviewerDashboardRole || user?.is_superuser) {
      navigate("/ppaa-maoni/dashboard", { replace: true });
    }
  }, [user, hasReviewerDashboardRole, navigate]);

  const handleFetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [suggestionsRes, departmentsRes] = await Promise.all([
        // Personal "My Maoni" — reviewers/admins still only their own rows here (see dashboard for all).
        getSuggestions(1, 100, { onlyMine: true }),
        getDepartments(),
      ]);

      const suggestions =
        suggestionsRes?.data && Array.isArray(suggestionsRes.data)
          ? suggestionsRes.data
          : [];
      const departments =
        departmentsRes?.data && Array.isArray(departmentsRes.data)
          ? departmentsRes.data
          : [];

      const deptByUid = new Map(departments.map((d) => [d.uid, d]));

      const mapped = suggestions.map((s) => {
        const status = (s.status || "").toLowerCase();
        const dept = s.department_uid ? deptByUid.get(s.department_uid) : null;
        return {
          id: s.uid,
          uid: s.uid,
          title: s.title,
          category: (s.category_name || "GENERAL").toUpperCase(),
          status:
            status === "submitted"
              ? "submitted"
              : status === "draft"
              ? "draft"
              : status,
          date: s.submitted_at || s.created_at,
          directory: dept?.name || "—",
          description: s.description || "",
          comment_count: s.comment_count || 0,
        };
      });

      const drafts = mapped.filter((m) => m.status === "draft").length;
      const submitted = mapped.filter((m) => m.status === "submitted").length;
      setMyMaoniStats({ total: mapped.length, drafts, submitted });
      setMyRecentMaoni(mapped);
    } catch (e) {
      console.error("Failed to load Maoni suggestions:", e);
      setMyRecentMaoni([]);
      setMyMaoniStats({ total: 0, drafts: 0, submitted: 0 });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!canAccessMaoni) return;
    handleFetchData();
  }, [handleFetchData, canAccessMaoni]);

  const itemsPerPage = 3;
  const totalPages = Math.ceil(myRecentMaoni.length / itemsPerPage);

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = myRecentMaoni.slice(indexOfFirstItem, indexOfLastItem);

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

  const getStatusBadgeClass = (status) => {
    const s = normalizeWorkflowStatus(status);
    // Use text-* (not *-emphasis): vendor core.css omits emphasis utilities but .badge defaults to white text.
    const pill = "rounded-pill px-2 py-1 small fw-semibold border";
    switch (s) {
      case "DRAFT":
        return `${pill} bg-warning-subtle text-dark border-warning`;
      case "SUBMITTED":
        return `${pill} bg-primary-subtle text-primary border-primary`;
      case "UNDER_HANDLER_REVIEW":
        return `${pill} bg-success-subtle text-success border-success`;
      case "ESCALATED_TO_REVIEWER":
        return `${pill} bg-info-subtle text-info border-info`;
      case "RETURNED_TO_HANDLER":
        return `${pill} bg-secondary-subtle text-dark border-secondary`;
      case "HANDLER_RESPONDED_TO_REVIEWER":
        return `${pill} bg-primary text-white border-primary`;
      case "HANDLER_RESPONDED_TO_CONTRIBUTOR":
        return `${pill} bg-dark-subtle text-dark border-dark`;
      case "CLOSED_APPROVED":
        return `${pill} bg-success text-white border-success`;
      case "CLOSED_REJECTED":
        return `${pill} bg-danger-subtle text-danger border-danger`;
      default:
        return `${pill} bg-secondary-subtle text-secondary border-secondary`;
    }
  };

  const getStatusText = (status) => {
    const s = normalizeWorkflowStatus(status);
    switch (s) {
      case "DRAFT":
        return "Draft";
      case "SUBMITTED":
        return "Submitted";
      case "UNDER_HANDLER_REVIEW":
        return "In progress";
      case "ESCALATED_TO_REVIEWER":
        return "Escalated to reviewer";
      case "RETURNED_TO_HANDLER":
        return "Returned to handler";
      case "HANDLER_RESPONDED_TO_REVIEWER":
        return "Handler → reviewer";
      case "HANDLER_RESPONDED_TO_CONTRIBUTOR":
        return "Handler → contributor";
      case "CLOSED_APPROVED":
        return "Closed — approved";
      case "CLOSED_REJECTED":
        return "Closed — rejected";
      default:
        return String(s).replaceAll("_", " ");
    }
  };

  // Strip HTML tags from text
  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const truncateWords = (text, maxWords = 22) => {
    // First strip HTML tags, then truncate
    const textWithoutHtml = stripHtml(text || "");
    const clean = textWithoutHtml.trim();
    if (!clean) return "";
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return clean;
    return `${words.slice(0, maxWords).join(" ")}...`;
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const openMaoniModal = () => {
    const modalElement = document.getElementById("maoniModal");
    if (modalElement && window.bootstrap?.Modal) {
      const modalInstance =
        window.bootstrap.Modal.getOrCreateInstance(modalElement);
      modalInstance.show();
    }
  };

  const openMaoniModalForEdit = async (maoni) => {
    try {
      const res = await getSuggestion(maoni.uid || maoni.id);
      const data = res.data || res;
      setSelectedMaoni(data);
      openMaoniModal();
    } catch (e) {
      console.error("Failed to load suggestion for editing:", e);
    }
  };

  if (!canAccessMaoni) {
    return null;
  }

  return (
    <MaoniContext.Provider
      value={{
        myMaoniStats,
        handleFetchData,
        selectedMaoni,
        setSelectedMaoni,
      }}
    >
      <div className="w-100 py-4">
        {/* Header Section */}
        <div className="row align-items-center mb-6">
          <div className="col-lg-8 col-md-6 mb-4 mb-md-0">
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                <i className="bx bx-message-rounded text-primary fs-1"></i>
              </div>
              <div>
                <h1 className="h2 mb-1">My Maoni Dashboard</h1>
                <p className="text-muted mb-0">
                  Manage your suggestions and contributions to improve our
                  organization
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-4 col-md-6">
            <button
              aria-label="Click me"
              type="button"
              data-bs-toggle="modal"
              data-bs-target="#maoniModal"
              className="btn btn-md w-100 d-flex align-items-center justify-content-center btn-primary me-2 attention-grow"
              // className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center"
            >
              <i className="bx bx-plus me-2"></i>
              New Suggestion
            </button>
          </div>
        </div>

        {/* My Stats Overview */}
        <div className="row mb-5 g-4">
          <div className="col-md-4">
            <div
              className="card card-hover border-0 shadow-sm h-100"
              style={{ cursor: "pointer" }}
              onClick={() =>
                navigate("/ppaa-maoni/suggestions", {
                  state: {
                    filter: "drafts",
                    userId: user?.id,
                    userName: user?.full_name || user?.username || undefined,
                  },
                })
              }
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="text-muted mb-1">My Total Contributions</h6>
                    <h2 className="mb-0">{myMaoniStats.total}</h2>
                  </div>
                  <div className="p-3 rounded-circle bg-primary-subtle">
                    <i className="bx bx-message-rounded text-primary fs-4"></i>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <i className="bx bx-user-circle text-info me-2"></i>
                  <small className="text-muted">Your contributions</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card card-hover border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="text-muted mb-1">My Drafts</h6>
                    <h2 className="mb-0">{myMaoniStats.drafts}</h2>
                  </div>
                  <div className="p-3 rounded-circle bg-warning-subtle">
                    <i className="bx bx-edit text-warning fs-4"></i>
                  </div>
                </div>
                <small className="text-warning fw-medium">
                  <i className="bx bx-time me-1"></i>
                  In progress
                </small>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card card-hover border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="text-muted mb-1">Submitted</h6>
                    <h2 className="mb-0">{myMaoniStats.submitted}</h2>
                  </div>
                  <div className="p-3 rounded-circle bg-success-subtle">
                    <i className="bx bx-paper-plane text-success fs-4"></i>
                  </div>
                </div>
                <small className="text-muted">
                  <i className="bx bx-check-circle me-1"></i>
                  Under review
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Left Column - My Recent Maoni with Pagination */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-0 pt-4 pb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className="bx bx-history me-2 text-primary"></i>
                    My Recent Contributions
                  </h5>
                  <span className="badge bg-light text-dark">
                    Showing {currentItems.length} of {myRecentMaoni.length}
                  </span>
                </div>
              </div>

              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <i className="bx bx-loader-circle bx-spin fs-1 text-primary mb-3"></i>
                    <p className="text-muted mb-0">Loading your suggestions...</p>
                  </div>
                ) : currentItems.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bx bx-message-rounded-detail fs-1 text-muted mb-3"></i>
                    <h5>No contributions yet</h5>
                    <p className="text-muted mb-4">
                      Start by sharing your first suggestion
                    </p>
                    <div className="d-flex justify-content-center">
                    <button
                        aria-label="Click me"
                        type="button"
                        data-bs-toggle="modal"
                        data-bs-target="#maoniModal"
                        className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center p-3 border-dashed text-center"
                        style={{ maxWidth: 420 }}
                      >
                        <div className="p-2 bg-primary-subtle rounded-circle me-3">
                          <i className="bx bx-plus text-primary"></i>
                        </div>
                        <div>
                          <div className="fw-medium">
                      Create First Contribution
                          </div>
                          <small className="text-muted">
                            Share your improvement idea
                          </small>
                        </div>
                    </button>
                    </div>
         
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {currentItems.map((maoni) => (
                      <div
                        key={maoni.id}
                        className="list-group-item list-group-item-action border-0 px-4 py-4 hover-bg"
                        onClick={() => navigate(`/ppaa-maoni/suggestions/${maoni.uid || maoni.id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center">
                            <span
                              className={`badge ${getStatusBadgeClass(
                                maoni.status
                              )} me-2`}
                            >
                              {getStatusText(maoni.status)}
                            </span>
                            <small className="text-muted">
                              {maoni.status === "draft"
                                ? "Last edited"
                                : "Submitted"}
                              : {formatDate(maoni.date, "DD/MM/YYYY")}
                            </small>
                          </div>
                          <span className="badge bg-light text-dark">
                            {maoni.category}
                          </span>
                        </div>

                        <h6 className="mb-2 text-primary-hover">
                          {maoni.title}
                        </h6>
                        <p className="text-muted mb-3" >
                          {truncateWords(maoni.description, 22)}
                        </p>

                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            <small className="text-muted">
                              <i className="bx bx-folder me-1"></i>
                              {maoni.directory}
                            </small>
                            {maoni.comment_count > 0 && (
                              <span
                                className="badge bg-info-subtle text-info d-flex align-items-center"
                                style={{ fontSize: "0.75rem" }}
                              >
                                <i className="bx bx-message-rounded me-1"></i>
                                {maoni.comment_count} {maoni.comment_count === 1 ? "reply" : "replies"}
                              </span>
                            )}
                          </div>

                          <div className="d-flex gap-2">
                            {maoni.status === "draft" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openMaoniModalForEdit(maoni);
                                }}
                                className="btn btn-sm btn-warning fw-semibold d-flex align-items-center"
                                style={{
                                  background: "linear-gradient(135deg, #ffc107 0%, #ff9800 100%)",
                                  border: "none",
                                  color: "#000",
                                  boxShadow: "0 2px 8px rgba(255, 193, 7, 0.3)",
                                  transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 193, 7, 0.4)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(255, 193, 7, 0.3)";
                                }}
                              >
                                <i className="bx bx-edit-alt me-2"></i>
                                Continue Editing
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/ppaa-maoni/suggestions/${maoni.uid || maoni.id}`
                                );
                              }}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bx bx-show me-1"></i>
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="card-footer bg-white border-0 pt-3 pb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">
                        Page {currentPage} of {totalPages} • Your contributions
                      </small>
                    </div>
                    <nav aria-label="Page navigation">
                      <ul className="pagination mb-0">
                        <li
                          className={`page-item ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <i className="bx bx-chevron-left"></i>
                          </button>
                        </li>

                        {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                          const pageNumber = index + 1;
                          const isCurrent = pageNumber === currentPage;
                          return (
                            <li
                              key={pageNumber}
                              className={`page-item ${
                                isCurrent ? "active" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(pageNumber)}
                              >
                                {pageNumber}
                              </button>
                            </li>
                          );
                        })}

                        <li
                          className={`page-item ${
                            currentPage === totalPages ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <i className="bx bx-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              )}

              {myMaoniStats.total > itemsPerPage && (
              <div className="card-footer bg-white border-0 pt-3 pb-4">
                <button
                  onClick={() =>
                      navigate("/ppaa-maoni/suggestions", {
                        state: {
                          userId: user?.id,
                          userName: user?.full_name || user?.username || undefined,
                        },
                      })
                  }
                  className="btn btn-outline-primary w-100"
                >
                  <i className="bx bx-list-ul me-2"></i>
                  View All My Contributions
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="col-lg-4">
            {/* Quick Actions */}
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4">
                  <i className="bx bx-rocket me-2 text-primary"></i>
                  Quick Actions
                </h5>

                <div className="d-grid gap-3">
                  <button
                    aria-label="Click me"
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#maoniModal"
                    className="btn btn-outline-primary d-flex align-items-center justify-content-start p-3 border-dashed text-start"
                  >
                    <div className="p-2 bg-primary-subtle rounded-circle me-3">
                      <i className="bx bx-plus text-primary"></i>
                    </div>
                    <div>
                      <div className="fw-medium">New Suggestion</div>
                      <small className="text-muted">
                        Share your improvement idea
                      </small>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      navigate("/ppaa-maoni/suggestions", {
                        state: {
                          filter: "drafts",
                          userId: user?.id,
                          userName: user?.full_name || user?.username || undefined,
                        },
                      })
                    }
                    className="btn btn-outline-warning d-flex align-items-center justify-content-start p-3 text-start"
                  >
                    <div className="p-2 bg-warning-subtle rounded-circle me-3">
                      <i className="bx bx-edit text-warning"></i>
                    </div>
                    <div>
                      <div className="fw-medium">My Drafts</div>
                      <small className="text-muted">
                        Continue editing ({myMaoniStats.drafts})
                      </small>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      navigate("/ppaa-maoni/suggestions", {
                        state: {
                          userId: user?.id,
                          userName: user?.full_name || user?.username || undefined,
                          submittedOnly: true,
                        },
                      })
                    }
                    className="btn btn-outline-success d-flex align-items-center justify-content-start p-3 text-start"
                  >
                    <div className="p-2 bg-success-subtle rounded-circle me-3">
                      <i className="bx bx-paper-plane text-success"></i>
                    </div>
                    <div>
                      <div className="fw-medium">My Submitted</div>
                      <small className="text-muted">
                        View sent suggestions ({myMaoniStats.submitted})
                      </small>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy Info */}
            <div className="card border-info bg-info-subtle border-0 mb-4">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="p-2 bg-info rounded-circle me-3">
                    <i className="bx bx-shield text-white"></i>
                  </div>
                  <div>
                    <h6 className="mb-0">Your Privacy</h6>
                    <small className="text-info">
                      Confidential contributions
                    </small>
                  </div>
                </div>
                <p className="small mb-0">
                  Your suggestions are submitted confidentially. Focus on
                  providing constructive feedback to help improve our
                  organization.
                </p>
              </div>
            </div>

            {/* Tips Card */}
            <div className="card border-primary bg-primary-subtle border-0">
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <i className="bx bx-bulb text-primary fs-4 me-3"></i>
                  <h6 className="mb-0">Tips for Your Suggestions</h6>
                </div>

                <ul className="list-unstyled mb-0">
                  <li className="mb-2 d-flex align-items-start">
                    <i className="bx bx-check-circle text-primary me-2 mt-1"></i>
                    <small>Be specific and provide examples</small>
                  </li>
                  <li className="mb-2 d-flex align-items-start">
                    <i className="bx bx-check-circle text-primary me-2 mt-1"></i>
                    <small>Suggest practical solutions</small>
                  </li>
                  <li className="mb-2 d-flex align-items-start">
                    <i className="bx bx-check-circle text-primary me-2 mt-1"></i>
                    <small>Focus on organizational benefits</small>
                  </li>
                  <li className="d-flex align-items-start">
                    <i className="bx bx-check-circle text-primary me-2 mt-1"></i>
                    <small>Save as draft before final submission</small>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State CTA */}
        {myMaoniStats.total === 0 && (
          <div className="card border-primary bg-primary-subtle border-2 mt-5">
            <div className="card-body text-center p-5">
              <div className="mb-4">
                <i className="bx bx-message-rounded-add text-primary fs-1 mb-3 d-block"></i>
                <h3 className="mb-3">Start Contributing Today</h3>
                <p className="text-muted mb-4">
                  Your insights are valuable. Share your first suggestion to
                  help improve our organization's processes and environment.
                </p>
              </div>
              <button
                aria-label="Click me"
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#maoniModal"
                className="btn btn-outline-primary w-100 d-inline-flex align-items-center justify-content-center p-3 border-dashed text-center"
                style={{ maxWidth: 420 }}
              >
                <i className="bx bx-plus me-2"></i>
                Create First Suggestion
              </button>
            </div>
          </div>
        )}

        {/* Regular CTA */}
        {myMaoniStats.total > 0 && (
          <div className="card border-success bg-success-subtle border-2 mt-5">
            <div className="card-body text-center p-5">
              <div className="mb-4">
                <i className="bx bx-trophy text-success fs-1 mb-3 d-block"></i>
                <h3 className="mb-3">Great Work So Far!</h3>
                <p className="text-muted mb-4">
                  You've contributed {myMaoniStats.total} suggestions. Keep
                  sharing your valuable insights to help us continuously
                  improve.
                </p>
              </div>
              <button
                aria-label="Click me"
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#maoniModal"
                className="btn btn-success btn-lg px-5"
              >
                <i className="bx bx-plus me-2"></i>
                Share Another Idea
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          .card-hover:hover {
            transform: translateY(-2px);
            transition: transform 0.2s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08) !important;
          }

          .hover-bg:hover {
            background-color: #f8f9fa;
          }

          .text-primary-hover:hover {
            color: #0d6efd !important;
          }

          .border-dashed {
            border-style: dashed !important;
          }

          .page-item.active .page-link {
            background-color: #0d6efd;
            border-color: #0d6efd;
          }

          .page-link {
            color: #0d6efd;
          }

          .page-link:hover {
            color: #0a58ca;
          }

          .btn-outline-primary:hover {
            transform: translateY(-1px);
            transition: transform 0.2s ease;
          }
        `}</style>
      </div>
      {/* Modal */}
      <MaoniModal
        onClose={() => {
          // Refresh dashboard list after closing modal (create/update)
          handleFetchData();
        }}
      />
    </MaoniContext.Provider>
  );
};
