import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import PositionalLevelModal from "./Modal";
import { formatDate } from "../../../../helpers/DateFormater";

export const PositionalLevelPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Position/Designation"]} />
      <PaginatedTable
        fetchPath="/internal-portal/positional-levels"
        title="Position/Designation Management"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "name",
            label: "Position/Designation Name",
            className: "cursor-pointer",
            render: (row) => (
              <span
                className="text-bold"
                onClick={() => {
                  navigate(
                    `/ppaa-internal-portal/positional-levels/open/${row.uid}`
                  );
                }}
              >
                {row.name}
              </span>
            ),
          },
          {
            key: "code",
            label: "Code",
            style: { width: "150px" },
            className: "text-center",
            render: (row) => row.code || "-",
          },
          {
            key: "is_active",
            label: "Status",
            style: { width: "100px" },
            className: "text-center",
            render: (row) => (
              <span className={`badge ${row.is_active ? "bg-label-success" : "bg-label-secondary"}`}>
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
            style: { width: "120px" },
            render: (row) => (
              <button
                className="btn btn-sm btn-outline-primary text-center"
                onClick={() => {
                  navigate(
                    `/ppaa-internal-portal/positional-levels/open/${row.uid}`
                  );
                }}
              >
                <i className="bx bx-show"></i>&nbsp; View
              </button>
            ),
          },
        ]}
        buttons={[
          {
            label: "Add Position/Designation",
            render: () => (
              <button
                aria-label="Click me"
                type="button"
                className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                data-bs-toggle="modal"
                data-bs-target="#positionalLevelModal"
              >
                <i className="bx bx-plus me-1"></i> Add Position/Designation
              </button>
            ),
          },
        ]}
        onSelect={(row) => {
          setSelectedObj(row);
        }}
        isRefresh={tableRefresh}
      />
      <PositionalLevelModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};

