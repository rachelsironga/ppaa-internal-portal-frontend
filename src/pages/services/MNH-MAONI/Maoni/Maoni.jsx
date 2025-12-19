import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "animate.css";
import { formatDate } from "../../../../helpers/DateFormater";
import MaoniModal from "./MaoniModal";
import { MaoniContext } from "../../../../utils/context";

export const Maoni = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const navigate = useNavigate();

  // User's personal maoni stats
  const [myMaoniStats, setMyMaoniStats] = useState({
    total: 14,
    drafts: 3,
    submitted: 11,
  });

  // User's recent maoni (only their own)
  const [myRecentMaoni, setMyRecentMaoni] = useState([
    {
      id: 1,
      title: "Improve Employee Onboarding Process",
      category: "HR Process",
      status: "draft",
      date: "2024-01-15",
      directory: "Human Resources",
      description:
        "Suggesting a more structured onboarding program with mentorship pairing...",
    },
    {
      id: 2,
      title: "Upgrade Office Wi-Fi Infrastructure",
      category: "ICT Infrastructure",
      status: "submitted",
      date: "2024-01-14",
      directory: "Information and Communication Technology",
      description:
        "The current Wi-Fi setup is outdated and often unreliable...",
      submittedDate: "2024-01-14",
    },
    {
      id: 3,
      title: "Implement Paperless Office System",
      category: "Digital Transformation",
      status: "submitted",
      date: "2024-01-10",
      directory: "Administration",
      description:
        "Transition to digital documentation to reduce paper waste...",
      submittedDate: "2024-01-10",
    },
    {
      id: 4,
      title: "Improve Cafeteria Food Quality",
      category: "Employee Welfare",
      status: "draft",
      date: "2024-01-08",
      directory: "Human Resources",
      description:
        "Better meal options and healthier food choices in the cafeteria...",
    },
    {
      id: 5,
      title: "Enhance Cybersecurity Training",
      category: "ICT Security",
      status: "submitted",
      date: "2024-01-05",
      directory: "Information and Communication Technology",
      description: "Regular cybersecurity awareness training for all staff...",
      submittedDate: "2024-01-05",
    },
    {
      id: 6,
      title: "Flexible Working Hours Implementation",
      category: "Work Policy",
      status: "submitted",
      date: "2024-01-03",
      directory: "Human Resources",
      description:
        "Allow flexible start and end times for better work-life balance...",
      submittedDate: "2024-01-03",
    },
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(myRecentMaoni.length / itemsPerPage);

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = myRecentMaoni.slice(indexOfFirstItem, indexOfLastItem);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "submitted":
        return "bg-primary-subtle text-primary";
      case "draft":
        return "bg-warning-subtle text-warning";
      default:
        return "bg-secondary-subtle text-secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "submitted":
        return "Submitted";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <MaoniContext.Provider
      value={{
        myMaoniStats,
      }}
    >
      <div className="container-fluid py-4">
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
            <div className="card card-hover border-0 shadow-sm h-100">
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
                {currentItems.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bx bx-message-rounded-detail fs-1 text-muted mb-3"></i>
                    <h5>No contributions yet</h5>
                    <p className="text-muted mb-4">
                      Start by sharing your first suggestion
                    </p>
                    <button
                      onClick={() => navigate("/mnh-connect/maoni/new")}
                      className="btn btn-primary"
                    >
                      <i className="bx bx-plus me-2"></i>
                      Create First Contribution
                    </button>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {currentItems.map((maoni) => (
                      <div
                        key={maoni.id}
                        className="list-group-item list-group-item-action border-0 px-4 py-4 hover-bg"
                        onClick={() =>
                          navigate(`/mnh-connect/maoni/${maoni.id}`)
                        }
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
                        <p className="text-muted mb-3">{maoni.description}</p>

                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-muted">
                              <i className="bx bx-folder me-1"></i>
                              {maoni.directory}
                            </small>
                          </div>

                          <div className="d-flex gap-2">
                            {maoni.status === "draft" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/mnh-connect/maoni/edit/${maoni.id}`
                                  );
                                }}
                                className="btn btn-sm btn-warning"
                              >
                                <i className="bx bx-edit me-1"></i>
                                Continue
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/mnh-connect/maoni/${maoni.id}`);
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

              <div className="card-footer bg-white border-0 pt-3 pb-4">
                <button
                  onClick={() =>
                    navigate("/mnh-connect/maoni/my-contributions")
                  }
                  className="btn btn-outline-primary w-100"
                >
                  <i className="bx bx-list-ul me-2"></i>
                  View All My Contributions
                </button>
              </div>
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
                    onClick={() => navigate("/mnh-connect/maoni/new")}
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
                    onClick={() => navigate("/mnh-connect/maoni/my-drafts")}
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
                    onClick={() => navigate("/mnh-connect/maoni/my-submitted")}
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
                onClick={() => navigate("/mnh-connect/maoni/new")}
                className="btn btn-primary btn-lg px-5"
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
                onClick={() => navigate("/mnh-connect/maoni/new")}
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
          // Optional: refresh data or perform any cleanup
          if (typeof handleFetchData === "function") handleFetchData();
        }}
      />
    </MaoniContext.Provider>
  );
};
