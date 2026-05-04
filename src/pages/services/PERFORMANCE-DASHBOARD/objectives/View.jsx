import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { spismCan } from "../../../../utils/spismPermissions";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import ObjectiveModal from "./Modal";
import { formatDate } from "../../../../helpers/DateFormater";

const STATUS_BADGE = {
  DRAFT: "bg-label-secondary",
  PENDING: "bg-label-warning",
  APPROVED: "bg-label-success",
  RETURNED: "bg-label-danger",
};

export const ObjectivePage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const canAddObjective = spismCan(user, "can_add_spism_objective");
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();

  return (
    <>
      <BreadCumb pageList={["SPISM", "Objectives"]} />
      <div className="alert alert-info border-0 mb-3 shadow-sm d-flex align-items-start gap-2" role="status">
        <span className="avatar avatar-sm flex-shrink-0 mt-1">
          <span className="avatar-initial rounded bg-info">
            <i className="bx bx-info-circle bx-sm"></i>
          </span>
        </span>
        <div className="flex-grow-1 small">
          <strong className="d-block mb-1">Structured hierarchical workflow</strong>
          <p className="mb-0 text-body">
            Create objectives and add targets, then submit as one package. Approvers approve the objective first, then each target. Activities can be added only after the target and objective are approved.
          </p>
        </div>
      </div>
      <PaginatedTable
        fetchPath="/performance-dashboard/objectives"
        title="Objectives Management"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "title",
            label: "Objective",
            style: { minWidth: "220px" },
            render: (row) => {
              const weight = row.weight != null ? `${row.weight}%` : null;
              const targetCount = row.targets_count ?? 0;
              return (
                <div
                  className="cursor-pointer py-1"
                  onClick={() =>
                    navigate(`/performance-dashboard/objectives/open/${row.uid}`)
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/performance-dashboard/objectives/open/${row.uid}`);
                    }
                  }}
                >
                  <div className="fw-semibold text-body mb-1">{row.title}</div>
                  <div className="d-flex align-items-center gap-2 flex-wrap small">
                    {weight != null && (
                      <span className="badge bg-label-warning text-warning px-2 py-1">
                        <i className="bx bx-pie-chart-alt me-1" style={{ fontSize: "0.75rem" }}></i>
                        {weight} weight
                      </span>
                    )}
                    <span className="badge bg-label-primary text-primary px-2 py-1">
                      <i className="bx bx-list-ul me-1" style={{ fontSize: "0.75rem" }}></i>
                      {targetCount} target{targetCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              );
            },
          },
          {
            key: "financial_year",
            label: "Financial Year",
            style: { width: "130px" },
            className: "text-center",
            render: (row) => row.financial_year || "—",
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
              <button
                className="btn btn-sm btn-outline-primary text-center"
                onClick={() =>
                  navigate(`/performance-dashboard/objectives/open/${row.uid}`)
                }
              >
                <i className="bx bx-show"></i>&nbsp; View
              </button>
            ),
          },
        ]}
        buttons={
          canAddObjective
            ? [
                {
                  label: "Add Objective",
                  render: () => (
                    <button
                      type="button"
                      className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                      data-bs-toggle="modal"
                      data-bs-target="#objectiveModal"
                      onClick={() => setSelectedObj(null)}
                    >
                      <i className="bx bx-plus me-1"></i> Add Objective
                    </button>
                  ),
                },
              ]
            : []
        }
        onSelect={(row) => setSelectedObj(row)}
        isRefresh={tableRefresh}
      />
      <ObjectiveModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};
