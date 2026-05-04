import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { spismCan } from "../../../../utils/spismPermissions";
import {
  getFinancialYears,
  getPerformanceAnalytics,
  getSPISMReport,
} from "../Queries";
import {
  GaugeChart,
  DoughnutChart,
  BarChart,
  QuarterlyTrendChart,
  QuarterlyComparisonChart,
  ProgressChart,
  TargetPerformanceChart,
} from "../../../../components/DashboardCharts";

const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

const formatFYLabel = (fy) => {
  // Converts "2025/2026" -> "FY 2025–2026"
  const parts = String(fy || "").split("/");
  if (parts.length === 2 && parts[0] && parts[1]) {
    return `FY ${parts[0]}–${parts[1]}`;
  }
  return fy ? `FY ${fy}` : "FY";
};

export const ESDashboardPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const canViewApprovalQueue = spismCan(user, "can_view_spism_approval");
  const canApprovePlanning = spismCan(user, "can_approve_spism_planning");
  const canApproveImplementation = spismCan(
    user,
    "can_approve_spism_implementation",
    "can_approve_spism_planning"
  );
  const canViewImplementation = spismCan(user, "can_view_spism_implementation");
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [institutionalTrend, setInstitutionalTrend] = useState([]);
  const [objectiveReport, setObjectiveReport] = useState(null);
  const [objectiveReportLoading, setObjectiveReportLoading] = useState(false);

  // Load configured financial years (for selector and multi‑year analysis)
  useEffect(() => {
    const loadYears = async () => {
      try {
        setYearsLoading(true);
        const res = await getFinancialYears();
        const list = res?.data ?? res?.results ?? res ?? [];
        const fyList = Array.isArray(list) ? list : list?.data ?? [];
        // Sort by start_date descending when available, otherwise by name
        const sorted = [...fyList].sort((a, b) => {
          if (a.start_date && b.start_date) {
            return new Date(b.start_date) - new Date(a.start_date);
          }
          return String(b.name || "").localeCompare(String(a.name || ""));
        });
        setYears(sorted);
        // If current FY is not part of the list, fall back to latest configured FY
        if (!sorted.find((y) => y.name === financialYear) && sorted[0]?.name) {
          setFinancialYear(sorted[0].name);
        }
        // Build institutional performance trend for up to last 5 years
        const topYears = sorted.slice(0, 5);
        const trendPromises = topYears.map(async (y) => {
          try {
            const a = await getPerformanceAnalytics(y.name);
            const data = a?.data ?? a;
            const inst = data?.institutional_performance;
            const value =
              typeof inst === "number" ? inst : Number(inst || 0);
            return {
              label: y.name,
              category: y.name,
              value: value,
              count: value,
            };
          } catch {
            return {
              label: y.name,
              category: y.name,
              value: 0,
              count: 0,
            };
          }
        });
        const trend = await Promise.all(trendPromises);
        setInstitutionalTrend(trend);
      } finally {
        setYearsLoading(false);
      }
    };
    loadYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataRefreshKey]);

  // Load analytics for the selected financial year
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
  }, [financialYear, dataRefreshKey]);

  // Load objective report (objectives + targets + KPI%) for the selected FY
  useEffect(() => {
    const loadObjectiveReport = async () => {
      if (!financialYear) return;
      setObjectiveReportLoading(true);
      try {
        const res = await getSPISMReport("objective", financialYear);
        const data = res?.data?.data ?? res?.data ?? res;
        setObjectiveReport(data);
      } catch {
        setObjectiveReport(null);
      } finally {
        setObjectiveReportLoading(false);
      }
    };
    loadObjectiveReport();
  }, [financialYear, dataRefreshKey]);

  const statusObjectives = analytics?.status_distribution?.objectives || [];
  const statusTargets = analytics?.status_distribution?.targets || [];
  const statusActivities = analytics?.status_distribution?.activities || [];
  const quarterlyTrend = analytics?.quarterly_trend || [];
  const objectivePerformance = analytics?.objective_performance || [];
  const progressStatus = analytics?.progress_status || [];
  const instPerf = analytics?.institutional_performance;
  const kpiTopTargets = analytics?.kpi_targets_top || [];
  const kpiBottomTargets = analytics?.kpi_targets_bottom || [];
  const kpiBandDistribution = analytics?.kpi_band_distribution || [];

  const instPerfNumber =
    typeof instPerf === "number" ? instPerf : Number(instPerf || 0);

  const quarterlyAIPerQuarter = (() => {
    // quarterlyTrend items come from backend as: { quarter, label: "Q1", value: <avg_ai> }
    const byQuarter = new Map(
      (Array.isArray(quarterlyTrend) ? quarterlyTrend : [])
        .filter((q) => q && (q.quarter || q.label))
        .map((q) => [
          Number(q.quarter || String(q.label || "").replace("Q", "")),
          Number(q.value ?? q._value ?? 0),
        ])
    );
    return [1, 2, 3, 4].map((q) => ({
      quarter: q,
      label: `Q${q}`,
      value: byQuarter.has(q) ? byQuarter.get(q) : null,
    }));
  })();

  const kpiPositionText = (() => {
    if (!kpiBandDistribution?.length) {
      return "No KPI evaluation data yet. Record KPI actuals for approved targets to see KPI-based institutional insights.";
    }
    if (instPerfNumber >= 80) {
      return "KPI results place the institution in a strong performance position. Maintain focus on sustaining high-scoring KPI targets while addressing a few weaker ones.";
    }
    if (instPerfNumber >= 60) {
      return "Overall KPI performance is moderate. Some KPI targets are performing well, but several weak KPIs are pulling down the institutional score and need attention.";
    }
    return "KPI performance is weak and significantly constraining institutional achievement. Priority actions should focus on the lowest-scoring KPI targets and their underlying activities.";
  })();

  const sortedObjectivePerformance =
    Array.isArray(objectivePerformance) && objectivePerformance.length > 0
      ? [...objectivePerformance].sort(
          (a, b) => (b.value || 0) - (a.value || 0)
        )
      : [];

  const objectivesWithTargets = (() => {
    const objectives = objectiveReport?.objectives || objectiveReport?.data?.objectives || [];
    const rows = Array.isArray(objectives) ? objectives : [];
    return rows
      .map((o) => ({
        ...o,
        targets: Array.isArray(o.targets) ? o.targets : [],
      }))
      .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  })();

  const kpiMeta = (v) => {
    const n = typeof v === "number" ? v : Number(v || 0);
    if (n >= 100) return { badge: "bg-label-success", bar: "bg-success", label: "Reached" };
    if (n >= 70) return { badge: "bg-label-primary", bar: "bg-primary", label: "On track" };
    if (n >= 50) return { badge: "bg-label-warning", bar: "bg-warning", label: "At risk" };
    return { badge: "bg-label-danger", bar: "bg-danger", label: "Not reached" };
  };

  const showPlanningQueue = canViewApprovalQueue;
  const showImplementationQueue = canViewImplementation;

  return (
    <div className="w-100">
      <BreadCumb pageList={["SPISM", "Approver Dashboard"]} />

      <div className="row">
        <div className="col-12 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="d-flex align-items-end row">
              <div className="col-md-8">
                <div className="card-body">
                  <h5 className="card-title text-primary">
                    Welcome, {user?.first_name || "User"} {user?.last_name || ""}!
                  </h5>
                  <p className="mb-4 text-muted">
                    {(canApprovePlanning || canApproveImplementation) && (
                      <>
                        <strong className="text-body">Institutional approvals.</strong> Approve or return
                        submitted objectives, targets (KPI), activities, and implementation progress so approved
                        data feeds this institutional view.{" "}
                      </>
                    )}
                    Review strategic performance for the selected financial year, open an approval queue when you
                    are ready to act, and refresh analytics to load the latest figures.
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    {showPlanningQueue ? (
                      <Link
                        className={`btn btn-sm ${showImplementationQueue ? "btn-outline-primary" : "btn-primary"}`}
                        to="/performance-dashboard/approval"
                      >
                        <i className="bx bx-list-check me-1" aria-hidden="true" />
                        Planning queue
                      </Link>
                    ) : null}
                    {showImplementationQueue ? (
                      <Link
                        className={`btn btn-sm ${showPlanningQueue ? "btn-primary" : "btn-outline-primary"}`}
                        to="/performance-dashboard/approval?type=implementation"
                      >
                        <i className="bx bx-check-shield me-1" aria-hidden="true" />
                        Implementation queue
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setDataRefreshKey((k) => k + 1)}
                    >
                      <i className="bx bx-refresh me-1" aria-hidden="true" />
                      Refresh data
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-center text-md-start d-none d-md-block">
                <div className="card-body pb-0 px-0 px-md-4">
                  <img
                    src="/assets/img/illustrations/man-with-laptop-light.png"
                    height="140"
                    alt=""
                    data-app-dark-img="illustrations/man-with-laptop-dark.png"
                    data-app-light-img="illustrations/man-with-laptop-light.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h5 className="mb-1 fw-semibold">
                <i className="bx bx-analyse me-2 text-primary"></i>
                Institutional Performance Overview (Approver)
              </h5>
              <p className="mb-0 text-muted small">
                End‑to‑end view from{" "}
                <strong>institution &rarr; objectives &rarr; targets (KPI)</strong>{" "}
                with quarterly KPI performance fluctuation and multi‑year
                comparison.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <label className="form-label mb-0 small text-muted">
                Financial Year
              </label>
              <select
                className="form-select form-select-sm"
                style={{ minWidth: "150px" }}
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                disabled={yearsLoading}
              >
                {years.length === 0 && (
                  <option value={financialYear}>{financialYear}</option>
                )}
                {years.map((y) => (
                  <option key={y.uid || y.name} value={y.name}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <p className="text-muted mb-0">Loading analytics…</p>
          ) : !analytics ? (
            <p className="text-muted mb-0">
              No analytics data available. Ensure objectives, targets, activities,
              and quarterly KPI actuals are captured for this financial year.
            </p>
          ) : (
            <>
              {/* Row: Institutional gauge + status overview */}
              {instPerf != null && (
                <div className="row mb-4">
                  <div className="col-12 col-lg-6 mb-3 mb-lg-0">
                    <div className="card h-100 shadow-sm border-primary">
                      <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                          Institutional Performance — {financialYear}
                        </h6>
                        <span className="badge bg-label-primary">
                          {instPerfNumber.toFixed(1)}%
                        </span>
                      </div>
                      <div className="card-body">
                        <GaugeChart value={instPerfNumber || 0} />
                        <p className="text-muted small mb-0 mt-2">
                          Overall institutional Achievement Index (AI%) computed
                          from approved objectives, KPI targets, activities and
                          their quarterly performance.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-6">
                    <div className="card h-100 shadow-sm">
                      <div className="card-header pb-0">
                        <h6 className="mb-0">
                          Objective status overview — {financialYear}
                        </h6>
                      </div>
                      <div className="card-body">
                        <ProgressChart
                          items={progressStatus}
                          title="Share of approved / pending / draft / returned objectives."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Row: Status distributions */}
              <div className="row mb-4">
                <div className="col-12 col-lg-4 mb-4 mb-lg-0">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header pb-0">
                      <h6 className="mb-0">Objectives by status</h6>
                    </div>
                    <div className="card-body">
                      <DoughnutChart data={statusObjectives} />
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-4 mb-4 mb-lg-0">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header pb-0">
                      <h6 className="mb-0">Targets (KPI) by status</h6>
                    </div>
                    <div className="card-body">
                      <DoughnutChart data={statusTargets} />
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header pb-0">
                      <h6 className="mb-0">Activities by status</h6>
                    </div>
                    <div className="card-body">
                      <DoughnutChart data={statusActivities} />
                    </div>
                  </div>
                </div>
              </div>




                {/* Row: Target KPI performance by objective */}
                <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                    <h6 className="fw-semibold text-primary mb-0">
                      Target performance by objective — {formatFYLabel(financialYear)}
                    </h6>
                    <span className="badge bg-label-secondary">
                      Metric: KPI% &amp; Target Implementation (TI%) per target
                    </span>
                  </div>

                  {objectiveReportLoading ? (
                    <p className="text-muted mb-0">Loading objective targets…</p>
                  ) : objectivesWithTargets.length === 0 ? (
                    <p className="text-muted mb-0">
                      No target performance available yet. Ensure approved objectives have targets and quarterly KPI actuals for this financial year.
                    </p>
                  ) : (
                    <div className="accordion" id="objectiveTargetsAccordion">
                      {objectivesWithTargets.map((o, idx) => {
                        const targets = o.targets || [];
                        const reachedCount = targets.filter((t) => Number(t.kpi_score || 0) >= 100).length;
                        const avgKpi =
                          targets.length > 0
                            ? targets.reduce((sum, t) => sum + Number(t.kpi_score || 0), 0) / targets.length
                            : null;
                        const collapseId = `objTargetsCollapse-${idx}`;
                        const headingId = `objTargetsHeading-${idx}`;
                        return (
                          <div className="accordion-item" key={o.uid || o.title || idx}>
                            <h2 className="accordion-header" id={headingId}>
                              <button
                                className={`accordion-button ${idx === 0 ? "" : "collapsed"}`}
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#${collapseId}`}
                                aria-expanded={idx === 0 ? "true" : "false"}
                                aria-controls={collapseId}
                              >
                                <div className="d-flex flex-wrap align-items-center gap-2 w-100">
                                  <span className="fw-semibold text-truncate" title={o.title} style={{ maxWidth: "520px" }}>
                                    {o.title}
                                  </span>
                                  {o.score != null && (
                                    <span className="badge bg-label-primary">
                                      OI%: {Number(o.score || 0).toFixed(1)}%
                                    </span>
                                  )}
                                  <span className="badge bg-label-secondary">
                                    Targets: {targets.length}
                                  </span>
                                  <span className="badge bg-label-success">
                                    Reached: {reachedCount}/{targets.length || 0}
                                  </span>
                                  {avgKpi != null && (
                                    <span className="badge bg-label-info">
                                      Avg KPI%: {Number(avgKpi || 0).toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                              </button>
                            </h2>
                            <div
                              id={collapseId}
                              className={`accordion-collapse collapse ${idx === 0 ? "show" : ""}`}
                              aria-labelledby={headingId}
                              data-bs-parent="#objectiveTargetsAccordion"
                            >
                              <div className="accordion-body">
                                {targets.length === 0 ? (
                                  <p className="text-muted mb-0">
                                    No targets captured for this objective.
                                  </p>
                                ) : (
                                  <>
                                    <div className="mb-3">
                                      <TargetPerformanceChart
                                        targets={targets}
                                        kpiColor="#696CFF"
                                        tiColor="#71DD37"
                                      />
                                    </div>
                                    <div className="table-responsive">
                                      <table className="table table-sm align-middle mb-0">
                                        <thead className="table-light">
                                          <tr>
                                            <th style={{ minWidth: 320 }}>Target</th>
                                            <th style={{ width: 200 }}>Target Implementation (TI%)</th>
                                            <th style={{ width: 260 }}>KPI performance (KPI%)</th>
                                            <th style={{ width: 140 }}>Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {targets.map((t, tIdx) => {
                                            const kpi = Number(t.kpi_score || 0);
                                            const ti = t.operational_score;
                                            const meta = kpiMeta(kpi);
                                            const pct = Math.max(0, Math.min(100, kpi));
                                            return (
                                              <tr key={t.uid || t.title || tIdx}>
                                                <td>
                                                  <div className="fw-semibold" title={t.title}>
                                                    {t.title}
                                                  </div>
                                                  {t.description && (
                                                    <div className="small text-muted">{t.description}</div>
                                                  )}
                                                </td>
                                                <td className="text-muted">
                                                  {ti == null || ti === "" ? "—" : `${Number(ti || 0).toFixed(1)}%`}
                                                </td>
                                                <td>
                                                  <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-semibold">{kpi.toFixed(1)}%</span>
                                                    <div
                                                      className="progress flex-grow-1"
                                                      style={{ height: 7 }}
                                                      title={`Progress to 100% baseline (actual: ${kpi.toFixed(1)}%)`}
                                                    >
                                                      <div
                                                        className={`progress-bar ${meta.bar}`}
                                                        style={{ width: `${pct}%` }}
                                                      />
                                                    </div>
                                                  </div>
                                                </td>
                                                <td>
                                                  <span className={`badge ${meta.badge}`}>
                                                    {meta.label}
                                                  </span>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Row: Objective performance vs institution */}
              {sortedObjectivePerformance.length > 0 && (
                <div className="card shadow-sm mb-4">
                  <div className="card-body">
                    <h6 className="fw-semibold text-primary mb-2">
                      Objective performance vs institutional score — {financialYear}
                    </h6>
                    <BarChart
                      data={sortedObjectivePerformance}
                      barColor="bg-success"
                      valueLabel="Objective performance (OI %)"
                    />
                    <p className="small text-muted mb-0 mt-2">
                      Use this view to spot <strong>high‑impact</strong> and{" "}
                      <strong>under‑performing</strong> objectives that are
                      pulling institutional performance up or down.
                    </p>
                  </div>
                </div>
              )}

            

              {/* Row: Target KPI evaluation & institutional position */}
              {(kpiTopTargets.length > 0 || kpiBottomTargets.length > 0) && (
                <div className="row mb-4">
                  <div className="col-12 col-lg-7 mb-3 mb-lg-0">
                    <div className="card shadow-sm h-100">
                      <div className="card-body">
                        <h6 className="fw-semibold text-primary mb-2">
                          Top KPI targets — evaluation ({financialYear})
                        </h6>
                        <BarChart
                          data={kpiTopTargets}
                          barColor="bg-success"
                          valueLabel="KPI performance (KPI %)"
                        />
                        <p className="small text-muted mb-0 mt-2">
                          Shows the strongest KPI targets based on{" "}
                          <strong>computed KPI %</strong>. These are driving
                          institutional performance upwards.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-5">
                    <div className="card shadow-sm h-100">
                      <div className="card-body">
                        <h6 className="fw-semibold text-primary mb-2">
                          KPI-based institutional position
                        </h6>
                        <p className="small text-muted mb-2">
                          Summary view of how target-level KPI results position
                          the institution overall.
                        </p>
                        <p className="mb-3">{kpiPositionText}</p>
                        {kpiBottomTargets.length > 0 && (
                          <>
                            <h6 className="small fw-semibold text-danger mb-1">
                              Weakest KPI targets to watch
                            </h6>
                            <ul className="small text-muted mb-0">
                              {kpiBottomTargets.map((t) => (
                                <li key={t.uid || t.title}>
                                  <strong>{t.title}</strong>{" "}
                                  <span className="text-body">
                                    — {Number(t.value || 0).toFixed(1)}%
                                  </span>
                                  {t.objective_title && (
                                    <span className="ms-1">
                                      ({t.objective_title})
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Row: Quarterly KPI / AI fluctuation */}
              {quarterlyTrend.length > 0 && (
                <div className="card shadow-sm mb-4">
                  <div className="card-body">
                    <h6 className="fw-semibold text-primary mb-2">
                      Quarterly Achievement Index (AI%) fluctuation — {formatFYLabel(financialYear)}
                    </h6>
                    <QuarterlyTrendChart data={quarterlyTrend} />
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {quarterlyAIPerQuarter.map((q) => (
                        <span
                          key={q.quarter}
                          className="badge bg-label-secondary"
                          title="Avg Achievement Index (AI%) for the quarter"
                        >
                          {q.label}:{" "}
                          <strong>
                            {q.value == null ? "—" : `${Number(q.value).toFixed(1)}%`}
                          </strong>
                        </span>
                      ))}
                      <span className="badge bg-label-primary" title="Metric plotted">
                        Metric: <strong>Avg AI%</strong>
                      </span>
                    </div>
                    <p className="small text-muted mb-0 mt-2">
                      <strong>What this value means:</strong> the chart shows the{" "}
                      <strong>average Achievement Index (AI%)</strong> per quarter
                      (from quarterly activity performance records) for the selected
                      financial year. Stable upward lines reflect consistent
                      implementation, while sharp dips/spikes signal potential
                      bottlenecks, data gaps, or execution risks.
                    </p>
                  </div>
                </div>
              )}

              {/* Row: Quarterly comparison chart (KPI vs institution vs baseline) */}
              {quarterlyTrend.length > 0 && (
                <div className="card shadow-sm mb-4">
                  <div className="card-body">
                    <h6 className="fw-semibold text-primary mb-2">
                      Quarterly comparison — {formatFYLabel(financialYear)} (KPI/AI vs institutional vs baseline)
                    </h6>
                    <QuarterlyComparisonChart
                      quarters={quarterlyTrend}
                      institutionalValue={instPerfNumber}
                    />
                    <p className="small text-muted mb-0 mt-2">
                      Compares the quarterly <strong>Avg AI%</strong> line against
                      the <strong>overall institutional AI%</strong> for the
                      financial year (reference line) and an <strong>ideal 100%</strong>{" "}
                      baseline. This makes it easy to see whether quarterly results
                      are tracking above or below the institutional performance
                      level for the year.
                    </p>
                  </div>
                </div>
              )}

              {/* Row: Multi‑year institutional comparison */}
              {institutionalTrend.length > 0 && (
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h6 className="fw-semibold text-primary mb-2">
                      Institutional performance — multi‑year comparison
                    </h6>
                    <BarChart
                      data={institutionalTrend}
                      barColor="bg-info"
                      valueLabel="Institutional AI %"
                    />
                    <p className="small text-muted mb-0 mt-2">
                      Compares institutional performance across the most recent
                      configured financial years, helping Approvers see overall
                      trajectory and year‑on‑year improvement.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ESDashboardPage;

