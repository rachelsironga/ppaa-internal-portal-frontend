import React, { useState, useEffect } from "react";
import "animate.css";
import { ApprovalRequestsContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import ApprovalRequestModal from "./Modal";
import { FileImportModal } from "../positional_level/ImportModal";

export const ApprovalRequestPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();

  return (
    <ApprovalRequestsContext.Provider
      value={{
        selectedObj,
        setSelectedObj,
        tableRefresh,
        setTableRefresh,
      }}
    >
      <BreadCumb pageList={["Requests"]} />
      <PaginatedTable
        fetchPath="/approval-request"
        title="List of System  Approval Requests"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "created_at",
            label: "Request Date",
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
          },
          {
            key: "title",
            label: "Request Title",
            className: "text-justify",
            render: (row) => {
              const text = String(row.title || "");
              return text.length > 50 ? text.slice(0, 50) + "..." : text;
            },
          },
          {
            key: "type",
            label: "Request Types",
            className: "text-justify",
            style: { width: "100px" },
            render: (row) => {
              return `${row.type}`.replaceAll("_", " ");
            },
          },
          {
            key: "status",
            label: "Status",
            style: { width: "150px", textAlign: "center" },
            render: (row) => (
              <div>
                <span
                  className={
                    row.status === "NEW"
                      ? "badge bg-label-primary me-1"
                      : row.status === "PENDING"
                      ? "badge bg-label-warning me-1"
                      : row.status === "REJECTED" ||
                        row.status === "CANCELLED" ||
                        row.status === "EXPIRED"
                      ? "badge bg-label-danger me-1"
                      : row.status === "APPROVED"
                      ? "badge bg-label-success me-1"
                      : "badge bg-label-info me-1"
                  }
                >
                  {row.status}
                </span>
                {row.is_handled === true && (
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
                  navigate(`/requests/open/${row.uid}`);
                }}
              >
                <i className="bx bx-link-external"></i>&nbsp; View
              </button>
            ),
          },
        ]}
        buttons={[
          {
            label: "Add System Roles",
            render: () => (
              <button
                aria-label="Click me"
                type="button"
                className="btn btn-primary ms-auto btn-sm   animate__animated animate__fadeInRight animate__slow me-1"
                data-bs-toggle="modal"
                data-bs-target="#viewCreateRequestModal"
              >
                <i className="bx bx-edit-alt me-1"></i> Add New Request
              </button>
            ),
          },
        ]}
        isRefresh={tableRefresh}
        filters={[
          { value: "ALL", label: "All Request" },
          { value: "MY_REQUEST", label: "My Requests" },
          { value: "RELATED", label: "Approval Requests" },
          { value: "NEW", label: "New" },
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
        ]}
        filterSelected={["MY_REQUEST"]}
      />
      <ApprovalRequestModal />
    </ApprovalRequestsContext.Provider>
  );
};
