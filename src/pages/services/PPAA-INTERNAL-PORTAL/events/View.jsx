import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import EventModal from "./Modal";
import { hasAccess } from "../../../../hooks/AccessHandler";

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
            render: (row) => (
              <span className="text-bold">
                {row.title}
              </span>
            ),
          },
          {
            key: "event_type",
            label: "Type",
            style: { width: "140px" },
            className: "text-center",
            render: (row) => row.event_type || "-",
          },
          {
            key: "start_date",
            label: "Start Date",
            style: { width: "160px" },
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
            style: { width: "160px" },
            className: "text-center",
            render: (row) => (
              <span className="text-purple">
                {row.end_date ? formatDate(row.end_date, "DD/MM/YYYY HH:mm") : "-"}
              </span>
            ),
          },
          {
            key: "location",
            label: "Location",
            render: (row) => row.location || "-",
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-center",
            style: { width: "120px" },
            render: (row) =>
              hasAccess(user, ["can_view_event"]) ? (
                <button
                  className="btn btn-sm btn-outline-primary text-center"
                  onClick={() => {
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


