import React, { useEffect, useState } from "react";
import BreadCumb from "../../../../layouts/BreadCumb";
import {
  getPerformanceAnalytics,
  getSPISMReport,
} from "../Queries";
import {
  GaugeChart,
  ObjectivePerformanceChart,
  BarChart,
} from "../../../../components/DashboardCharts";
import showToast from "../../../../helpers/ToastHelper";

const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

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

export const ViewerDashboardPage = () => {
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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

  const instPerfNumber =
    typeof instPerf === "number" ? instPerf : Number(instPerf || 0);

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
      <BreadCumb pageList={["SPISM", "Viewer Dashboard"]} />
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h5 className="mb-1 fw-semibold">
              <i className="bx bx-show-alt me-2 text-primary"></i>
              Institutional Performance Summary (Viewer)
            </h5>
            <p className="mb-0 text-muted small">
              Read‑only overview of institutional performance, with best and weakest
              KPI targets and a downloadable institutional performance report.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 small text-muted">
              Financial Year
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ width: "140px" }}
              placeholder="e.g. 2024/2025"
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={handleExportInstitutionalReport}
              disabled={exporting}
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
                  <i className="bx bx-download me-1"></i>
                  Export SPISM Institutional Report
                </>
              )}
            </button>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <p className="text-muted mb-0">Loading institutional summary…</p>
          ) : !analytics ? (
            <p className="text-muted mb-0">
              No institutional performance data available. Ensure that objectives,
              targets, activities and quarterly KPI actuals are captured for this
              financial year.
            </p>
          ) : (
            <>
              {/* Institutional gauge */}
              {instPerf != null && (
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card h-100 shadow-sm border-primary">
                      <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                          Institutional Performance — {formatFYLabel(financialYear)}
                        </h6>
                        <span className="badge bg-label-primary">
                          {instPerfNumber.toFixed(1)}%
                        </span>
                      </div>
                      <div className="card-body">
                        <GaugeChart value={instPerfNumber || 0} />
                        <p className="text-muted small mb-0 mt-2">
                          Overall institutional Achievement Index (AI%) from approved
                          objectives, KPI targets and their implementation results.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Objective performance: each objective with own color, OI%, and High/Low summary */}
              {objectiveListWithColors.length > 0 && (
                <div className="card shadow-sm mb-4">
                  <div className="card-body">
                    <h6 className="fw-semibold text-primary mb-2">
                      Objective performance (OI%) — {formatFYLabel(financialYear)}
                    </h6>
                    <ObjectivePerformanceChart
                      data={objectiveListWithColors}
                      valueLabel="Objective performance (OI%)"
                    />
                    <p className="small text-muted mb-0 mt-2">
                      Each objective has its own color. The summary badge indicates <strong>High</strong> (≥70%) or <strong>Low</strong> (&lt;70%) performance.
                    </p>
                  </div>
                </div>
              )}

              {/* Top and weakest KPI targets */}
              {(kpiTopTargets.length > 0 || kpiBottomTargets.length > 0) && (
                <div className="row">
                  <div className="col-12 col-lg-6 mb-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-body">
                        <h6 className="fw-semibold text-primary mb-2">
                          Highest‑performing KPI targets
                        </h6>
                        <BarChart
                          data={kpiTopTargets}
                          barColor="bg-success"
                          valueLabel="KPI performance (KPI %)"
                        />
                        <p className="small text-muted mb-0 mt-2">
                          Targets with the highest KPI performance (KPI %) for the
                          selected financial year.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-6 mb-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-body">
                        <h6 className="fw-semibold text-danger mb-2">
                          Lowest‑performing KPI targets
                        </h6>
                        {kpiBottomTargets.length === 0 ? (
                          <p className="small text-muted mb-0">
                            No low‑performing KPI targets identified for this
                            financial year.
                          </p>
                        ) : (
                          <>
                            <BarChart
                              data={kpiBottomTargets}
                              barColor="bg-danger"
                              valueLabel="KPI performance (KPI %)"
                            />
                            <p className="small text-muted mb-0 mt-2">
                              Targets with the lowest KPI performance (KPI %) — useful
                              for understanding where institutional performance is
                              most constrained.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
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

export default ViewerDashboardPage;

