import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import AnnouncementModal from "./Modal";
import { hasAccess } from "../../../../hooks/AccessHandler";

const ANNOUNCEMENT_TITLE_TABLE_MAX_CHARS = 80;

function truncateAnnouncementTitle(title) {
  const full = (title || "").trim();
  if (!full) return { display: "—", full: "" };
  if (full.length <= ANNOUNCEMENT_TITLE_TABLE_MAX_CHARS) {
    return { display: full, full };
  }
  return {
    display: `${full.slice(0, Math.max(0, ANNOUNCEMENT_TITLE_TABLE_MAX_CHARS - 1))}…`,
    full,
  };
}

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
        tableLayoutFixed
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "64px", minWidth: "64px", maxWidth: "64px" },
            className: "text-center align-middle",
          },
          {
            key: "title",
            label: "Title",
            className: "align-middle",
            style: {
              width: "auto",
              minWidth: "200px",
              maxWidth: "420px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              verticalAlign: "middle",
            },
            render: (row) => {
              const { display, full } = truncateAnnouncementTitle(row.title);
              return (
                <span
                  role="link"
                  tabIndex={0}
                  className="text-bold d-block text-truncate text-primary cursor-pointer"
                  style={{ maxWidth: "100%" }}
                  title={full || undefined}
                  onClick={() => {
                    navigate(`/ppaa-internal-portal/announcements/open/${row.uid}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/ppaa-internal-portal/announcements/open/${row.uid}`);
                    }
                  }}
                >
                  {display}
                </span>
              );
            },
          },
          {
            key: "priority",
            label: "Priority",
            style: { width: "108px", minWidth: "108px", maxWidth: "108px" },
            className: "text-center align-middle",
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
            style: { width: "88px", minWidth: "88px", maxWidth: "88px" },
            className: "text-center align-middle",
            render: (row) => (
              <span className={row.is_pinned ? "badge bg-label-success me-1" : "badge bg-label-secondary me-1"}>
                {row.is_pinned ? "Yes" : "No"}
              </span>
            ),
          },
          {
            key: "start_date",
            label: "Start Date",
            style: { width: "138px", minWidth: "138px", maxWidth: "138px", whiteSpace: "nowrap" },
            className: "text-center align-middle",
            render: (row) => (
              <span className="text-purple">
                {row.start_date ? formatDate(row.start_date, "DD/MM/YYYY HH:mm") : "-"}
              </span>
            ),
          },
          {
            key: "end_date",
            label: "End Date",
            style: { width: "138px", minWidth: "138px", maxWidth: "138px", whiteSpace: "nowrap" },
            className: "text-center align-middle",
            render: (row) => (
              <span className="text-purple">
                {row.end_date ? formatDate(row.end_date, "DD/MM/YYYY HH:mm") : "-"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-center align-middle",
            style: { width: "108px", minWidth: "108px", maxWidth: "108px" },
            render: (row) =>
              hasAccess(user, ["can_view_announcement"]) ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary text-center text-nowrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ppaa-internal-portal/announcements/open/${row.uid}`);
                  }}
                >
                  <i className="bx bx-show"></i>&nbsp; View
                </button>
              ) : null,
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

