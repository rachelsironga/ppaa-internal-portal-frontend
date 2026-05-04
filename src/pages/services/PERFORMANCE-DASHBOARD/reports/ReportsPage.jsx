import React, { useEffect, useMemo, useState } from "react";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getFinancialYears, getSPISMReport } from "../Queries";
import showToast from "../../../../helpers/ToastHelper";

const REPORT_TYPES = [
  { value: "quarterly", label: "Quarterly Report" },
  { value: "annual", label: "Annual Report" },
  { value: "objective", label: "Objective Performance Report" },
  { value: "kpi", label: "KPI Report" },
];

export const ReportsPage = () => {
  const [financialYear, setFinancialYear] = useState("");
  const [reportType, setReportType] = useState("quarterly");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [financialYears, setFinancialYears] = useState([]);
  const [financialYearsLoading, setFinancialYearsLoading] = useState(false);

  useEffect(() => {
    setFinancialYearsLoading(true);
    getFinancialYears()
      .then((res) => {
        const data = res?.data ?? res?.results ?? res;
        const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
        setFinancialYears(Array.isArray(list) ? list : []);
        if (!financialYear && Array.isArray(list) && list.length > 0) {
          setFinancialYear(list[0]?.name || "");
        }
      })
      .catch(() => setFinancialYears([]))
      .finally(() => setFinancialYearsLoading(false));
  }, []);

  const loadReport = async (typeOverride) => {
    const type = typeOverride || reportType;
    if (!financialYear?.trim()) {
      showToast("Select a financial year", "warning");
      return;
    }
    setLoading(true);
    setReportData(null);
    setReportType(type);
    try {
      const res = await getSPISMReport(type, financialYear);
      const data = res?.data?.data ?? res?.data ?? res;
      setReportData(data);
    } catch (e) {
      showToast(e?.response?.data?.message || "Failed to load report", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value) => {
    setReportType(value);
    setReportData(null);
    if (financialYear?.trim()) {
      loadReport(value);
    }
  };

  const handlePrint = () => {
    if (!reportData) {
      showToast("Generate a report first", "warning");
      return;
    }
    window.print();
  };

  const handleExport = () => {
    if (!reportData) {
      showToast("Generate a report first", "warning");
      return;
    }

    let headers = [];
    let rows = [];

    if (reportType === "quarterly") {
      headers = ["Quarter", "Avg AI %"];
      const trend = reportData.quarterly_trend || [];
      rows = trend.map((r) => [r.label, r.value ?? ""]);
    } else if (reportType === "annual" && Array.isArray(reportData.objectives)) {
      headers = ["Objective", "Weight %", "Objective performance (OI %)"];
      rows = reportData.objectives.map((o) => [o.title, o.weight, o.score]);
    } else if (reportType === "objective" && Array.isArray(reportData.objectives)) {
      headers = ["Objective", "Target", "Target Weight %", "Operational performance (TI %)", "KPI performance (KPI %)"];
      reportData.objectives.forEach((o) => {
        if (Array.isArray(o.targets) && o.targets.length > 0) {
          o.targets.forEach((t) => {
            rows.push([
              o.title,
              t.title,
              t.weight,
              t.operational_score,
              t.kpi_score,
            ]);
          });
        } else {
          rows.push([o.title, "", "", o.score, ""]);
        }
      });
    } else if (reportType === "kpi" && Array.isArray(reportData.kpi_targets)) {
      headers = ["Target", "Objective", "KPI Name", "Planned KPI value", "KPI performance (KPI %)"];
      rows = reportData.kpi_targets.map((t) => [
        t.title,
        t.objective_title,
        t.kpi_name,
        t.kpi_planned_value,
        t.kpi_score,
      ]);
    }

    if (!headers.length) {
      showToast("Nothing to export for this report", "info");
      return;
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
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spism-${reportType}-report-${financialYear.replace("/", "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summaryCards = useMemo(() => {
    if (!reportData?.summary) return [];
    const summary = reportData.summary;
    if (reportType === "quarterly") {
      return [
        { label: "Institutional Performance", value: summary.institutional_performance != null ? `${summary.institutional_performance}%` : "—" },
        { label: "Quarters with submitted data", value: summary.quarters_reported ?? 0 },
        {
          label: "Submitted quarter records",
          value: summary.submitted_quarter_rows ?? "—",
        },
      ];
    }
    if (reportType === "annual") {
      return [
        { label: "Institutional Performance", value: summary.institutional_performance != null ? `${summary.institutional_performance}%` : "—" },
        { label: "Approved Objectives", value: summary.objective_count ?? 0 },
      ];
    }
    if (reportType === "objective") {
      return [
        { label: "Objectives", value: summary.objective_count ?? 0 },
        { label: "Approved Targets", value: summary.target_count ?? 0 },
      ];
    }
    if (reportType === "kpi") {
      return [
        { label: "Targets With KPI", value: summary.target_count ?? 0 },
        { label: "Average KPI Score", value: summary.average_kpi_score != null ? `${summary.average_kpi_score}%` : "—" },
      ];
    }
    return [];
  }, [reportData, reportType]);

  const hasContent =
    (reportType === "quarterly" && (reportData?.quarterly_trend?.length > 0 || reportData?.institutional_performance != null)) ||
    (reportType === "annual" && reportData?.objectives?.length > 0) ||
    (reportType === "objective" && reportData?.objectives?.length > 0) ||
    (reportType === "kpi" && reportData?.kpi_targets?.length > 0);

  return (
    <>
      <BreadCumb pageList={["SPISM", "Reports"]} />
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-report me-2 text-primary"></i>
            Performance Reports
          </h5>
        </div>
        <div className="card-body">
          <p className="text-muted small mb-3">
            Choose a report type and financial year. Use the tabs to switch between Quarterly,
            Annual, KPI and Performance reports. Quarterly and performance views use{" "}
            <strong>submitted</strong> quarterly implementation only (submitted for ES review or
            already approved); draft quarters are excluded.
          </p>
          <ul className="nav nav-tabs mb-3">
            {REPORT_TYPES.map((r) => (
              <li className="nav-item" key={r.value}>
                <button
                  type="button"
                  className={`nav-link ${reportType === r.value ? "active" : ""}`}
                  onClick={() => handleTabChange(r.value)}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <select
              className="form-select form-select-sm"
              style={{ width: "190px" }}
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              disabled={financialYearsLoading}
            >
              <option value="">{financialYearsLoading ? "Loading years..." : "Select financial year"}</option>
              {financialYears.map((fy) => (
                <option key={fy.uid || fy.name} value={fy.name}>
                  {fy.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => loadReport()}
              disabled={loading}
            >
              {loading ? "Loading…" : "Generate"}
            </button>
            {reportData && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleExport}
                >
                  <i className="bx bx-download me-1"></i>
                  Export CSV
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handlePrint}
                >
                  <i className="bx bx-printer me-1"></i>
                  Print
                </button>
              </>
            )}
          </div>
          {loading && (
            <div className="alert alert-light border text-muted small mb-0">
              Generating report...
            </div>
          )}
          {!loading && reportData && (
            <div className="mt-3">
              {summaryCards.length > 0 && (
                <div className="row g-3 mb-3">
                  {summaryCards.map((card) => (
                    <div
                      className={`col-12 ${summaryCards.length > 2 ? "col-md-4" : "col-md-6"}`}
                      key={card.label}
                    >
                      <div className="card border shadow-none h-100">
                        <div className="card-body py-3">
                          <div className="text-muted small">{card.label}</div>
                          <div className="fw-bold fs-5 text-primary">{card.value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div className="small text-muted">
                  Financial year: <strong>{reportData.financial_year}</strong>
                </div>
                {reportData.generated_at && (
                  <div className="small text-muted">
                    Generated: {new Date(reportData.generated_at).toLocaleString()}
                  </div>
                )}
              </div>

              {!hasContent && (
                <div className="alert alert-warning mb-0">
                  No report data was found for the selected financial year.
                </div>
              )}

              {reportType === "quarterly" && (
                <>
                  <p><strong>Institutional performance:</strong> {reportData.institutional_performance != null ? `${reportData.institutional_performance}%` : "—"}</p>
                  {reportData.quarterly_trend?.length > 0 && (
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead><tr><th>Quarter</th><th>Avg AI %</th></tr></thead>
                        <tbody>
                          {reportData.quarterly_trend.map((r) => (
                            <tr key={r.quarter}><td>{r.label}</td><td>{r.value ?? "—"}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
              {reportType === "annual" && reportData.objectives?.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead><tr><th>Objective</th><th>Weight %</th><th>Objective performance (OI %)</th></tr></thead>
                    <tbody>
                      {reportData.objectives.map((o) => (
                        <tr key={o.uid}><td>{o.title}</td><td>{o.weight}</td><td>{o.score}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {reportType === "objective" && reportData.objectives?.length > 0 && (
                <div>
                  {reportData.objectives.map((o) => (
                    <div key={o.uid} className="mb-3">
                      <strong>{o.title}</strong> — Weight: {o.weight}%, Objective performance (OI %): {o.score}
                      {o.targets?.length > 0 && (
                        <div className="table-responsive mt-2 ms-3">
                          <table className="table table-sm table-bordered">
                            <thead><tr><th>Target</th><th>Weight %</th><th>Operational performance (TI %)</th><th>KPI performance (KPI %)</th></tr></thead>
                            <tbody>
                              {o.targets.map((t) => (
                                <tr key={t.uid}><td>{t.title}</td><td>{t.weight}</td><td>{t.operational_score}</td><td>{t.kpi_score}</td></tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {reportType === "kpi" && reportData.kpi_targets?.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead><tr><th>Target</th><th>Objective</th><th>KPI Name</th><th>Planned</th><th>KPI Score</th></tr></thead>
                    <tbody>
                      {reportData.kpi_targets.map((t) => (
                        <tr key={t.uid}><td>{t.title}</td><td>{t.objective_title}</td><td>{t.kpi_name}</td><td>{t.kpi_planned_value}</td><td>{t.kpi_score}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
