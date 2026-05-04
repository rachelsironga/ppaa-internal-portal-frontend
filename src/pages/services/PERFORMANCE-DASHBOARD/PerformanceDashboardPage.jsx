import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../layouts/BreadCumb";
import {
  getDashboardSummary,
  getFinancialYears,
  getPerformanceAnalytics,
  getTargets,
} from "./Queries";
import {
  extractFinancialYearRows,
  getDefaultFinancialYear,
  resolveFinancialYearForList,
} from "./financialYearUtils";
import showToast from "../../../helpers/ToastHelper";
import { hasPermission } from "../../../utils/permissions";
import {
  DoughnutChart,
  BarChart,
  ProgressChart,
  GaugeChart,
} from "../../../components/DashboardCharts";
import "animate.css";

export const PerformanceDashboardPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  const [summary, setSummary] = useState({ data: [] });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState(getDefaultFinancialYear());
  const [financialYearRows, setFinancialYearRows] = useState([]);
  const [financialYearsLoading, setFinancialYearsLoading] = useState(true);
  const [myAssignedTargets, setMyAssignedTargets] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);

  /** Charts + status rollups: analytics codename, or main dashboard / institutional reports (backend scopes dept heads). */
  const canFetchSpismAnalytics = useMemo(
    () =>
      hasPermission(
        [
          "can_view_spism_analytics",
          "can_view_spism_dashboard",
          "can_view_spism_reports",
        ],
        [],
        user?.user_permissions,
        user?.groups,
        user
      ),
    [user]
  );

  const canViewSpismTargets = useMemo(
    () =>
      hasPermission(
        ["can_view_spism_target"],
        [],
        user?.user_permissions,
        user?.groups,
        user
      ),
    [user]
  );

  const isDeptHeadLike = useMemo(() => {
    const roles = (user?.groups || []).map((r) => String(r).toLowerCase());
    return roles.some((r) => ["spism_dept_head", "spism_contributor", "spims_dept_head"].includes(r));
  }, [user]);

  // Role-specific landing: dept heads stay here (scoped data); viewers → viewer dashboard; approvers → ES dashboard.
  // SPISM admins keep both entry points without forced redirect.
  useEffect(() => {
    if (!user) return;
    const normalized = (user?.groups || []).map((r) => String(r).toLowerCase());
    if (normalized.includes("spism_admin")) return;
    if (isDeptHeadLike) return;

    const isApproverRole = normalized.some((r) => ["spism_approver", "spims_approver"].includes(r));
    const hasEsWorkbench =
      hasPermission(
        ["can_view_spism_analytics"],
        [],
        user?.user_permissions,
        user?.groups,
        user
      ) &&
      hasPermission(
        ["can_view_spism_approval"],
        [],
        user?.user_permissions,
        user?.groups,
        user
      );
    if (isApproverRole || hasEsWorkbench) {
      navigate("/performance-dashboard/es-dashboard", { replace: true });
      return;
    }

    const isViewerRole = normalized.some((r) => ["spism_viewer", "spims_viewer"].includes(r));
    if (isViewerRole) {
      navigate("/performance-dashboard/viewer-dashboard", { replace: true });
    }
  }, [user, navigate, isDeptHeadLike]);

  useEffect(() => {
    let cancelled = false;
    const loadFinancialYears = async () => {
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
    loadFinancialYears();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await getDashboardSummary(financialYear);
        if (res?.data !== undefined) {
          setSummary(Array.isArray(res) ? { data: res } : res);
        } else {
          setSummary({ data: [] });
        }
      } catch (err) {
        showToast("Failed to load dashboard summary", "warning", "Error");
        setSummary({ data: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [financialYear]);

  useEffect(() => {
    if (!canFetchSpismAnalytics) {
      setAnalytics(null);
      return;
    }
    const fetchAnalytics = async () => {
      try {
        const res = await getPerformanceAnalytics(financialYear);
        const data = res?.data ?? res;
        if (data && (res?.status === 200 || res?.status === 8000)) {
          setAnalytics(data);
        } else {
          setAnalytics(null);
        }
      } catch {
        setAnalytics(null);
      }
    };
    fetchAnalytics();
  }, [financialYear, canFetchSpismAnalytics]);

  useEffect(() => {
    if (!financialYear || !user || !canViewSpismTargets) {
      setMyAssignedTargets([]);
      setAssignedLoading(false);
      return;
    }
    let cancelled = false;
    const loadAssigned = async () => {
      setAssignedLoading(true);
      try {
        const res = await getTargets({
          financial_year: financialYear,
          assigned_to_me: true,
          pagination: { page_size: 100 },
        });
        const raw = res?.data ?? res;
        const list = Array.isArray(raw) ? raw : [];
        if (!cancelled) setMyAssignedTargets(list);
      } catch {
        if (!cancelled) setMyAssignedTargets([]);
      } finally {
        if (!cancelled) setAssignedLoading(false);
      }
    };
    loadAssigned();
    return () => {
      cancelled = true;
    };
  }, [financialYear, user, canViewSpismTargets]);

  const objectives = summary?.data || [];
  const approvedCount = objectives.filter((o) => o.status === "APPROVED").length;
  const pendingCount = objectives.filter((o) => o.status === "PENDING").length;

  const objectivesStatusFromSummary = useMemo(() => {
    const counts = {};
    for (const o of objectives) {
      const s = o.status || "UNKNOWN";
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [objectives]);

  const assignedTargetCount = myAssignedTargets.length;
  const targetsRollup =
    analytics?.status_distribution?.targets?.reduce((s, t) => s + (t.count || 0), 0) ?? null;

  const cards = [
    {
      title: "Objectives",
      value: objectives.length,
      sub: `${approvedCount} approved, ${pendingCount} pending`,
      icon: "bx bx-target-lock",
      color: "primary",
      link: "/performance-dashboard/objectives",
    },
    {
      title: "Targets",
      value:
        assignedTargetCount > 0
          ? assignedTargetCount
          : targetsRollup != null
            ? targetsRollup
            : "—",
      sub:
        assignedTargetCount > 0
          ? `Assigned to you in ${financialYear} · Open Planning → Targets for the full register`
          : "Manage targets & KPIs",
      icon: "bx bx-bullseye",
      color: "info",
      link: "/performance-dashboard/targets",
      badge: assignedTargetCount > 0 ? assignedTargetCount : null,
    },
    {
      title: "Activities",
      value: analytics?.status_distribution?.activities?.reduce((s, a) => s + (a.count || 0), 0) ?? "—",
      sub: "Activities & quarterly data",
      icon: "bx bx-task",
      color: "success",
      link: "/performance-dashboard/activities",
    },
  ];

  const doughnutObjectives =
    (analytics?.status_distribution?.objectives?.length
      ? analytics.status_distribution.objectives
      : objectivesStatusFromSummary) || [];
  const doughnutTargets = analytics?.status_distribution?.targets || [];
  const barByFy = analytics?.objectives_by_financial_year || [];
  const progressStatus = analytics?.progress_status || [];
  const objectivePerformance = analytics?.objective_performance || [];
  const quarterlyTrend = analytics?.quarterly_trend || [];
  const institutionalPerf = analytics?.institutional_performance;

  // Sort objectives by performance (highest first) and append institutional total as a separate bar
  const sortedObjectivePerformance =
    Array.isArray(objectivePerformance) && objectivePerformance.length > 0
      ? [...objectivePerformance].sort((a, b) => (b.value || 0) - (a.value || 0))
      : [];

  const objectivePerformanceWithInstitution =
    financialYear && sortedObjectivePerformance.length > 0 && institutionalPerf != null
      ? [
          ...sortedObjectivePerformance,
          {
            category: "Institution",
            label: "Institution",
            value: Number(institutionalPerf) || 0,
            count: Number(institutionalPerf) || 0,
          },
        ]
      : sortedObjectivePerformance;

  // Ensure quarterly trend always shows Q1–Q4, even when some quarters have no data.
  const quarterlyTrendByQuarter = Array.isArray(quarterlyTrend)
    ? quarterlyTrend.reduce((acc, item) => {
        const q = item.quarter ?? null;
        if (q != null) acc[q] = item;
        return acc;
      }, {})
    : {};

  const quarterlyTrendFull = [1, 2, 3, 4].map((q) => {
    const existing = quarterlyTrendByQuarter[q];
    const label = existing?.label || `Q${q}`;
    const value = existing?.value || 0;
    return {
      category: label,
      label,
      value,
      count: value,
    };
  });

  return (
    <>
      <BreadCumb pageList={["SPISM"]} />
      <div className="row animate__animated animate__fadeIn">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h5 className="card-title mb-2">
                  <i className="bx bx-line-chart me-2"></i>
                  Strategic Performance Management Information System (SPISM)
                </h5>
                <p className="text-muted small mb-0">
                  Activity → Target (KPI) → Objective → Institution. Weight-based aggregation and KPI-driven outcome tracking.
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <label htmlFor="spism-dashboard-financial-year" className="form-label mb-0 small text-muted text-uppercase">
                  Financial Year
                </label>
                <select
                  id="spism-dashboard-financial-year"
                  className="form-select form-select-sm"
                  style={{ minWidth: "180px", maxWidth: "240px" }}
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  disabled={financialYearsLoading}
                  aria-busy={financialYearsLoading}
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
            </div>
          </div>
        </div>

        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {financialYear && institutionalPerf != null && (
              <div className="col-12 mb-4">
                <div className="card h-100 border-primary shadow-sm">
                  <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Institutional Performance — {financialYear}</h6>
                    <span className="badge bg-label-primary">
                      {Number(institutionalPerf).toFixed(1)}%
                    </span>
                  </div>
                  <div className="card-body">
                    <GaugeChart value={Number(institutionalPerf) || 0} />
                    <p className="text-muted small mb-0 mt-2">
                      Overall institutional Achievement Index (AI%) computed from approved objectives,
                      targets, activities and their quarterly performance.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {cards.map((card, idx) => (
              <div key={idx} className="col-md-4 col-lg-4 mb-4">
                <div
                  className="card h-100 cursor-pointer shadow-sm position-relative"
                  onClick={() => navigate(card.link)}
                  style={{ cursor: "pointer" }}
                >
                  {card.badge != null ? (
                    <span className="position-absolute top-0 end-0 m-2 badge bg-warning text-dark">
                      {card.badge}
                    </span>
                  ) : null}
                  <div className="card-body d-flex align-items-center">
                    <div className={`avatar avatar-lg me-3 bg-label-${card.color}`}>
                      <i className={`bx ${card.icon} fs-2`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{card.title}</h6>
                      <h4 className="mb-0">{card.value}</h4>
                      <small className="text-muted">{card.sub}</small>
                    </div>
                    <i className="bx bx-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            ))}

            {canViewSpismTargets && financialYear ? (
              <div className="col-12 mb-4">
                {assignedLoading ? (
                  <div className="card border-0 shadow-sm">
                    <div className="card-body py-4 text-center text-muted small">
                      Loading targets assigned to you…
                    </div>
                  </div>
                ) : myAssignedTargets.length > 0 ? (
                  <div className="card border-0 shadow-sm border-start border-4 border-warning">
                    <div className="card-body">
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                        <div>
                          <h6 className="mb-1 fw-semibold">
                            <i className="bx bx-user-check me-2 text-warning" aria-hidden="true" />
                            Your assigned targets — {financialYear}
                          </h6>
                          <p className="text-muted small mb-0">
                            You are the responsible officer for these KPI targets. Open a target to manage KPIs and
                            linked activities, or go to{" "}
                            <strong>Implementation</strong> to record quarterly progress and submit for institutional
                            review.
                          </p>
                        </div>
                        <Link
                          className="btn btn-sm btn-primary"
                          to={`/performance-dashboard/implementation?financial_year=${encodeURIComponent(
                            financialYear
                          )}`}
                        >
                          <i className="bx bx-calendar-check me-1" aria-hidden="true" />
                          Implementation workspace
                        </Link>
                      </div>
                      <div className="table-responsive">
                        <table className="table table-sm table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Target (KPI)</th>
                              <th>Objective</th>
                              <th>Status</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {myAssignedTargets.map((row) => {
                              const uid = row.uid || row.target_uid;
                              const title = row.title || "—";
                              const objTitle = row.objective_title || row.objectiveTitle || "—";
                              const st = (row.status || "").toUpperCase();
                              const badge =
                                st === "APPROVED"
                                  ? "bg-label-success"
                                  : st === "PENDING"
                                    ? "bg-label-warning"
                                    : st === "RETURNED"
                                      ? "bg-label-danger"
                                      : "bg-label-secondary";
                              const implHref = `/performance-dashboard/implementation?financial_year=${encodeURIComponent(
                                financialYear
                              )}&search=${encodeURIComponent(title)}`;
                              return (
                                <tr key={uid || title}>
                                  <td className="fw-medium">{title}</td>
                                  <td className="text-muted small">{objTitle}</td>
                                  <td>
                                    <span className={`badge ${badge}`}>{st || "—"}</span>
                                  </td>
                                  <td className="text-end text-nowrap">
                                    <Link
                                      className="btn btn-sm btn-outline-primary me-1"
                                      to={`/performance-dashboard/targets/open/${uid}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Target
                                    </Link>
                                    <Link className="btn btn-sm btn-outline-success" to={implHref}>
                                      Implementation
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : isDeptHeadLike ? (
                  <div className="alert alert-light border small mb-0" role="status">
                    <i className="bx bx-info-circle me-1" aria-hidden="true" />
                    No KPI targets are assigned to you for <strong>{financialYear}</strong>. When Planning assigns you
                    as <strong>responsible officer</strong> on a target, it will appear here with shortcuts to
                    implementation work.
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Charts row */}
            <div className="col-12">
              <h6 className="mb-3">
                <i className="bx bx-bar-chart me-2"></i>
                Analytics & Charts
              </h6>
            </div>
            <div className="col-12 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-header pb-0">
                  <h6 className="mb-0">Objectives by Status</h6>
                </div>
                <div className="card-body">
                  <DoughnutChart data={doughnutObjectives} />
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-header pb-0">
                  <h6 className="mb-0">Targets by Status</h6>
                </div>
                <div className="card-body">
                  <DoughnutChart data={doughnutTargets} />
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-header pb-0">
                  <h6 className="mb-0">Objective Status (FY)</h6>
                </div>
                <div className="card-body">
                  <ProgressChart items={progressStatus} title="" />
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-header pb-0">
                  <h6 className="mb-0">
                    {financialYear
                      ? `Objective Performance & Institutional Score (${financialYear})`
                      : "Select a financial year"}
                  </h6>
                </div>
                <div className="card-body">
                  {financialYear && objectivePerformance.length > 0 ? (
                    <>
                      <BarChart
                        data={objectivePerformanceWithInstitution}
                        barColor="bg-success"
                        valueLabel="Objective / Institutional AI %"
                      />
                      <div className="text-muted small mt-2">
                        The last bar <strong>&quot;Institution&quot;</strong> shows the overall
                        institutional performance (AI%) compared with each approved objective.
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted small">
                      Enter a financial year above to see objective performance scores.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-6 mb-4">
              <div className="card h-100">
                <div className="card-header pb-0">
                  <h6 className="mb-0">Objectives by Financial Year (volume)</h6>
                </div>
                <div className="card-body">
                  <BarChart data={barByFy} barColor="bg-info" valueLabel="Objectives" />
                </div>
              </div>
            </div>
            {financialYear && (
              <div className="col-12 mb-4">
                <div className="card">
                  <div className="card-header pb-0">
                    <h6 className="mb-0">Quarterly Trend (Avg AI %) — {financialYear}</h6>
                  </div>
                  <div className="card-body">
                    <BarChart
                      data={quarterlyTrendFull}
                      barColor="bg-primary"
                      valueLabel="Avg AI %"
                    />
                    <div className="d-flex flex-wrap gap-3 small text-muted mt-3">
                      {quarterlyTrendFull.map((q) => (
                        <span key={q.label}>
                          <strong>{q.label}:</strong> {Number(q.value || 0).toFixed(1)}%
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
