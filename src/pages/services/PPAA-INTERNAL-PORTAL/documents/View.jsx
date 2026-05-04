import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import DocumentModal from "./Modal";
import { formatDate } from "../../../../helpers/DateFormater";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const DocumentPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Documents"]} />
      <PaginatedTable
        fetchPath="/internal-portal/documents"
        title="Document Management"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "title",
            label: "Title",
            className: "cursor-pointer",
            render: (row) => (
              <span
                className="text-bold"
                onClick={() => {
                  navigate(`/ppaa-internal-portal/documents/open/${row.uid}`);
                }}
              >
                {row.title}
              </span>
            ),
          },
          {
            key: "category",
            label: "Category",
            style: { width: "150px" },
            render: (row) => row.category?.name || "-",
          },
          {
            key: "status",
            label: "Status",
            style: { width: "120px" },
            className: "text-center",
            render: (row) => (
              <span
                className={
                  row.status === "PUBLISHED"
                    ? "badge bg-label-success me-1"
                    : row.status === "DRAFT"
                    ? "badge bg-label-warning me-1"
                    : "badge bg-label-secondary me-1"
                }
              >
                {row.status}
              </span>
            ),
          },
          {
            key: "download_count",
            label: "Downloads",
            style: { width: "100px" },
            className: "text-center",
            render: (row) => row.download_count || 0,
          },
          {
            key: "created_at",
            label: "Created At",
            style: { width: "150px" },
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
            render: (row) =>
              hasAccess(user, ["can_view_document"]) ? (
                <button
                  className="btn btn-sm btn-outline-primary text-center"
                  onClick={() => {
                    navigate(`/ppaa-internal-portal/documents/open/${row.uid}`);
                  }}
                >
                  <i className="bx bx-show"></i>&nbsp; View
                </button>
              ) : null,
          },
        ]}
        buttons={[
          ...(hasAccess(user, ["can_add_document"])
            ? [
                {
                  label: "Add Document",
                  render: () => (
                    <button
                      aria-label="Add Document"
                      type="button"
                      className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                      data-bs-toggle="modal"
                      data-bs-target="#documentModal"
                      onClick={() => setSelectedObj(null)}
                    >
                      <i className="bx bx-plus me-1"></i> Add Document
                    </button>
                  ),
                },
              ]
            : []),
        ]}
        onSelect={(row) => {
          setSelectedObj(row);
        }}
        isRefresh={tableRefresh}
      />
      <DocumentModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};

