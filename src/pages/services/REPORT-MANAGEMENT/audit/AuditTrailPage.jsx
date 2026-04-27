import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card, CardBody, Row, Col, Nav, NavItem, NavLink, Badge } from "reactstrap";
import BreadCumb from "../../../../layouts/BreadCumb";
import api from "../../../../api";
import { API_BASE_URL } from "../../../../Costants";
import { formatDateTime, formatDate } from "../../../../helpers/DateFormater";
import showToast from "../../../../helpers/ToastHelper";

const ACTION_CONFIG = {
  created: { color: "success", icon: "bx-plus-circle", label: "Created" },
  updated: { color: "info", icon: "bx-edit", label: "Updated" },
  status_changed: { color: "warning", icon: "bx-refresh", label: "Status Changed" },
  submitted: { color: "primary", icon: "bx-check-double", label: "Submitted" },
  progress_updated: { color: "info", icon: "bx-trending-up", label: "Progress Updated" },
  comment_added: { color: "secondary", icon: "bx-message", label: "Comment Added" },
  file_downloaded: { color: "primary", icon: "bx-download", label: "File Downloaded" },
  file_previewed: { color: "info", icon: "bx-show", label: "File Previewed" },
  attachment_uploaded: { color: "dark", icon: "bx-upload", label: "Attachment Uploaded" },
  reminder_sent: { color: "warning", icon: "bx-bell", label: "Reminder Sent" },
  reassigned: { color: "info", icon: "bx-transfer", label: "Reassigned" },
  deleted: { color: "danger", icon: "bx-trash", label: "Deleted" },
};

/** Tab shortcuts for the activity log (subset of ACTION_CONFIG keys). */
const AUDIT_TAB_ACTIONS = [
  "created",
  "updated",
  "status_changed",
  "submitted",
  "progress_updated",
  "comment_added",
  "file_downloaded",
  "file_previewed",
  "attachment_uploaded",
  "deleted",
];

const DATE_FILTERS = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
];

const AuditTrailPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  
  const [loading, setLoading] = useState(true);
  const [auditTrail, setAuditTrail] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });
  
  // Filters
  const [filters, setFilters] = useState({
    action: "",
    date_filter: "",
    search: "",
  });
  const [activeTab, setActiveTab] = useState("all");

  const fetchAuditTrail = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("paginated", "true");
      params.append("page", pagination.currentPage);
      params.append("page_size", pagination.pageSize);
      
      if (filters.action) params.append("action", filters.action);
      if (filters.date_filter) params.append("date_filter", filters.date_filter);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(
        `${API_BASE_URL}/api/reports/audit-trail?${params.toString()}`
      );

      if (response.data.status === 8000) {
        // Backend returns data as array and pagination info separately
        const results = Array.isArray(response.data.data) ? response.data.data : [];
        const total = response.data.pagination?.total || results.length;
        
        setAuditTrail(results);
        setPagination(prev => ({
          ...prev,
          totalCount: total,
          totalPages: Math.ceil(total / prev.pageSize),
        }));
      }
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      showToast("Failed to load audit trail", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, filters]);

  const fetchStats = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/api/reports/audit-trail/stats`);
      if (response.data.status === 8000) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, [fetchAuditTrail]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleActionFilter = (action) => {
    setActiveTab(action || "all");
    handleFilterChange("action", action);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      handleFilterChange("search", e.target.value);
    }
  };

  const renderActivityItem = (item, index) => {
    const config = ACTION_CONFIG[item.action] || { color: "secondary", icon: "bx-info-circle", label: item.action };
    const itemTitle = item.report_title || item.entity_name || "RMS Item";
    const itemReference = item.report_reference || item.entity_type || "RMS";
    const isReportEntry = !!item.report_uid;
    
    return (
      <div 
        key={item.uid} 
        className="d-flex align-items-start p-3 border-bottom hover-bg-light"
        style={{ 
          transition: "background-color 0.2s",
          cursor: isReportEntry ? "pointer" : "default",
        }}
        onClick={() => {
          if (isReportEntry) navigate(`/report-management/reports/${item.report_uid}`);
        }}
      >
        {/* Action Icon */}
        <div 
          className={`rounded-circle bg-label-${config.color} d-flex align-items-center justify-content-center me-3 flex-shrink-0`}
          style={{ width: "45px", height: "45px" }}
        >
          <i className={`bx ${config.icon} fs-4 text-${config.color}`}></i>
        </div>

        {/* Content */}
        <div className="flex-grow-1">
          {/* Action Header */}
          <div className="d-flex justify-content-between align-items-start mb-1">
            <div>
              <span className={`badge bg-${config.color} me-2`}>
                {config.label}
              </span>
              <span className="badge bg-label-primary">
                {itemReference}
              </span>
            </div>
            <small className="text-muted">
              <i className="bx bx-time me-1"></i>
              {formatDateTime(item.created_at)}
            </small>
          </div>

          {/* Report Title */}
          <h6 className="mb-1 text-dark">
            {itemTitle}
          </h6>

          {/* Change Details */}
          {(item.old_value || item.new_value) && (
            <div className="mb-2">
              {item.old_value && (
                <span className="text-muted small">
                  <del>{item.old_value}</del>
                </span>
              )}
              {item.old_value && item.new_value && (
                <i className="bx bx-right-arrow-alt mx-2 text-muted"></i>
              )}
              {item.new_value && (
                <span className="text-success small fw-medium">
                  {item.new_value}
                </span>
              )}
            </div>
          )}

          {/* Comments */}
          {item.comments && (
            <p className="text-muted small mb-2 fst-italic">
              <i className="bx bx-message-detail me-1"></i>
              "{item.comments}"
            </p>
          )}

          {/* Footer Info */}
          <div className="d-flex flex-wrap gap-3 small">
            <span className="text-muted">
              <i className="bx bx-user me-1"></i>
              <strong>{item.performed_by_name || "System"}</strong>
            </span>
            {item.directory_code && (
              <span className="text-primary">
                <i className="bx bx-building me-1"></i>
                {item.directory_code}
              </span>
            )}
            {item.ip_address && (
              <span className="text-muted">
                <i className="bx bx-globe me-1"></i>
                {item.ip_address}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-100">
      <BreadCumb pageList={["Report Management System (RMS)", "Audit Trail"]} />

      {/* Stats Cards */}
      {stats && (
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100 bg-label-primary">
              <CardBody className="text-center py-4">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="bx bx-calendar-event fs-1 text-primary"></i>
                </div>
                <h2 className="mb-0 text-primary">{stats.overall?.today || 0}</h2>
                <p className="text-muted mb-0">Today's Activities</p>
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100 bg-label-info">
              <CardBody className="text-center py-4">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="bx bx-calendar-week fs-1 text-info"></i>
                </div>
                <h2 className="mb-0 text-info">{stats.overall?.week || 0}</h2>
                <p className="text-muted mb-0">This Week</p>
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100 bg-label-warning">
              <CardBody className="text-center py-4">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="bx bx-calendar fs-1 text-warning"></i>
                </div>
                <h2 className="mb-0 text-warning">{stats.overall?.month || 0}</h2>
                <p className="text-muted mb-0">This Month</p>
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100 bg-label-success">
              <CardBody className="text-center py-4">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="bx bx-history fs-1 text-success"></i>
                </div>
                <h2 className="mb-0 text-success">{stats.overall?.total || 0}</h2>
                <p className="text-muted mb-0">Total Records</p>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content */}
      <Row className="g-4">
        {/* Activity Feed */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 className="mb-0">
                  <i className="bx bx-history me-2 text-primary"></i>
                  Activity Log
                </h5>
                
                {/* Search */}
                <div className="d-flex gap-2">
                  <div className="input-group" style={{ width: "250px" }}>
                    <span className="input-group-text bg-light border-0">
                      <i className="bx bx-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 bg-light"
                      placeholder="Search activities..."
                      onKeyPress={handleSearch}
                    />
                  </div>
                  <select
                    className="form-select border-0 bg-light"
                    style={{ width: "150px" }}
                    value={filters.date_filter}
                    onChange={(e) => handleFilterChange("date_filter", e.target.value)}
                  >
                    {DATE_FILTERS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Type Tabs */}
              <Nav
                className="nav-tabs card-header-tabs mt-3 flex-wrap gap-1"
                style={{ borderBottom: "none" }}
              >
                <NavItem>
                  <NavLink
                    className={`cursor-pointer ${activeTab === "all" ? "active" : ""}`}
                    onClick={() => handleActionFilter("")}
                    style={{ cursor: "pointer" }}
                  >
                    All
                  </NavLink>
                </NavItem>
                {AUDIT_TAB_ACTIONS.filter((key) => ACTION_CONFIG[key]).map((key) => {
                  const config = ACTION_CONFIG[key];
                  return (
                    <NavItem key={key}>
                      <NavLink
                        className={`cursor-pointer ${activeTab === key ? "active" : ""}`}
                        onClick={() => handleActionFilter(key)}
                        style={{ cursor: "pointer" }}
                      >
                        <i className={`bx ${config.icon} me-1`}></i>
                        {config.label}
                      </NavLink>
                    </NavItem>
                  );
                })}
              </Nav>
            </div>

            <CardBody className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : auditTrail.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bx bx-history fs-1 text-muted mb-3"></i>
                  <h5 className="text-muted">No activities found</h5>
                  <p className="text-muted">System activities will appear here</p>
                </div>
              ) : (
                <>
                  <div className="activity-feed" style={{ maxHeight: "600px", overflowY: "auto" }}>
                    {auditTrail.map((item, index) => renderActivityItem(item, index))}
                  </div>
                  
                  {/* Pagination */}
                  <div className="d-flex justify-content-between align-items-center p-3 border-top">
                    <small className="text-muted">
                      Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount}
                    </small>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={pagination.currentPage === 1}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                      >
                        <i className="bx bx-chevron-left"></i> Previous
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={pagination.currentPage >= pagination.totalPages}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                      >
                        Next <i className="bx bx-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </Col>

        {/* Sidebar - Action Stats & Top Users */}
        <Col lg={4}>
          {/* Action Type Stats */}
          <Card className="border-0 shadow-sm mb-4">
            <CardBody>
              <h6 className="mb-3">
                <i className="bx bx-bar-chart-alt-2 me-2 text-primary"></i>
                Actions Breakdown
              </h6>
              {stats?.by_action && Object.entries(stats.by_action).map(([key, data]) => {
                const config = ACTION_CONFIG[key] || { color: "secondary", icon: "bx-info-circle" };
                return (
                  <div 
                    key={key} 
                    className="d-flex align-items-center justify-content-between py-2 border-bottom cursor-pointer"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleActionFilter(key)}
                  >
                    <div className="d-flex align-items-center">
                      <div 
                        className={`rounded bg-label-${config.color} d-flex align-items-center justify-content-center me-2`}
                        style={{ width: "30px", height: "30px" }}
                      >
                        <i className={`bx ${config.icon} text-${config.color}`}></i>
                      </div>
                      <span className="small">{data.label}</span>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-label-secondary">{data.total}</span>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          {/* Most Active Users */}
          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">
                <i className="bx bx-user-circle me-2 text-primary"></i>
                Most Active Users (This Week)
              </h6>
              {stats?.most_active_users?.length > 0 ? (
                stats.most_active_users.map((u, index) => {
                  const initial =
                    (u.first_name?.[0] || u.email?.[0] || "?").toUpperCase();
                  const displayName =
                    `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                    u.email ||
                    "User";
                  return (
                    <div key={index} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-2 text-white fw-bold"
                          style={{ width: "35px", height: "35px", fontSize: "0.8rem" }}
                        >
                          {initial}
                        </div>
                        <div>
                          <div className="fw-medium small">{displayName}</div>
                          <small className="text-muted">{u.email || ""}</small>
                        </div>
                      </div>
                      <Badge color="primary" pill>
                        {u.action_count}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted small mb-0">No user activity this week</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AuditTrailPage;
