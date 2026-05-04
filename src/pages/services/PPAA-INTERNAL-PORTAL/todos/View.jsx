import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import TodoModal from "./Modal";
import { hasAccess } from "../../../../hooks/AccessHandler";

const TASK_TITLE_TABLE_MAX_CHARS = 110;

function truncateTaskTitle(title) {
  const full = (title || "").trim();
  if (!full) return { display: "—", full: "" };
  if (full.length <= TASK_TITLE_TABLE_MAX_CHARS) return { display: full, full };
  return {
    display: `${full.slice(0, Math.max(0, TASK_TITLE_TABLE_MAX_CHARS - 1))}…`,
    full,
  };
}

export const TodoPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: "badge bg-warning text-white",
      IN_PROGRESS: "badge bg-info text-white",
      COMPLETED: "badge bg-success text-white",
      CANCELLED: "badge bg-secondary text-white",
    };
    return badges[status] || "badge bg-secondary text-white";
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "Pending",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return labels[status] || status;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      LOW: "badge bg-success text-white",
      MEDIUM: "badge bg-primary text-white",
      HIGH: "badge bg-warning text-white",
      URGENT: "badge bg-danger text-white",
    };
    return badges[priority] || "badge bg-secondary text-white";
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      URGENT: "Urgent",
    };
    return labels[priority] || priority;
  };

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Todo List"]} />
      <PaginatedTable
        fetchPath="/internal-portal/todos"
        title="Todo List"
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
            label: "Task Title",
            className: "align-middle",
            style: {
              width: "auto",
              minWidth: "320px",
              maxWidth: "560px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              verticalAlign: "middle",
            },
            render: (row) => {
              const { display, full } = truncateTaskTitle(row.title);
              return (
                <span
                  className="text-bold d-block text-truncate"
                  style={{ maxWidth: "100%" }}
                  title={full || undefined}
                >
                  {display}
                </span>
              );
            },
          },
          {
            key: "status",
            label: "Status",
            style: { width: "118px", minWidth: "118px", maxWidth: "118px" },
            className: "text-center align-middle",
            render: (row) => (
              <span className={getStatusBadge(row.status)}>
                {getStatusLabel(row.status)}
              </span>
            ),
          },
          {
            key: "priority",
            label: "Priority",
            style: { width: "108px", minWidth: "108px", maxWidth: "108px" },
            className: "text-center align-middle",
            render: (row) => (
              <span className={getPriorityBadge(row.priority)}>
                {getPriorityLabel(row.priority)}
              </span>
            ),
          },
          {
            key: "start_date",
            label: "Start Date",
            style: { width: "128px", minWidth: "128px", maxWidth: "128px", whiteSpace: "nowrap" },
            className: "text-center align-middle",
            render: (row) => (
              <span className="text-purple">
                {row.start_date
                  ? formatDate(row.start_date, "DD/MM/YYYY")
                  : "-"}
              </span>
            ),
          },
          {
            key: "due_date",
            label: "Due Date",
            style: { width: "128px", minWidth: "128px", maxWidth: "128px", whiteSpace: "nowrap" },
            className: "text-center align-middle",
            render: (row) => (
              <span className="text-purple">
                {row.due_date
                  ? formatDate(row.due_date, "DD/MM/YYYY")
                  : "-"}
              </span>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-center align-middle",
            style: { width: "108px", minWidth: "108px", maxWidth: "108px" },
            render: (row) =>
              hasAccess(user, ["can_view_todo"]) ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary text-center text-nowrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/ppaa-internal-portal/todos/open/${row.uid}`);
                  }}
                >
                  <i className="bx bx-show"></i>&nbsp; View
                </button>
              ) : null,
          },
        ]}
        buttons={[
          ...(hasAccess(user, ["can_add_todo"])
            ? [
                {
                  label: "Add Task",
                  render: () => (
                    <button
                      aria-label="Add Task"
                      type="button"
                      className="btn btn-primary ms-auto btn-sm animate__animated animate__fadeInRight animate__slow me-1"
                      data-bs-toggle="modal"
                      data-bs-target="#todoModal"
                      onClick={() => setSelectedObj(null)}
                    >
                      <i className="bx bx-plus me-1"></i> Add Task
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
      <TodoModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};

