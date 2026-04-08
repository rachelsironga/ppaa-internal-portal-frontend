import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../layouts/BreadCumb";
import { getDashboardSummary, getPerformanceAnalytics } from "./Queries";
import showToast from "../../../helpers/ToastHelper";
import {
  DoughnutChart,
  BarChart,
  ProgressChart,
  GaugeChart,
} from "../../../components/DashboardCharts";
import "animate.css";

const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1–12
  // SPISM financial year assumed July–June, e.g. 2025/2026
  if (month >= 7) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

export const PerformanceDashboardPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  const [summary, setSummary] = useState({ data: [] });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());

  // If logged-in user has the Approver role, default them to the Approver dashboard
  useEffect(() => {
    const roles = user?.groups || [];
    const normalized = roles.map((r) => String(r).toLowerCase());
    if (normalized.includes("spism approver".toLowerCase())) {
      navigate("/performance-dashboard/es-dashboard", { replace: true });
    }
  }, [user, navigate]);

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
  }, [financialYear]);

  const objectives = summary?.data || [];
  const approvedCount = objectives.filter((o) => o.status === "APPROVED").length;
  const pendingCount = objectives.filter((o) => o.status === "PENDING").length;

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
      value: analytics?.status_distribution?.targets?.reduce((s, t) => s + (t.count || 0), 0) ?? "—",
      sub: "Manage targets & KPIs",
      icon: "bx bx-bullseye",
      color: "info",
      link: "/performance-dashboard/targets",
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

  const doughnutObjectives = analytics?.status_distribution?.objectives || [];
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
                <label className="form-label mb-0 small text-muted">Financial Year</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ width: "140px" }}
                  placeholder="e.g. 2024/2025"
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value.trim())}
                />
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
                  className="card h-100 cursor-pointer shadow-sm"
                  onClick={() => navigate(card.link)}
                  style={{ cursor: "pointer" }}
                >
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
