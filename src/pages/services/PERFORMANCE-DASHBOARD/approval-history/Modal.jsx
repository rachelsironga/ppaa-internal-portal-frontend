import React, { useEffect } from "react";
import { formatDate } from "../../../../helpers/DateFormater";

const ApprovalHistoryDetailModal = ({ modalId = "approvalHistoryDetailModal", item, onClose }) => {
  useEffect(() => {
    const el = document.getElementById(modalId);
    if (!el || !onClose) return;
    const handleHidden = () => onClose();
    el.addEventListener("hidden.bs.modal", handleHidden);
    return () => el.removeEventListener("hidden.bs.modal", handleHidden);
  }, [modalId, onClose]);

  const handleClose = () => {
    const el = document.getElementById(modalId);
    const modal = window.bootstrap?.Modal?.getInstance(el);
    if (modal) modal.hide();
    onClose?.();
  };

  const renderJson = (val) => {
    if (val == null) return "—";
    if (typeof val === "string") return val;
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  };

  return (
    <div
      className="modal modal-slide-in"
      id={modalId}
      tabIndex="-1"
      aria-hidden="true"
      data-bs-backdrop="static"
      data-bs-keyboard="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center">
              <i className="bx bx-history me-2 text-primary"></i>
              Approval history detail
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            />
          </div>
          <div className="modal-body">
            {item ? (
              <>
                <div className="mb-3">
                  <table className="table table-borderless table-sm">
                    <tbody>
                      <tr>
                        <td className="text-muted fw-medium" style={{ width: "120px" }}>Time</td>
                        <td>{formatDate(item.timestamp, "DD/MM/YYYY HH:mm") || "—"}</td>
                      </tr>
                      <tr>
                        <td className="text-muted fw-medium">Entity</td>
                        <td>
                          <span className="badge bg-label-primary me-1">{item.entity_type}</span>
                          <span className="text-break">{item.entity_id}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted fw-medium">Action</td>
                        <td><span className="badge bg-label-info">{item.action}</span></td>
                      </tr>
                      <tr>
                        <td className="text-muted fw-medium">User</td>
                        <td>{item.user_name ?? "—"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {item.comment && (
                  <div className="mb-3">
                    <small className="text-muted text-uppercase fw-semibold">Comment</small>
                    <div className="alert alert-light border mt-1 mb-0">
                      <p className="mb-0">{item.comment}</p>
                    </div>
                  </div>
                )}
                {(item.old_value != null || item.new_value != null) && (
                  <div className="row g-2">
                    {item.old_value != null && (
                      <div className="col-12">
                        <small className="text-muted text-uppercase fw-semibold">Previous value</small>
                        <pre className="bg-light border rounded p-2 small mb-0 mt-1" style={{ maxHeight: "120px", overflow: "auto" }}>
                          {renderJson(item.old_value)}
                        </pre>
                      </div>
                    )}
                    {item.new_value != null && (
                      <div className="col-12">
                        <small className="text-muted text-uppercase fw-semibold">New value</small>
                        <pre className="bg-light border rounded p-2 small mb-0 mt-1" style={{ maxHeight: "120px", overflow: "auto" }}>
                          {renderJson(item.new_value)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted mb-0">Loading…</p>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-label-secondary"
              onClick={handleClose}
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalHistoryDetailModal;
