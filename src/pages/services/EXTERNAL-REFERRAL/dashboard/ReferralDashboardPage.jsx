import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "animate.css";
import { formatDate } from "../../../../helpers/DateFormater";

// Chart components (using simple div-based charts for demo)
const BarChart = ({ data, labels, colors, height = 200 }) => {
  const maxValue = Math.max(...data);

  return (
    <div className="d-flex align-items-end" style={{ height: `${height}px` }}>
      {data.map((value, index) => (
        <div
          key={index}
          className="d-flex flex-column align-items-center mx-1"
          style={{ flex: 1 }}
        >
          <div
            className="rounded-top"
            style={{
              width: "80%",
              height: `${(value / maxValue) * 100}%`,
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
  const total = data.reduce((sum, value) => sum + value, 0);
  let cumulativePercent = 0;

  return (
    <div
      className="position-relative"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        {data.map((value, index) => {
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
        })}
      </svg>
      <div className="position-absolute top-50 start-50 translate-middle text-center">
        <div className="fw-bold">{total}</div>
        <div className="small text-muted">Total</div>
      </div>
    </div>
  );
};

const LineChart = ({ data, labels, color = "#0d6efd", height = 200 }) => {
  const maxValue = Math.max(...data);
  const pointCount = data.length;
  const pointWidth = 100 / (pointCount - 1);

  const points = data
    .map((value, index) => {
      const x = index * pointWidth;
      const y = 100 - (value / maxValue) * 100;
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
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        {data.map((value, index) => {
          const x = index * pointWidth;
          const y = 100 - (value / maxValue) * 100;
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

export const ReferralDashboardPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [customDateRange, setCustomDateRange] = useState({
    start: "2024-01-01",
    end: "2024-01-31",
  });

  // Dashboard statistics
  const [dashboardStats, setDashboardStats] = useState({
    totalContributions: 156,
    newThisMonth: 24,
    pendingReview: 18,
    implemented: 32,
    underConsideration: 42,
    rejected: 28,
    uniqueContributors: 67,
    avgResponseTime: "2.5",
    engagementRate: "43%",
    satisfactionScore: "4.2",
  });

  // Chart data
  const [contributionTrend, setContributionTrend] = useState({
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    data: [8, 12, 10, 15, 18, 22, 20, 25, 28, 24, 20, 18],
  });

  const [statusDistribution, setStatusDistribution] = useState({
    labels: [
      "Implemented",
      "Under Consideration",
      "Pending Review",
      "Rejected",
    ],
    data: [32, 42, 18, 28],
    colors: ["#10b981", "#0ea5e9", "#f59e0b", "#ef4444"],
  });

  const [categoryDistribution, setCategoryDistribution] = useState({
    labels: [
      "HR Processes",
      "ICT Infrastructure",
      "Work Environment",
      "Administration",
      "Employee Welfare",
    ],
    data: [38, 29, 26, 22, 19],
    colors: ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  });

  const [departmentPerformance, setDepartmentPerformance] = useState({
    labels: ["ICT", "HR", "Finance", "Operations", "Admin"],
    data: [8, 10, 6, 3, 5],
    colors: ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  });

  const [monthlyEngagement, setMonthlyEngagement] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    data: [35, 42, 38, 45, 50, 48],
  });

  // Sample data for all tabs
  const [allContributions, setAllContributions] = useState([
    {
      id: 1,
      title: "Implement Flexible Working Hours",
      category: "Work Policy",
      status: "pending_review",
      date: "2024-01-15",
      submittedBy: "anonymous_001",
      votes: 45,
      comments: 18,
      priority: "high",
      lastAction: "2 days ago",
      department: "Multiple",
      description:
        "Allow flexible start and end times for better work-life balance",
      estimatedImpact: "High",
      estimatedCost: "Low",
    },
    {
      id: 2,
      title: "Upgrade Office Wi-Fi Infrastructure",
      category: "ICT Infrastructure",
      status: "under_review",
      date: "2024-01-14",
      submittedBy: "anonymous_002",
      votes: 28,
      comments: 9,
      priority: "high",
      lastAction: "1 day ago",
      department: "ICT",
      description:
        "Replace current Wi-Fi routers with enterprise-grade equipment",
      estimatedImpact: "High",
      estimatedCost: "Medium",
    },
    {
      id: 3,
      title: "Improve Employee Onboarding Process",
      category: "HR Processes",
      status: "implemented",
      date: "2024-01-10",
      submittedBy: "anonymous_003",
      votes: 32,
      comments: 15,
      priority: "medium",
      lastAction: "1 week ago",
      department: "HR",
      description: "Create structured 30-60-90 day onboarding plan",
      estimatedImpact: "Medium",
      estimatedCost: "Low",
      implementationDate: "2024-01-08",
    },
    {
      id: 4,
      title: "Implement Paperless Office System",
      category: "Administration",
      status: "under_consideration",
      date: "2024-01-08",
      submittedBy: "anonymous_004",
      votes: 41,
      comments: 22,
      priority: "medium",
      lastAction: "3 days ago",
      department: "Admin",
      description: "Digitize all internal documentation and approvals",
      estimatedImpact: "High",
      estimatedCost: "Medium",
    },
    {
      id: 5,
      title: "Enhance Cybersecurity Training",
      category: "ICT Security",
      status: "pending_review",
      date: "2024-01-05",
      submittedBy: "anonymous_005",
      votes: 19,
      comments: 7,
      priority: "high",
      lastAction: "Just now",
      department: "ICT",
      description: "Quarterly cybersecurity awareness workshops",
      estimatedImpact: "High",
      estimatedCost: "Low",
    },
    {
      id: 6,
      title: "Improve Cafeteria Food Options",
      category: "Employee Welfare",
      status: "rejected",
      date: "2024-01-03",
      submittedBy: "anonymous_006",
      votes: 56,
      comments: 31,
      priority: "low",
      lastAction: "2 weeks ago",
      department: "HR",
      description:
        "Introduce healthier meal options and dietary accommodations",
      estimatedImpact: "Medium",
      estimatedCost: "High",
      rejectionReason: "Budget constraints for this quarter",
    },
    {
      id: 7,
      title: "Create Mentorship Program",
      category: "HR Processes",
      status: "implemented",
      date: "2023-12-20",
      submittedBy: "anonymous_007",
      votes: 38,
      comments: 24,
      priority: "medium",
      lastAction: "1 month ago",
      department: "HR",
      description: "Pair junior staff with senior mentors",
      estimatedImpact: "High",
      estimatedCost: "Low",
      implementationDate: "2024-01-02",
    },
    {
      id: 8,
      title: "Upgrade Meeting Room Equipment",
      category: "Facilities",
      status: "under_consideration",
      date: "2023-12-15",
      submittedBy: "anonymous_008",
      votes: 22,
      comments: 11,
      priority: "medium",
      lastAction: "3 weeks ago",
      department: "Operations",
      description: "Install new projectors and video conferencing systems",
      estimatedImpact: "Medium",
      estimatedCost: "Medium",
    },
  ]);

  const [topContributors, setTopContributors] = useState([
    {
      id: "anonymous_001",
      contributions: 14,
      implemented: 3,
      active: true,
      lastContribution: "2024-01-15",
      avgRating: 4.5,
    },
    {
      id: "anonymous_002",
      contributions: 12,
      implemented: 2,
      active: true,
      lastContribution: "2024-01-14",
      avgRating: 4.2,
    },
    {
      id: "anonymous_003",
      contributions: 9,
      implemented: 1,
      active: true,
      lastContribution: "2024-01-10",
      avgRating: 4.8,
    },
    {
      id: "anonymous_004",
      contributions: 8,
      implemented: 0,
      active: false,
      lastContribution: "2023-12-20",
      avgRating: 3.9,
    },
    {
      id: "anonymous_005",
      contributions: 7,
      implemented: 2,
      active: true,
      lastContribution: "2024-01-05",
      avgRating: 4.1,
    },
    {
      id: "anonymous_006",
      contributions: 6,
      implemented: 1,
      active: true,
      lastContribution: "2024-01-03",
      avgRating: 4.3,
    },
    {
      id: "anonymous_007",
      contributions: 5,
      implemented: 2,
      active: true,
      lastContribution: "2023-12-28",
      avgRating: 4.6,
    },
  ]);

  const [departmentStats, setDepartmentStats] = useState([
    {
      name: "ICT Department",
      contributions: 42,
      implemented: 8,
      pending: 12,
      engagement: "65%",
      avgRating: 4.3,
    },
    {
      name: "HR Department",
      contributions: 38,
      implemented: 10,
      pending: 8,
      engagement: "72%",
      avgRating: 4.5,
    },
    {
      name: "Finance",
      contributions: 24,
      implemented: 6,
      pending: 4,
      engagement: "58%",
      avgRating: 4.1,
    },
    {
      name: "Operations",
      contributions: 22,
      implemented: 3,
      pending: 7,
      engagement: "61%",
      avgRating: 4.0,
    },
    {
      name: "Administration",
      contributions: 19,
      implemented: 5,
      pending: 2,
      engagement: "54%",
      avgRating: 4.2,
    },
    {
      name: "Marketing",
      contributions: 15,
      implemented: 3,
      pending: 5,
      engagement: "48%",
      avgRating: 3.9,
    },
    {
      name: "Sales",
      contributions: 12,
      implemented: 2,
      pending: 3,
      engagement: "52%",
      avgRating: 4.0,
    },
  ]);

  const [moderationQueue, setModerationQueue] = useState([
    {
      id: 1,
      title: "Implement 4-Day Work Week",
      category: "Work Policy",
      date: "2024-01-16",
      submittedBy: "anonymous_009",
      priority: "high",
      urgency: "New",
      flags: ["High Impact", "Policy Change"],
      reviewTime: "48h",
    },
    {
      id: 5,
      title: "Enhance Cybersecurity Training",
      category: "ICT Security",
      date: "2024-01-05",
      submittedBy: "anonymous_005",
      priority: "high",
      urgency: "Overdue",
      flags: ["Security Related", "High Votes"],
      reviewTime: "120h",
    },
    {
      id: 9,
      title: "Introduce Remote Work Stipend",
      category: "Employee Benefits",
      date: "2024-01-18",
      submittedBy: "anonymous_010",
      priority: "medium",
      urgency: "New",
      flags: ["Budget Impact"],
      reviewTime: "24h",
    },
    {
      id: 10,
      title: "Update Performance Review System",
      category: "HR Processes",
      date: "2024-01-17",
      submittedBy: "anonymous_011",
      priority: "medium",
      urgency: "Normal",
      flags: ["Process Improvement"],
      reviewTime: "72h",
    },
  ]);

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

  const handleExportData = () => {
    const reportData = {
      dateGenerated: new Date().toISOString(),
      timeRange,
      customDateRange,
      statistics: dashboardStats,
      contributions: allContributions,
      topContributors,
      departmentStats,
      charts: {
        contributionTrend,
        statusDistribution,
        categoryDistribution,
      },
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `maoni-report-${formatDate(
      new Date().toISOString(),
      "YYYY-MM-DD"
    )}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("Report exported successfully!");
  };

  const handleGenerateReport = (type = "detailed") => {
    const reportTypes = {
      detailed: {
        title: "Detailed Analytics Report",
        sections: [
          "Executive Summary",
          "Contribution Trends",
          "Category Analysis",
          "Department Performance",
          "Top Contributors",
          "Recommendations",
        ],
      },
      executive: {
        title: "Executive Summary Report",
        sections: [
          "Key Metrics",
          "Success Stories",
          "Areas for Improvement",
          "Strategic Recommendations",
        ],
      },
      operational: {
        title: "Operational Report",
        sections: [
          "Moderation Queue",
          "Response Times",
          "Implementation Status",
          "Action Items",
        ],
      },
    };

    const report = reportTypes[type] || reportTypes.detailed;

    alert(
      `Generating ${report.title}...\n\nSections:\n${report.sections.join(
        "\n"
      )}\n\nThe report has been queued for generation and will be available for download shortly.`
    );
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
        handleGenerateReport("detailed");
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

    if (name === "end") {
      // Simulate data refresh based on date range
      setTimeRange("custom");
      alert(`Loading data for ${customDateRange.start} to ${value}`);
    }
  };

  return (
    <div className="container-fluid py-4">
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
                  : "Custom"}
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
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
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
                  {moderationQueue.length}
                </span>
              </button>
            </li>
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
                                    `/mnh-connect/admin/maoni/review/${contribution.id}`
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

                    <button
                      onClick={() =>
                        navigate("/mnh-connect/admin/maoni/settings")
                      }
                      className="btn btn-secondary d-flex align-items-center justify-content-start p-3 text-start"
                    >
                      <div className="p-2 bg-secondary-subtle rounded-circle me-3">
                        <i className="bx bx-cog text-secondary"></i>
                      </div>
                      <div>
                        <div className="fw-medium">System Settings</div>
                        <small className="text-muted">
                          Configure system preferences
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
                <h5 className="mb-0">Department Implementation Rate</h5>
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
                          <th className="text-center">Implemented</th>
                          <th className="text-center">Rate</th>
                          <th className="text-center">Engagement</th>
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
                              <span className="badge bg-success">
                                {dept.implemented}
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
                            <td className="text-center">
                              <span className="badge bg-info-subtle text-info">
                                {dept.engagement}
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
                <button className="btn btn-sm btn-outline-primary">
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
                        <th className="text-center">Implemented</th>
                        <th className="text-center">Success Rate</th>
                        <th className="text-center">Avg. Rating</th>
                        <th className="text-center">Last Active</th>
                        <th className="text-center">Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topContributors.map((contributor) => (
                        <tr key={contributor.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-2">
                                <i className="bx bx-user-circle text-primary"></i>
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
                            <span className="badge bg-info-subtle text-info">
                              {(
                                (contributor.implemented /
                                  contributor.contributions) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-warning-subtle text-warning">
                              {contributor.avgRating} ⭐
                            </span>
                          </td>
                          <td className="text-center">
                            <small>
                              {formatDate(
                                contributor.lastContribution,
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
                            <button className="btn btn-sm btn-outline-primary">
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
                  All Contributions ({allContributions.length})
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
                      placeholder="Search..."
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
                        <th>Votes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allContributions.map((contribution) => (
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
                              <i className="bx bx-upvote text-success me-1"></i>
                              <span className="me-3">{contribution.votes}</span>
                              <i className="bx bx-message text-primary me-1"></i>
                              <span>{contribution.comments}</span>
                            </div>
                          </td>
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
              <div className="card-footer bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Showing {allContributions.length} of{" "}
                    {allContributions.length} contributions
                  </small>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className="page-item disabled">
                        <button className="page-link">Previous</button>
                      </li>
                      <li className="page-item active">
                        <button className="page-link">1</button>
                      </li>
                      <li className="page-item">
                        <button className="page-link">2</button>
                      </li>
                      <li className="page-item">
                        <button className="page-link">3</button>
                      </li>
                      <li className="page-item">
                        <button className="page-link">Next</button>
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
      {activeTab === "moderation" && (
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  Moderation Queue ({moderationQueue.length} items)
                </h5>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-success">
                    <i className="bx bx-check-circle me-1"></i>
                    Approve All
                  </button>
                  <button className="btn btn-sm btn-danger">
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
                      {moderationQueue.map((item) => (
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
                              <button className="btn btn-sm btn-success">
                                <i className="bx bx-check"></i>
                              </button>
                              <button className="btn btn-sm btn-danger">
                                <i className="bx bx-x"></i>
                              </button>
                              <button className="btn btn-sm btn-primary">
                                <i className="bx bx-show"></i>
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

          {/* Moderation Statistics */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">Moderation Stats</h5>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <div className="h1 text-primary">18</div>
                  <small className="text-muted">Pending Review</small>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small>High Priority</small>
                    <small className="fw-medium">8</small>
                  </div>
                  <div className="progress" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-danger"
                      style={{ width: "44%" }}
                    ></div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small>Medium Priority</small>
                    <small className="fw-medium">6</small>
                  </div>
                  <div className="progress" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-warning"
                      style={{ width: "33%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="d-flex justify-content-between mb-1">
                    <small>Low Priority</small>
                    <small className="fw-medium">4</small>
                  </div>
                  <div className="progress" style={{ height: "6px" }}>
                    <div
                      className="progress-bar bg-secondary"
                      style={{ width: "22%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">Recent Moderation Actions</h5>
              </div>
              <div className="card-body">
                <div className="timeline">
                  {[
                    {
                      action: "Approved",
                      title: "Implement Paperless Office",
                      by: "Admin_001",
                      time: "2 hours ago",
                    },
                    {
                      action: "Rejected",
                      title: "Extended Lunch Break",
                      by: "Admin_002",
                      time: "1 day ago",
                    },
                    {
                      action: "Approved",
                      title: "Cybersecurity Training",
                      by: "Admin_001",
                      time: "2 days ago",
                    },
                    {
                      action: "Pending",
                      title: "Flexible Work Hours",
                      by: "System",
                      time: "3 days ago",
                    },
                  ].map((item, index) => (
                    <div key={index} className="d-flex mb-3">
                      <div className="me-3">
                        <div
                          className={`rounded-circle p-2 ${
                            item.action === "Approved"
                              ? "bg-success-subtle text-success"
                              : item.action === "Rejected"
                              ? "bg-danger-subtle text-danger"
                              : "bg-warning-subtle text-warning"
                          }`}
                        >
                          <i
                            className={`bx ${
                              item.action === "Approved"
                                ? "bx-check"
                                : item.action === "Rejected"
                                ? "bx-x"
                                : "bx-time"
                            }`}
                          ></i>
                        </div>
                      </div>
                      <div>
                        <div className="fw-medium">{item.title}</div>
                        <small className="text-muted">
                          {item.action} by {item.by} • {item.time}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

                {/* Report Configuration */}
                <div className="card border-0 bg-light mt-4">
                  <div className="card-body">
                    <h6 className="mb-3">Report Configuration</h6>
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
                            defaultChecked
                          />
                          <label
                            className="form-check-label"
                            htmlFor="includeCharts"
                          >
                            Charts and Graphs
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="includeDetails"
                            defaultChecked
                          />
                          <label
                            className="form-check-label"
                            htmlFor="includeDetails"
                          >
                            Detailed Contribution List
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="includeRecommendations"
                            defaultChecked
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
                        onClick={handleExportData}
                        className="btn btn-primary px-5"
                      >
                        <i className="bx bx-download me-2"></i>
                        Generate Custom Report
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Reports */}
                <div className="mt-4">
                  <h6 className="mb-3">Recently Generated Reports</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Report Name</th>
                          <th>Type</th>
                          <th>Date Range</th>
                          <th>Generated</th>
                          <th>Size</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {
                            name: "Q4 2023 Analysis",
                            type: "Detailed",
                            range: "Oct-Dec 2023",
                            generated: "2 days ago",
                            size: "2.4 MB",
                          },
                          {
                            name: "Executive Summary Jan",
                            type: "Executive",
                            range: "Jan 2024",
                            generated: "1 week ago",
                            size: "1.1 MB",
                          },
                          {
                            name: "Operational Review",
                            type: "Operational",
                            range: "Dec 2023",
                            generated: "2 weeks ago",
                            size: "1.8 MB",
                          },
                        ].map((report, index) => (
                          <tr key={index}>
                            <td>{report.name}</td>
                            <td>
                              <span className="badge bg-light text-dark">
                                {report.type}
                              </span>
                            </td>
                            <td>
                              <small>{report.range}</small>
                            </td>
                            <td>
                              <small>{report.generated}</small>
                            </td>
                            <td>
                              <small>{report.size}</small>
                            </td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary">
                                <i className="bx bx-download"></i>
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
