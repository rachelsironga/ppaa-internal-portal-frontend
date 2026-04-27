import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getPendingApprovals } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReturnCommentModal from "./Modal";
import { ActivityPlanningContext } from "../ActivityPlanningContext";

const STATUS_BADGE = {
  DRAFT: "bg-label-secondary",
  PENDING: "bg-label-warning",
  APPROVED: "bg-label-success",
  RETURNED: "bg-label-danger",
};

const RETURNED_STATUS = "RETURNED";

export const ReturnedView = () => {
  const [financialYear, setFinancialYear] = useState("");
  const [entityType, setEntityType] = useState("");
  const [data, setData] = useState({ objectives: [], targets: [], activities: [] });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();

  const fetchReturned = async () => {
    setLoading(true);
    try {
      const res = await getPendingApprovals({
        entity_type: entityType,
        status: RETURNED_STATUS,
        financial_year: financialYear,
      });
      const payload = res?.data?.data ?? res?.data ?? res;
      if (payload && (payload.objectives || payload.targets || payload.activities)) {
        setData({
          objectives: payload.objectives || [],
          targets: payload.targets || [],
          activities: payload.activities || [],
        });
      } else {
        setData({ objectives: [], targets: [], activities: [] });
      }
    } catch (e) {
      showToast("Failed to load returned items", "warning", "Error");
      setData({ objectives: [], targets: [], activities: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturned();
  }, [financialYear, entityType]);

  const openReturnCommentModal = (item, type) => {
    setSelectedItem({
      type,
      title: item.title,
      approval_comment: item.approval_comment,
    });
  };

  useEffect(() => {
    if (!selectedItem) return;
    const el = document.getElementById("returnCommentModal");
    if (el) window.bootstrap?.Modal?.getOrCreateInstance(el)?.show();
  }, [selectedItem]);

  const totalReturned =
    data.objectives.length + data.targets.length + data.activities.length;

  return (
    <>
      <BreadCumb pageList={["SPISM", "Returned Items"]} />
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-undo me-2 text-warning"></i>
            Returned Items — Review comments and revise
          </h5>
        </div>
        <div className="card-body">
          <div className="alert alert-warning mb-3">
            <strong><i className="bx bx-message-square-detail me-2"></i>Items returned by ES</strong>
            <p className="mb-0 mt-1 small">
              These objectives, targets, or activities were returned for revision. Open the return comment to see what to fix, then go to the detail page to edit and resubmit.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <input
              type="text"
              placeholder="Financial Year"
              className="form-control form-control-sm"
              style={{ width: "130px" }}
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
            />
            <select
              className="form-select form-select-sm"
              style={{ width: "160px" }}
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="">All (Objectives, Targets, Activities)</option>
              <option value="objective">Objectives only</option>
              <option value="target">Targets only</option>
              <option value="activity">Activities only</option>
            </select>
            <button type="button" className="btn btn-primary btn-sm" onClick={fetchReturned}>
              Refresh
            </button>
          </div>
          {loading ? (
            <p className="text-muted mb-0">Loading…</p>
          ) : totalReturned === 0 ? (
            <p className="text-muted mb-0">No returned items.</p>
          ) : (
            <>
              {data.objectives.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold text-primary">
                    Objectives
                    <span className="badge bg-label-primary ms-2">{data.objectives.length}</span>
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Objective</th>
                          <th>FY</th>
                          <th className="pe-3 text-end" style={{ minWidth: "100px" }}>Updated</th>
                          <th className="ps-3" style={{ width: "100px", minWidth: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.objectives.map((row) => (
                          <tr key={row.uid}>
                            <td>
                              <span
                                className="text-primary fw-semibold cursor-pointer"
                                onClick={() => navigate(`/performance-dashboard/approval/objectives/${row.uid}`)}
                              >
                                {row.title && row.title.length > 80
                                  ? `${row.title.substring(0, 80)}...`
                                  : row.title}
                              </span>
                              <div className="mt-1 small">
                                {row.weight != null && (
                                  <span className="badge bg-label-warning me-1">Weight {row.weight}%</span>
                                )}
                                {row.status && (
                                  <span className={`badge ${STATUS_BADGE[row.status] || "bg-label-secondary"}`}>
                                    {row.status}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{row.financial_year}</td>
                            <td className="pe-3 text-end">{formatDate(row.updated_at, "DD/MM/YYYY")}</td>
                            <td className="ps-3">
                              <div className="dropdown d-flex justify-content-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-outline-secondary"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  aria-haspopup="true"
                                  title="Actions"
                                >
                                  <i className="bx bx-dots-vertical"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center"
                                      onClick={() => navigate(`/performance-dashboard/approval/objectives/${row.uid}`)}
                                    >
                                      <i className="bx bx-show me-2 text-primary"></i>
                                      View
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center"
                                      onClick={() => openReturnCommentModal(row, "objective")}
                                    >
                                      <i className="bx bx-message-square-detail me-2 text-warning"></i>
                                      View return comment
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {data.targets.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold text-info">
                    Targets
                    <span className="badge bg-label-info ms-2">{data.targets.length}</span>
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle targets-returned-table">
                      <thead>
                        <tr>
                          <th>Target</th>
                          <th className="pe-3 text-end" style={{ minWidth: "100px" }}>Planned value</th>
                          <th className="ps-3" style={{ width: "100px", minWidth: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.targets.map((row) => (
                          <tr key={row.uid}>
                            <td>
                              <span
                                className="text-primary fw-semibold cursor-pointer"
                                onClick={() => navigate(`/performance-dashboard/approval/targets/${row.uid}`)}
                              >
                                {row.title && row.title.length > 80
                                  ? `${row.title.substring(0, 80)}...`
                                  : row.title}
                              </span>
                              <div className="mt-1 small">
                                {row.weight != null && (
                                  <span className="badge bg-label-warning me-1">Weight {row.weight}%</span>
                                )}
                                {row.kpi_name && (
                                  <span className="badge bg-label-info me-1">
                                    KPI:{" "}
                                    <span className="fw-semibold">
                                      {row.kpi_name.length > 50
                                        ? `${row.kpi_name.substring(0, 50)}...`
                                        : row.kpi_name}
                                    </span>
                                  </span>
                                )}
                                {row.objective_title && (
                                  <span className="badge bg-label-secondary">
                                    Obj:{" "}
                                    <span className="fw-semibold">
                                      {row.objective_title.length > 40
                                        ? `${row.objective_title.substring(0, 40)}...`
                                        : row.objective_title}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="pe-3 text-end">
                              {row.planned_value != null
                                ? row.kpi_unit === "%"
                                  ? `${row.planned_value}%`
                                  : String(row.planned_value)
                                : "—"}
                            </td>
                            <td className="ps-3">
                              <div className="dropdown d-flex justify-content-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-outline-secondary"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  aria-haspopup="true"
                                  title="Actions"
                                >
                                  <i className="bx bx-dots-vertical"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center"
                                      onClick={() => navigate(`/performance-dashboard/approval/targets/${row.uid}`)}
                                    >
                                      <i className="bx bx-show me-2 text-primary"></i>
                                      View
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center"
                                      onClick={() => openReturnCommentModal(row, "target")}
                                    >
                                      <i className="bx bx-message-square-detail me-2 text-warning"></i>
                                      View return comment
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {data.activities.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold text-success">
                    Activities
                    <span className="badge bg-label-success ms-2">{data.activities.length}</span>
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th className="pe-3 text-end" style={{ minWidth: "100px" }}>Updated</th>
                          <th className="ps-3" style={{ width: "100px", minWidth: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.activities.map((row) => (
                          <tr key={row.uid}>
                            <td>
                              <span
                                className="text-primary fw-semibold cursor-pointer"
                                onClick={() => navigate(`/performance-dashboard/approval/activities/${row.uid}`)}
                              >
                                {row.title && row.title.length > 80
                                  ? `${row.title.substring(0, 80)}...`
                                  : row.title}
                              </span>
                              {row.approval_comment && (
                                <small className="d-block text-muted mt-1">
                                  {row.approval_comment.length > 100
                                    ? `${row.approval_comment.substring(0, 100)}...`
                                    : row.approval_comment}
                                </small>
                              )}
                              <ActivityPlanningContext row={row} />
                            </td>
                            <td className="pe-3 text-end">{formatDate(row.updated_at, "DD/MM/YYYY")}</td>
                            <td className="ps-3">
                              <div className="dropdown d-flex justify-content-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-icon btn-outline-secondary"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  aria-haspopup="true"
                                  title="Actions"
                                >
                                  <i className="bx bx-dots-vertical"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center"
                                      onClick={() => navigate(`/performance-dashboard/approval/activities/${row.uid}`)}
                                    >
                                      <i className="bx bx-show me-2 text-primary"></i>
                                      View
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      type="button"
                                      className="dropdown-item d-flex align-items-center"
                                      onClick={() => openReturnCommentModal(row, "activity")}
                                    >
                                      <i className="bx bx-message-square-detail me-2 text-warning"></i>
                                      View return comment
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ReturnCommentModal
        modalId="returnCommentModal"
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      <style>{`.targets-returned-table tbody td { padding-top: 0.75rem; padding-bottom: 0.75rem; }`}</style>
    </>
  );
};

export default ReturnedView;
