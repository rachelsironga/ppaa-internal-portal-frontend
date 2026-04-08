import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";

export const AuditLogPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();

  const getActionBadgeClass = (action) => {
    switch (action) {
      case "CREATE":
        return "bg-label-success";
      case "UPDATE":
        return "bg-label-primary";
      case "DELETE":
        return "bg-label-danger";
      case "VIEW":
        return "bg-label-info";
      case "DOWNLOAD":
        return "bg-label-warning";
      case "LOGIN":
        return "bg-label-success";
      case "LOGOUT":
        return "bg-label-secondary";
      default:
        return "bg-label-secondary";
    }
  };

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "System Logs"]} />
      <PaginatedTable
        fetchPath="/internal-portal/audit-logs"
        title="System Logs (Audit Logs)"
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
                {row.action}
              </span>
            ),
          },
          {
            key: "model_name",
            label: "Model",
            style: { width: "150px" },
            render: (row) => (
              <span className="text-bold">{row.model_name || "-"}</span>
            ),
          },
          {
            key: "object_repr",
            label: "Object",
            style: { maxWidth: "300px" },
            render: (row) => (
              <span className="text-truncate d-inline-block" style={{ maxWidth: "300px" }}>
                {row.object_repr || row.object_id || "-"}
              </span>
            ),
          },
          {
            key: "user",
            label: "User",
            style: { width: "200px" },
            render: (row) => (
              <div className="d-flex flex-column">
                <span className="fw-medium">
                  {row.user
                    ? `${row.user.first_name || ""} ${row.user.last_name || ""}`.trim() || row.user.username
                    : "System"}
                </span>
                {row.user && (
                  <small className="text-muted">{row.user.email || row.user.username}</small>
                )}
              </div>
            ),
          },
          {
            key: "department",
            label: "Department",
            style: { width: "150px" },
            render: (row) => (
              <span>{row.department?.name || "-"}</span>
            ),
          },
          {
            key: "ip_address",
            label: "IP Address",
            style: { width: "130px" },
            render: (row) => (
              <span className="text-muted">{row.ip_address || "-"}</span>
            ),
          },
          {
            key: "created_at",
            label: "Date & Time",
            style: { width: "180px" },
            className: "text-center",
            render: (row) => (
              <span className="text-purple">
                {formatDate(row.created_at, "DD/MM/YYYY HH:mm:ss") || "-"}
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
                onClick={() => {
                  navigate(
                    `/ppaa-internal-portal/audit-logs/open/${row.uid}`
                  );
                }}
              >
                <i className="bx bx-show"></i>&nbsp; View
              </button>
            ),
          },
        ]}
        filters={[
          { value: "ALL", label: "All Actions" },
          { value: "CREATE", label: "Create" },
          { value: "UPDATE", label: "Update" },
          { value: "DELETE", label: "Delete" },
          { value: "VIEW", label: "View" },
          { value: "DOWNLOAD", label: "Download" },
          { value: "LOGIN", label: "Login" },
          { value: "LOGOUT", label: "Logout" },
        ]}
        filterSelected={["ALL"]}
        onSelect={(row) => {
          setSelectedObj(row);
        }}
        isRefresh={tableRefresh}
      />
    </>
  );
};

