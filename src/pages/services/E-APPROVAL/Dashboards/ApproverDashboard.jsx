import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "animate.css";
import { useNavigate } from "react-router-dom";
import { ApprovalRequestsContext } from "../../../../utils/context";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import dashboardService from "../../ICT-ASSETS/dashboard/DashboardQueries";

export const DashboardPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch dashboard analytics
  const dashboardAnalitics = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getApprovalDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      Swal.fire({
        icon: "error",
        title: "Dashboard Error",
        text: "Failed to load dashboard data.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    dashboardAnalitics();
  }, []);

  const {
    summary = {},
    status_stats = {},
    type_distribution = [],
    pending_approvals = [],
    recent_activities = [],
  } = dashboardData || {};

  // Quick stats calculations
  const totalRequests = summary.total_requests || 0;
  const approvalRate = summary.total_approved
    ? ((summary.total_approved / totalRequests) * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Welcome Section */}
      <div className="row">
        <div className="col-lg-8 mb-4 order-0">
          <div className="card">
            <div className="d-flex align-items-end row">
              <div className="col-sm-7">
                <div className="card-body">
                  <h5 className="card-title text-primary">
                    Welcome, {user?.first_name} {user?.last_name}!
                  </h5>
                  <p className="mb-4">
                    Please note that every action you perform in{" "}
                    <span className="fw-medium">E-APPROVAL</span> is crucial to
                    the success of the organization.
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      onClick={() => navigate("/requests")}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="bx bx-list-check me-1"></i>
                      My Pending Approvals
                    </button>
                    <button
                      onClick={() => navigate("/new-request")}
                      className="btn btn-sm btn-primary"
                    >
                      <i className="bx bx-plus me-1"></i>
                      New Request
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={dashboardAnalitics}
                    >
                      <i className="bx bx-refresh me-1"></i>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-sm-5 text-center text-sm-left">
                <div className="card-body pb-0 px-0 px-md-4">
                  <img
                    src="/assets/img/illustrations/man-with-laptop-light.png"
                    height="140"
                    alt="E-Approval Dashboard"
                    data-app-dark-img="illustrations/man-with-laptop-dark.png"
                    data-app-light-img="illustrations/man-with-laptop-light.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="col-lg-4 col-md-4 order-1">
          <div className="row">
            {/* My Requests */}
            <div className="col-lg-6 col-md-12 col-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="card-title d-flex align-items-start justify-content-between">
                    <div className="avatar flex-shrink-0">
                      <div className="bg-primary rounded p-2">
                        <i className="bx bx-file text-white"></i>
                      </div>
                    </div>
                    <div className="dropdown">
                      <button
                        className="btn p-0"
                        type="button"
                        data-bs-toggle="dropdown"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div className="dropdown-menu dropdown-menu-end">
                        <a className="dropdown-item" href="#my-requests">
                          View More
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className="fw-medium d-block mb-1">My Requests</span>
                  <h3 className="card-title mb-2">
                    {summary.my_requests || 0}
                  </h3>
                  <small className="text-success fw-medium">
                    <i className="bx bx-trending-up me-1"></i>
                    {summary.my_requests_pending
                      ? `${summary.my_requests_pending} pending`
                      : "All processed"}
                  </small>
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="col-lg-6 col-md-12 col-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="card-title d-flex align-items-start justify-content-between">
                    <div className="avatar flex-shrink-0">
                      <div className="bg-warning rounded p-2">
                        <i className="bx bx-time-five text-white"></i>
                      </div>
                    </div>
                    <div className="dropdown">
                      <button
                        className="btn p-0"
                        type="button"
                        data-bs-toggle="dropdown"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div className="dropdown-menu dropdown-menu-end">
                        <a className="dropdown-item" href="#pending-approvals">
                          View More
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className="fw-medium d-block mb-1">
                    Pending My Approval
                  </span>
                  <h3 className="card-title text-warning mb-2">
                    {summary.pending_my_approval || 0}
                  </h3>
                  <small className="text-warning fw-medium">
                    <i className="bx bx-alarm me-1"></i>
                    Needs attention
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Detailed Metrics */}
      <div className="row">
        {/* Total Requests */}
        <div className="col-sm-6 col-lg-3 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0">
                  <div className="bg-info rounded p-2">
                    <i className="bx bx-stats text-white"></i>
                  </div>
                </div>
                <div className="ms-3">
                  <span className="fw-medium d-block mb-1">Total Requests</span>
                  <h3 className="card-title mb-0">{totalRequests}</h3>
                  <small className="text-success">
                    <i className="bx bx-trending-up me-1"></i>
                    {approvalRate}% approval rate
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="col-sm-6 col-lg-3 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0">
                  <div className="bg-success rounded p-2">
                    <i className="bx bx-check-circle text-white"></i>
                  </div>
                </div>
                <div className="ms-3">
                  <span className="fw-medium d-block mb-1">Approved</span>
                  <h3 className="card-title mb-0">
                    {summary.total_approved || 0}
                  </h3>
                  <small className="text-muted">Successfully processed</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="col-sm-6 col-lg-3 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0">
                  <div className="bg-danger rounded p-2">
                    <i className="bx bx-x-circle text-white"></i>
                  </div>
                </div>
                <div className="ms-3">
                  <span className="fw-medium d-block mb-1">Rejected</span>
                  <h3 className="card-title text-danger mb-0">
                    {summary.total_rejected || 0}
                  </h3>
                  <small className="text-danger">Requires review</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="col-sm-6 col-lg-3 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="text-center mb-3">
                <span className="fw-medium d-block mb-2">
                  Completion Status
                </span>
              </div>
              <div className="row g-2 text-center">
                <div className="col-6">
                  <div className="border rounded p-2">
                    <small className="fw-medium d-block mb-1">Completed</small>
                    <h6 className="text-success mb-0">
                      {summary.total_completed || 0}
                    </h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-2">
                    <small className="fw-medium d-block mb-1">
                      In Progress
                    </small>
                    <h6 className="text-primary mb-0">
                      {summary.total_in_progress || 0}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Third Row - Charts & Pending Actions */}
      <div className="row">
        {/* Status Distribution */}
        <div className="col-lg-4 col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">Request Status</h5>
              <span className="badge bg-primary">{totalRequests}</span>
            </div>
            <div className="card-body">
              {status_stats && Object.keys(status_stats).length > 0 ? (
                <div className="status-distribution">
                  {Object.entries(status_stats).map(([status, count]) => (
                    <div
                      key={status}
                      className="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded"
                    >
                      <span className="fw-medium text-capitalize">
                        {status.toLowerCase()}
                      </span>
                      <div className="text-end">
                        <span
                          className={`badge ${
                            status === "APPROVED"
                              ? "bg-success"
                              : status === "PENDING"
                              ? "bg-warning"
                              : status === "REJECTED"
                              ? "bg-danger"
                              : status === "NEW"
                              ? "bg-primary"
                              : "bg-info"
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bx bx-pie-chart-alt text-muted display-4"></i>
                  <p className="text-muted mt-2">No status data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Request Types Overview */}
        <div className="col-lg-4 col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Request Types</h5>
            </div>
            <div className="card-body">
              {type_distribution.length > 0 ? (
                type_distribution.map((type, index) => (
                  <div
                    key={index}
                    className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded"
                  >
                    <span className="fw-medium text-capitalize">
                      <i
                        className={`bx ${
                          type.type === "JEEVA"
                            ? "bx-cog"
                            : type.type === "EDMS"
                            ? "bx-file"
                            : type.type === "INTERNET"
                            ? "bx-wifi"
                            : type.type === "EMAIL"
                            ? "bx-envelope"
                            : "bx-desktop"
                        } me-2`}
                      ></i>
                      {type.type.replaceAll("_", " ")}
                    </span>
                    <div className="text-end">
                      <span className="badge bg-primary">{type.count}</span>
                      <br />
                      <small className="text-muted">
                        {totalRequests
                          ? Math.round((type.count / totalRequests) * 100)
                          : 0}
                        %
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <i className="bx bx-category text-muted display-4"></i>
                  <p className="text-muted mt-2">No type data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Pending Approvals */}
        <div className="col-lg-4 col-md-12 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-primary btn-sm text-start"
                  onClick={() => navigate("/new-request")}
                >
                  <i className="bx bx-plus me-2"></i>
                  New Access Request
                </button>
                <button
                  className="btn btn-outline-info btn-sm text-start"
                  onClick={() => navigate("/requests?filter=MY_REQUEST")}
                >
                  <i className="bx bx-list-ul me-2"></i>
                  View My Requests
                </button>
                <button
                  className="btn btn-outline-warning btn-sm text-start"
                  onClick={() => navigate("/requests?filter=PENDING")}
                >
                  <i className="bx bx-time-five me-2"></i>
                  Pending Approvals
                </button>
                <button
                  className="btn btn-outline-success btn-sm text-start"
                  onClick={() => navigate("/reports")}
                >
                  <i className="bx bx-chart me-2"></i>
                  Generate Reports
                </button>
              </div>

              {/* Pending Approvals Count */}
              {pending_approvals.length > 0 && (
                <div className="mt-3 p-3 bg-warning bg-opacity-10 rounded">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-medium">Urgent Approvals</span>
                    <span className="badge bg-warning">
                      {pending_approvals.length}
                    </span>
                  </div>
                  <small className="text-muted">
                    {pending_approvals.length} requests awaiting your action
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Requests Table */}
      <div className="row">
        <div className="col-12">
          <ApprovalRequestsContext.Provider
            value={{
              selectedObj,
              setSelectedObj,
              tableRefresh,
              setTableRefresh,
            }}
          >
            <PaginatedTable
              fetchPath="/approval-request"
              title="Recent Approval Requests"
              columns={[
                {
                  key: "SN",
                  label: "SN",
                  style: { width: "80px" },
                  className: "text-center",
                },
                {
                  key: "created_at",
                  label: "Request Date",
                  style: { width: "150px" },
                  className: "text-right",
                  render: (row) => (
                    <span className="text-purple">
                      {formatDate(row.created_at, "DD/MM/YYYY HH:mm:ss") || "-"}
                    </span>
                  ),
                },
                {
                  key: "requester_name",
                  label: "Requested by",
                  className: "cursor-pointer text-bold",
                  width: { width: "120px" },
                },
                {
                  key: "title",
                  label: "Request Title",
                  className: "text-justify",
                  render: (row) => {
                    const text = String(row.title || "");
                    return text.length > 50 ? text.slice(0, 50) + "..." : text;
                  },
                },
                {
                  key: "type",
                  label: "Request Types",
                  className: "text-justify",
                  style: { width: "100px" },
                  render: (row) => {
                    return `${row.type}`.replaceAll("_", " ");
                  },
                },
                {
                  key: "status",
                  label: "Status",
                  style: { width: "150px" },
                  render: (row) => (
                    <span
                      className={
                        row.status === "NEW"
                          ? "badge bg-label-primary me-1"
                          : row.status === "PENDING"
                          ? "badge bg-label-warning me-1"
                          : row.status === "REJECTED" ||
                            row.status === "CANCELLED" ||
                            row.status === "EXPIRED"
                          ? "badge bg-label-danger me-1"
                          : row.status === "APPROVED"
                          ? "badge bg-label-success me-1"
                          : "badge bg-label-info me-1"
                      }
                    >
                      {row.status}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  className: "text-center",
                  style: { width: "120px" },
                  render: (row) => (
                    <button
                      type="button"
                      className="btn p-0 dropdown-toggle hide-arrow text-info"
                      onClick={() => {
                        navigate(`/mnh-connect/requests/open/${row.uid}`);
                      }}
                    >
                      <i className="bx bx-link-external"></i>&nbsp; View
                    </button>
                  ),
                },
              ]}
              isRefresh={tableRefresh}
              filterSelected={["RELATED"]}
              pageSize={10}
            />
          </ApprovalRequestsContext.Provider>
        </div>
      </div>
    </>
  );
};
