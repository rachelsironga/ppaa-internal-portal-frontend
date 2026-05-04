import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getSuggestions, getSuggestion, getAllSuggestions } from "./Queries";
import { formatDate } from "../../../helpers/DateFormater";
import LinearIndeterminate from "../../../LinearIndeterminate";
import MaoniPortalBreadcrumb from "../../../layouts/MaoniPortalBreadcrumb";
import SuggestionForm from "./SuggestionForm";
import { isMaoniDepartmentHandler, isMaoniReviewer } from "../../../utils/maoniRoles";
import {
  maoniUnderHandlerReviewBadgeClasses,
  getMaoniUnderHandlerReviewBadgeStyle,
} from "../../../utils/maoniUnderHandlerReviewBadge";

const maoniSeenUpdatedKey = (uid) => `maoni_suggestion_last_seen_updated_${uid}`;

/** True when this suggestion was updated after the contributor last opened its detail page. */
const suggestionHasNewActivityForContributor = (suggestion, userId) => {
  if (!suggestion?.uid || userId == null) return false;
  if (String(suggestion.submitted_by_id ?? "") !== String(userId)) return false;
  try {
    const seen = localStorage.getItem(maoniSeenUpdatedKey(suggestion.uid));
    const cur = String(suggestion.updated_at || suggestion.created_at || "");
    if (!cur) return false;
    if (!seen) return Number(suggestion.comment_count || 0) > 0;
    return cur > seen;
  } catch {
    return false;
  }
};

const SuggestionsList = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const location = useLocation();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const isMaoniReviewerUser =
    isMaoniReviewer(user) || user?.is_superuser;

  const handlerDepartmentUid = useMemo(() => {
    if (!isMaoniDepartmentHandler(user)) return null;
    return (
      user?.department?.uid ||
      user?.department_uid ||
      user?.position?.department_uid ||
      user?.current_department_uid ||
      null
    );
  }, [user]);

  const hasDepartmentListScope = Boolean(handlerDepartmentUid);

  const draftOnly = location?.state?.filter === "drafts";
  const filterUserId = location?.state?.userId || null;
  const filterUserName = location?.state?.userName || null;
  const submittedOnly = Boolean(location?.state?.submittedOnly);

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

  // Debounce search input so we don't re-fetch on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [draftOnly, filterUserId, submittedOnly, hasDepartmentListScope, handlerDepartmentUid]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchSuggestions();
  }, [currentPage, draftOnly, debouncedSearch, filterUserId, submittedOnly, hasDepartmentListScope, handlerDepartmentUid]);

  // Show success modal after creating a suggestion, then clear navigation state.
  useEffect(() => {
    const message = location?.state?.maoniSuccessMessage;
    if (!message) return;

    Swal.fire({
      icon: "success",
      title: "Success",
      text: message,
    }).then(() => {
      // Clear the state so it doesn't re-show on refresh/back
      navigate(location.pathname, { replace: true, state: {} });
    });
  }, [location?.state, location?.pathname, navigate]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);

      if (isMaoniDepartmentHandler(user) && !handlerDepartmentUid) {
        setSuggestions([]);
        setTotalPages(1);
        setTotalCount(0);
        return;
      }

      const pageSize = 10;
      const query = (debouncedSearch || "").trim().toLowerCase();
      const hasSearchQuery = query.length > 0;

      const hasUserFilter = Boolean(filterUserId);

      const matchesQuery = (s) => {
        if (!hasSearchQuery) return true;
        const haystack = [
          s.title,
          stripHtml(s.description || ""),
          s.category_name,
          s.priority,
          s.status,
          s.submitted_by_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      };

      const applyDepartmentScope = (rows) => {
        if (!hasDepartmentListScope || !handlerDepartmentUid) return rows;
        return rows.filter(
          (s) =>
            s.department_uid != null &&
            String(s.department_uid).trim() !== "" &&
            String(s.department_uid) === String(handlerDepartmentUid)
        );
      };

      const needsClientMode =
        draftOnly ||
        hasSearchQuery ||
        hasUserFilter ||
        submittedOnly ||
        hasDepartmentListScope;

      if (needsClientMode) {
        let data = [];
        if (hasDepartmentListScope) {
          const res = await getAllSuggestions();
          data = Array.isArray(res?.data) ? res.data : [];
        } else {
          const batchSize = 500;
          const response = await getSuggestions(1, batchSize);
          if (response.status === 8000 || response.status === 200) {
            data = Array.isArray(response.data) ? response.data : [];
          }
        }

        let base = applyDepartmentScope(data);

        if (draftOnly) {
          base = base.filter((s) => normalizeWorkflowStatus(s.status) === "DRAFT");
        } else if (submittedOnly) {
          base = base.filter((s) => normalizeWorkflowStatus(s.status) !== "DRAFT");
        } else {
          base = base.filter((s) => normalizeWorkflowStatus(s.status) !== "DRAFT");
        }

        if (hasUserFilter) {
          base = base.filter((s) => String(s.submitted_by_id) === String(filterUserId));
        }

        const filtered = base.filter(matchesQuery);

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageItems = filtered.slice(startIndex, endIndex);

        setSuggestions(pageItems);
        setTotalPages(Math.ceil(filtered.length / pageSize) || 1);
        setTotalCount(filtered.length);
        return;
      }

      const response = await getSuggestions(currentPage, pageSize);
      if (response.status === 8000 || response.status === 200) {
        const data = response.data || [];
        const pagination = response.pagination || {};

        if (Array.isArray(data)) {
          const pageItems = data.slice(0, pageSize);

          setSuggestions(pageItems);
          const total = pagination.total || data.length;
          const size = pagination.page_size || pageSize;
          setTotalPages(Math.ceil(total / size) || 1);
          setTotalCount(total);
        }
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to load suggestions",
      });
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = normalizeWorkflowStatus(status).toLowerCase();
    switch (statusLower) {
      case "submitted":
        return "bg-primary-subtle text-primary";
      case "draft":
        return "bg-warning-subtle text-warning";
      case "under_handler_review":
        return maoniUnderHandlerReviewBadgeClasses;
      case "returned_to_handler":
      case "handler_responded_to_reviewer":
        return "bg-warning-subtle text-warning";
      case "escalated_to_reviewer":
        return "bg-info-subtle text-info";
      case "closed_approved":
        return "bg-success-subtle text-success";
      case "closed_rejected":
        return "bg-danger-subtle text-danger";
      default:
        return "bg-secondary-subtle text-secondary";
    }
  };

  const getStatusBadgeStyle = (status) => {
    const statusLower = normalizeWorkflowStatus(status).toLowerCase();
    if (statusLower === "under_handler_review") {
      return getMaoniUnderHandlerReviewBadgeStyle();
    }
    return undefined;
  };

  const getStatusText = (status) => {
    const statusLower = normalizeWorkflowStatus(status).toLowerCase();
    switch (statusLower) {
      case "submitted":
        return "SUBMITTED";
      case "draft":
        return "DRAFT";
      case "under_handler_review":
        return "UNDER HANDLER REVIEW";
      case "escalated_to_reviewer":
        return "ESCALATED TO REVIEWER";
      case "returned_to_handler":
        return "RETURNED TO HANDLER";
      case "handler_responded_to_reviewer":
        return "HANDLER RESPONDED TO REVIEWER";
      case "handler_responded_to_contributor":
        return "HANDLER RESPONDED TO CONTRIBUTOR";
      case "closed_approved":
        return "CLOSED APPROVED";
      case "closed_rejected":
        return "CLOSED REJECTED";
      default:
        return status || "";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    const priorityLower = priority?.toLowerCase();
    switch (priorityLower) {
      case "urgent":
        return "bg-danger text-white";
      case "high":
        return "bg-warning text-dark";
      case "medium":
        return "bg-info text-white";
      case "low":
        return "bg-secondary text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const truncateWords = (text, maxWords = 22) => {
    const clean = stripHtml(text || "").trim();
    if (!clean) return "";
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return clean;
    return `${words.slice(0, maxWords).join(" ")}...`;
  };

  // visibleSuggestions is now just suggestions (already filtered/paginated)
  const visibleSuggestions = suggestions;

  const handleEditDraft = async (e, suggestion) => {
    e.stopPropagation(); // Prevent card click
    try {
      const response = await getSuggestion(suggestion.uid);
      if (response.status === 8000 || response.status === 200) {
        setSelectedSuggestion(response.data || response);
        setIsEditMode(true);
        // Open the modal
        const modalElement = document.getElementById("ppaaMaoniSuggestionModal");
        if (modalElement && window.bootstrap?.Modal) {
          const modalInstance =
            window.bootstrap.Modal.getOrCreateInstance(modalElement);
          modalInstance.show();
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to load suggestion for editing",
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedSuggestion(null);
    setIsEditMode(false);
    fetchSuggestions(); // Refresh the list
  };

  if (loading) {
    return <LinearIndeterminate />;
  }

  const goBackFromList = () => {
    navigate(-1);
  };

  return (
    <>
      <div className="w-100 py-4">
        <MaoniPortalBreadcrumb onBack={goBackFromList} tailLabel="List" />

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Suggestions</h2>
            <p className="text-muted mb-0">
              {draftOnly
                ? "Your draft suggestions"
                : filterUserId
                ? `Submitted suggestions by ${filterUserName || "selected user"}`
                : isMaoniDepartmentHandler(user) && !handlerDepartmentUid
                ? "Assign a department to your profile to see suggestions for your queue"
                : hasDepartmentListScope
                ? "Suggestions submitted to your department only"
                : isMaoniReviewerUser
                ? "All submitted suggestions"
                : "Your submitted suggestions"}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <div className="input-group" style={{ width: "320px" }}>
              <span className="input-group-text bg-white">
                <i className="bx bx-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search suggestions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                >
                  <i className="bx bx-x"></i>
                </button>
              )}
            </div>

            {/* Hide "New Suggestion" when viewing another user's suggestions (from dashboard View Details) */}
            {!filterUserId && (
              <button
                aria-label="Click me"
                type="button"
                data-bs-toggle="modal"
                data-bs-target="#ppaaMaoniSuggestionModal"
                className="btn btn-md btn-primary d-flex align-items-center justify-content-center attention-grow"
                style={{ minWidth: "200px" }}
                onClick={() => {
                  setSelectedSuggestion(null);
                  setIsEditMode(false);
                }}
              >
                <i className="bx bx-plus me-2"></i>
                New Suggestion
              </button>
            )}
          </div>
        </div>

        {debouncedSearch && (
          <div className="d-flex align-items-center justify-content-between mb-3">
            <small className="text-muted">
              Showing <strong>{totalCount}</strong> result
              {totalCount === 1 ? "" : "s"} for{" "}
              <strong>&ldquo;{debouncedSearch}&rdquo;</strong>
              {draftOnly ? " (Drafts)" : ""}
            </small>
          </div>
        )}

        {visibleSuggestions.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox fs-1 text-muted"></i>
            <p className="text-muted mt-3">
              {filterUserId
                ? filterUserName
                  ? `No suggestions found for ${filterUserName}.`
                  : "No suggestions found for this user."
                : "No suggestions found"}
            </p>
            {!filterUserId && (
              <button
                className="btn btn-primary"
                onClick={() => navigate("/ppaa-maoni/suggestions/new")}
              >
                Create Your First Suggestion
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="row">
              {visibleSuggestions.map((suggestion) => (
                <div key={suggestion.uid} className="col-md-6 col-lg-4 mb-4">
                  <div
                    className="card h-100 shadow-sm cursor-pointer suggestion-card border-0"
                    onClick={() =>
                      navigate(`/ppaa-maoni/suggestions/${suggestion.uid}`)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div className="card-body d-flex flex-column">
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <h5 className="card-title mb-0 suggestion-title">
                          {suggestion.title}
                        </h5>
                        <div className="d-flex flex-wrap align-items-center gap-1 justify-content-end">
                          {suggestionHasNewActivityForContributor(suggestion, user?.id) && (
                            <span
                              className="badge rounded-pill bg-danger"
                              title="New message or update since you last opened this suggestion"
                            >
                              New
                            </span>
                          )}
                          <span
                            className={`badge ${getStatusBadgeClass(
                              suggestion.status
                            )} text-uppercase`}
                            style={{
                              letterSpacing: "0.02em",
                              ...getStatusBadgeStyle(suggestion.status),
                            }}
                          >
                            {getStatusText(suggestion.status)}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-muted mb-3 suggestion-desc">
                        {truncateWords(suggestion.description, 22)}
                      </p>

                      {/* Chips */}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span
                          className={`badge ${getPriorityBadgeClass(
                            suggestion.priority
                          )} d-flex align-items-center`}
                        >
                          <i className="bx bx-flag me-1"></i>
                          {suggestion.priority}
                        </span>

                        {suggestion.category_name && (
                          <span className="badge bg-light text-dark d-flex align-items-center">
                            <i className="bx bx-category me-1"></i>
                            {suggestion.category_name}
                          </span>
                        )}

                        {suggestion.comment_count > 0 && (
                          <span
                            className="badge bg-info-subtle text-info d-flex align-items-center"
                            style={{ fontSize: "0.75rem" }}
                          >
                            <i className="bx bx-message-rounded me-1"></i>
                            {suggestion.comment_count}{" "}
                            {suggestion.comment_count === 1 ? "reply" : "replies"}
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                        <small className="text-muted d-flex align-items-center">
                          <i className="bx bx-user-circle me-1"></i>
                          {suggestion.submitted_by_name || "Anonymous"}
                        </small>
                        <small className="text-muted d-flex align-items-center">
                          <i className="bx bx-calendar me-1"></i>
                          {formatDate(
                            suggestion.submitted_at || suggestion.created_at
                          )}
                        </small>
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-2 mt-3">
                        {(suggestion.status || "").toLowerCase() === "draft" && (
                          <button
                            onClick={(e) => handleEditDraft(e, suggestion)}
                            className="btn btn-warning fw-semibold d-flex align-items-center justify-content-center flex-grow-1"
                            style={{
                              background:
                                "linear-gradient(135deg, #ffc107 0%, #ff9800 100%)",
                              border: "none",
                              color: "#000",
                              boxShadow: "0 2px 8px rgba(255, 193, 7, 0.3)",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-2px)";
                              e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(255, 193, 7, 0.4)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow =
                                "0 2px 8px rgba(255, 193, 7, 0.3)";
                            }}
                          >
                            <i className="bx bx-edit-alt me-2"></i>
                            Continue Editing
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/ppaa-maoni/suggestions/${suggestion.uid}`);
                          }}
                          className={`btn ${
                            (suggestion.status || "").toLowerCase() === "draft"
                              ? "btn-outline-primary"
                              : "btn-primary"
                          } d-flex align-items-center justify-content-center ${
                            (suggestion.status || "").toLowerCase() === "draft"
                              ? ""
                              : "flex-grow-1"
                          }`}
                        >
                          <i className="bx bx-show me-2"></i>
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Info */}
            {totalCount > 0 && (
              <div className="text-center text-muted mb-3">
                <small>
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} suggestions
                </small>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Suggestions pagination">
                <ul className="pagination justify-content-center">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        if (newPage !== currentPage) {
                          setCurrentPage(newPage);
                        }
                      }}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, idx) => {
                    const page = idx + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <li
                          key={page}
                          className={`page-item ${
                            currentPage === page ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => {
                              if (page >= 1 && page <= totalPages) {
                                setCurrentPage(page);
                              }
                            }}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <li key={page} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }
                    return null;
                  })}
                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        if (newPage !== currentPage) {
                          setCurrentPage(newPage);
                        }
                      }}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>

      {/* New Suggestion Modal (PPAA Maoni) */}
      <div
        className="modal modal-slide-in fade"
        id="ppaaMaoniSuggestionModal"
        tabIndex="-1"
        aria-hidden="true"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog modal-xl" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <div className="d-flex align-items-center">
                <i className="bx bx-message-rounded-add text-primary fs-4 me-2"></i>
                <h5 className="modal-title mb-0">
                  {isEditMode ? "Edit Draft Suggestion" : "Submit a Suggestion"}
                </h5>
              </div>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleCloseModal}
              ></button>
            </div>
            <div className="modal-body">
              <SuggestionForm
                initialData={selectedSuggestion}
                isEditMode={isEditMode}
                onSuccess={handleCloseModal}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .suggestion-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .suggestion-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
        }
        .suggestion-title {
          font-weight: 700;
          line-height: 1.2;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .suggestion-desc {
          font-size: 0.95rem;
          line-height: 1.45;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          min-height: 4.2em;
        }
      `}</style>
    </>
  );
};

export default SuggestionsList;
