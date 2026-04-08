import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { spismCan } from "../../../../utils/spismPermissions";
import BreadCumb from "../../../../layouts/BreadCumb";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import {
  getImplementationActivities,
  getImplementationTargets,
  submitActivityImplementation,
  getFinancialYears,
} from "../Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";

const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1–12
  // Assume financial year runs July–June, e.g. 2025/2026
  if (month >= 7) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

const CURRENT_FINANCIAL_YEAR = getCurrentFinancialYear();
const PAGE_SIZE = 10;

const TAB_SUBMIT = "submit";
const TAB_KPI = "kpi";

export const ImplementationPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const canSubmitImplementationHere = spismCan(
    user,
    "can_add_spism_quarterly_data",
    "can_edit_spism_quarterly_data"
  );
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || TAB_SUBMIT;
  const [activeTab, setActiveTab] = useState(
    [TAB_SUBMIT, TAB_KPI].includes(tabFromUrl) ? tabFromUrl : TAB_SUBMIT
  );
  const navigate = useNavigate();
  const [implementationList, setImplementationList] = useState([]);
  const [kpiTargetsList, setKpiTargetsList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingKpiTargets, setLoadingKpiTargets] = useState(false);
  const [financialYear, setFinancialYear] = useState(CURRENT_FINANCIAL_YEAR);
  const [financialYears, setFinancialYears] = useState([]);
  const [loadingFY, setLoadingFY] = useState(false);
  const [submissionFilter, setSubmissionFilter] = useState("all"); // all | pending | submitted
  const [activitySearch, setActivitySearch] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [page, setPage] = useState(1);
  const [kpiPage, setKpiPage] = useState(1);

  const loadFinancialYears = async () => {
    setLoadingFY(true);
    try {
      const res = await getFinancialYears();
      const raw = res?.data ?? res?.results ?? res;
      const list = Array.isArray(raw) ? raw : raw?.data ?? raw?.results ?? [];
      setFinancialYears(Array.isArray(list) ? list : []);
    } catch {
      setFinancialYears([]);
    } finally {
      setLoadingFY(false);
    }
  };

  const loadImplementationActivities = async () => {
    setLoadingList(true);
    try {
      const fy = (financialYear || "").trim();
      const res = await getImplementationActivities(fy);
      const raw = res?.data ?? res?.results ?? res;
      const data = Array.isArray(raw) ? raw : raw?.data ?? raw?.results ?? [];
      setImplementationList(Array.isArray(data) ? data : []);
    } catch {
      setImplementationList([]);
    } finally {
      setLoadingList(false);
    }
  };

  const loadKpiTargets = async () => {
    setLoadingKpiTargets(true);
    try {
      const fy = (financialYear || "").trim();
      const res = await getImplementationTargets(fy);
      const raw = res?.data ?? res?.results ?? res;
      const data = Array.isArray(raw) ? raw : raw?.data ?? raw?.results ?? [];
      setKpiTargetsList(Array.isArray(data) ? data : []);
    } catch {
      setKpiTargetsList([]);
    } finally {
      setLoadingKpiTargets(false);
    }
  };

  useEffect(() => {
    loadFinancialYears();
  }, []);

  useEffect(() => {
    if (activeTab === TAB_SUBMIT) {
      loadImplementationActivities();
    }
  }, [activeTab, financialYear]);

  useEffect(() => {
    if (activeTab === TAB_KPI) {
      loadKpiTargets();
    }
  }, [activeTab, financialYear]);

  useEffect(() => {
    setPage(1);
  }, [financialYear, activitySearch, submissionFilter]);

  useEffect(() => {
    setKpiPage(1);
  }, [financialYear]);

  const filteredImplementationList = implementationList.filter((row) => {
    const term = activitySearch.trim().toLowerCase();
    if (term) {
      const fields = [row.title, row.target_title, row.objective_title];
      const matchesSearch = fields.some((value) =>
        (value || "").toString().toLowerCase().includes(term)
      );
      if (!matchesSearch) return false;
    }
    const submitted = Boolean(row.implementation_submitted_at);
    if (submissionFilter === "pending" && submitted) return false;
    if (submissionFilter === "submitted" && !submitted) return false;
    return true;
  });

  const submittedCount = implementationList.filter((r) => r.implementation_submitted_at).length;
  const pendingCount = implementationList.length - submittedCount;

  const totalActivities = filteredImplementationList.length;
  const totalActivityPages = totalActivities ? Math.ceil(totalActivities / PAGE_SIZE) : 1;
  const currentActivityPage = Math.min(page, totalActivityPages);
  const pagedImplementationList = filteredImplementationList.slice(
    (currentActivityPage - 1) * PAGE_SIZE,
    currentActivityPage * PAGE_SIZE
  );
  const activityStartIndex = totalActivities === 0 ? 0 : (currentActivityPage - 1) * PAGE_SIZE + 1;
  const activityEndIndex = Math.min(totalActivities, currentActivityPage * PAGE_SIZE);

  const totalKpiTargets = kpiTargetsList.length;
  const totalKpiPages = totalKpiTargets ? Math.ceil(totalKpiTargets / PAGE_SIZE) : 1;
  const currentKpiPage = Math.min(kpiPage, totalKpiPages);
  const pagedKpiTargets = kpiTargetsList.slice(
    (currentKpiPage - 1) * PAGE_SIZE,
    currentKpiPage * PAGE_SIZE
  );
  const kpiStartIndex = totalKpiTargets === 0 ? 0 : (currentKpiPage - 1) * PAGE_SIZE + 1;
  const kpiEndIndex = Math.min(totalKpiTargets, currentKpiPage * PAGE_SIZE);

  const handleSubmitImplementation = async (activityUid) => {
    setSubmittingId(activityUid);
    try {
      const result = await submitActivityImplementation(activityUid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Implementation submitted successfully", "success", "Done");
        loadImplementationActivities();
      } else {
        showToast(result?.message || "Submit failed", "warning", "Error");
      }
    } catch (err) {
      showToast("Failed to submit implementation", "danger", "Error");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <>
      <BreadCumb pageList={["SPISM", "Implementation"]} />
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-calendar-check me-2 text-primary"></i>
            Implementation — Submit &amp; Track Activity Implementation
          </h5>
        </div>
        <div className="card-body">
          <p className="text-muted small mb-3">
            Choose the <strong>financial year</strong> to list approved activities for that implementation year (matches each activity&apos;s planned year). Use <strong>Submission</strong> to show only pending or fully submitted rows. Open an activity to submit quarter-by-quarter from the activity detail page.
          </p>
          <Nav tabs className="mb-3">
            <NavItem>
              <NavLink
                className={activeTab === TAB_SUBMIT ? "active" : ""}
                onClick={() => setActiveTab(TAB_SUBMIT)}
                style={{ cursor: "pointer" }}
              >
                <i className="bx bx-check-double me-1" /> Submit implementation
              </NavLink>
            </NavItem>
            {/* <NavItem>
              <NavLink
                className={activeTab === TAB_KPI ? "active" : ""}
                onClick={() => setActiveTab(TAB_KPI)}
                style={{ cursor: "pointer" }}
              >
                <i className="bx bx-trending-up me-1" /> KPI Updates
              </NavLink>
            </NavItem> */}
          </Nav>
          <TabContent activeTab={activeTab}>
            <TabPane tabId={TAB_SUBMIT}>
              <div className="row g-3 align-items-end mb-3">
                <div className="col-sm-auto">
                  <label className="form-label small text-muted mb-1">Financial year</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: "170px" }}
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    disabled={loadingFY}
                  >
                    <option value="">All years</option>
                    {financialYear &&
                      !financialYears.some((fy) => fy.name === financialYear) && (
                        <option value={financialYear}>{financialYear}</option>
                      )}
                    {financialYears.map((fy) => (
                      <option key={fy.uid} value={fy.name}>
                        {fy.name}
                        {fy.name === CURRENT_FINANCIAL_YEAR ? " (current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-sm-auto">
                  <label className="form-label small text-muted mb-1">Submission</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: "160px" }}
                    value={submissionFilter}
                    onChange={(e) => setSubmissionFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending submission</option>
                    <option value="submitted">Fully submitted</option>
                  </select>
                </div>
                <div className="col-sm">
                  <label className="form-label small text-muted mb-1">Search</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Activity, target, or objective…"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                  />
                </div>
                <div className="col-sm-auto d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={loadImplementationActivities}
                    disabled={loadingList}
                  >
                    <i className="bx bx-refresh me-1" />
                    Refresh
                  </button>
                </div>
              </div>
              <div className="alert alert-light border py-2 px-3 small mb-3 d-flex flex-wrap align-items-center gap-2">
                <span>
                  <i className="bx bx-filter-alt me-1 text-primary" />
                  <strong>View:</strong>{" "}
                  {financialYear.trim()
                    ? <>Financial year <strong>{financialYear.trim()}</strong></>
                    : <><strong>All</strong> financial years</>}
                </span>
                <span className="text-muted">·</span>
                <span>
                  Today&apos;s FY: <strong>{CURRENT_FINANCIAL_YEAR}</strong>
                </span>
                <span className="text-muted">·</span>
                <span>
                  In this list: <span className="text-success">{submittedCount} submitted</span>
                  {", "}
                  <span className="text-warning">{pendingCount} pending</span>
                </span>
              </div>
              {loadingList ? (
                <div className="text-center py-4">
                  <ReactLoading type="cylon" color="#696cff" height={36} width={60} />
                  <p className="text-muted small mt-2 mb-0">Loading approved activities...</p>
                </div>
              ) : filteredImplementationList.length === 0 ? (
                <p className="text-muted mb-0">
                  No activities match this financial year, submission filter, or search. Approve activities first, then select the correct year or try &quot;All years&quot;.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Activity</th>
                        <th>Target / Objective</th>
                        <th>Quarterly data</th>
                        <th>Documents</th>
                        <th>Submitted</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedImplementationList.map((row) => {
                        const canSubmit = row.quarterly_data_count > 0 || row.documents_count > 0;
                        return (
                        <tr key={row.uid}>
                          <td>
                            <strong>{row.title}</strong>
                            {row.weight != null && (
                              <span className="badge bg-label-warning ms-1">{row.weight}%</span>
                            )}
                            {row.planned_financial_year && (
                              <div className="small text-muted mt-1">
                                <i className="bx bx-calendar me-1" />
                                FY {row.planned_financial_year}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="text-primary">{row.target_title}</span>
                            {row.objective_title && (
                              <small className="text-muted d-block">{row.objective_title}</small>
                            )}
                          </td>
                          <td>
                            {row.quarterly_data_count > 0 ? (
                              <span className="badge bg-label-success">{row.quarterly_data_count}</span>
                            ) : (
                              <span className="badge bg-label-secondary">0</span>
                            )}
                          </td>
                          <td>
                            {row.documents_count > 0 ? (
                              <span className="badge bg-label-success">{row.documents_count}</span>
                            ) : (
                              <span className="badge bg-label-secondary">0</span>
                            )}
                          </td>
                          <td>
                            {row.implementation_submitted_at ? (
                              <div className="d-flex flex-column gap-1">
                                <span className="badge bg-success align-self-start">
                                  <i className="bx bx-check-double me-1" />
                                  Submitted
                                </span>
                                <small className="text-success">
                                  {formatDate(row.implementation_submitted_at, "DD/MM/YYYY HH:mm")}
                                </small>
                              </div>
                            ) : (
                              <span className="badge bg-label-warning text-warning">Pending</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() => navigate(`/performance-dashboard/activities/open/${row.uid}`)}
                              >
                                Open
                              </button>
                              {!row.implementation_submitted_at && canSubmitImplementationHere && (
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={() => handleSubmitImplementation(row.uid)}
                                  disabled={submittingId === row.uid || !canSubmit}
                                >
                                  {submittingId === row.uid ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                                      Submitting...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bx bx-check-double me-1"></i>
                                      Submit implementation
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                  {totalActivities > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                      <small className="text-muted">
                        Showing {activityStartIndex}–{activityEndIndex} of {totalActivities}
                      </small>
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={currentActivityPage <= 1}
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        >
                          Previous
                        </button>
                        <button type="button" className="btn btn-outline-secondary disabled">
                          Page {currentActivityPage} of {totalActivityPages}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={currentActivityPage >= totalActivityPages}
                          onClick={() => setPage((prev) => Math.min(totalActivityPages, prev + 1))}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabPane>
            <TabPane tabId={TAB_KPI}>
              <p className="text-muted mb-3">
                Add KPI actual values per target. Open a target below to add or edit KPI actuals for the reporting period.
              </p>
              <div className="mb-3 d-flex align-items-end gap-3 flex-wrap">
                <div>
                  <label className="form-label small text-muted mb-1">Financial year</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ minWidth: "170px" }}
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                    disabled={loadingFY}
                  >
                    <option value="">All years</option>
                    {financialYear &&
                      !financialYears.some((fy) => fy.name === financialYear) && (
                        <option value={financialYear}>{financialYear}</option>
                      )}
                    {financialYears.map((fy) => (
                      <option key={fy.uid} value={fy.name}>
                        {fy.name}
                        {fy.name === CURRENT_FINANCIAL_YEAR ? " (current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={loadKpiTargets}
                  disabled={loadingKpiTargets}
                >
                  <i className="bx bx-refresh me-1" />
                  Refresh
                </button>
              </div>
              {loadingKpiTargets ? (
                <div className="text-center py-4">
                  <ReactLoading type="cylon" color="#696cff" height={36} width={60} />
                  <p className="text-muted small mt-2 mb-0">Loading approved targets...</p>
                </div>
              ) : kpiTargetsList.length === 0 ? (
                <p className="text-muted mb-0">
                  No approved targets found. Approve targets first, then they will appear here to add KPI actuals.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Target</th>
                        <th>Objective</th>
                        <th>KPI name</th>
                        <th>KPI actuals</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedKpiTargets.map((row) => (
                        <tr key={row.uid}>
                          <td>
                            <strong>{row.title}</strong>
                          </td>
                          <td>
                            <span className="text-primary">{row.objective_title ?? "—"}</span>
                          </td>
                          <td>
                            {row.kpi_name ? (
                              <>
                                <span>{row.kpi_name}</span>
                                {row.kpi_planned_value != null && (
                                  <small className="text-muted d-block">
                                    Planned: {row.kpi_planned_value} {row.kpi_unit ?? ""}
                                  </small>
                                )}
                              </>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            {row.kpi_actuals_count > 0 ? (
                              <span className="badge bg-label-success">{row.kpi_actuals_count}</span>
                            ) : (
                              <span className="badge bg-label-secondary">0</span>
                            )}
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => navigate(`/performance-dashboard/targets/open/${row.uid}`)}
                            >
                              Open to add KPI actuals
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalKpiTargets > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
                      <small className="text-muted">
                        Showing {kpiStartIndex}–{kpiEndIndex} of {totalKpiTargets}
                      </small>
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={currentKpiPage <= 1}
                          onClick={() => setKpiPage((prev) => Math.max(1, prev - 1))}
                        >
                          Previous
                        </button>
                        <button type="button" className="btn btn-outline-secondary disabled">
                          Page {currentKpiPage} of {totalKpiPages}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={currentKpiPage >= totalKpiPages}
                          onClick={() => setKpiPage((prev) => Math.min(totalKpiPages, prev + 1))}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabPane>
          </TabContent>
        </div>
      </div>
    </>
  );
};
