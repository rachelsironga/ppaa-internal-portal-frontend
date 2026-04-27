import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { spismCan } from "../../../../utils/spismPermissions";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import ActivityModal from "./Modal";
import { formatDate } from "../../../../helpers/DateFormater";

const STATUS_BADGE = {
  DRAFT: "bg-label-secondary",
  PENDING: "bg-label-warning",
  APPROVED: "bg-label-success",
  RETURNED: "bg-label-danger",
};

export const ActivityPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const canAddActivity = spismCan(user, "can_add_spism_activity");
  const [tableRefresh, setTableRefresh] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedActivity?.uid) return;
    const el = document.getElementById("activityModal");
    if (!el) return;
    window.bootstrap?.Modal?.getOrCreateInstance(el).show();
  }, [selectedActivity?.uid]);

  return (
    <>
      <BreadCumb pageList={["SPISM", "Activities"]} />
      <div className="alert alert-info border-0 mb-3 shadow-sm d-flex align-items-start gap-2" role="status">
        <span className="avatar avatar-sm flex-shrink-0 mt-1">
          <span className="avatar-initial rounded bg-info">
            <i className="bx bx-info-circle bx-sm"></i>
          </span>
        </span>
        <div className="flex-grow-1 small">
          <strong className="d-block mb-1">Activities under approved targets</strong>
          <p className="mb-0 text-body">
            Activities can be added only for <strong>approved</strong> targets and objectives. Use the hierarchical workflow: approve the objective and target first, then add activities.
          </p>
        </div>
      </div>
      <PaginatedTable
        fetchPath="/performance-dashboard/activities"
        title="Activities Management"
        buttons={
          canAddActivity
            ? [
                {
                  label: "Add Activity",
                  render: () => (
                    <button
                      type="button"
                      className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                      data-bs-toggle="modal"
                      data-bs-target="#activityModal"
                      onClick={() => setSelectedActivity(null)}
                    >
                      <i className="bx bx-plus me-1"></i> Add Activity
                    </button>
                  ),
                },
              ]
            : []
        }
        onSelect={(row) => setSelectedActivity(row)}
        columns={[
          { key: "SN", label: "SN", style: { width: "80px" }, className: "text-center" },
          {
            key: "title",
            label: "Activity",
            style: { minWidth: "260px" },
            render: (row) => {
              const fullTitle = row.title != null ? String(row.title).trim() : "";
              const weight = row.weight != null ? `${row.weight}%` : null;
              const targetTitle = row.target_title || "";
              const fy = row.planned_financial_year || "";
              const quarters = Array.isArray(row.planned_quarters) && row.planned_quarters.length > 0
                ? row.planned_quarters
                : row.planned_quarter != null ? [row.planned_quarter] : [];
              const qLabel = quarters.length === 4 ? "All quarters" : quarters.length > 0 ? quarters.map((q) => `Q${q}`).join(", ") : "";
              const plannedPeriod = fy && qLabel ? `${fy} ${qLabel}` : fy || qLabel || null;
              return (
                <div
                  className="cursor-pointer py-1"
                  onClick={() => navigate(`/performance-dashboard/activities/open/${row.uid}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/performance-dashboard/activities/open/${row.uid}`);
                    }
                  }}
                >
                  <div className="fw-semibold text-body mb-1 text-break">
                    {fullTitle || "—"}
                  </div>
                  <div className="d-flex align-items-center gap-2 flex-wrap small">
                    {targetTitle && (
                      <span className="badge bg-label-primary text-primary px-2 py-1">
                        <i className="bx bx-bullseye me-1" style={{ fontSize: "0.75rem" }}></i>
                        {targetTitle.length > 40 ? `${targetTitle.substring(0, 40)}...` : targetTitle}
                      </span>
                    )}
                    {weight != null && (
                      <span className="badge bg-label-warning text-warning px-2 py-1">
                        <i className="bx bx-pie-chart-alt me-1" style={{ fontSize: "0.75rem" }}></i>
                        {weight}
                      </span>
                    )}
                    {plannedPeriod && (
                      <span className="badge bg-label-info text-info px-2 py-1">
                        <i className="bx bx-calendar me-1" style={{ fontSize: "0.75rem" }}></i>
                        {plannedPeriod}
                      </span>
                    )}
                  </div>
                </div>
              );
            },
          },
          {
            key: "planned_value_label",
            label: "Planned value",
            style: { width: "140px" },
            render: (row) => {
              const val = row.planned_value != null ? String(row.planned_value) : "";
              const label = row.planned_value_label || "";
              return label ? `${val ? val + " " : ""}${label}` : (val || "—");
            },
          },
          {
            key: "status",
            label: "Status",
            style: { width: "120px" },
            className: "text-center",
            render: (row) => (
              <span className={`badge ${STATUS_BADGE[row.status] || "bg-label-secondary"} me-1`}>
                {row.status || "—"}
              </span>
            ),
          },
          {
            key: "created_at",
            label: "Created",
            style: { width: "150px" },
            className: "text-center",
            render: (row) => (
              <span className="text-purple">
                {formatDate(row.created_at, "DD/MM/YYYY HH:mm") || "—"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-center",
            style: { width: "120px" },
            render: (row) => (
              <div className="d-flex flex-nowrap align-items-center justify-content-center gap-1">
                {/* <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedActivity(row);
                  }}
                  title="Edit activity"
                >
                  <i className="bx bx-edit"></i>
                </button> */}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary flex-shrink-0"
                  onClick={() => navigate(`/performance-dashboard/activities/open/${row.uid}`)}
                  title="View details"
                >
                  <i className="bx bx-show"></i>&nbsp; View
                </button>
              </div>
            ),
          },
        ]}
        isRefresh={tableRefresh}
      />
      <ActivityModal
        modalId="activityModal"
        selectedActivity={selectedActivity}
        setSelectedActivity={setSelectedActivity}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};
