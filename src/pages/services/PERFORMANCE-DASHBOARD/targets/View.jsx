import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import TargetModal from "./Modal";
import { formatDate } from "../../../../helpers/DateFormater";
import { getFinancialYears } from "../Queries";
import { spismCan } from "../../../../utils/spismPermissions";

const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12
  // SPISM financial year assumed July–June, e.g. 2025/2026
  if (month >= 7) return `${year}/${year + 1}`;
  return `${year - 1}/${year}`;
};

const STATUS_BADGE = {
  DRAFT: "bg-label-secondary",
  PENDING: "bg-label-warning",
  APPROVED: "bg-label-success",
  RETURNED: "bg-label-danger",
};

export const TargetPage = () => {
  const [tableRefresh, setTableRefresh] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [addWithObjective, setAddWithObjective] = useState(null);
  const [financialYears, setFinancialYears] = useState([]);
  const [financialYearsLoading, setFinancialYearsLoading] = useState(true);
  const [defaultFinancialYear, setDefaultFinancialYear] = useState(getCurrentFinancialYear());
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.userReducer?.data);
  const canAddTarget = spismCan(user, "can_add_spism_target");
  const currentFinancialYear = getCurrentFinancialYear();

  useEffect(() => {
    const loadFinancialYears = async () => {
      setFinancialYearsLoading(true);
      try {
        const res = await getFinancialYears();
        const list = res?.data ?? res?.results ?? res ?? [];
        const normalized = Array.isArray(list) ? list : [];
        setFinancialYears(normalized);

        // Prefetch should be for current FY first; fallback to first configured FY.
        const match = normalized.find((fy) => fy?.name === currentFinancialYear);
        setDefaultFinancialYear(match?.name || normalized[0]?.name || currentFinancialYear);
      } catch {
        setFinancialYears([]);
        setDefaultFinancialYear(currentFinancialYear);
      } finally {
        setFinancialYearsLoading(false);
      }
    };
    loadFinancialYears();
  }, []);

  useEffect(() => {
    const state = location.state;
    const uid = state?.objective_uid;
    const title = state?.objective_title;
    if (uid) {
      setAddWithObjective({ uid, title: title || "" });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.objective_uid]);

  useEffect(() => {
    if (!addWithObjective?.uid) return;
    const el = document.getElementById("targetModal");
    if (!el) return;
    window.bootstrap?.Modal?.getOrCreateInstance(el).show();
  }, [addWithObjective?.uid]);

  useEffect(() => {
    if (!selectedTarget?.uid) return;
    const el = document.getElementById("targetModal");
    if (!el) return;
    window.bootstrap?.Modal?.getOrCreateInstance(el).show();
  }, [selectedTarget?.uid]);

  return (
    <>
      <BreadCumb pageList={["SPISM", "Targets"]} />
      {financialYearsLoading ? (
        <div className="card">
          <div className="card-body">Loading targets…</div>
        </div>
      ) : (
        <PaginatedTable
          key={`targets-${defaultFinancialYear}`}
          fetchPath="/performance-dashboard/targets"
          title="Target Management (with KPI)"
          filterSelected={[]}
          buttons={
            canAddTarget
              ? [
                  {
                    label: "Add Target",
                    render: () => (
                      <button
                        type="button"
                        className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                        data-bs-toggle="modal"
                        data-bs-target="#targetModal"
                        onClick={() => {
                          setAddWithObjective(null);
                          setSelectedTarget(null);
                        }}
                      >
                        <i className="bx bx-plus me-1"></i> Add Target
                      </button>
                    ),
                  },
                ]
              : []
          }
          onSelect={(row) => {
            if (!row) return;
            // Approved targets should not be edited; open read-only view instead.
            if (row.status === "APPROVED") {
              navigate(`/performance-dashboard/targets/open/${row.uid}`);
              return;
            }
            setSelectedTarget(row);
          }}
          isRefresh={tableRefresh}
          filterGroups={[
            {
              group: "financial_year",
              label: "Financial Year",
              options: financialYears.map((fy) => ({
                value: fy.name,
                label: fy.name,
              })),
              selected: [defaultFinancialYear],
            },
          ]}
          columns={[
            { key: "SN", label: "SN", style: { width: "40px" }, className: "text-center" },
            {
              key: "title",
              label: "Target & KPI",
              style: { minWidth: "260px" },
              render: (row) => (
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/performance-dashboard/targets/open/${row.uid}`)}
                >
                  <div className="fw-semibold text-body">
                    {row.title && row.title.length > 60
                      ? `${row.title.substring(0, 60)}...`
                      : row.title}
                  </div>
                  <div className="mt-1 d-flex flex-wrap gap-1 small">
                    {row.weight != null && (
                      <span className="badge bg-label-warning">
                        Weight {row.weight}%
                      </span>
                    )}
                    {row.kpi_name && (
                      <span className="badge bg-label-info">
                        KPI:{" "}
                        <span className="fw-semibold">
                          {row.kpi_name.length > 60
                            ? `${row.kpi_name.substring(0, 60)}...`
                            : row.kpi_name}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: "responsible_officer",
              label: "Responsible officer",
              style: { width: "260px" },
              render: (row) => {
                const name =
                  row.responsible_officer_name || row.responsible_officer_label;
                const designation = row.responsible_officer_designation;
                return (
                  <div className="small">
                    <div className="fw-semibold text-body">
                      {name || "Not assigned"}
                    </div>
                    {designation ? (
                      <div className="text-muted mt-1">{designation}</div>
                    ) : null}
                  </div>
                );
              },
            },
            {
              key: "status",
              label: "Status",
              style: { width: "110px" },
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
              style: { width: "140px" },
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
              style: { width: "100px", minWidth: "100px" },
              className: "text-center",
              render: (row) => (
                <div className="d-flex flex-nowrap align-items-center justify-content-center gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary flex-shrink-0"
                    onClick={() => navigate(`/performance-dashboard/targets/open/${row.uid}`)}
                    title="View details"
                  >
                    <i className="bx bx-show"></i>
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}
      <TargetModal
        modalId="targetModal"
        selectedTarget={selectedTarget}
        setSelectedTarget={setSelectedTarget}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
        preselectedObjectiveUid={addWithObjective?.uid}
        preselectedObjectiveTitle={addWithObjective?.title}
        onSuccess={() => setAddWithObjective(null)}
      />
    </>
  );
};
