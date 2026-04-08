import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getTodosList, deleteTodo } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import TodoModal from "./Modal";
import Swal from "sweetalert2";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";


export const TodoOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  const [selectedObj, setSelectedObj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableRefresh, setTableRefresh] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { class: "bg-warning", label: "Pending" },
      IN_PROGRESS: { class: "bg-info", label: "In Progress" },
      COMPLETED: { class: "bg-success", label: "Completed" },
      CANCELLED: { class: "bg-secondary", label: "Cancelled" },
    };
    return badges[status] || { class: "bg-secondary", label: status };
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      LOW: { class: "bg-success", label: "Low" },
      MEDIUM: { class: "bg-primary", label: "Medium" },
      HIGH: { class: "bg-warning", label: "High" },
      URGENT: { class: "bg-danger", label: "Urgent" },
    };
    return badges[priority] || { class: "bg-secondary", label: priority };
  };

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const result = await getTodosList({ uid });
      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
      } else {
        setSelectedObj(null);
        showToast("Unable to fetch task details", "warning", "Fetch Failed");
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Unable to fetch task details", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const taskUid = selectedObj?.uid || selectedObj?.id || uid;
    if (!taskUid) {
      showToast("Cannot delete: task identifier is missing.", "error", "Error");
      return;
    }
    const confirmed = await Swal.fire({
      title: "Delete Task?",
      text: `Are you sure you want to delete "${selectedObj?.title || "this task"}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
    if (!confirmed.isConfirmed) return;
    setDeleting(true);
    try {
      const result = await deleteTodo(taskUid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Task deleted successfully.", "success", "Done");
        navigate("/ppaa-internal-portal/todos");
      } else {
        showToast(result?.message || "Failed to delete task.", "warning", "Failed");
      }
    } catch (err) {
      showToast("Unable to delete task.", "danger", "Failed");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, [uid, tableRefresh]);

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Todo List", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
              <h6 className="text-muted mt-2">Loading Task Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!selectedObj) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Todo List", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Task Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/ppaa-internal-portal/todos")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const statusInfo = getStatusBadge(selectedObj.status);
  const priorityInfo = getPriorityBadge(selectedObj.priority);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Todo List", "View"]} />

      {/* Task Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-task bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold">
                    {selectedObj.title}
                  </h4>
                  <p className="mb-2 text-muted">
                    {selectedObj.description ? selectedObj.description.substring(0, 100) + (selectedObj.description.length > 100 ? '...' : '') : 'No description provided'}
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${statusInfo.class}`}>
                      {statusInfo.label}
                    </span>
                    <span className={`badge ${priorityInfo.class}`}>
                      {priorityInfo.label}
                    </span>
                    {selectedObj.department && (
                      <span className="badge bg-label-info">
                        {selectedObj.department.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex flex-nowrap gap-2 justify-content-end align-items-center">
              {hasAccess(user, ["can_edit_todo"]) && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#todoModal"
                >
                  <i className="bx bx-edit-alt me-1"></i> Edit Task
                </button>
              )}
              {hasAccess(user, ["can_delete_todo"]) && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-trash me-1"></i> Delete Task
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/ppaa-internal-portal/todos")}
              >
                <i className="bx bx-arrow-back me-1"></i> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        {selectedObj.start_date && (
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-calendar-check fs-4"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block mb-1">Start Date & Time</small>
                    <h6 className="mb-0">
                      {formatDate(selectedObj.start_date, "DD/MM/YYYY HH:mm")}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedObj.due_date && (
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-danger">
                      <i className="bx bx-calendar fs-4"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block mb-1">Due Date & Time</small>
                    <h6 className="mb-0">
                      {formatDate(selectedObj.due_date, "DD/MM/YYYY HH:mm")}
                    </h6>
                    {new Date(selectedObj.due_date) < new Date() && selectedObj.status !== 'COMPLETED' && (
                      <span className="badge bg-danger mt-1">Overdue</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedObj.completed_at && (
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-success">
                      <i className="bx bx-check-double fs-4"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block mb-1">Completed At</small>
                    <h6 className="mb-0">
                      {formatDate(selectedObj.completed_at, "DD/MM/YYYY HH:mm")}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedObj.department && (
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-info">
                      <i className="bx bx-building fs-4"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block mb-1">Department</small>
                    <h6 className="mb-0">
                      {selectedObj.department.name}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Details Card */}
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            Task Information
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Basic Information</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className="bx bx-task me-2 text-primary"></i>
                      Title:
                    </td>
                    <td>
                      <strong>{selectedObj.title}</strong>
                    </td>
                  </tr>
                  {selectedObj.description && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-detail me-2 text-info"></i>
                        Description:
                      </td>
                      <td>
                        <div className="alert alert-light mb-0">
                          <p className="mb-0">{selectedObj.description}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-star me-2 text-warning"></i>
                      Priority:
                    </td>
                    <td>
                      <span className={`badge ${priorityInfo.class}`}>
                        {priorityInfo.label}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-check-circle me-2 text-success"></i>
                      Status:
                    </td>
                    <td>
                      <span className={`badge ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                  </tr>
                  {selectedObj.department && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-building me-2 text-info"></i>
                        Department:
                      </td>
                      <td>
                        <strong>{selectedObj.department.name}</strong>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Schedule & Timeline</h6>
              <table className="table table-borderless">
                <tbody>
                  {selectedObj.start_date && (
                    <tr>
                      <td className="fw-medium" style={{ width: "40%" }}>
                        <i className="bx bx-calendar-check me-2 text-primary"></i>
                        Start Date:
                      </td>
                      <td>
                        <strong className="text-primary">
                          {formatDate(selectedObj.start_date, "DD/MM/YYYY HH:mm")}
                        </strong>
                      </td>
                    </tr>
                  )}
                  {selectedObj.due_date && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-calendar me-2 text-danger"></i>
                        Due Date:
                      </td>
                      <td>
                        <strong className="text-danger">
                          {formatDate(selectedObj.due_date, "DD/MM/YYYY HH:mm")}
                        </strong>
                        {new Date(selectedObj.due_date) < new Date() && selectedObj.status !== 'COMPLETED' && (
                          <span className="badge bg-danger ms-2">Overdue</span>
                        )}
                      </td>
                    </tr>
                  )}
                  {selectedObj.completed_at && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-check-double me-2 text-success"></i>
                        Completed At:
                      </td>
                      <td>
                        <strong className="text-success">
                          {formatDate(selectedObj.completed_at, "DD/MM/YYYY HH:mm:ss")}
                        </strong>
                      </td>
                    </tr>
                  )}
           
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <TodoModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};
