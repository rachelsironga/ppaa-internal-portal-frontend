import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Row, Col, Nav, NavItem, NavLink, Badge } from "reactstrap";
import BreadCumb from "../../../../layouts/BreadCumb";
import api from "../../../../api";
import { API_BASE_URL } from "../../../../Costants";
import { formatDateTime } from "../../../../helpers/DateFormater";
import showToast from "../../../../helpers/ToastHelper";

/** Maps ``action_key`` from API (RMS-style semantic actions, not raw HTTP). */
const PORTAL_ACTION_CONFIG = {
  created: { color: "success", icon: "bx-plus-circle", label: "Created" },
  updated: { color: "info", icon: "bx-edit", label: "Updated" },
  deleted: { color: "danger", icon: "bx-trash", label: "Deleted" },
  view: { color: "success", icon: "bx-show", label: "View" },
  login: { color: "success", icon: "bx-log-in", label: "Login" },
  logout: { color: "secondary", icon: "bx-log-out", label: "Logout" },
  download: { color: "warning", icon: "bx-download", label: "Download" },
};

const AUDIT_TAB_KEYS = ["created", "updated", "deleted", "view", "login", "download"];

const DATE_FILTERS = [
  { value: "", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
];

export const AuditLogPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    action_key: "",
    date_filter: "",
    search: "",
  });
  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("paginated", "true");
      params.append("page", String(pagination.currentPage));
      params.append("page_size", String(pagination.pageSize));
      if (filters.action_key) params.append("action_key", filters.action_key);
      if (filters.date_filter) params.append("date_filter", filters.date_filter);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(
        `${API_BASE_URL}/api/internal-portal/audit-logs?${params.toString()}`
      );

      if (response.data.status === 8000) {
        const list = Array.isArray(response.data.data) ? response.data.data : [];
        const total = response.data.pagination?.total ?? list.length;
        setRows(list);
        setPagination((prev) => ({
          ...prev,
          totalCount: total,
          totalPages: Math.max(1, Math.ceil(total / prev.pageSize)),
        }));
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      showToast("Failed to load system logs", "error");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.pageSize,
    filters.action_key,
    filters.date_filter,
    filters.search,
  ]);

  const fetchStats = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/api/internal-portal/audit-logs/stats`);
      if (response.data.status === 8000) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching audit stats:", error);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleActionFilter = (key) => {
    const k = key || "all";
    setActiveTab(k);
    handleFilterChange("action_key", k === "all" ? "" : k);
  };

  const applySearch = () => {
    handleFilterChange("search", searchInput.trim());
  };

  const renderRow = (item) => {
    const key = item.action_key || "unknown";
    const config =
      PORTAL_ACTION_CONFIG[key] || {
        color: "secondary",
        icon: "bx-info-circle",
        label: item.action_label || "Activity",
      };
    const badgeText = item.action_label || config.label;

    const deptName = item.department?.name || "";
    const areaLabel = item.resource_label || item.model_name || "—";

    return (
      <div
        key={item.uid}
        className="d-flex align-items-start p-3 border-bottom hover-bg-light"
        style={{ transition: "background-color 0.2s", cursor: "pointer" }}
        onClick={() => navigate(`/ppaa-internal-portal/audit-logs/open/${item.uid}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate(`/ppaa-internal-portal/audit-logs/open/${item.uid}`);
        }}
      >
        <div
          className={`rounded-circle bg-label-${config.color} d-flex align-items-center justify-content-center me-3 flex-shrink-0`}
          style={{ width: "45px", height: "45px" }}
        >
          <i className={`bx ${config.icon} fs-4 text-${config.color}`}></i>
        </div>

        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start mb-1">
            <div>
              <span className={`badge bg-${config.color} me-2`}>{badgeText}</span>
              <span className="badge bg-label-secondary">{areaLabel}</span>
              {item.http_status != null && Number(item.http_status) >= 400 && (
                <span className="badge bg-label-danger ms-1">{item.http_status}</span>
              )}
            </div>
            <small className="text-muted">
              <i className="bx bx-time me-1"></i>
              {formatDateTime(item.created_at)}
            </small>
          </div>

          <h6 className="mb-1 text-dark">{item.activity_title || item.object_repr || "—"}</h6>
          <p className="text-muted small mb-0">{item.activity_subtitle || "—"}</p>

          <div className="d-flex flex-wrap gap-3 small">
            <span className="text-muted">
              <i className="bx bx-user me-1"></i>
              <strong>{item.performed_by_name || "System"}</strong>
            </span>
            {deptName && (
              <span className="text-primary">
                <i className="bx bx-building me-1"></i>
                {deptName}
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
      <BreadCumb pageList={["Internal Portal", "System Logs"]} />

      {stats && (
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100 bg-label-primary">
              <CardBody className="text-center py-4">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="bx bx-calendar-event fs-1 text-primary"></i>
                </div>
                <h2 className="mb-0 text-primary">{stats.overall?.today ?? 0}</h2>
                <p className="text-muted mb-0">Today&apos;s Activities</p>
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100 bg-label-info">
              <CardBody className="text-center py-4">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="bx bx-calendar-week fs-1 text-info"></i>
                </div>
                <h2 className="mb-0 text-info">{stats.overall?.week ?? 0}</h2>
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
                <h2 className="mb-0 text-warning">{stats.overall?.month ?? 0}</h2>
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
                <h2 className="mb-0 text-success">{stats.overall?.total ?? 0}</h2>
                <p className="text-muted mb-0">Total Records</p>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <h5 className="mb-0">
                  <i className="bx bx-history me-2 text-primary"></i>
                  Activity Log
                </h5>
                <div className="d-flex gap-2 flex-wrap">
                  <div className="input-group" style={{ width: "260px", minWidth: "200px" }}>
                    <span className="input-group-text bg-light border-0">
                      <i className="bx bx-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 bg-light"
                      placeholder="Search activities..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") applySearch();
                      }}
                    />
                  </div>
                  <button type="button" className="btn btn-sm btn-primary" onClick={applySearch}>
                    Search
                  </button>
                  <select
                    className="form-select border-0 bg-light"
                    style={{ width: "160px" }}
                    value={filters.date_filter}
                    onChange={(e) => handleFilterChange("date_filter", e.target.value)}
                  >
                    {DATE_FILTERS.map((f) => (
                      <option key={f.value || "all"} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Nav className="nav-tabs card-header-tabs mt-3 flex-wrap gap-1" style={{ borderBottom: "none" }}>
                <NavItem>
                  <NavLink
                    className={`cursor-pointer ${activeTab === "all" ? "active" : ""}`}
                    onClick={() => handleActionFilter("")}
                    style={{ cursor: "pointer" }}
                  >
                    All
                  </NavLink>
                </NavItem>
                {AUDIT_TAB_KEYS.map((tabKey) => {
                  const cfg = PORTAL_ACTION_CONFIG[tabKey];
                  if (!cfg) return null;
                  return (
                    <NavItem key={tabKey}>
                      <NavLink
                        className={`cursor-pointer ${activeTab === tabKey ? "active" : ""}`}
                        onClick={() => handleActionFilter(tabKey)}
                        style={{ cursor: "pointer" }}
                      >
                        <i className={`bx ${cfg.icon} me-1`}></i>
                        {cfg.label}
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
              ) : rows.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bx bx-history fs-1 text-muted mb-3"></i>
                  <h5 className="text-muted">No activities found</h5>
                  <p className="text-muted mb-0">User actions and API activity will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="activity-feed" style={{ maxHeight: "640px", overflowY: "auto" }}>
                    {rows.map((item) => renderRow(item))}
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-3 border-top flex-wrap gap-2">
                    <small className="text-muted">
                      Showing{" "}
                      {pagination.totalCount === 0
                        ? 0
                        : (pagination.currentPage - 1) * pagination.pageSize + 1}{" "}
                      - {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of{" "}
                      {pagination.totalCount}
                    </small>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        disabled={pagination.currentPage <= 1}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))
                        }
                      >
                        <i className="bx bx-chevron-left"></i> Previous
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        disabled={pagination.currentPage >= pagination.totalPages}
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
                          }))
                        }
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

        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <CardBody>
              <h6 className="mb-3">
                <i className="bx bx-bar-chart-alt-2 me-2 text-primary"></i>
                Actions Breakdown
              </h6>
              {stats?.by_action &&
                Object.entries(stats.by_action).map(([key, data]) => {
                  const cfg = PORTAL_ACTION_CONFIG[key] || { color: "secondary", icon: "bx-info-circle" };
                  return (
                    <div
                      key={key}
                      className="d-flex align-items-center justify-content-between py-2 border-bottom"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleActionFilter(key)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleActionFilter(key);
                      }}
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className={`rounded bg-label-${cfg.color} d-flex align-items-center justify-content-center me-2`}
                          style={{ width: "30px", height: "30px" }}
                        >
                          <i className={`bx ${cfg.icon} text-${cfg.color}`}></i>
                        </div>
                        <span className="small">{data.label}</span>
                      </div>
                      <span className="badge bg-label-secondary">{data.total}</span>
                    </div>
                  );
                })}
            </CardBody>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardBody>
              <h6 className="mb-3">
                <i className="bx bx-user-circle me-2 text-primary"></i>
                Most Active Users (This Week)
              </h6>
              {stats?.most_active_users?.length > 0 ? (
                stats.most_active_users.map((u, index) => {
                  const initial = (u.first_name?.[0] || u.email?.[0] || "?").toUpperCase();
                  const displayName =
                    `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "User";
                  return (
                    <div key={`${u.email}-${index}`} className="d-flex align-items-center justify-content-between py-2 border-bottom">
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
