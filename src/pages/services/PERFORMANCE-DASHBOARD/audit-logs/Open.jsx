import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { getSpismAuditLogs } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";

const getActionBadge = (action) => {
  const a = (action || "").toUpperCase();
  const map = {
    APPROVE: { class: "bg-success", label: "Approve", icon: "bx-check" },
    RETURN: { class: "bg-danger", label: "Return", icon: "bx-undo" },
    COMMENT: { class: "bg-info", label: "Comment", icon: "bx-message-detail" },
  };
  return map[a] || { class: "bg-secondary", label: a || "Action", icon: "bx-info-circle" };
};

export const PerformanceAuditLogOpenPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await getSpismAuditLogs({ uid });
      if (res?.status === 200 || res?.status === 8000) {
        setLog(res.data ?? res);
      } else {
        setLog(null);
        showToast(res?.message || "Unable to fetch audit log details", "warning", "Fetch Failed");
      }
    } catch {
      setLog(null);
      showToast("Unable to fetch audit log details", "danger", "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, [uid]);

  if (loading) {
    return (
      <>
        <BreadCumb pageList={["SPISM", "Audit & Logs", "View"]} />
        <div className="card">
          <div className="card-body">
            <center>
              <ReactLoading type="cylon" color="#00853f" height={30} width={50} />
              <h6 className="text-muted mt-2">Loading Audit Log Details...</h6>
            </center>
          </div>
        </div>
      </>
    );
  }

  if (!log) {
    return (
      <>
        <BreadCumb pageList={["SPISM", "Audit & Logs", "View"]} />
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              <div className="alert-body text-center">
                <p className="mb-0">
                  Sorry! Unable to get Audit Log Details. Please contact System Administrator.
                </p>
                <button
                  className="btn btn-primary btn-sm mt-3"
                  onClick={() => navigate("/performance-dashboard/audit-logs")}
                >
                  <i className="bx bx-arrow-back me-1"></i> Back to Audit Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const actionInfo = getActionBadge(log.action);

  return (
    <>
      <BreadCumb pageList={["SPISM", "Audit & Logs", "View"]} />

      {/* Header card */}
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
                    {actionInfo.label} action on {log.model_name || log.entity_type || "Entity"}
                  </h4>
                  <p className="mb-2 text-muted">
                    {log.object_repr || "No object description"} (ID: {log.entity_id || "N/A"})
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`badge ${actionInfo.class}`}>
                      <i className={`bx ${actionInfo.icon} me-1`}></i>
                      {log.action}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-end">
              <button
                type="button"
                className="btn btn-label-secondary btn-sm"
                onClick={() => navigate("/performance-dashboard/audit-logs")}
              >
                <i className="bx bx-arrow-back me-1"></i> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="row mb-4">
        <div className="col-xl-4 col-md-6 mb-3">
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
                    {log.user_name || "System"}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 mb-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-info">
                    <i className="bx bx-cube fs-4"></i>
                  </span>
                </div>
                <div className="flex-grow-1">
                  <small className="text-muted d-block mb-1">Entity</small>
                  <h6 className="mb-0">
                    {log.model_name || log.entity_type || "N/A"}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-6 mb-3">
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
                    {log.timestamp ? formatDate(log.timestamp, "DD/MM/YYYY HH:mm:ss") : "N/A"}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
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
                      <span className={`badge ${actionInfo.class}`}>{log.action}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-cube me-2 text-info"></i>
                      Entity type:
                    </td>
                    <td>
                      <strong>{log.entity_type || "-"}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-medium">
                      <i className="bx bx-hash me-2 text-muted"></i>
                      Entity ID:
                    </td>
                    <td>
                      <small className="text-muted">{log.entity_id || "-"}</small>
                    </td>
                  </tr>
                  {log.comment && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-comment-detail me-2 text-info"></i>
                        Comment:
                      </td>
                      <td>{log.comment}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h6 className="mb-3 fw-semibold text-primary">Context</h6>
              <table className="table table-borderless">
                <tbody>
                  {log.ip_address && (
                    <tr>
                      <td className="fw-medium" style={{ width: "40%" }}>
                        <i className="bx bx-globe me-2 text-warning"></i>
                        IP Address:
                      </td>
                      <td>
                        <strong className="text-muted">{log.ip_address}</strong>
                      </td>
                    </tr>
                  )}
                  {log.user_agent && (
                    <tr>
                      <td className="fw-medium">
                        <i className="bx bx-desktop me-2 text-info"></i>
                        User Agent:
                      </td>
                      <td>
                        <small className="text-muted">{log.user_agent}</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {(log.old_value || log.new_value) && (
            <div className="row mt-3">
              <div className="col-12">
                <h6 className="mb-3 fw-semibold text-primary">Changes</h6>
                <div className="card bg-light">
                  <div className="card-body">
                    <pre className="mb-0" style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem" }}>
                      {JSON.stringify(
                        { before: log.old_value || null, after: log.new_value || null },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

