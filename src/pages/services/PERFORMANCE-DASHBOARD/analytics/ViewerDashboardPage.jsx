import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import SpismDashboardToggle from "../../../../components/spism/SpismDashboardToggle";
import "../../../../components/spism/spismDashboard.css";
import {
  getFinancialYears,
  getPerformanceAnalytics,
  getSPISMReport,
} from "../Queries";
import {
  extractFinancialYearRows,
  getDefaultFinancialYear,
  resolveFinancialYearForList,
} from "../financialYearUtils";
import {
  GaugeChart,
  ObjectivePerformanceChart,
  BarChart,
  DoughnutChart,
  QuarterlyTrendChart,
} from "../../../../components/DashboardCharts";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";

const formatFYLabel = (fy) => {
  const parts = String(fy || "").split("/");
  if (parts.length === 2 && parts[0] && parts[1]) {
    return `FY ${parts[0]}–${parts[1]}`;
  }
  return fy ? `FY ${fy}` : "FY";
};

const truncateLabel = (s, max = 40) => {
  const str = String(s ?? "");
  if (str.length <= max) return str;
  return `${str.slice(0, max)}...`;
};

const sumStatusCounts = (rows) =>
  (rows || []).reduce((sum, row) => sum + (row.count || 0), 0);

const perfBand = (value) => {
  const n = Number(value) || 0;
  if (n >= 85) return { label: "Excellent", tone: "spism-stat-card--green" };
  if (n >= 70) return { label: "On track", tone: "spism-stat-card--blue" };
  if (n >= 50) return { label: "At risk", tone: "spism-stat-card--orange" };
  return { label: "Needs attention", tone: "spism-stat-card--red" };
};

const SpismStatCard = ({ label, value, sub, icon, tone }) => (
  <div className={`spism-stat-card ${tone}`}>
    <div className="spism-stat-card__body">
      <div className="spism-stat-card__icon" aria-hidden="true">
        <i className={icon} />
      </div>
      <div className="spism-stat-card__label">{label}</div>
      <div className="spism-stat-card__value">{value}</div>
      {sub ? <div className="spism-stat-card__sub">{sub}</div> : null}
    </div>
  </div>
);

export const ViewerDashboardPage = () => {
  const [financialYear, setFinancialYear] = useState(getDefaultFinancialYear());
  const [financialYearRows, setFinancialYearRows] = useState([]);
  const [financialYearsLoading, setFinancialYearsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadYears = async () => {
      setFinancialYearsLoading(true);
      try {
        const res = await getFinancialYears();
        const sorted = extractFinancialYearRows(res);
        if (cancelled) return;
        setFinancialYearRows(sorted);
        if (sorted.length) {
          setFinancialYear((current) => resolveFinancialYearForList(sorted, current));
        }
      } catch {
        if (!cancelled) setFinancialYearRows([]);
      } finally {
        if (!cancelled) setFinancialYearsLoading(false);
      }
    };
    loadYears();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const res = await getPerformanceAnalytics(financialYear);
        const data = res?.data ?? res;
        setAnalytics(data);
      } catch {
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };
    if (financialYear) {
      loadAnalytics();
    }
  }, [financialYear]);

  const instPerf = analytics?.institutional_performance;
  const objectivePerformance = analytics?.objective_performance || [];
  const kpiTopTargets = analytics?.kpi_targets_top || [];
  const kpiBottomTargets = analytics?.kpi_targets_bottom || [];
  const statusObjectives = analytics?.status_distribution?.objectives || [];
  const statusTargets = analytics?.status_distribution?.targets || [];
  const statusActivities = analytics?.status_distribution?.activities || [];
  const quarterlyTrend = analytics?.quarterly_trend || [];

  const instPerfNumber =
    typeof instPerf === "number" ? instPerf : Number(instPerf || 0);

  const objectiveCount = objectivePerformance.length;
  const targetCount = sumStatusCounts(statusTargets);
  const activityCount = sumStatusCounts(statusActivities);
  const approvedObjectives = (statusObjectives || [])
    .filter((r) => String(r.status).toUpperCase() === "APPROVED")
    .reduce((s, r) => s + (r.count || 0), 0);
  const topKpiValue =
    kpiTopTargets.length > 0
      ? Math.max(...kpiTopTargets.map((t) => Number(t.value) || 0))
      : null;
  const weakKpiCount = analytics?.kpi_needs_attention_count ?? 0;
  const instBand = perfBand(instPerfNumber);

  const quarterlyTrendFull = useMemo(() => {
    const byQ = (quarterlyTrend || []).reduce((acc, item) => {
      const q = item.quarter ?? null;
      if (q != null) acc[q] = item;
      return acc;
    }, {});
    return [1, 2, 3, 4].map((q) => {
      const existing = byQ[q];
      const label = existing?.label || `Q${q}`;
      const value = existing?.value || 0;
      return { category: label, label, value, count: value };
    });
  }, [quarterlyTrend]);

  const objectiveListWithColors = (() => {
    const PALETTE = ["#696CFF", "#71DD37", "#FFAB00", "#03C3EC", "#FF3E1D", "#8592A3"];
    const rows = Array.isArray(objectivePerformance) ? objectivePerformance : [];
    return rows
      .map((o, idx) => ({
        fullLabel:
          o.full_label ||
          o.fullLabel ||
          o.full_title ||
          o.title ||
          o.label ||
          o.category ||
          `Objective ${idx + 1}`,
        label: truncateLabel(
          o.label ||
            o.category ||
            o.full_label ||
            o.fullLabel ||
            o.full_title ||
            o.title ||
            `Objective ${idx + 1}`,
          40
        ),
        category:
          o.category ||
          o.label ||
          truncateLabel(
            o.full_label ||
              o.fullLabel ||
              o.full_title ||
              o.title ||
              `Objective ${idx + 1}`,
            40
          ),
        value: typeof o.value === "number" ? o.value : Number(o.value || 0),
        color: PALETTE[idx % PALETTE.length],
      }))
      .sort((a, b) => (b.value || 0) - (a.value || 0));
  })();

  const handleExportInstitutionalReport = async () => {
    if (!financialYear?.trim()) {
      showToast("Select a financial year first", "warning");
      return;
    }
    setExporting(true);
    try {
      // Use objective report so we include objectives, targets and KPI scores
      const res = await getSPISMReport("objective", financialYear.trim());
      const data = res?.data?.data ?? res?.data ?? res;
      const objectives = data?.objectives || [];
      if (!Array.isArray(objectives) || objectives.length === 0) {
        showToast("No institutional performance data to export for this year", "info");
        return;
      }

      const headers = [
        "Objective",
        "Target",
        "Operational performance (TI %)",
        "KPI performance (KPI %)",
        "Target status (Reached / Not reached)",
      ];
      const rows = [];

      objectives.forEach((o) => {
        if (Array.isArray(o.targets) && o.targets.length > 0) {
          o.targets.forEach((t) => {
            const kpiScoreNumber =
              typeof t.kpi_score === "number"
                ? t.kpi_score
                : Number(t.kpi_score || 0);
            const reached =
              kpiScoreNumber >= 100 ? "Reached" : "Not reached";
            rows.push([
              o.title,
              t.title,
              t.operational_score,
              t.kpi_score,
              reached,
            ]);
          });
        } else {
          // Objective with no targets – still include its score
          rows.push([o.title, "", o.score, "", ""]);
        }
      });

      if (!rows.length) {
        showToast("Nothing to export for this year", "info");
        return;
      }

      // Add a summary row for total institutional performance at the top
      if (!Number.isNaN(instPerfNumber)) {
        rows.unshift([
          "INSTITUTIONAL PERFORMANCE (AI %)",
          "",
          instPerfNumber.toFixed(2),
          "",
          "",
        ]);
      }

      const csvLines = [
        headers.join(","),
        ...rows.map((r) =>
          r
            .map((val) => {
              const s = val == null ? "" : String(val);
              return `"${s.replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
      ];
      const blob = new Blob([csvLines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SPISM-INSTITUTIONAL-PERFORMANCE-${financialYear.replace(
        "/",
        "-"
      )}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast("Institutional performance report exported", "success");
    } catch (e) {
      showToast(
        e?.response?.data?.message ||
          "Failed to export institutional performance report",
        "danger"
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <BreadCumb pageList={["SPISM", "Viewer Dashboard"]}>
        <SpismDashboardToggle />
      </BreadCumb>

      <div className="card shadow-sm border-0 mb-4 animate__animated animate__fadeInUp animate__fast">
        <div className="card-body spism-dashboard-welcome">
          <div className="spism-dashboard-header">
            <div className="spism-dashboard-header__title">
              <h5 className="mb-1 fw-semibold">
                <i className="bx bx-show-alt me-2 text-primary" aria-hidden="true" />
                Institutional Performance Summary (Viewer)
              </h5>
              <p className="mb-0 text-muted small">
                Read-only overview of institutional performance, best and weakest KPI targets,
                and quarterly trends for {formatFYLabel(financialYear)}.
              </p>
            </div>
            <div className="spism-dashboard-header__actions">
              <div className="spism-dashboard-toolbar__controls">
                <label
                  htmlFor="spism-viewer-financial-year"
                  className="form-label mb-0 small text-muted text-uppercase"
                >
                  Financial Year
                </label>
                <select
                  id="spism-viewer-financial-year"
                  className="form-select form-select-sm"
                  style={{ minWidth: "180px", maxWidth: "240px" }}
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  disabled={financialYearsLoading}
                  aria-label="Financial year"
                  title="Choose a configured financial year"
                >
                  {financialYearRows.length === 0 ? (
                    <option value={financialYear}>
                      {financialYearsLoading ? "Loading years…" : financialYear}
                    </option>
                  ) : (
                    financialYearRows.map((y) => (
                      <option key={y.uid || y.name} value={y.name}>
                        {y.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-success btn-sm spism-dashboard-toolbar__export"
                onClick={handleExportInstitutionalReport}
                disabled={exporting || loading}
              >
                {exporting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    />
                    Exporting…
                  </>
                ) : (
                  <>
                    <i className="bx bx-download me-1" aria-hidden="true" />
                    Export SPISM Institutional Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {!analytics && !loading ? (
        <div className="alert alert-warning border-0 shadow-sm mb-4" role="status">
          <i className="bx bx-info-circle me-2" aria-hidden="true" />
          Limited data for {formatFYLabel(financialYear)}. Summary cards below will update when
          objectives, targets and KPI actuals are available.
        </div>
      ) : null}

      <div className="spism-stat-grid mb-4 animate__animated animate__fadeIn">
            <SpismStatCard
              label="Institutional AI%"
              value={analytics ? `${instPerfNumber.toFixed(1)}%` : "—"}
              sub={analytics ? instBand.label : "Awaiting data"}
              icon="bx bx-tachometer"
              tone={analytics ? instBand.tone : "spism-stat-card--blue"}
            />
            <SpismStatCard
              label="Approved objectives"
              value={analytics ? approvedObjectives || objectiveCount || "0" : "—"}
              sub={analytics ? `${objectiveCount} with performance scores` : "Objectives register"}
              icon="bx bx-target-lock"
              tone="spism-stat-card--purple"
            />
            <SpismStatCard
              label="KPI targets"
              value={analytics ? targetCount || "0" : "—"}
              sub={analytics ? `${activityCount} linked activities` : "Targets & activities"}
              icon="bx bx-bullseye"
              tone="spism-stat-card--teal"
            />
            <SpismStatCard
              label="Best KPI score"
              value={
                analytics && topKpiValue != null ? `${topKpiValue.toFixed(1)}%` : "—"
              }
              sub={analytics ? kpiTopTargets[0]?.title || "Top performer" : "Highest performer"}
              icon="bx bx-trophy"
              tone="spism-stat-card--green"
            />
            <SpismStatCard
              label="Needs attention"
              value={analytics ? weakKpiCount || "0" : "—"}
              sub="KPI targets below 70%"
              icon="bx bx-error-circle"
              tone="spism-stat-card--orange"
            />
          </div>

      <div className="row g-3 mb-4">
            <div className="col-md-4">
              <Link
                to="/performance-dashboard/reports"
                className="card spism-quick-link h-100 text-decoration-none text-body"
              >
                <div className="card-body d-flex align-items-center gap-3">
                  <span className="avatar bg-label-primary rounded">
                    <i className="bx bx-file-blank fs-4" />
                  </span>
                  <div>
                    <div className="fw-semibold">SPISM Reports</div>
                    <div className="small text-muted">Institutional & objective reports</div>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-4">
              <Link
                to="/performance-dashboard/objectives"
                className="card spism-quick-link h-100 text-decoration-none text-body"
              >
                <div className="card-body d-flex align-items-center gap-3">
                  <span className="avatar bg-label-info rounded">
                    <i className="bx bx-target-lock fs-4" />
                  </span>
                  <div>
                    <div className="fw-semibold">Objectives</div>
                    <div className="small text-muted">Browse approved objectives & scores</div>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-4">
              <div className="card spism-quick-link h-100 border-start border-4 border-warning">
                <div className="card-body">
                  <div className="fw-semibold text-warning">
                    <i className="bx bx-show-alt me-1" aria-hidden="true" />
                    Viewer access
                  </div>
                  <div className="small text-muted mb-0">
                    Read-only institutional overview. Use the toggle above to switch dashboard views
                    when you have access to more than one.
                  </div>
                </div>
              </div>
            </div>
          </div>

      {loading ? (
        <div className="text-center py-4 mb-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading charts…</span>
          </div>
          <p className="text-muted small mt-2 mb-0">Loading performance charts…</p>
        </div>
      ) : (
        <div className="card shadow-sm border-0 animate__animated animate__fadeInUp animate__fast">
          <div className="card-body">
            {analytics && instPerf != null ? (
                <div className="row mb-4">
                  <div className="col-12 col-xl-5 mb-4 mb-xl-0">
                    <div className="card h-100 shadow-sm border-0 border-start border-4 border-primary">
                      <div className="card-header pb-0 bg-transparent d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                          Institutional Performance — {formatFYLabel(financialYear)}
                        </h6>
                        <span
                          className={`badge ${
                            instBand.tone.includes("green")
                              ? "bg-label-success"
                              : instBand.tone.includes("orange")
                                ? "bg-label-warning"
                                : instBand.tone.includes("red")
                                  ? "bg-label-danger"
                                  : "bg-label-primary"
                          }`}
                        >
                          {instPerfNumber.toFixed(1)}%
                        </span>
                      </div>
                      <div className="card-body">
                        <GaugeChart value={instPerfNumber || 0} />
                        <p className="text-muted small mb-0 mt-2">
                          Overall institutional Achievement Index (AI%) from approved objectives,
                          KPI targets and their implementation results.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-xl-7">
                    <div className="row g-3 h-100">
                      <div className="col-md-4">
                        <div className="card h-100 spism-chart-card spism-chart-card--primary">
                          <div className="card-header pb-0 bg-transparent">
                            <h6 className="mb-0 small text-primary">Objectives by status</h6>
                          </div>
                          <div className="card-body">
                            <DoughnutChart data={statusObjectives} />
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card h-100 spism-chart-card spism-chart-card--info">
                          <div className="card-header pb-0 bg-transparent">
                            <h6 className="mb-0 small text-info">Targets by status</h6>
                          </div>
                          <div className="card-body">
                            <DoughnutChart data={statusTargets} />
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card h-100 spism-chart-card spism-chart-card--success">
                          <div className="card-header pb-0 bg-transparent">
                            <h6 className="mb-0 small text-success">Quarterly trend</h6>
                          </div>
                          <div className="card-body">
                            <QuarterlyTrendChart data={quarterlyTrendFull} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted small mb-4">
                  Institutional performance charts will appear once analytics data is loaded for this
                  financial year.
                </div>
              )}

              {objectiveListWithColors.length > 0 ? (
                <div className="card shadow-sm mb-4 border-start border-4 border-primary">
                  <div className="card-body">
                    <h6 className="fw-semibold text-primary mb-2">
                      Objective performance (OI%) — {formatFYLabel(financialYear)}
                    </h6>
                    <ObjectivePerformanceChart
                      data={objectiveListWithColors}
                      valueLabel="Objective performance (OI%)"
                    />
                    <p className="small text-muted mb-0 mt-2">
                      Each objective has its own color. The summary badge indicates{" "}
                      <strong>High</strong> (≥70%) or <strong>Low</strong> (&lt;70%) performance.
                    </p>
                  </div>
                </div>
              ) : null}

              {kpiTopTargets.length > 0 || kpiBottomTargets.length > 0 ? (
                <div className="row">
                  <div className="col-12 col-lg-6 mb-4">
                    <div className="card h-100 shadow-sm border-start border-4 border-success">
                      <div className="card-body">
                        <h6 className="fw-semibold text-success mb-2">
                          Highest‑performing KPI targets
                        </h6>
                        <BarChart
                          data={kpiTopTargets}
                          barColor="bg-success"
                          valueLabel="KPI performance (KPI %)"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-6 mb-4">
                    <div className="card h-100 shadow-sm border-start border-4 border-danger">
                      <div className="card-body">
                        <h6 className="fw-semibold text-danger mb-2">
                          Lowest‑performing KPI targets
                        </h6>
                        {kpiBottomTargets.length === 0 ? (
                          <p className="small text-muted mb-0">
                            No low‑performing KPI targets identified for this financial year.
                          </p>
                        ) : (
                          <BarChart
                            data={kpiBottomTargets}
                            barColor="bg-danger"
                            valueLabel="KPI performance (KPI %)"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
          </div>
        </div>
      )}
    </>
  );
};

export default ViewerDashboardPage;

