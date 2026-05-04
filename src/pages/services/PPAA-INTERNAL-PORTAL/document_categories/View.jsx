import React, { useState } from "react";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import DocumentCategoryModal from "./Modal";

export const DocumentCategoryPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Document Categories"]} />
      <PaginatedTable
        fetchPath="/internal-portal/document-categories"
        title="Document Categories Management"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "name",
            label: "Category Name",
            render: (row) => (
              <span className="text-bold">
                {row.name}
              </span>
            ),
          },
          {
            key: "description",
            label: "Description",
            render: (row) => (
              <span className="text-truncate" style={{ maxWidth: "300px" }}>
                {row.description || "-"}
              </span>
            ),
          },
          {
            key: "is_active",
            label: "Status",
            style: { width: "120px" },
            className: "text-center",
            render: (row) => (
              <span
                className={
                  row.is_active
                    ? "badge bg-label-success me-1"
                    : "badge bg-label-secondary me-1"
                }
              >
                {row.is_active ? "Active" : "Inactive"}
              </span>
            ),
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
            style: { width: "100px" },
            render: (row) => (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  setSelectedObj(row);
                  const modalElement = document.getElementById("documentCategoryModal");
                  if (modalElement) {
                    const modal = new window.bootstrap.Modal(modalElement);
                    modal.show();
                  }
                }}
                title="Edit Category"
              >
                <i className="bx bx-edit"></i>
              </button>
            ),
          },
        ]}
        buttons={[
          {
            label: "Add Category",
            render: () => (
              <button
                aria-label="Click me"
                type="button"
                className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                data-bs-toggle="modal"
                data-bs-target="#documentCategoryModal"
              >
                <i className="bx bx-plus me-1"></i> Add Category
              </button>
            ),
          },
        ]}
        onSelect={(row) => {
          setSelectedObj(row);
        }}
        isRefresh={tableRefresh}
      />
      <DocumentCategoryModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};

