import React from "react";
import "../spism/spismDashboard.css";

const RmsStatCard = ({ label, value, sub, icon, tone, onClick }) => (
  <div
    className={`spism-stat-card ${tone}${onClick ? " cursor-pointer" : ""}`}
    onClick={onClick}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === "Enter" || e.key === " ") onClick(e);
          }
        : undefined
    }
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    <div className="spism-stat-card__body">
      <div className="spism-stat-card__icon" aria-hidden="true">
        <i className={icon} />
      </div>
      <div className="spism-stat-card__label">{label}</div>
      <div className="spism-stat-card__value">{value}</div>
      {sub ? <div className="spism-stat-card__sub">{sub}</div> : null}
    </div>
  </div>
);

export default RmsStatCard;
