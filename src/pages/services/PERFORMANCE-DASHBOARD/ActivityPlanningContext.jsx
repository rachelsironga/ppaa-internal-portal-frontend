import React from "react";

/**
 * Shows parent objective + target for a SPISM activity (pending approvals list, etc.).
 * Backend: SpismActivitySerializer includes objective_title, target_title.
 */
export function ActivityPlanningContext({ row, variant = "table" }) {
  if (!row?.target_title && !row?.objective_title) return null;

  if (variant === "detail") {
    return (
      <div
        className="alert alert-light border mb-0 mt-3 py-3"
        role="region"
        aria-label="Planning hierarchy"
      >
        <div className="row g-3">
          {row.objective_title ? (
            <div className="col-md-6">
              <small className="text-muted d-block text-uppercase fw-semibold mb-1">Objective</small>
              <div className="fw-medium text-break">{row.objective_title}</div>
            </div>
          ) : null}
          {row.target_title ? (
            <div className="col-md-6">
              <small className="text-muted d-block text-uppercase fw-semibold mb-1">Target</small>
              <div className="fw-medium text-break text-primary">{row.target_title}</div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="small mt-2 pt-2 border-top border-light-subtle">
      {row.objective_title ? (
        <div className="mb-1">
          <span className="text-muted fw-semibold text-uppercase" style={{ fontSize: "0.68rem" }}>
            Objective
          </span>
          <div className="text-dark text-break">{row.objective_title}</div>
        </div>
      ) : null}
      {row.target_title ? (
        <div>
          <span className="text-muted fw-semibold text-uppercase" style={{ fontSize: "0.68rem" }}>
            Target
          </span>
          <div className="text-primary text-break">{row.target_title}</div>
        </div>
      ) : null}
    </div>
  );
}
