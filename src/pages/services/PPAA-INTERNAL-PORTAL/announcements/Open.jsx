import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getAnnouncements, deleteAnnouncement } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import AnnouncementModal from "./Modal";
import Swal from "sweetalert2";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const AnnouncementOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.userReducer?.data);
  const [selectedObj, setSelectedObj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableRefresh, setTableRefresh] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const result = await getAnnouncements({ uid });
      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
      } else {
        setSelectedObj(null);
        showToast("Unable to fetch announcement details", "warning", "Fetch Failed");
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Unable to fetch announcement details", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const announcementUid = selectedObj?.uid || selectedObj?.id || uid;
    if (!announcementUid) {
      showToast("Cannot delete: announcement identifier is missing.", "error", "Error");
      return;
    }
    const confirmed = await Swal.fire({
      title: "Delete Announcement?",
      text: `Are you sure you want to delete "${selectedObj?.title || "this announcement"}"? This action cannot be undone.`,
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
      const result = await deleteAnnouncement(announcementUid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Announcement deleted successfully.", "success", "Done");
        navigate("/ppaa-internal-portal/announcements");
      } else {
        showToast(result?.message || "Failed to delete announcement.", "warning", "Failed");
      }
    } catch (err) {
      showToast("Unable to delete announcement.", "danger", "Failed");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, [uid, tableRefresh]);

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      LOW: { class: "bg-info", label: "Low" },
      MEDIUM: { class: "bg-primary", label: "Medium" },
      HIGH: { class: "bg-warning", label: "High" },
      URGENT: { class: "bg-danger", label: "Urgent" },
    };
    return priorityConfig[priority] || { class: "bg-secondary", label: priority || "Unknown" };
  };

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Announcements", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
              <h6 className="text-muted mt-2">Loading Announcement Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!selectedObj) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Announcements", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Announcement Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/ppaa-internal-portal/announcements")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to Announcements
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const priorityInfo = getPriorityBadge(selectedObj.priority);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Announcements", "View"]} />

      {/* Announcement Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-warning">
                      <i className="bx bx-bullhorn bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold">
                    {selectedObj.title}
                  </h4>
                  <p className="mb-2 text-muted">
                    {selectedObj.content ? selectedObj.content.substring(0, 100) + (selectedObj.content.length > 100 ? '...' : '') : 'No content provided'}
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${priorityInfo.class}`}>
                      {priorityInfo.label}
                    </span>
                    <span className={`badge ${selectedObj.is_pinned ? 'bg-success' : 'bg-label-secondary'}`}>
                      {selectedObj.is_pinned ? "Pinned" : "Not Pinned"}
                    </span>
                    <span className={`badge ${selectedObj.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedObj.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex flex-nowrap gap-2 justify-content-end align-items-center">
              {hasAccess(user, ["can_edit_announcement"]) && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#announcementModal"
                >
                  <i className="bx bx-edit-alt me-1"></i> Edit Announcement
                </button>
              )}
              {hasAccess(user, ["can_delete_announcement"]) && (
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
                      <i className="bx bx-trash me-1"></i> Delete Announcement
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/ppaa-internal-portal/announcements")}
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
                      <i className="bx bx-calendar fs-4"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block mb-1">Start Date</small>
                    <h6 className="mb-0">
                      {formatDate(selectedObj.start_date, "DD/MM/YYYY HH:mm")}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedObj.end_date && (
          <div className="col-xl-3 col-md-6 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="avatar flex-shrink-0 me-3">
                    <span className="avatar-initial rounded bg-label-danger">
                      <i className="bx bx-calendar-check fs-4"></i>
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <small className="text-muted d-block mb-1">End Date</small>
                    <h6 className="mb-0">
                      {formatDate(selectedObj.end_date, "DD/MM/YYYY HH:mm")}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-warning">
                    <i className="bx bx-flag fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Priority</small>
                  <div className="mb-0">
                    <span className={`badge ${priorityInfo.class}`}>
                      {priorityInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-success">
                    <i className="bx bx-check-circle fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Status</small>
                  <div className="mb-0">
                    <span className={`badge ${selectedObj.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedObj.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Details Card */}
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            Announcement Information
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
                      <i className="bx bx-bullhorn me-2 text-primary"></i>
                      Title:
                    </td>
                    <td>
                      <strong>{selectedObj.title}</strong>
                    </td>
                  </tr>
                  {selectedObj.content && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-detail me-2 text-info"></i>
                        Content:
                      </td>
                      <td>
                        <div className="alert alert-light mb-0">
                          <p className="mb-0">{selectedObj.content}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-flag me-2 text-warning"></i>
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
                      <i className="bx bx-pin me-2 text-success"></i>
                      Pinned:
                    </td>
                    <td>
                      <span className={`badge ${selectedObj.is_pinned ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedObj.is_pinned ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                  {selectedObj.file_url && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-file me-2 text-primary"></i>
                        File:
                      </td>
                      <td>
                        <a
                          href={selectedObj.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bx bx-download me-1"></i> Download File
                        </a>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Schedule & Settings</h6>
              <table className="table table-borderless">
                <tbody>
                  {selectedObj.start_date && (
                    <tr>
                      <td className="fw-medium" style={{ width: "40%" }}>
                        <i className="bx bx-calendar me-2 text-primary"></i>
                        Start Date:
                      </td>
                      <td>
                        <strong className="text-primary">
                          {formatDate(selectedObj.start_date, "DD/MM/YYYY HH:mm")}
                        </strong>
                      </td>
                    </tr>
                  )}
                  {selectedObj.end_date && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-calendar-check me-2 text-danger"></i>
                        End Date:
                      </td>
                      <td>
                        <strong className="text-danger">
                          {formatDate(selectedObj.end_date, "DD/MM/YYYY HH:mm")}
                        </strong>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-check-circle me-2 text-success"></i>
                      Status:
                    </td>
                    <td>
                      <span className={`badge ${selectedObj.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedObj.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AnnouncementModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};
