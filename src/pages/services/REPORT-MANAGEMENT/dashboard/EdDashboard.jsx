import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Row, Col, Card, CardBody } from "reactstrap";
import BreadCumb from "../../../../layouts/BreadCumb";
import RmsDashboardToggle from "../../../../components/rms/RmsDashboardToggle";
import RmsStatCard from "../../../../components/rms/RmsStatCard";
import "../../../../components/spism/spismDashboard.css";
import { getDashboardStats, getFinancialYears, getReportTypes, DEADLINE_STATE_OPTIONS } from "../Queries";
import { DoughnutChart } from "../../../../components/DashboardCharts/DoughnutChart";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate, formatDateTime } from "../../../../helpers/DateFormater";

const EdDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [selectedFY, setSelectedFY] = useState("");
  const [selectedReportTypeUid, setSelectedReportTypeUid] = useState("");

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedFY, selectedReportTypeUid]);

  const resolveCurrentFinancialYear = (years = []) => {
    const today = new Date();
    return (
      years.find((fy) => {
        const start = fy?.start_date ? new Date(fy.start_date) : null;
        const end = fy?.end_date ? new Date(fy.end_date) : null;
        return start && end && today >= start && today <= end;
      }) ||
      years.find((fy) => fy.is_current) ||
      null
    );
  };

  const fetchFilterOptions = async () => {
    try {
      const [fyResponse, reportTypeResponse] = await Promise.all([
        getFinancialYears({ is_active: true }),
        getReportTypes(),
      ]);

      if (fyResponse.status === 8000) {
        const years = fyResponse.data || [];
        setFinancialYears(years);
        const currentFY = resolveCurrentFinancialYear(years);
        if (currentFY) setSelectedFY(currentFY.uid);
      }
      if (reportTypeResponse.status === 8000) {
        setReportTypes(reportTypeResponse.data || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard filters:", error);
    }
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedFY) params.financial_year_uid = selectedFY;
      if (selectedReportTypeUid) params.report_type_uid = selectedReportTypeUid;
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

  const currentFinancialYear = resolveCurrentFinancialYear(financialYears);
  const selectedFinancialYear =
    financialYears.find((fy) => String(fy.uid) === String(selectedFY)) ||
    stats?.selected_financial_year ||
    null;
  const selectedReportType =
    reportTypes.find((type) => String(type.uid) === String(selectedReportTypeUid)) ||
    null;

  const byDepartment = stats?.by_department || stats?.by_directory || [];
  const byReportType = stats?.by_report_type || [];
  const statusSummary = stats?.status_summary || {};
  const deadlineSummary = stats?.deadline_summary || {};
  const lateSubmissions = stats?.late_submissions || [];

  const analyticsPalette = [
    "#00853f",
    "#71dd37",
    "#03c3ec",
    "#ffab00",
    "#ff3e1d",
    "#8592a3",
    "#8b5cf6",
    "#0d9488",
    "#ec4899",
    "#f97316",
  ];

  const reportTypePieData = byReportType.slice(0, 8).map((item, index) => ({
    label: item.report_type__name,
    count: item.count,
    value: item.count,
    percentage: stats?.total_reports ? Math.round((item.count / stats.total_reports) * 100) : 0,
    color: analyticsPalette[index % analyticsPalette.length],
    report_type_uid: item.report_type__uid,
  }));

  const departmentPieData = byDepartment.slice(0, 8).map((item, index) => ({
    label: item.department__code || item.department__name,
    count: item.total,
    value: item.total,
    percentage: stats?.total_reports ? Math.round((item.total / stats.total_reports) * 100) : 0,
    color: analyticsPalette[index % analyticsPalette.length],
    department_uid: item.department__uid,
  }));

  const sortedDepartmentPerformance = [...byDepartment]
    .map((item) => {
      const total = Number(item.total || 0);
      const submitted = Number(item.submitted || 0);
      const submittedThisMonth = Number(item.submitted_this_month || 0);
      return {
        ...item,
        submission_rate: total > 0 ? Math.round((submitted / total) * 100) : 0,
        submitted_this_month: submittedThisMonth,
      };
    })
    .sort((a, b) => {
      if (b.submitted_this_month !== a.submitted_this_month) {
        return b.submitted_this_month - a.submitted_this_month;
      }
      if (b.submission_rate !== a.submission_rate) {
        return b.submission_rate - a.submission_rate;
      }
      return (b.submitted || 0) - (a.submitted || 0);
    });
  const bestPerformingDepartment = sortedDepartmentPerformance[0] || null;
  const hasMultipleDepartments = sortedDepartmentPerformance.length > 1;
  const lowestPerformingDepartment = hasMultipleDepartments
    ? sortedDepartmentPerformance[sortedDepartmentPerformance.length - 1]
    : null;
  const currentMonthLabel = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const performanceReasonText =
    sortedDepartmentPerformance.length === 0
      ? "No department data is available for the selected filter."
      : sortedDepartmentPerformance.length === 1
        ? "Only one department is available in the current filtered view, so the same department appears as the top result and there is no separate lowest performer."
        : "Departments are ranked by reports submitted this month, then by overall financial-year completion rate.";

  const navigateToReports = (filters = {}) => {
    const params = new URLSearchParams();
    if (selectedFY) params.set("financial_year_uid", selectedFY);
    if (selectedReportTypeUid) params.set("report_type_uid", selectedReportTypeUid);
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    });
    const query = params.toString();
    navigate(`/report-management/reports${query ? `?${query}` : ""}`);
  };

  const exportDepartmentStatistics = () => {
    setExporting(true);
    try {
    const rows = sortedDepartmentPerformance.map((item, index) => ({
      rank: index + 1,
      department_code: item.department__code || "",
      department_name: item.department__name || "",
      submitted_this_month: item.submitted_this_month || 0,
      fy_submitted: item.submitted || 0,
      fy_total: item.total || 0,
      fy_completion_rate: `${item.submission_rate || 0}%`,
      financial_year: selectedFinancialYear?.name || "All Financial Years",
      report_type: selectedReportType?.name || "All Report Types",
      month: currentMonthLabel,
    }));

    if (rows.length === 0) {
      showToast("No department statistics available to export", "info");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeFy = (selectedFinancialYear?.name || "all-financial-years").replace(/\s+/g, "-").toLowerCase();
    const safeType = (selectedReportType?.name || "all-report-types").replace(/\s+/g, "-").toLowerCase();
    link.href = url;
    link.setAttribute("download", `department-submission-ranking-${safeFy}-${safeType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const totalReports = stats?.total_reports || 0;
  const submittedCount = statusSummary?.submitted || 0;
  const submissionRate =
    totalReports > 0 ? Math.round((submittedCount / totalReports) * 100) : 0;
  const overdueCount = stats?.overdue_count || deadlineSummary?.overdue || 0;
  const pendingWorkload =
    (statusSummary?.pending || 0) + (statusSummary?.in_progress || 0);

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
    const label = DEADLINE_STATE_OPTIONS.find((o) => o.value === state)?.label || state;

    return (
      <div
        className={`p-3 rounded-3 text-center cursor-pointer hover-lift`}
        style={{
          background: `var(--bs-${config.color}-bg-subtle)`,
          border: `1px solid var(--bs-${config.color})`,
          transition: "transform 0.2s ease",
        }}
        onClick={onClick}
      >
        <i className={`bx ${config.icon} fs-1 text-${config.color} mb-2`}></i>
        <h4 className={`mb-1 text-${config.color} fw-bold`}>{count}</h4>
        <small className="text-muted fw-medium">{label}</small>
      </div>
    );
  };

  return (
    <div className="w-100">
      <BreadCumb pageList={["Report Management System (RMS)", "ED Dashboard"]}>
        <RmsDashboardToggle />
      </BreadCumb>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body spism-dashboard-welcome">
          <div className="spism-dashboard-header">
            <div className="spism-dashboard-header__title">
              <h5 className="mb-1 fw-semibold">
                <i className="bx bx-pie-chart-alt me-2 text-primary" aria-hidden="true" />
                Institutional Analytics Dashboard
              </h5>
              <p className="mb-0 text-muted small">
                Welcome, {user?.first_name || "User"}! Review institutional performance, compare
                departments, and track report submissions for{" "}
                {selectedFinancialYear?.name || "the selected financial year"}.
              </p>
            </div>
            <div className="spism-dashboard-header__actions">
              <div className="spism-dashboard-toolbar__controls">
                <label
                  htmlFor="rms-ed-financial-year"
                  className="form-label mb-0 small text-muted text-uppercase"
                >
                  Financial Year
                </label>
                <select
                  id="rms-ed-financial-year"
                  className="form-select form-select-sm"
                  style={{ minWidth: "160px", maxWidth: "200px" }}
                  value={selectedFY}
                  onChange={(e) => setSelectedFY(e.target.value)}
                >
                  <option value="">All Financial Years</option>
                  {financialYears.map((fy) => (
                    <option key={fy.uid} value={fy.uid}>
                      {fy.name}{" "}
                      {currentFinancialYear && fy.uid === currentFinancialYear.uid
                        ? "(Current)"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="spism-dashboard-toolbar__controls">
                <label
                  htmlFor="rms-ed-report-type"
                  className="form-label mb-0 small text-muted text-uppercase"
                >
                  Report Type
                </label>
                <select
                  id="rms-ed-report-type"
                  className="form-select form-select-sm"
                  style={{ minWidth: "160px", maxWidth: "200px" }}
                  value={selectedReportTypeUid}
                  onChange={(e) => setSelectedReportTypeUid(e.target.value)}
                >
                  <option value="">All Report Types</option>
                  {reportTypes.map((type) => (
                    <option key={type.uid} value={type.uid}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-success btn-sm spism-dashboard-toolbar__export"
                onClick={exportDepartmentStatistics}
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
                    Export Department Statistics
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="spism-stat-grid mb-4">
        <RmsStatCard
          label="Total reports"
          value={loading ? "—" : totalReports}
          sub="Across all departments"
          icon="bx bx-file-blank"
          tone="spism-stat-card--purple"
          onClick={() => navigateToReports()}
        />
        <RmsStatCard
          label="Submitted"
          value={loading ? "—" : submittedCount}
          sub={`${submissionRate}% of all reports`}
          icon="bx bx-check-circle"
          tone="spism-stat-card--green"
          onClick={() => navigateToReports({ status: "submitted" })}
        />
        <RmsStatCard
          label="Pending / In progress"
          value={loading ? "—" : pendingWorkload}
          sub="Active institutional workload"
          icon="bx bx-time-five"
          tone="spism-stat-card--orange"
          onClick={() => navigateToReports({ status: "pending" })}
        />
        <RmsStatCard
          label="Overdue"
          value={loading ? "—" : overdueCount}
          sub="Immediate attention required"
          icon="bx bx-error-circle"
          tone="spism-stat-card--red"
          onClick={() => navigateToReports({ deadline_state: "overdue" })}
        />
        <RmsStatCard
          label="Late submissions"
          value={loading ? "—" : stats?.late_submissions_count || 0}
          sub="Submitted after deadline"
          icon="bx bx-alarm-exclamation"
          tone="spism-stat-card--teal"
          onClick={() => navigateToReports({ status: "submitted" })}
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
                <div className="fw-semibold">View Reports</div>
                <div className="small text-muted">Full institutional register</div>
              </div>
            </div>
          </button>
        </div>
        <div className="col-md-4">
          <button
            type="button"
            className="card spism-quick-link h-100 text-decoration-none text-body w-100 border-0 text-start"
            onClick={() => navigateToReports({ status: "submitted" })}
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
            onClick={() => {
              fetchFilterOptions();
              fetchDashboardStats();
            }}
          >
            <div className="card-body d-flex align-items-center gap-3">
              <span className="avatar bg-label-info rounded">
                <i className="bx bx-refresh fs-4" />
              </span>
              <div>
                <div className="fw-semibold">Refresh Analytics</div>
                <div className="small text-muted">Reload charts and rankings</div>
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
          <p className="text-muted small mt-2 mb-0">Loading institutional analytics…</p>
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
              <small className="text-muted">
                Track institutional report deadlines and take action
              </small>
            </div>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigateToReports()}
            >
              View All Reports
            </button>
          </div>

          <Row className="g-3">
            {["on_track", "due_soon", "due_today", "overdue", "completed"].map((state) => (
              <Col key={state} xs={6} md>
                <DeadlineStateCard
                  state={state}
                  count={deadlineSummary?.[state] || 0}
                  onClick={() => navigateToReports({ deadline_state: state })}
                />
              </Col>
            ))}
          </Row>
        </CardBody>
      </Card>

      <Card className="border-0 shadow-sm mb-4">
        <CardBody>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h5 className="mb-1">
                <i className="bx bx-alarm-exclamation me-2 text-danger"></i>
                Late Submitted Reports
              </h5>
              <small className="text-muted">
                Reports that were submitted after the deadline, with the submitted date and overdue days.
              </small>
            </div>
            <div className="text-end">
              <div className="fw-bold text-danger fs-4">{stats?.late_submissions_count || 0}</div>
              <small className="text-muted">Late submissions</small>
            </div>
          </div>

          {lateSubmissions.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {lateSubmissions.slice(0, 5).map((report) => (
                <div
                  key={report.uid}
                  className="p-3 border rounded-3 hover-bg-light cursor-pointer"
                  onClick={() => navigate(`/report-management/reports/${report.uid}`)}
                >
                  <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                    <div>
                      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                        <span className="badge bg-label-primary">{report.reference_number}</span>
                        <span className="badge bg-danger">
                          {report.days_overdue_on_submission || 0} day(s) overdue
                        </span>
                      </div>
                      <h6 className="mb-1">{report.title}</h6>
                      <small className="text-muted">
                        {report.department_name || report.directory_name || "No department"}{" "}
                        {report.report_type_name ? `• ${report.report_type_name}` : ""}
                      </small>
                    </div>
                    <div className="text-md-end">
                      <div className="small text-muted">
                        Deadline: <span className="fw-medium text-dark">{formatDate(report.deadline_date)}</span>
                      </div>
                      <div className="small text-muted">
                        Submitted:{" "}
                        <span className="fw-medium text-dark">
                          {report.submission_date ? formatDateTime(report.submission_date) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => navigateToReports({ status: "submitted" })}
                >
                  <i className="bx bx-link-external me-1"></i>
                  Open Submitted Reports
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="avatar avatar-lg mx-auto mb-3">
                <span className="avatar-initial rounded bg-label-success">
                  <i className="bx bx-check-shield fs-2 text-success"></i>
                </span>
              </div>
              <h6 className="mb-1">No late submissions in this view</h6>
              <small className="text-muted">
                All submitted reports in the current filter were submitted on or before the deadline.
              </small>
            </div>
          )}
        </CardBody>
      </Card>

      <Row className="g-4 mt-4">
        <Col lg={4} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <div className="mb-3">
                <h5 className="mb-1">
                  <i className="bx bx-category-alt me-2 text-primary" />
                  Analysis by Report Type
                </h5>
                <small className="text-muted d-block">Clickable analysis by report type</small>
              </div>
              <DoughnutChart
                data={reportTypePieData}
                centerLabel="Types"
                onItemClick={(item) => item?.report_type_uid && navigateToReports({ report_type_uid: item.report_type_uid })}
                compact
              />
            </CardBody>
          </Card>
        </Col>

        <Col lg={4} md={6}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <div className="mb-3">
                <h5 className="mb-1">
                  <i className="bx bx-buildings me-2 text-info" />
                  Distribution by Department
                </h5>
                <small className="text-muted d-block">See which departments carry the most reporting load</small>
              </div>
              <DoughnutChart
                data={departmentPieData}
                centerLabel="Departments"
                onItemClick={(item) => item?.department_uid && navigateToReports({ department_uid: item.department_uid })}
                compact
              />
            </CardBody>
          </Card>
        </Col>

        <Col lg={4} md={12}>
          <Card className="border-0 shadow-sm h-100">
            <CardBody>
              <div className="mb-3">
                <h5 className="mb-1">
                  <i className="bx bx-trophy me-2 text-success" />
                  Monthly Submission Leaders
                </h5>
                <small className="text-muted d-block">
                  Department ranking for {currentMonthLabel} in {selectedFinancialYear?.name || "the selected year"}
                </small>
              </div>

              <div className="d-flex flex-column gap-3">
                <div className="p-3 rounded-3 border bg-label-success">
                  <small className="text-muted d-block mb-1">Best performer</small>
                  <div className="fw-bold text-dark">
                    {bestPerformingDepartment?.department__code || bestPerformingDepartment?.department__name || "N/A"}
                  </div>
                  <small className="text-muted">
                    {bestPerformingDepartment
                      ? `${bestPerformingDepartment.submitted_this_month} submitted this month • ${bestPerformingDepartment.submission_rate}% FY completion`
                      : "No department data available"}
                  </small>
                </div>

                {hasMultipleDepartments ? (
                  <div className="p-3 rounded-3 border bg-label-danger">
                    <small className="text-muted d-block mb-1">Lowest performer</small>
                    <div className="fw-bold text-dark">
                      {lowestPerformingDepartment?.department__code || lowestPerformingDepartment?.department__name || "N/A"}
                    </div>
                    <small className="text-muted">
                      {lowestPerformingDepartment
                        ? `${lowestPerformingDepartment.submitted_this_month} submitted this month • ${lowestPerformingDepartment.submission_rate}% FY completion`
                        : "No department data available"}
                    </small>
                  </div>
                ) : (
                  <div className="p-3 rounded-3 border bg-label-secondary">
                    <small className="text-muted d-block mb-1">Ranking note</small>
                    <div className="fw-bold text-dark">Single department in current scope</div>
                    <small className="text-muted">{performanceReasonText}</small>
                  </div>
                )}

                <div className="p-3 rounded-3 border bg-light">
                  <small className="text-muted d-block mb-1">Why this can happen</small>
                  <small className="text-muted">{performanceReasonText}</small>
                </div>

                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigateToReports({ status: "submitted" })}
                >
                  <i className="bx bx-link-external me-1"></i>
                  Open Submitted Reports
                </button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
        </>
      )}

      {/* Shared dashboard hover styles like main RMS dashboard */}
      <style>{`
        .cursor-pointer { cursor: pointer; }
        .hover-shadow:hover { box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important; }
        .hover-lift:hover { transform: translateY(-2px); }
        .hover-bg-light:hover { background-color: rgba(0, 0, 0, 0.02); }
      `}</style>
    </div>
  );
};

export default EdDashboard;

