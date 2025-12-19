import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "animate.css";
import { formatDate } from "../../../../helpers/DateFormater";

export const MaoniDashboardPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("month"); // month, quarter, year
  const [activeTab, setActiveTab] = useState("overview");

  // Dashboard statistics
  const [dashboardStats, setDashboardStats] = useState({
    totalContributions: 156,
    newThisMonth: 24,
    pendingReview: 18,
    implemented: 32,
    underConsideration: 42,
    rejected: 28,
    uniqueContributors: 67,
    avgResponseTime: "2.5", // days
  });

  // Category breakdown
  const [categoryBreakdown, setCategoryBreakdown] = useState([
    { name: "HR Processes", count: 38, color: "#4f46e5", percentage: 24.4 },
    {
      name: "ICT Infrastructure",
      count: 29,
      color: "#10b981",
      percentage: 18.6,
    },
    { name: "Work Environment", count: 26, color: "#f59e0b", percentage: 16.7 },
    { name: "Administration", count: 22, color: "#ef4444", percentage: 14.1 },
    { name: "Employee Welfare", count: 19, color: "#8b5cf6", percentage: 12.2 },
    { name: "Other", count: 22, color: "#6b7280", percentage: 14.1 },
  ]);

  // Recent contributions (all users)
  const [recentContributions, setRecentContributions] = useState([
    {
      id: 1,
      title: "Implement Flexible Working Hours",
      category: "Work Policy",
      status: "pending_review",
      date: "2024-01-15",
      submittedBy: "anonymous",
      votes: 45,
      comments: 18,
      priority: "high",
      lastAction: "2 days ago",
      department: "Multiple",
    },
    {
      id: 2,
      title: "Upgrade Office Wi-Fi Infrastructure",
      category: "ICT Infrastructure",
      status: "under_review",
      date: "2024-01-14",
      submittedBy: "anonymous",
      votes: 28,
      comments: 9,
      priority: "high",
      lastAction: "1 day ago",
      department: "ICT",
    },
    {
      id: 3,
      title: "Improve Onboarding Process",
      category: "HR Processes",
      status: "implemented",
      date: "2024-01-10",
      submittedBy: "anonymous",
      votes: 32,
      comments: 15,
      priority: "medium",
      lastAction: "1 week ago",
      department: "HR",
    },
    {
      id: 4,
      title: "Implement Paperless Office",
      category: "Administration",
      status: "under_consideration",
      date: "2024-01-08",
      submittedBy: "anonymous",
      votes: 41,
      comments: 22,
      priority: "medium",
      lastAction: "3 days ago",
      department: "Admin",
    },
    {
      id: 5,
      title: "Enhance Cybersecurity Training",
      category: "ICT Security",
      status: "pending_review",
      date: "2024-01-05",
      submittedBy: "anonymous",
      votes: 19,
      comments: 7,
      priority: "high",
      lastAction: "Just now",
      department: "ICT",
    },
    {
      id: 6,
      title: "Improve Cafeteria Food Options",
      category: "Employee Welfare",
      status: "rejected",
      date: "2024-01-03",
      submittedBy: "anonymous",
      votes: 56,
      comments: 31,
      priority: "low",
      lastAction: "2 weeks ago",
      department: "HR",
      rejectionReason: "Budget constraints for this quarter",
    },
  ]);

  // Top contributors (anonymous identifiers)
  const [topContributors, setTopContributors] = useState([
    { id: "user_001", contributions: 14, implemented: 3, active: true },
    { id: "user_002", contributions: 12, implemented: 2, active: true },
    { id: "user_003", contributions: 9, implemented: 1, active: true },
    { id: "user_004", contributions: 8, implemented: 0, active: false },
    { id: "user_005", contributions: 7, implemented: 2, active: true },
  ]);

  // Department statistics
  const [departmentStats, setDepartmentStats] = useState([
    { name: "ICT Department", contributions: 42, implemented: 8, pending: 12 },
    { name: "HR Department", contributions: 38, implemented: 10, pending: 8 },
    { name: "Finance", contributions: 24, implemented: 6, pending: 4 },
    { name: "Operations", contributions: 22, implemented: 3, pending: 7 },
    { name: "Administration", contributions: 19, implemented: 5, pending: 2 },
  ]);

  // Status breakdown for chart
  const statusBreakdown = {
    pending_review: dashboardStats.pendingReview,
    under_consideration: dashboardStats.underConsideration,
    implemented: dashboardStats.implemented,
    rejected: dashboardStats.rejected,
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "implemented":
        return "bg-success-subtle text-success border-success";
      case "under_review":
      case "under_consideration":
        return "bg-primary-subtle text-primary border-primary";
      case "pending_review":
        return "bg-warning-subtle text-warning border-warning";
      case "rejected":
        return "bg-danger-subtle text-danger border-danger";
      default:
        return "bg-secondary-subtle text-secondary border-secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "implemented":
        return "Implemented";
      case "under_review":
        return "Under Review";
      case "under_consideration":
        return "Under Consideration";
      case "pending_review":
        return "Pending Review";
      case "rejected":
        return "Rejected";
      default:
        return status.replace("_", " ").toUpperCase();
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <span className="badge bg-danger">High Priority</span>;
      case "medium":
        return <span className="badge bg-warning">Medium Priority</span>;
      case "low":
        return <span className="badge bg-secondary">Low Priority</span>;
      default:
        return <span className="badge bg-light text-dark">{priority}</span>;
    }
  };

  const handleExportData = () => {
    // Export functionality
    console.log("Exporting dashboard data");
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
        navigate("/mnh-connect/admin/maoni/reports");
        break;
      case "settings":
        navigate("/mnh-connect/admin/maoni/settings");
        break;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Dashboard Header */}
      <div className="row align-items-center mb-6">
        <div className="col-lg-8 col-md-6 mb-4 mb-md-0">
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

        <div className="col-lg-4 col-md-6">
          <div className="d-flex gap-2 justify-content-end">
            <div className="dropdown">
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
                  : "This Year"}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setTimeRange("month")}
                  >
                    This Month
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setTimeRange("quarter")}
                  >
                    This Quarter
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => setTimeRange("year")}
                  >
                    This Year
                  </button>
                </li>
              </ul>
            </div>
            <button onClick={handleExportData} className="btn btn-primary">
              <i className="bx bx-download me-2"></i>
              Export
            </button>
          </div>
        </div>
      </div>

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
                  activeTab === "contributions" ? "active" : ""
                }`}
                onClick={() => setActiveTab("contributions")}
              >
                <i className="bx bx-message-rounded me-2"></i>
                Contributions
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
                Analytics
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "moderation" ? "active" : ""
                }`}
                onClick={() => setActiveTab("moderation")}
              >
                <i className="bx bx-check-shield me-2"></i>
                Moderation
                <span className="badge bg-danger ms-2">
                  {dashboardStats.pendingReview}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Key Metrics */}
          <div className="row mb-5 g-4">
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
                      {dashboardStats.newThisMonth} this month
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
                      <h6 className="text-muted mb-1">Pending Review</h6>
                      <h2 className="mb-0 text-warning">
                        {dashboardStats.pendingReview}
                      </h2>
                    </div>
                    <div className="p-3 rounded-circle bg-warning-subtle">
                      <i className="bx bx-time text-warning fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => handleQuickAction("review_pending")}
                      className="btn btn-sm btn-warning"
                    >
                      Review Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="text-muted mb-1">Implemented</h6>
                      <h2 className="mb-0 text-success">
                        {dashboardStats.implemented}
                      </h2>
                    </div>
                    <div className="p-3 rounded-circle bg-success-subtle">
                      <i className="bx bx-check-circle text-success fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-muted small">
                      {(
                        (dashboardStats.implemented /
                          dashboardStats.totalContributions) *
                        100
                      ).toFixed(1)}
                      % success rate
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
                      <h6 className="text-muted mb-1">Unique Contributors</h6>
                      <h2 className="mb-0 text-info">
                        {dashboardStats.uniqueContributors}
                      </h2>
                    </div>
                    <div className="p-3 rounded-circle bg-info-subtle">
                      <i className="bx bx-user text-info fs-4"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-muted small">
                      Avg. {dashboardStats.avgResponseTime} days response time
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Tables Row */}
          <div className="row g-4">
            {/* Status Breakdown */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0">
                  <h5 className="mb-0">Status Breakdown</h5>
                </div>
                <div className="card-body">
                  {Object.entries(statusBreakdown).map(([status, count]) => (
                    <div key={status} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">
                          {getStatusText(status)}
                        </span>
                        <span className="fw-medium">{count}</span>
                      </div>
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className={`progress-bar ${
                            status === "implemented"
                              ? "bg-success"
                              : status === "under_consideration"
                              ? "bg-primary"
                              : status === "pending_review"
                              ? "bg-warning"
                              : "bg-danger"
                          }`}
                          style={{
                            width: `${
                              (count / dashboardStats.totalContributions) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Contributions by Category</h5>
                  <button
                    onClick={() => handleQuickAction("add_category")}
                    className="btn btn-sm btn-outline-primary"
                  >
                    <i className="bx bx-plus me-1"></i>
                    Add Category
                  </button>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th className="text-center">Count</th>
                          <th className="text-center">Percentage</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryBreakdown.map((category) => (
                          <tr key={category.name}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle me-2"
                                  style={{
                                    width: "12px",
                                    height: "12px",
                                    backgroundColor: category.color,
                                  }}
                                ></div>
                                {category.name}
                              </div>
                            </td>
                            <td className="text-center">
                              <span className="fw-medium">
                                {category.count}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark">
                                {category.percentage}%
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/mnh-connect/admin/maoni/category/${category.name}`
                                  )
                                }
                                className="btn btn-sm btn-outline-primary"
                              >
                                View
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

          {/* Recent Activity & Quick Actions */}
          <div className="row g-4 mt-4">
            {/* Recent Contributions */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Contributions</h5>
                  <button
                    onClick={() => navigate("/mnh-connect/admin/maoni/all")}
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
                          <th>Priority</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentContributions.slice(0, 5).map((contribution) => (
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
                                    {formatDate(
                                      contribution.date,
                                      "DD/MM/YYYY"
                                    )}
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
                              >
                                {getStatusText(contribution.status)}
                              </span>
                            </td>
                            <td>{getPriorityBadge(contribution.priority)}</td>
                            <td>
                              <div className="btn-group">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/mnh-connect/admin/maoni/review/${contribution.id}`
                                    )
                                  }
                                  className="btn btn-sm btn-outline-primary"
                                >
                                  Review
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/mnh-connect/admin/maoni/${contribution.id}`
                                    )
                                  }
                                  className="btn btn-sm btn-outline-secondary"
                                >
                                  View
                                </button>
                              </div>
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
                          {dashboardStats.pendingReview} items need review
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
                          Monthly analytics report
                        </small>
                      </div>
                    </button>

                    <button
                      onClick={() => handleQuickAction("settings")}
                      className="btn btn-secondary d-flex align-items-center justify-content-start p-3 text-start"
                    >
                      <div className="p-2 bg-secondary-subtle rounded-circle me-3">
                        <i className="bx bx-cog text-secondary"></i>
                      </div>
                      <div>
                        <div className="fw-medium">System Settings</div>
                        <small className="text-muted">
                          Configure maoni system
                        </small>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        navigate("/mnh-connect/admin/maoni/categories")
                      }
                      className="btn btn-info d-flex align-items-center justify-content-start p-3 text-start"
                    >
                      <div className="p-2 bg-info-subtle rounded-circle me-3">
                        <i className="bx bx-category text-info"></i>
                      </div>
                      <div>
                        <div className="fw-medium">Manage Categories</div>
                        <small className="text-muted">
                          Add or edit categories
                        </small>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="row g-4 mt-4">
            {/* Top Contributors */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0">
                  <h5 className="mb-0">Top Contributors</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Contributor ID</th>
                          <th className="text-center">Contributions</th>
                          <th className="text-center">Implemented</th>
                          <th className="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topContributors.map((contributor) => (
                          <tr key={contributor.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="me-2">
                                  <i className="bx bx-user-circle text-muted"></i>
                                </div>
                                <span className="font-monospace">
                                  {contributor.id}
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
                                {contributor.implemented}
                              </span>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Performance */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0">
                  <h5 className="mb-0">Department Performance</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th className="text-center">Total</th>
                          <th className="text-center">Implemented</th>
                          <th className="text-center">Pending</th>
                          <th className="text-center">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departmentStats.map((dept) => (
                          <tr key={dept.name}>
                            <td>{dept.name}</td>
                            <td className="text-center">
                              <span className="fw-medium">
                                {dept.contributions}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-success">
                                {dept.implemented}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-warning">
                                {dept.pending}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark">
                                {(
                                  (dept.implemented / dept.contributions) *
                                  100
                                ).toFixed(0)}
                                %
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
        </>
      )}

      {/* Analytics Tab Content */}
      {activeTab === "analytics" && (
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bx bx-bar-chart-alt text-muted fs-1 mb-3"></i>
                <h5>Detailed Analytics View</h5>
                <p className="text-muted mb-0">
                  Comprehensive analytics and reporting features will be
                  available here
                </p>
                <button
                  onClick={() => handleQuickAction("generate_report")}
                  className="btn btn-primary mt-3"
                >
                  <i className="bx bx-download me-2"></i>
                  Generate Detailed Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Tab Content */}
      {activeTab === "moderation" && (
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">Pending Moderation</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th width="40%">Contribution</th>
                        <th>Submitted</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentContributions
                        .filter((c) => c.status === "pending_review")
                        .map((contribution) => (
                          <tr key={contribution.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="me-3">
                                  <i className="bx bx-message-rounded text-warning"></i>
                                </div>
                                <div>
                                  <div className="fw-medium">
                                    {contribution.title}
                                  </div>
                                  <small className="text-muted">
                                    ID: {contribution.id} • Last action:{" "}
                                    {contribution.lastAction}
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {formatDate(contribution.date, "DD/MM/YYYY")}
                            </td>
                            <td>
                              <span className="badge bg-light text-dark">
                                {contribution.category}
                              </span>
                            </td>
                            <td>{getPriorityBadge(contribution.priority)}</td>
                            <td>
                              <div className="btn-group">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/mnh-connect/admin/maoni/review/${contribution.id}`
                                    )
                                  }
                                  className="btn btn-sm btn-primary"
                                >
                                  <i className="bx bx-check me-1"></i>
                                  Review
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/mnh-connect/admin/maoni/${contribution.id}`
                                    )
                                  }
                                  className="btn btn-sm btn-outline-secondary"
                                >
                                  <i className="bx bx-show me-1"></i>
                                  Preview
                                </button>
                              </div>
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

      {/* Dashboard Footer */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-0 bg-light">
            <div className="card-body py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">
                    <i className="bx bx-info-circle me-1"></i>
                    Last updated:{" "}
                    {formatDate(new Date().toISOString(), "DD/MM/YYYY HH:mm")}
                  </small>
                </div>
                <div>
                  <small className="text-muted">
                    Data is refreshed every 15 minutes
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

        .badge {
          padding: 0.35em 0.65em;
          font-size: 0.75em;
        }

        .progress {
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-bar {
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
