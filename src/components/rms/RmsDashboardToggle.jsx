import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getVisibleRmsDashboards } from "../../utils/rmsDashboardNav";
import "../spism/spismDashboardToggle.css";

/** E-Approval style switcher — shown only when the user can access 2+ RMS dashboards. */
export function RmsDashboardToggle() {
  const user = useSelector((state) => state.userReducer?.data);
  const location = useLocation();
  const navigate = useNavigate();

  const dashboards = useMemo(() => getVisibleRmsDashboards(user), [user]);
  const currentPath = location.pathname.split("?")[0];

  if (dashboards.length < 2) return null;

  return (
    <div className="spism-dashboard-toggle" role="group" aria-label="Switch dashboard view">
      {dashboards.map((dash) => {
        const path = (dash.link || "").split("?")[0];
        const active = currentPath === path;
        return (
          <button
            key={dash.id}
            type="button"
            className={`btn btn-sm spism-dashboard-toggle__btn ${
              active ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => navigate(path)}
            aria-current={active ? "page" : undefined}
          >
            {dash.text}
          </button>
        );
      })}
    </div>
  );
}

export default RmsDashboardToggle;
