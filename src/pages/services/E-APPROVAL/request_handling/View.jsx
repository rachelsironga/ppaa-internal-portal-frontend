import React, { useState, useEffect } from "react";
import "animate.css";
import { PageContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import RequestHandlingModal from "./Modal";
import { formatDate } from "../../../../helpers/DateFormater";

export const RequestHandlingPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();

  return (
    <PageContext.Provider
      value={{
        selectedObj,
        setSelectedObj,
        tableRefresh,
        setTableRefresh,
      }}
    >
      <BreadCumb pageList={["Settings", "Approval Request Handling"]} />
      <PaginatedTable
        fetchPath="/approval-request-handler"
        title="List of Approval Request into Handling Stage"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "created_at",
            label: "Approved Date",
            style: { width: "150px" },
            className: "text-right",
            render: (row) => (
              <span className="text-purple">
                {formatDate(row.created_at, "DD/MM/YYYY HH:mm:ss") || "-"}
              </span>
            ),
          },
          {
            key: "requester_name",
            label: "Requested by",
            className: "cursor-pointer text-bold",
            width: { width: "120px" },
            render: (row) => (
              <span className="text-heading text-truncate">
                <span className="fw-medium">
                  {row?.approval_request?.created_by?.first_name}{" "}
                  {row?.approval_request?.created_by?.middle_name}{" "}
                  {row?.approval_request?.created_by?.last_name}
                </span>
              </span>
            ),
          },
          {
            key: "title",
            label: "Request Title",
            className: "text-justify",
            render: (row) => {
              const text = String(row?.approval_request?.title || "");
              return text.length > 50 ? text.slice(0, 50) + "..." : text;
            },
          },
          {
            key: "type",
            label: "Request Types",
            className: "text-justify",
            style: { width: "100px" },
            render: (row) => {
              return `${row?.approval_request?.type}`.replaceAll("_", " ");
            },
          },
          {
            key: "status_request",
            label: "Status",
            style: { width: "150px", textAlign: "center" },
            render: (row) => (
              <div>
                <span
                  className={
                    row?.approval_request?.status === "NEW"
                      ? "badge bg-label-primary me-1"
                      : row?.approval_request?.status === "PENDING"
                      ? "badge bg-label-warning me-1"
                      : row?.approval_request?.status === "REJECTED" ||
                        row?.approval_request?.status === "CANCELLED" ||
                        row?.approval_request?.status === "EXPIRED"
                      ? "badge bg-label-danger me-1"
                      : row?.approval_request?.status === "APPROVED"
                      ? "badge bg-label-success me-1"
                      : "badge bg-label-info me-1"
                  }
                >
                  {row?.approval_request?.status}
                </span>
                {row?.approval_request?.is_handled === true && (
                  <span className="badge bg-info text-sm mt-1">
                    <small>complete</small>
                  </span>
                )}
              </div>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-center",
            style: { width: "120px" },
            render: (row) => (
              <button
                aria-label="Click me"
                type="button"
                className="btn p-0 dropdown-toggle hide-arrow text-info"
                data-bs-toggle="dropdown"
                onClick={() => {
                  navigate(`/requests/open/${row?.approval_request?.uid}`);
                }}
              >
                <i className="bx bx-link-external"></i>&nbsp; View
              </button>
            ),
          },
        ]}
        filters={[
          { value: "ALL", label: "All TASK" },
          { value: "PENDING", label: "PENDING" },
          { value: "DONE", label: "DONE" },
          { value: "POSTPONED", label: "POSTPONED" },
        ]}
        isRefresh={tableRefresh}
      />
      <RequestHandlingModal />
    </PageContext.Provider>
  );
};
