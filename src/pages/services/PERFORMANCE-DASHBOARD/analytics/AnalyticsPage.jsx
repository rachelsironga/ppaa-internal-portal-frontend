import React, { useState, useEffect } from "react";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getFinancialYears, getPerformanceAnalytics } from "../Queries";
import {
  extractFinancialYearRows,
  getDefaultFinancialYear,
  resolveFinancialYearForList,
} from "../financialYearUtils";
import {
  BarChart,
  DoughnutChart,
  ProgressChart,
  GaugeChart,
} from "../../../../components/DashboardCharts";

export const AnalyticsPage = () => {
  const [financialYear, setFinancialYear] = useState(getDefaultFinancialYear());
  const [financialYearRows, setFinancialYearRows] = useState([]);
  const [financialYearsLoading, setFinancialYearsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

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
    const fetchAnalytics = async () => {
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
    fetchAnalytics();
  }, [financialYear]);

  const statusObjectives = analytics?.status_distribution?.objectives || [];
  const statusTargets = analytics?.status_distribution?.targets || [];
  const statusActivities = analytics?.status_distribution?.activities || [];
  const barByFy = analytics?.objectives_by_financial_year || [];
  const quarterlyTrend = analytics?.quarterly_trend || [];
  const objectivePerformance = analytics?.objective_performance || [];
  const progressStatus = analytics?.progress_status || [];
  const instPerf = analytics?.institutional_performance;

  const sortedObjectivePerformance =
    Array.isArray(objectivePerformance) && objectivePerformance.length > 0
      ? [...objectivePerformance].sort((a, b) => (b.value || 0) - (a.value || 0))
      : [];

  const instPerfNumber = typeof instPerf === "number" ? instPerf : Number(instPerf || 0);
  const outlook =
    instPerfNumber >= 80
      ? "On track to exceed planned institutional performance."
      : instPerfNumber >= 60
      ? "Generally on track, with room for improvement on weaker objectives."
      : "Below desired performance. Review low-scoring objectives and KPI targets.";

  return (
    <>
      <BreadCumb pageList={["SPISM", "Trends & Forecast"]} />
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-line-chart me-2 text-primary"></i>
            Performance Analytics
          </h5>
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
            <label
              htmlFor="spism-analytics-financial-year"
              className="form-label mb-0 small text-muted text-uppercase"
            >
              Financial Year
            </label>
            <select
              id="spism-analytics-financial-year"
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
          {loading ? (
            <p className="text-muted mb-0">Loading analytics…</p>
          ) : (
            <>
              {instPerf != null && (
                <div className="row mb-4">
                  <div className="col-12 col-lg-6 mb-3 mb-lg-0">
                    <div className="card h-100 shadow-sm">
                      <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Institutional Performance — {financialYear}</h6>
                        <span className="badge bg-label-primary">
                          {instPerfNumber.toFixed(1)}%
                        </span>
                      </div>
                      <div className="card-body">
                        <GaugeChart value={instPerfNumber || 0} />
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-6">
                    <div className="card h-100 shadow-sm">
                      <div className="card-header pb-0">
                        <h6 className="mb-0">Forecast outlook</h6>
                      </div>
                      <div className="card-body">
                        <p className="mb-2 small text-muted">
                          Based on current institutional performance and objective scores.
                        </p>
                        <p className="mb-0">{outlook}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                <div className="col-12 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header pb-0">
                      <h6 className="mb-0">Objectives by Status</h6>
                    </div>
                    <div className="card-body">
                      <DoughnutChart data={statusObjectives} />
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header pb-0">
                      <h6 className="mb-0">Targets by Status</h6>
                    </div>
                    <div className="card-body">
                      <DoughnutChart data={statusTargets} />
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header pb-0">
                      <h6 className="mb-0">Activities by Status</h6>
                    </div>
                    <div className="card-body">
                      <DoughnutChart data={statusActivities} />
                    </div>
                  </div>
                </div>
              </div>

              {barByFy.length > 0 && (
                <div className="card shadow-sm mb-4">
                  <div className="card-body">
                    <h6 className="fw-semibold text-primary">Objectives by Financial Year</h6>
                    <BarChart data={barByFy} barColor="bg-info" valueLabel="Objectives" />
                  </div>
                </div>
              )}

              {quarterlyTrend.length > 0 && (
                <div className="card shadow-sm mb-4">
                  <div className="card-body">
                    <h6 className="fw-semibold text-primary">
                      Quarterly Trend (Avg AI %) — {financialYear}
                    </h6>
                    <BarChart
                      data={quarterlyTrend.map((q) => ({
                        category: q.label,
                        label: q.label,
                        value: q.value,
                        count: q.value,
                      }))}
                      barColor="bg-primary"
                      valueLabel="Avg AI %"
                    />
                  </div>
                </div>
              )}

              {sortedObjectivePerformance.length > 0 && (
                <div className="card shadow-sm mb-4">
                  <div className="card-body">
                    <h6 className="fw-semibold text-primary">
                      Top Objectives by Performance — {financialYear}
                    </h6>
                    <BarChart
                      data={sortedObjectivePerformance}
                      barColor="bg-success"
                      valueLabel="Objective performance (OI %)"
                    />
                  </div>
                </div>
              )}

              {progressStatus.length > 0 && (
                <div className="card shadow-sm mb-4">
                  <div className="card-body">
                    <h6 className="fw-semibold text-primary">Status Overview (Objectives)</h6>
                    <ProgressChart data={progressStatus} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
