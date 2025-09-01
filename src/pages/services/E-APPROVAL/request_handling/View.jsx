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
        onSelect={(row) => {
          setSelectedObj(row);
        }}
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
