import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card, CardBody, Row, Col, Progress } from "reactstrap";
import BreadCumb from "../../../../layouts/BreadCumb";
import RmsDashboardToggle from "../../../../components/rms/RmsDashboardToggle";
import RmsStatCard from "../../../../components/rms/RmsStatCard";
import "../../../../components/spism/spismDashboard.css";
import { getDashboardStats, getFinancialYears, DEADLINE_STATE_OPTIONS } from "../Queries";
import { formatDate } from "../../../../helpers/DateFormater";
import showToast from "../../../../helpers/ToastHelper";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedFY, setSelectedFY] = useState("");

  useEffect(() => {
    fetchFinancialYears();
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedFY]);

  const fetchFinancialYears = async () => {
    try {
      const response = await getFinancialYears({ is_active: true });
      if (response.status === 8000) {
        setFinancialYears(response.data || []);
        const currentFY = response.data?.find(fy => fy.is_current);
        if (currentFY) setSelectedFY(currentFY.uid);
      }
    } catch (error) {
      console.error("Error fetching financial years:", error);
    }
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const params = selectedFY ? { financial_year_uid: selectedFY } : {};
      const response = await getDashboardStats(params);
      if (response.status === 8000) {
        setStats(response.data);
      } else {
        showToast("Failed to load dashboard", "error");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      showToast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportSummary = () => {
    if (!stats) {
      showToast("No dashboard data to export yet", "info");
      return;
    }
    setExporting(true);
    try {
      const fyLabel =
        financialYears.find((fy) => fy.uid === selectedFY)?.name || "All Financial Years";
      const rows = [
        ["Metric", "Count"],
        ["Pending", stats?.status_summary?.pending || 0],
        ["In Progress", stats?.status_summary?.in_progress || 0],
        ["Submitted", stats?.status_summary?.submitted || 0],
        ["Due Today", stats?.due_today_count || 0],
        ["Overdue", stats?.overdue_count || stats?.deadline_summary?.overdue || 0],
        ["On Track", stats?.deadline_summary?.on_track || 0],
        ["Due Soon", stats?.deadline_summary?.due_soon || 0],
        ["Completed", stats?.deadline_summary?.completed || 0],
      ];
      const csv = [
        `"RMS Dashboard Summary — ${fyLabel}"`,
        "",
        ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rms-dashboard-summary-${fyLabel.replace(/\s+/g, "-").toLowerCase()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Dashboard summary exported", "success");
    } finally {
      setExporting(false);
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

  const DeadlineStateCard = ({ state, count, onClick }) => {
    const config = getDeadlineStateConfig(state);
    const label = DEADLINE_STATE_OPTIONS.find(o => o.value === state)?.label || state;
    
    return (
      <div 
        className={`p-3 rounded-3 text-center cursor-pointer hover-lift`}
        style={{ 
          background: `var(--bs-${config.color}-bg-subtle)`,
          border: `1px solid var(--bs-${config.color})`,
          transition: 'transform 0.2s ease'
        }}
        onClick={onClick}
      >
        <i className={`bx ${config.icon} fs-1 text-${config.color} mb-2`}></i>
        <h4 className={`mb-1 text-${config.color} fw-bold`}>{count}</h4>
        <small className="text-muted fw-medium">{label}</small>
      </div>
    );
  };

  const selectedFyName =
    financialYears.find((fy) => fy.uid === selectedFY)?.name || "All Financial Years";
  const totalReports = stats?.total_reports || 0;
  const submittedCount = stats?.status_summary?.submitted || 0;
  const submissionRate =
    totalReports > 0 ? Math.round((submittedCount / totalReports) * 100) : 0;

  return (
    <div className="w-100">
      <BreadCumb pageList={["Report Management System (RMS)", "Dashboard"]}>
        <RmsDashboardToggle />
      </BreadCumb>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body spism-dashboard-welcome">
          <div className="spism-dashboard-header">
            <div className="spism-dashboard-header__title">
              <h5 className="mb-1 fw-semibold">
                <i className="bx bx-file-blank me-2 text-primary" aria-hidden="true" />
                PPAA Reports Dashboard
              </h5>
              <p className="mb-0 text-muted small">
                Welcome, {user?.first_name || "User"}! Track deadlines, monitor submission progress,
                and manage your reports for {selectedFyName}.
              </p>
            </div>
            <div className="spism-dashboard-header__actions">
              <div className="spism-dashboard-toolbar__controls">
                <label
                  htmlFor="rms-dept-financial-year"
                  className="form-label mb-0 small text-muted text-uppercase"
                >
                  Financial Year
                </label>
                <select
                  id="rms-dept-financial-year"
                  className="form-select form-select-sm"
                  style={{ minWidth: "180px", maxWidth: "240px" }}
                  value={selectedFY}
                  onChange={(e) => setSelectedFY(e.target.value)}
                >
                  <option value="">All Financial Years</option>
                  {financialYears.map((fy) => (
                    <option key={fy.uid} value={fy.uid}>
                      {fy.name} {fy.is_current && "(Current)"}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-success btn-sm spism-dashboard-toolbar__export"
                onClick={handleExportSummary}
                disabled={exporting || loading}
              >
                {exporting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <i className="bx bx-download me-1" aria-hidden="true" />
                    Export Summary
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="spism-stat-grid mb-4">
        <RmsStatCard
          label="Pending"
          value={loading ? "—" : stats?.status_summary?.pending || 0}
          sub="Awaiting action"
          icon="bx bx-hourglass"
          tone="spism-stat-card--orange"
          onClick={() => navigate("/report-management/reports?status=pending")}
        />
        <RmsStatCard
          label="In Progress"
          value={loading ? "—" : stats?.status_summary?.in_progress || 0}
          sub="Being prepared"
          icon="bx bx-loader-circle"
          tone="spism-stat-card--blue"
          onClick={() => navigate("/report-management/reports?status=in_progress")}
        />
        <RmsStatCard
          label="Submitted"
          value={loading ? "—" : stats?.status_summary?.submitted || 0}
          sub={`${submissionRate}% completion`}
          icon="bx bx-check-circle"
          tone="spism-stat-card--green"
          onClick={() => navigate("/report-management/reports?status=submitted")}
        />
        <RmsStatCard
          label="Due Today"
          value={loading ? "—" : stats?.due_today_count || stats?.deadline_summary?.due_today || 0}
          sub="Submit before end of day"
          icon="bx bx-calendar-event"
          tone="spism-stat-card--teal"
          onClick={() => navigate("/report-management/reports?deadline_state=due_today")}
        />
        <RmsStatCard
          label="Overdue"
          value={loading ? "—" : stats?.overdue_count || stats?.deadline_summary?.overdue || 0}
          sub="Needs immediate action"
          icon="bx bx-error-circle"
          tone="spism-stat-card--red"
          onClick={() => navigate("/report-management/reports?deadline_state=overdue")}
        />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <button
            type="button"
            className="card spism-quick-link h-100 text-decoration-none text-body w-100 border-0 text-start"
            onClick={() => navigate("/report-management/reports")}
          >
            <div className="card-body d-flex align-items-center gap-3">
              <span className="avatar bg-label-primary rounded">
                <i className="bx bx-list-ul fs-4" />
              </span>
              <div>
                <div className="fw-semibold">View All Reports</div>
                <div className="small text-muted">Open the full reports register</div>
              </div>
            </div>
          </button>
        </div>
        <div className="col-md-4">
          <button
            type="button"
            className="card spism-quick-link h-100 text-decoration-none text-body w-100 border-0 text-start"
            onClick={() => navigate("/report-management/reports?status=submitted")}
          >
            <div className="card-body d-flex align-items-center gap-3">
              <span className="avatar bg-label-success rounded">
                <i className="bx bx-check-double fs-4" />
              </span>
              <div>
                <div className="fw-semibold">Submitted Reports</div>
                <div className="small text-muted">Review completed submissions</div>
              </div>
            </div>
          </button>
        </div>
        <div className="col-md-4">
          <button
            type="button"
            className="card spism-quick-link h-100 text-decoration-none text-body w-100 border-0 text-start"
            onClick={fetchDashboardStats}
          >
            <div className="card-body d-flex align-items-center gap-3">
              <span className="avatar bg-label-info rounded">
                <i className="bx bx-refresh fs-4" />
              </span>
              <div>
                <div className="fw-semibold">Refresh Data</div>
                <div className="small text-muted">Reload dashboard statistics</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 mb-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      ) : (
        <>
      <Card className="border-0 shadow-sm mb-4">
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-1">
                <i className="bx bx-calendar-exclamation me-2 text-danger"></i>
                Deadline Monitoring
              </h5>
              <small className="text-muted">Track report deadlines and take action</small>
            </div>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigate('/report-management/reports')}
            >
              View All Reports
            </button>
          </div>
          
          <Row className="g-3">
            {["on_track", "due_soon", "due_today", "overdue", "completed"].map(state => (
              <Col key={state} xs={6} md>
                <DeadlineStateCard
                  state={state}
                  count={stats?.deadline_summary?.[state] || 0}
                  onClick={() => navigate(`/report-management/reports?deadline_state=${state}`)}
                />
              </Col>
            ))}
          </Row>
        </CardBody>
      </Card>

      {/* Alert Cards for Critical Items */}
      {stats?.due_today_count > 0 && (
        <Row className="mb-4 g-3">
          {stats?.due_today_count > 0 && (
            <Col md={6}>
              <Card className="border-warning border-2 bg-warning bg-opacity-10">
                <CardBody className="d-flex align-items-center">
                  <div className="rounded-circle bg-warning p-3 me-3">
                    <i className="bx bx-calendar-event fs-3 text-white"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="text-warning mb-1">{stats.due_today_count} Due Today</h5>
                    <small className="text-muted">Submit before end of day</small>
                  </div>
                  <button 
                    className="btn btn-warning btn-sm"
                    onClick={() => navigate('/report-management/reports?deadline_state=due_today')}
                  >
                    View Now
                  </button>
                </CardBody>
              </Card>
            </Col>
          )}
        </Row>
      )}

      <Row className="g-4">
        {/* Reports by Type */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h5 className="mb-4">
                <i className="bx bx-pie-chart-alt-2 me-2 text-primary"></i>
                Reports by Type
              </h5>
              {stats?.by_report_type?.length > 0 ? (
                <div className="space-y-3">
                  {stats.by_report_type.map((item, index) => {
                    const total = stats.total_reports || 1;
                    const percentage = Math.round((item.count / total) * 100);
                    const colors = ['primary', 'success', 'info', 'warning', 'danger'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={index} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fw-medium">{item.report_type__name}</span>
                          <span className="text-muted">{item.count} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} color={color} style={{ height: '8px' }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bx bx-folder-open fs-1 mb-2"></i>
                  <p>No report type data available</p>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        {/* Reports by Category */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <h5 className="mb-4">
                <i className="bx bx-category me-2 text-info"></i>
                Reports by Category
              </h5>
              {stats?.by_category?.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {stats.by_category.map((item, index) => (
                    <span 
                      key={index}
                      className="badge rounded-pill px-3 py-2 fs-6"
                      style={{ 
                        backgroundColor: item.category__color || '#6c757d',
                        color: '#fff'
                      }}
                    >
                      {item.category__name}: {item.count}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bx bx-category fs-1 mb-2"></i>
                  <p>No category data available</p>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        {/* Upcoming Deadlines */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">
                  <i className="bx bx-calendar me-2 text-warning"></i>
                  Upcoming Deadlines
                </h5>
                <span className="badge bg-warning">{stats?.upcoming_deadlines?.length || 0}</span>
              </div>
              <div className="list-group list-group-flush">
                {stats?.upcoming_deadlines?.length > 0 ? (
                  stats.upcoming_deadlines.slice(0, 5).map((report, index) => (
                    <div 
                      key={index}
                      className="list-group-item px-0 d-flex justify-content-between align-items-center cursor-pointer hover-bg-light"
                      onClick={() => navigate(`/report-management/reports/${report.uid}`)}
                    >
                      <div>
                        <h6 className="mb-1 text-truncate" style={{ maxWidth: '250px' }}>
                          {report.title}
                        </h6>
                        <small className="text-muted">
                          {report.report_type_name} • {report.days_until_deadline} days left
                        </small>
                      </div>
                      <span className={`badge bg-${getDeadlineStateConfig(report.deadline_state).color}`}>
                        {formatDate(report.deadline_date)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="bx bx-calendar-check fs-1 mb-2"></i>
                    <p>No upcoming deadlines</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Recent Submissions */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">
                  <i className="bx bx-check-double me-2 text-success"></i>
                  Recent Submissions
                </h5>
                <span className="badge bg-success">{stats?.submitted_this_month || 0} this month</span>
              </div>
              <div className="list-group list-group-flush">
                {stats?.recent_submissions?.length > 0 ? (
                  stats.recent_submissions.slice(0, 5).map((report, index) => (
                    <div 
                      key={index}
                      className="list-group-item px-0 d-flex justify-content-between align-items-center cursor-pointer hover-bg-light"
                      onClick={() => navigate(`/report-management/reports/${report.uid}`)}
                    >
                      <div>
                        <h6 className="mb-1 text-truncate" style={{ maxWidth: '250px' }}>
                          {report.title}
                        </h6>
                        <small className="text-muted">
                          {report.report_type_name}
                        </small>
                      </div>
                      <small className="text-muted">
                        {formatDate(report.submission_date)}
                      </small>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="bx bx-file fs-1 mb-2"></i>
                    <p>No recent submissions</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </Col>

        {/* Overdue Reports Alert */}
        {stats?.overdue_reports?.length > 0 && (
          <Col lg={12}>
            <Card className="border-danger border-0 shadow-sm">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 text-danger">
                    <i className="bx bx-error-circle me-2"></i>
                    Overdue Reports - Requires Immediate Action
                  </h5>
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => navigate('/report-management/reports?deadline_state=overdue')}
                  >
                    View All Overdue
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Report Title</th>
                        <th>Type</th>
                        <th>Deadline</th>
                        <th>Days Overdue</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.overdue_reports.slice(0, 5).map((report, index) => (
                        <tr key={index}>
                          <td>
                            <strong>{report.title}</strong>
                            <br />
                            <small className="text-muted">{report.reference_number}</small>
                          </td>
                          <td>{report.report_type_name}</td>
                          <td className="text-danger fw-medium">
                            {formatDate(report.deadline_date)}
                          </td>
                          <td>
                            <span className="badge bg-danger">
                              {Math.abs(report.days_until_deadline)} days
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-label-${report.status === 'pending' ? 'warning' : 'info'}`}>
                              {report.status_display}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => navigate(`/report-management/reports/${report.uid}`)}
                            >
                              <i className="bx bx-show me-1"></i>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </Col>
        )}
      </Row>
        </>
      )}

      <style>{`
        .cursor-pointer { cursor: pointer; }
        .hover-shadow:hover { box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important; }
        .hover-lift:hover { transform: translateY(-2px); }
        .hover-bg-light:hover { background-color: rgba(0, 0, 0, 0.02); }
      `}</style>
    </div>
  );
};

export default Dashboard;
