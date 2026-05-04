import React, { useEffect } from "react";

const ReturnCommentModal = ({ modalId = "returnCommentModal", item, onClose }) => {
  useEffect(() => {
    const el = document.getElementById(modalId);
    if (!el || !onClose) return;
    const handleHidden = () => onClose();
    el.addEventListener("hidden.bs.modal", handleHidden);
    return () => el.removeEventListener("hidden.bs.modal", handleHidden);
  }, [modalId, onClose]);

  const typeLabel =
    item?.type === "objective"
      ? "Objective"
      : item?.type === "target"
      ? "Target"
      : "Activity";
  const title =
    item?.title && item.title.length > 80
      ? `${item.title.substring(0, 80)}...`
      : item?.title || "—";

  const handleClose = () => {
    const el = document.getElementById(modalId);
    const modal = window.bootstrap?.Modal?.getInstance(el);
    if (modal) modal.hide();
    onClose?.();
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
              <i className="bx bx-message-square-error me-2 text-warning"></i>
              Return comment
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
                  <small className="text-muted text-uppercase fw-semibold">{typeLabel}</small>
                  <p className="mb-0 fw-semibold">{title}</p>
                </div>
                <div className="alert alert-warning mb-0">
                  <strong>Comment from ES:</strong>
                  <p className="mb-0 mt-2">
                    {item.approval_comment || "No comment provided."}
                  </p>
                </div>
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

export default ReturnCommentModal;
