// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import "animate.css";
import { RolesManagementContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import SystemRoleModal from "./Modal";
import { OpenRolesManagementPage } from "./Open";
import { HashUtil } from "../../../../helpers/HashUtil";
import { formatDate } from "../../../../helpers/DateFormater";

export const RolesManagementPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();

  return (
    <RolesManagementContext.Provider
      value={{
        selectedObj,
        setSelectedObj,
        tableRefresh,
        setTableRefresh,
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
                className="text-bold"
                onClick={() => {
                  navigate(
                    `/roles-managements/open/` + HashUtil.hashNumber(row.id)
                  );
                }}
              >
                {row.name}
              </span>
            ),
          },
          {
            key: "Users",
            label: "Number of Users",
            style: { width: "150px" },
            className: "text-center",
            render: (row) => row.users || 0,
          },
          {
            key: "NumberOfModules",
            label: "Number of PRIVILEGE",
            style: { width: "150px" },
            className: "text-center",
            render: (row) => row.permissions?.length || 0,
          },
          {
            key: "last_updated_at",
            label: "Last Update",
            style: { width: "150px" },
            className: "text-center",
            render: (row) => (
              <span className="text-purple">
                {formatDate(row.last_update_at, "DD/MM/YYYY HH:mm:ss") || "-"}
              </span>
            ),
          },
          {
            key: "last_updated_by",
            label: "Last Update By",
            style: { width: "150px" },
            className: "text-center text-secondary",
            render: (row) => row.last_updated_by || "-",
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
                    `/roles-managements/open/` + HashUtil.hashNumber(row.id)
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
        isRefresh={tableRefresh}
      />
      <SystemRoleModal />
    </RolesManagementContext.Provider>
  );
};
