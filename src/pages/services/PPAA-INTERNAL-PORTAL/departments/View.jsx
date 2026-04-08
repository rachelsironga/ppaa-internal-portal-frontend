import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import DepartmentModal from "./Modal";
import { formatDate } from "../../../../helpers/DateFormater";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const DepartmentPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Departments"]} />
      <PaginatedTable
        fetchPath="/internal-portal/departments"
        title="Department Management"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "name",
            label: "Department Name",
            className: "cursor-pointer",
            render: (row) => (
              <span
                className="text-bold"
                onClick={() => {
                  navigate(
                    `/ppaa-internal-portal/departments/open/${row.uid}`
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
            key: "description",
            label: "Description",
            render: (row) => (
              <span className="text-truncate" style={{ maxWidth: "300px" }}>
                {row.description || "-"}
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
                    `/ppaa-internal-portal/departments/open/${row.uid}`
                  );
                }}
              >
                <i className="bx bx-show"></i>&nbsp; View
              </button>
            ),
          },
        ]}
        buttons={[
          ...(hasAccess(user, ["can_add_department"])
            ? [
                {
                  label: "Add Department",
                  render: () => (
                    <button
                      aria-label="Click me"
                      type="button"
                      className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                      data-bs-toggle="modal"
                      data-bs-target="#departmentModal"
                    >
                      <i className="bx bx-plus me-1"></i> Add Department
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
      <DepartmentModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};

