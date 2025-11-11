import React, { useState, useMemo } from "react";
import MarkupViewer from "./MarkupViewer";

const ResultPanel = ({
  title = "Result",
  html = "",
  initiallyOpen = true,
  isViewer = false,
}) => {
  const [open, setOpen] = useState(initiallyOpen);

  const panelStyle = useMemo(
    () => ({
      borderRadius: 12,
      background:
        "linear-gradient(180deg, rgba(220,249,235,0.55), rgba(245,255,248,0.45))",
      border: "1.5px solid rgba(50,168,82,0.16)",
      boxShadow: "0 8px 24px rgba(32, 120, 39, 0.06)",
      padding: "0.5rem",
      overflow: "hidden",
    }),
    []
  );

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    padding: "0.6rem 0.75rem",
    borderBottom: open ? "1px solid rgba(50,168,82,0.06)" : "none",
  };

  const titleStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    cursor: "pointer",
  };

  const badgeStyle = {
    background: "rgba(50,168,82,0.12)",
    color: "#2f8a3f",
    padding: "0.25rem 0.5rem",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: "0.85rem",
  };

  return (
    <div style={panelStyle} className="result-panel">
      <div style={headerStyle}>
        <div
          style={titleStyle}
          onClick={() => setOpen((v) => !v)}
          aria-hidden="true"
        >
          <div style={badgeStyle}>
            <i className="bx bx-check-circle"></i>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#175d34" }}>{title}</div>
            <div style={{ fontSize: "0.85rem", color: "#3e6c4f" }}>
              Click to {open ? "collapse" : "expand"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            aria-label={open ? "Collapse" : "Expand"}
            className="btn btn-sm btn-outline-success"
            onClick={() => setOpen((v) => !v)}
          >
            <i className={open ? "bx bx-chevron-up" : "bx bx-chevron-down"} />
          </button>

          <button
            type="button"
            aria-label="Close"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setOpen(false)}
          >
            <i className="bx bx-x" />
          </button>
        </div>
      </div>

      <div
        style={{
          maxHeight: open ? 520 : 0,
          transition: "max-height 360ms ease",
          overflow: "hidden",
          padding: open ? "0.75rem" : "0 0.75rem",
        }}
      >
        {html ? (
          <div style={{ background: "transparent", overflow: "auto" }}>
            {isViewer ? (
              <MarkupViewer html={html} />
            ) : (
              <div className="row g-4 px-4">
                <p className="text-muted text-center py-5">
                  The instruction from the handler is now visible to the
                  requester.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted">No content available.</div>
        )}
      </div>
    </div>
  );
};




export default ResultPanel;
