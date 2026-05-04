import React from "react";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";

const getActionBadgeClass = (action) => {
  const a = (action || "").toUpperCase();
  switch (a) {
    case "APPROVE":
      return "bg-label-success";
    case "RETURN":
      return "bg-label-danger";
    case "COMMENT":
      return "bg-label-info";
    default:
      return "bg-label-secondary";
  }
};

export const AuditLogsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <BreadCumb pageList={["SPISM", "Audit & Logs"]} />
      <PaginatedTable
        fetchPath="/performance-dashboard/audit-logs"
        title="Performance Audit Trail"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "action",
            label: "Action",
            style: { width: "120px" },
            className: "text-center",
            render: (row) => (
              <span className={`badge ${getActionBadgeClass(row.action)} me-1`}>
                {(row.action || "").toUpperCase()}
              </span>
            ),
          },
          {
            key: "model_name",
            label: "Model",
            style: { width: "150px" },
            render: (row) => (
              <span className="text-bold">
                {row.model_name || (row.entity_type ? row.entity_type.toUpperCase() : "-")}
              </span>
            ),
          },
          {
            key: "object_repr",
            label: "Object",
            style: { maxWidth: "300px" },
            render: (row) => (
              <span className="text-truncate d-inline-block" style={{ maxWidth: "300px" }}>
                {row.object_repr || row.entity_id || "-"}
              </span>
            ),
          },
          {
            key: "user_name",
            label: "User",
            style: { width: "200px" },
            render: (row) => (
              <span className="fw-medium">
                {row.user_name || "System"}
              </span>
            ),
          },
          {
            key: "ip_address",
            label: "IP Address",
            style: { width: "130px" },
            render: (row) => (
              <span className="text-muted">
                {row.ip_address || "-"}
              </span>
            ),
          },
          {
            key: "timestamp",
            label: "Date & Time",
            style: { width: "180px" },
            className: "text-center",
            render: (row) => (
              <span className="text-purple">
                {formatDate(row.timestamp, "DD/MM/YYYY HH:mm:ss") || "-"}
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
                onClick={() => navigate(`/performance-dashboard/audit-logs/open/${row.uid}`)}
              >
                <i className="bx bx-show"></i>&nbsp; View
              </button>
            ),
          },
        ]}
        filters={[
          { value: "ALL", label: "All actions" },
          { value: "approve", label: "Approvals" },
          { value: "return", label: "Returns" },
          { value: "comment", label: "Comments" },
        ]}
        filterSelected={["ALL"]}
        isRefresh={0}
      />
    </>
  );
};
