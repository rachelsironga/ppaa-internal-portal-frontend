import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import AnnouncementModal from "./Modal";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const AnnouncementPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Announcements"]} />
      <PaginatedTable
        fetchPath="/internal-portal/announcements"
        title="Announcement Management"
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
                  navigate(`/ppaa-internal-portal/announcements/open/${row.uid}`);
                }}
              >
                {row.title}
              </span>
            ),
          },
          {
            key: "priority",
            label: "Priority",
            style: { width: "120px" },
            className: "text-center",
            render: (row) => {
              const priorityColors = {
                LOW: "bg-label-info",
                MEDIUM: "bg-label-primary",
                HIGH: "bg-label-warning",
                URGENT: "bg-label-danger",
              };
              return (
                <span className={`badge ${priorityColors[row.priority] || "bg-label-secondary"} me-1`}>
                  {row.priority}
                </span>
              );
            },
          },
          {
            key: "is_pinned",
            label: "Pinned",
            style: { width: "100px" },
            className: "text-center",
            render: (row) => (
              <span className={row.is_pinned ? "badge bg-label-success me-1" : "badge bg-label-secondary me-1"}>
                {row.is_pinned ? "Yes" : "No"}
              </span>
            ),
          },
          {
            key: "start_date",
            label: "Start Date",
            style: { width: "150px" },
            className: "text-center",
            render: (row) => (
              <span className="text-purple">
                {row.start_date ? formatDate(row.start_date, "DD/MM/YYYY HH:mm") : "-"}
              </span>
            ),
          },
          {
            key: "end_date",
            label: "End Date",
            style: { width: "150px" },
            className: "text-center",
            render: (row) => (
              <span className="text-purple">
                {row.end_date ? formatDate(row.end_date, "DD/MM/YYYY HH:mm") : "-"}
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
            style: { width: "120px" },
            render: (row) => (
              hasAccess(user, ["can_view_announcement"]) ? (
              <button
                className="btn btn-sm btn-outline-primary text-center"
                onClick={() => {    
                  navigate(`/ppaa-internal-portal/announcements/open/${row.uid}`);
                }}
              >
                <i className="bx bx-show"></i>&nbsp; View
              </button>
            ) : null),
          },
        ]}
        buttons={[
          ...(hasAccess(user, ["can_add_announcement"])
            ? [
                {
                  label: "Add Announcement",
                  render: () => (
                    <button
                      aria-label="Add Announcement"
                      type="button"
                      className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                      data-bs-toggle="modal"
                      data-bs-target="#announcementModal"
                      onClick={() => setSelectedObj(null)}
                    >
                      <i className="bx bx-plus me-1"></i> Add Announcement
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
      <AnnouncementModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};

