import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getAuditLogs } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";

export const AuditLogOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [selectedObj, setSelectedObj] = useState(null);
  const [loading, setLoading] = useState(false);

  const getActionBadge = (action) => {
    const actionConfig = {
      CREATE: { class: "bg-success", label: "Create", icon: "bx-plus-circle" },
      UPDATE: { class: "bg-primary", label: "Update", icon: "bx-edit" },
      DELETE: { class: "bg-danger", label: "Delete", icon: "bx-trash" },
      VIEW: { class: "bg-info", label: "View", icon: "bx-show" },
      DOWNLOAD: { class: "bg-warning", label: "Download", icon: "bx-download" },
      LOGIN: { class: "bg-success", label: "Login", icon: "bx-log-in" },
      LOGOUT: { class: "bg-secondary", label: "Logout", icon: "bx-log-out" },
    };
    return actionConfig[action] || { class: "bg-secondary", label: action, icon: "bx-info-circle" };
  };

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({ uid });
      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
      } else {
        setSelectedObj(null);
        showToast("Unable to fetch audit log details", "warning", "Fetch Failed");
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Unable to fetch audit log details", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, [uid]);

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "System Logs", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
              <h6 className="text-muted mt-2">Loading Audit Log Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!selectedObj) {
    return (
      <>
        <BreadCumb pageList={["Internal Portal", "System Logs", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Audit Log Details. Please Contact System Administrator
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/ppaa-internal-portal/audit-logs")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to System Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const actionInfo = getActionBadge(selectedObj.action);

  return (
    <>
      <BreadCumb pageList={["Internal Portal", "System Logs", "View"]} />

      {/* Audit Log Header Card */}
      <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  <div className="avatar avatar-xl me-3">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="bx bx-history bx-lg"></i>
                    </span>
                  </div>
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold">
                    {actionInfo.label} Action
                  </h4>
                  <p className="mb-2 text-muted">
                    {selectedObj.model_name || "System"} - {selectedObj.object_repr || "N/A"}
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${actionInfo.class}`}>
                      <i className={`bx ${actionInfo.icon} me-1`}></i>
                      {selectedObj.action}
                    </span>
                    {selectedObj.department?.name && (
                      <span className="badge bg-label-info">
                        {selectedObj.department.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/ppaa-internal-portal/audit-logs")}
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
                    <i className="bx bx-user fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">User</small>
                  <h6 className="mb-0">
                    {selectedObj.user
                      ? `${selectedObj.user.first_name || ""} ${selectedObj.user.last_name || ""}`.trim() || selectedObj.user.username
                      : "System"}
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
                    <i className="bx bx-cube fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Model</small>
                  <h6 className="mb-0">
                    {selectedObj.model_name || "N/A"}
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
                    <i className="bx bx-calendar fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Date & Time</small>
                  <h6 className="mb-0">
                    {selectedObj.created_at
                      ? formatDate(selectedObj.created_at, "DD/MM/YYYY HH:mm:ss")
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
                  <span className="avatar-initial rounded bg-label-warning">
                    <i className="bx bx-globe fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">IP Address</small>
                  <h6 className="mb-0">
                    {selectedObj.ip_address || "N/A"}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Details Card */}
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-info-circle me-2 text-primary"></i>
            Audit Log Information
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Action Details</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className={`bx ${actionInfo.icon} me-2 text-primary`}></i>
                      Action:
                    </td>
                    <td>
                      <span className={`badge ${actionInfo.class}`}>
                        {selectedObj.action}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-cube me-2 text-info"></i>
                      Model:
                    </td>
                    <td>
                      <strong>{selectedObj.model_name || "-"}</strong>
                    </td>
                  </tr>
                  {selectedObj.object_repr && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-file me-2 text-success"></i>
                        Object:
                      </td>
                      <td>
                        <strong>{selectedObj.object_repr}</strong>
                      </td>
                    </tr>
                  )}
                  {selectedObj.object_id && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-hash me-2 text-muted"></i>
                        Object ID:
                      </td>
                      <td>
                        <small className="text-muted">{selectedObj.object_id}</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">User & Context</h6>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-medium" style={{ width: "40%" }}>
                      <i className="bx bx-user me-2 text-primary"></i>
                      User:
                    </td>
                    <td>
                      <strong>
                        {selectedObj.user
                          ? `${selectedObj.user.first_name || ""} ${selectedObj.user.last_name || ""}`.trim() || selectedObj.user.username
                          : "System"}
                      </strong>
                      {selectedObj.user && (
                        <small className="text-muted d-block">
                          {selectedObj.user.email || selectedObj.user.username}
                        </small>
                      )}
                    </td>
                  </tr>
                  {selectedObj.department?.name && (
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
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-calendar me-2 text-danger"></i>
                      Date & Time:
                    </td>
                    <td>
                      <strong>
                        {selectedObj.created_at
                          ? formatDate(selectedObj.created_at, "DD/MM/YYYY HH:mm:ss")
                          : "N/A"}
                      </strong>
                    </td>
                  </tr>
                  {selectedObj.ip_address && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-globe me-2 text-warning"></i>
                        IP Address:
                      </td>
                      <td>
                        <strong className="text-muted">{selectedObj.ip_address}</strong>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {selectedObj.changes && Object.keys(selectedObj.changes).length > 0 && (
            <div className="row mt-3">
              <div className="col-12">
                <h6 className="mb-3 fw-semibold text-primary">Changes</h6>
                <div className="card bg-light">
                  <div className="card-body">
                    <pre className="mb-0" style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
                      {JSON.stringify(selectedObj.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedObj.user_agent && (
            <div className="row mt-3">
              <div className="col-12">
                <h6 className="mb-3 fw-semibold text-primary">User Agent</h6>
                <div className="alert alert-light">
                  <p className="mb-0" style={{ fontSize: "0.9rem" }}>
                    {selectedObj.user_agent}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
