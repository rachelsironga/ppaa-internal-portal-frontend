import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getEvents, deleteEvent } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import EventModal from "./Modal";
import Swal from "sweetalert2";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const EventOpenPage = () => {
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
      const result = await getEvents({ uid });
      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
      } else {
        setSelectedObj(null);
        showToast("Unable to fetch event details", "warning", "Fetch Failed");
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Unable to fetch event details", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const eventUid = selectedObj?.uid || selectedObj?.id || uid;
    if (!eventUid) {
      showToast("Cannot delete: event identifier is missing.", "error", "Error");
      return;
    }
    const confirmed = await Swal.fire({
      title: "Delete Event?",
      text: `Are you sure you want to delete "${selectedObj?.title || "this event"}"? This action cannot be undone.`,
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
      const result = await deleteEvent(eventUid);
      if (result?.status === 200 || result?.status === 8000) {
        showToast("Event deleted successfully.", "success", "Done");
        navigate("/ppaa-internal-portal/events");
      } else {
        showToast(result?.message || "Failed to delete event.", "warning", "Failed");
      }
    } catch (err) {
      showToast("Unable to delete event.", "danger", "Failed");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, [uid, tableRefresh]);

  const getEventTypeBadge = (eventType) => {
    const typeConfig = {
      'MEETING': { class: 'bg-primary', label: 'Meeting' },
      'TRAINING': { class: 'bg-info', label: 'Training' },
      'WORKSHOP': { class: 'bg-success', label: 'Workshop' },
      'HOLIDAY': { class: 'bg-warning', label: 'Holiday' },
      'OTHER': { class: 'bg-secondary', label: 'Other' }
    };
    return typeConfig[eventType] || { class: 'bg-secondary', label: eventType || 'Unknown' };
  };

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Events", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
              <h6 className="text-muted mt-2">Loading Event Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!selectedObj) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "Events", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Event Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/ppaa-internal-portal/events")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to Events
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const typeInfo = getEventTypeBadge(selectedObj.event_type);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "Events", "View"]} />

      {/* Event Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-calendar-event bx-lg"></i>
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
                    <span className={`badge ${typeInfo.class}`}>
                      {typeInfo.label}
                    </span>
                    <span className={`badge ${selectedObj.is_all_day ? 'bg-success' : 'bg-label-secondary'}`}>
                      {selectedObj.is_all_day ? "All Day" : "Timed Event"}
                    </span>
                    <span className={`badge ${selectedObj.is_public ? 'bg-info' : 'bg-label-warning'}`}>
                      {selectedObj.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 d-flex flex-nowrap gap-2 justify-content-end align-items-center">
              {hasAccess(user, ["can_edit_event"]) && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  data-bs-toggle="modal"
                  data-bs-target="#eventModal"
                >
                  <i className="bx bx-edit-alt me-1"></i> Edit Event
                </button>
              )}
              {hasAccess(user, ["can_delete_event"]) && (
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
                      <i className="bx bx-trash me-1"></i> Delete Event
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/ppaa-internal-portal/events")}
              >
                <i className="bx bx-arrow-back me-1"></i> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-time fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Start Date & Time</small>
                  <h6 className="mb-0">
                    {selectedObj.start_date
                      ? formatDate(selectedObj.start_date, "DD/MM/YYYY HH:mm")
                      : "N/A"}
                  </h6>
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
                  <span className="avatar-initial rounded bg-label-danger">
                    <i className="bx bx-time-five fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">End Date & Time</small>
                  <h6 className="mb-0">
                    {selectedObj.end_date
                      ? formatDate(selectedObj.end_date, "DD/MM/YYYY HH:mm")
                      : "N/A"}
                  </h6>
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
                    <i className="bx bx-map fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Location</small>
                  <h6 className="mb-0">
                    {selectedObj.location || "Not specified"}
                  </h6>
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
                  <span className="avatar-initial rounded bg-label-info">
                    <i className="bx bx-calendar fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Event Type</small>
                  <div className="mb-0">
                    <span className={`badge ${typeInfo.class}`}>
                      {typeInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Card */}
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            Event Information
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
                      <i className="bx bx-calendar-event me-2 text-primary"></i>
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
                  {selectedObj.event_type && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-category me-2 text-success"></i>
                        Type:
                      </td>
                      <td>
                        <span className={`badge ${typeInfo.class}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                    </tr>
                  )}
                  {selectedObj.location && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-map me-2 text-warning"></i>
                        Location:
                      </td>
                      <td>
                        <strong>{selectedObj.location}</strong>
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
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className="bx bx-time me-2 text-primary"></i>
                      Start Date:
                    </td>
                    <td>
                      <strong className="text-primary">
                        {selectedObj.start_date
                          ? formatDate(selectedObj.start_date, "DD/MM/YYYY HH:mm")
                          : "N/A"}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-time-five me-2 text-danger"></i>
                      End Date:
                    </td>
                    <td>
                      <strong className="text-danger">
                        {selectedObj.end_date
                          ? formatDate(selectedObj.end_date, "DD/MM/YYYY HH:mm")
                          : "N/A"}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-check-circle me-2 text-success"></i>
                      All Day:
                    </td>
                    <td>
                      <span className={`badge ${selectedObj.is_all_day ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedObj.is_all_day ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-globe me-2 text-info"></i>
                      Visibility:
                    </td>
                    <td>
                      <span className={`badge ${selectedObj.is_public ? 'bg-info' : 'bg-label-warning'}`}>
                        {selectedObj.is_public ? "Public" : "Private"}
                      </span>
                    </td>
                  </tr>
               
                
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <EventModal
        selectedObj={selectedObj}
        setSelectedObj={setSelectedObj}
        tableRefresh={tableRefresh}
        setTableRefresh={setTableRefresh}
      />
    </>
  );
};


