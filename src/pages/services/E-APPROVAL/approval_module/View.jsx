import React, { useState, useEffect } from "react";
import "animate.css";
import { ApprovalModuleContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import ApprovalModuleModal from "./Modal";
import { formatDate } from "../../../../helpers/DateFormater";

export const ApprovalModulePage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();

  return (
    <ApprovalModuleContext.Provider
      value={{
        selectedObj,
        setSelectedObj,
        tableRefresh,
        setTableRefresh,
      }}
    >
      <BreadCumb pageList={["Settings", "Approval Modules"]} />
      <PaginatedTable
        fetchPath="/approval-module"
        title="List of Registered Approval Modules"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "name",
            label: "Module Name",
            className: "cursor-pointer",

            render: (row) => (
              <span
                className="text-bold"
                onClick={() => {
                  // navigate(
                  //   `/roles-managements/open/` + HashUtil.hashNumber(row.id)
                  // );
                }}
              >
                {row.name}
              </span>
            ),
          },
          {
            key: "code",
            label: "Code",
            className: "text-justify",
            style: { width: "30%" },
          },
          {
            key: "created_at",
            label: "Created Date",
            style: { width: "150px" },
            className: "text-right",
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
                  navigate(`/settings/approval-modules/open/${row.uid}`);
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
                data-bs-target="#viewCreateModuleDataModal"
              >
                <i className="bx bx-edit-alt me-1"></i> Add New Module
              </button>
            ),
          },
        ]}
        onSelect={(row) => {
          setSelectedObj(row);
        }}
        isRefresh={tableRefresh}
      />
      <ApprovalModuleModal />
    </ApprovalModuleContext.Provider>
  );
};
