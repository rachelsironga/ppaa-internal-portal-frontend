import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import EventModal from "./Modal";
import { hasAccess } from "../../../../hooks/AccessHandler";
import {
  EVENT_MERGED_TITLE_MAX_CHARS,
  getEventLifecycleStatus,
  getEventTypeBadge,
  truncateEventTitle,
} from "./eventDisplay";

/** SN + Start + End + Actions fixed widths — Event column gets the remainder via calc (stable with empty rows). */
const EVENT_TABLE_FIXED_PX = 64 + 158 + 158 + 108;

export const EventPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Events"]} />
      <PaginatedTable
        fetchPath="/internal-portal/events"
        title="Event Management"
        tableLayoutFixed
        tableMinWidth={`${EVENT_TABLE_FIXED_PX + 260}px`}
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "64px", minWidth: "64px", maxWidth: "64px" },
            className: "text-center align-middle",
          },
          {
            key: "title",
            label: "Event",
            className: "align-middle",
            style: {
              width: `calc(100% - ${EVENT_TABLE_FIXED_PX}px)`,
              minWidth: "260px",
              whiteSpace: "normal",
              wordBreak: "break-word",
              verticalAlign: "middle",
            },
            render: (row) => {
              const { display, full } = truncateEventTitle(
                row.title,
                EVENT_MERGED_TITLE_MAX_CHARS
              );
              const status = getEventLifecycleStatus(row);
              const typeInfo = row.event_type
                ? getEventTypeBadge(row.event_type)
                : null;
              const loc = (row.location || "").trim();

              return (
                <div className="py-2 pe-1" style={{ minWidth: 0 }}>
                  <div
                    className="fw-semibold text-dark text-truncate mb-1"
                    title={full || undefined}
                  >
                    {display}
                  </div>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    {typeInfo ? (
                      <span
                        className={`badge rounded-pill flex-shrink-0 ${typeInfo.class}`}
                      >
                        {typeInfo.label}
                      </span>
                    ) : null}
                    <span className={`badge flex-shrink-0 ${status.mainClass}`}>
                      {status.mainLabel}
                    </span>
                    {status.showNew ? (
                      <span className="badge rounded-pill bg-label-primary flex-shrink-0">
                        New
                      </span>
                    ) : null}
                    {loc ? (
                      <span
                        className="small text-muted text-truncate d-inline-flex align-items-center"
                        style={{ minWidth: 0, maxWidth: "min(100%, 14rem)" }}
                        title={loc}
                      >
                        <i className="bx bx-map me-1 flex-shrink-0" />
                        {loc}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            },
          },
          {
            key: "start_date",
            label: "Start Date",
            style: {
              width: "158px",
              minWidth: "158px",
              maxWidth: "158px",
              whiteSpace: "nowrap",
            },
            className: "text-center align-middle",
            render: (row) => (
              <span className="text-purple">
                {row.start_date
                  ? formatDate(row.start_date, "DD/MM/YYYY HH:mm")
                  : "—"}
              </span>
            ),
          },
          {
            key: "end_date",
            label: "End Date",
            style: {
              width: "158px",
              minWidth: "158px",
              maxWidth: "158px",
              whiteSpace: "nowrap",
            },
            className: "text-center align-middle",
            render: (row) => (
              <span className="text-purple">
                {row.end_date
                  ? formatDate(row.end_date, "DD/MM/YYYY HH:mm")
                  : "—"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-center align-middle",
            style: {
              width: "108px",
              minWidth: "108px",
              maxWidth: "108px",
              verticalAlign: "middle",
            },
            render: (row) =>
              hasAccess(user, ["can_view_event"]) ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary text-center text-nowrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ppaa-internal-portal/events/open/${row.uid}`);
                  }}
                >
                  <i className="bx bx-show"></i>&nbsp; View
                </button>
              ) : null,
          },
        ]}
        buttons={[
          ...(hasAccess(user, ["can_add_event"])
            ? [
                {
                  label: "Add Event",
                  render: () => (
                    <button
                      aria-label="Add Event"
                      type="button"
                      className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                      data-bs-toggle="modal"
                      data-bs-target="#eventModal"
                      onClick={() => setSelectedObj(null)}
                    >
                      <i className="bx bx-plus me-1"></i> Add Event
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
      <EventModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};
