import { useNavigate } from "react-router-dom";

/**
 * Breadcrumb row aligned with internal portal {@link ./BreadCumb.jsx}:
 * Back (outline) · PPAA Maoni / Suggestion (highlight) / tail label.
 */
const MaoniPortalBreadcrumb = ({ onBack, tailLabel = "View" }) => {
  const navigate = useNavigate();

  return (
    <h4 className="py-3 mb-3 animate__animated animate__fadeInLeft animate__slow">
      <div className="d-flex align-items-center flex-wrap gap-1">
        <button
          type="button"
          className="btn btn-sm btn-outline-info pe-1 text-start"
          style={{
            fontSize: "12px",
            marginRight: "6px",
            animation: "pulseAttention 3s ease",
            animationIterationCount: "infinite",
          }}
          onClick={onBack}
        >
          <i className="bx bx-left-arrow-alt"></i>&nbsp;Back&nbsp;&nbsp;
        </button>
        <span className="fw-light text-muted">&nbsp;/&nbsp;</span>
        <button
          type="button"
          className="btn btn-link fw-light text-muted p-0 text-decoration-none"
          style={{ fontSize: "inherit" }}
          onClick={() => navigate("/ppaa-maoni")}
        >
          PPAA Maoni
        </button>
        <span className="fw-light text-muted">&nbsp;/&nbsp;</span>
        <span
          className="fw-light px-2 py-1 rounded small"
          style={{
            backgroundColor: "#dbeafe",
            color: "#1e3a8a",
          }}
        >
          Suggestion
        </span>
        <span className="fw-light text-muted">&nbsp;/&nbsp;</span>
        <span className="fw-light text-dark">{tailLabel}</span>
      </div>
    </h4>
  );
};

export default MaoniPortalBreadcrumb;
