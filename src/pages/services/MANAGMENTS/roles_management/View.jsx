// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import { formatDate } from "../../../../helpers/DateFormater";
import "animate.css";
import { RolesManagementContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import SystemRoleModal from "./Modal";

export const RolesManagementPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const navigate = useNavigate();

  return (
    <RolesManagementContext.Provider
      value={{
        selectedObj,
        setSelectedObj,
      }}
    >
      <BreadCumb pageList={["Roles Managements"]} />
      <PaginatedTable
        fetchPath="/system/roles"
        title="Roles Managements"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "name",
            label: "Role Name",
            className: "cursor-pointer",
            render: (row) => (
              <span
                className="text-primary"
                onClick={() => {
                  console.log("Row clicked:", row);
                  // navigate(`/roles-managements/open/${row.id}`);
                }}
              >
                {row.name}
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
                data-bs-toggle="modal"
                data-bs-target="#viewCreateRoleModal"
              >
                <i className="bx bx-transfer-alt"></i>
                View
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
                data-bs-target="#viewCreateRoleModal"
              >
                <i className="bx bx-edit-alt me-1"></i> Add System Roles
              </button>
            ),
          },
        ]}
        onSelect={(row) => {
          setSelectedObj(row);
        }}
      />
      <SystemRoleModal />
    </RolesManagementContext.Provider>
  );
};
