import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { spismCan } from "../../../../utils/spismPermissions";
import {
  getTargets,
  getKpiActuals,
  createUpdateKpiActual,
  getFinancialYears,
} from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";

const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

export const KpiActualsPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const canMutateKpiActual = spismCan(
    user,
    "can_add_spism_kpi_actual",
    "can_edit_spism_kpi_actual"
  );
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const [financialYears, setFinancialYears] = useState([]);
  const [loadingFY, setLoadingFY] = useState(false);
  const [targets, setTargets] = useState([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [savingUid, setSavingUid] = useState(null);
  const [search, setSearch] = useState("");

  // Load financial years from DB for the dropdown
  const loadFinancialYears = async () => {
    setLoadingFY(true);
    try {
      const res = await getFinancialYears();
      const data = res?.data ?? res?.results ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
      setFinancialYears(Array.isArray(list) ? list : []);
    } catch {
      setFinancialYears([]);
    } finally {
      setLoadingFY(false);
    }
  };

  const loadTargets = async () => {
    if (!financialYear) return;
    setLoadingTargets(true);
    try {
      // Fetch approved targets filtered by the selected financial year
      const res = await getTargets({
        financial_year: financialYear,
        search,
        pagination: { page_size: 500 },
      });
      const data = res?.data ?? res?.results ?? res;
      const list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
      // Show all approved targets that have a KPI planned value configured
      const directTargets = (Array.isArray(list) ? list : []).filter(
        (t) => t.status === "APPROVED" && t.kpi_planned_value != null
      );

      // For each target, load the annual KPI actual for the selected FY
      const withActuals = await Promise.all(
        directTargets.map(async (t) => {
          try {
            const resActuals = await getKpiActuals({
              target: t.uid,
              financial_year: financialYear,
              pagination: { page_size: 10 },
            });
            const aData = resActuals?.data ?? resActuals?.results ?? resActuals;
            const aList = Array.isArray(aData) ? aData : aData?.data ?? aData?.results ?? [];
            // Pick the annual record (no quarter) if present, else fall back to first
            const annual = (Array.isArray(aList) ? aList : []).find((a) => !a.quarter);
            const match = annual ?? (Array.isArray(aList) ? aList[0] : null);
            return {
              ...t,
              kpi_actual_uid: match?.uid || null,
              kpi_actual_value: match?.actual_value != null ? String(match.actual_value) : "",
              kpi_computed_percent: match?.computed_kpi_percent ?? null,
            };
          } catch {
            return {
              ...t,
              kpi_actual_uid: null,
              kpi_actual_value: "",
              kpi_computed_percent: null,
            };
          }
        })
      );

      setTargets(withActuals);
    } catch {
      setTargets([]);
      showToast("Failed to load KPI targets", "danger", "Error");
    } finally {
      setLoadingTargets(false);
    }
  };

  useEffect(() => {
    loadFinancialYears();
  }, []);

  useEffect(() => {
    loadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financialYear]);

  const handleChangeActual = (uid, value) => {
    setTargets((prev) =>
      prev.map((t) => (t.uid === uid ? { ...t, kpi_actual_value: value } : t))
    );
  };

  const handleSave = async (target) => {
    if (!financialYear?.trim()) {
      showToast("Select a financial year first", "warning");
      return;
    }
    const actual = Number(target.kpi_actual_value);
    if (!actual || actual <= 0) {
      showToast("Enter a positive KPI actual value", "warning");
      return;
    }
    setSavingUid(target.uid);
    try {
      const fy = financialYear.trim();
      const payload = {
        uid: target.kpi_actual_uid || undefined,
        target: target.uid,
        financial_year: fy,
        reporting_period: `Annual ${fy}`,
        actual_value: actual,
      };
      const res = await createUpdateKpiActual(payload);
      if (res?.status === 200 || res?.status === 8000) {
        showToast("KPI actual saved", "success", "Done");
        await loadTargets();
      } else {
        showToast(res?.message || "Save failed", "warning", "Error");
      }
    } catch {
      showToast("Failed to save KPI actual", "danger", "Error");
    } finally {
      setSavingUid(null);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadTargets();
  };

  const percentColor = (pct) => {
    if (pct == null) return "text-muted";
    if (pct >= 80) return "text-success fw-semibold";
    if (pct >= 50) return "text-warning fw-semibold";
    return "text-danger fw-semibold";
  };

  return (
    <>
      <BreadCumb pageList={["SPISM", "KPI Actuals"]} />
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light d-flex align-items-center gap-3 flex-wrap">
          <div>
            <h5 className="mb-0 fw-semibold">
              <i className="bx bx-bar-chart-alt me-2 text-primary"></i>
              KPI Actuals
            </h5>
            <p className="mb-0 text-muted small mt-1">
              Record annual actual KPI values for approved targets. For <strong>Direct KPI</strong> targets this is required before submitting implementation.
            </p>
          </div>
        </div>

        <div className="card-body">
          {/* Filter bar */}
          <div className="row g-3 align-items-end mb-4">
            <div className="col-sm-auto">
              <label className="form-label small text-muted mb-1">Financial Year</label>
              <select
                className="form-select form-select-sm"
                style={{ minWidth: "160px" }}
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                disabled={loadingFY}
              >
                {loadingFY && (
                  <option value="">Loading years…</option>
                )}
                {!loadingFY && financialYears.length === 0 && (
                  <option value={financialYear}>{financialYear}</option>
                )}
                {financialYears.map((fy) => (
                  <option key={fy.uid} value={fy.name}>
                    {fy.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-sm">
              <label className="form-label small text-muted mb-1">Search target</label>
              <form className="d-flex gap-2" onSubmit={handleSearch}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Target name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="btn btn-sm btn-outline-primary" disabled={loadingTargets}>
                  <i className="bx bx-search"></i>
                </button>
              </form>
            </div>

            <div className="col-sm-auto">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={loadTargets}
                disabled={loadingTargets}
              >
                <i className="bx bx-refresh me-1"></i>
                {loadingTargets ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* Info strip */}
          {financialYear && (
            <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-3">
              <i className="bx bx-info-circle fs-5"></i>
              Showing targets with KPI configured for financial year <strong>{financialYear}</strong> — annual values.
            </div>
          )}

          {/* Table */}
          {loadingTargets ? (
            <div className="d-flex justify-content-center py-5">
              <ReactLoading type="spin" color="#696cff" height={36} width={36} />
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bx bx-bar-chart-alt-2 fs-1 d-block mb-2 text-secondary"></i>
              {financialYear
                ? `No approved targets with KPI found for ${financialYear}.`
                : "Select a financial year to load targets."}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle table-hover table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Target / KPI</th>
                    <th>Objective</th>
                    <th>Planned KPI</th>
                    <th style={{ width: "170px" }}>Annual Actual</th>
                    <th style={{ width: "150px" }}>KPI Performance</th>
                    <th style={{ width: "110px" }} className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.map((t, idx) => {
                    const isSaving = savingUid === t.uid;
                    const pct = t.kpi_computed_percent != null ? Number(t.kpi_computed_percent) : null;
                    return (
                      <tr key={t.uid}>
                        <td className="text-muted small">{idx + 1}</td>
                        <td>
                          <div className="d-flex align-items-start gap-2 flex-wrap">
                            <div>
                              <strong>{t.title}</strong>
                              {t.kpi_name && (
                                <div className="small text-muted mt-1">
                                  <i className="bx bx-target-lock me-1"></i>{t.kpi_name}
                                </div>
                              )}
                              <div className="mt-1 d-flex align-items-center gap-2 flex-wrap">
                                <span className={`badge ${t.kpi_source_type === "DIRECT" ? "bg-label-primary" : "bg-label-info"}`}>
                                  {t.kpi_source_type === "DIRECT" ? "Direct KPI" : "Activity-Driven KPI"}
                                </span>
                                {t.kpi_actual_uid ? (
                                  <span className="small text-success">
                                    <i className="bx bx-check-circle me-1"></i>Actual recorded
                                  </span>
                                ) : (
                                  <span className="small text-danger">
                                    <i className="bx bx-error-circle me-1"></i>No actual yet
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted small">{t.objective_title || "—"}</td>
                        <td>
                          {t.kpi_planned_value != null
                            ? <><strong>{t.kpi_planned_value}</strong> <span className="text-muted small">{t.kpi_unit || ""}</span></>
                            : "—"}
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="form-control form-control-sm"
                            placeholder="Enter annual actual…"
                            value={t.kpi_actual_value}
                            onChange={(e) => handleChangeActual(t.uid, e.target.value)}
                            disabled={!canMutateKpiActual}
                            title={!canMutateKpiActual ? "No permission to edit KPI actuals" : undefined}
                          />
                        </td>
                        <td>
                          {pct != null ? (
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="progress flex-grow-1"
                                style={{ height: "6px" }}
                                title={`${pct.toFixed(1)}%`}
                              >
                                <div
                                  className={`progress-bar ${pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger"}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className={`small ${percentColor(pct)}`}>
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td className="text-end">
                          {canMutateKpiActual ? (
                          <button
                            type="button"
                            className={`btn btn-sm ${t.kpi_actual_uid ? "btn-outline-primary" : "btn-primary"}`}
                            onClick={() => handleSave(t)}
                            disabled={isSaving || !t.kpi_actual_value}
                          >
                            {isSaving ? (
                              <span className="spinner-border spinner-border-sm" />
                            ) : t.kpi_actual_uid ? (
                              <><i className="bx bx-save me-1"></i>Update</>
                            ) : (
                              <><i className="bx bx-save me-1"></i>Save</>
                            )}
                          </button>
                          ) : (
                            <span className="text-muted small">View only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default KpiActualsPage;
