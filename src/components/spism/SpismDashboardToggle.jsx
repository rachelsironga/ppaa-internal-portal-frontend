import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  getVisibleSpismDashboards,
} from "../../utils/spismDashboardNav";
import "./spismDashboardToggle.css";

/**
 * E-Approval style dashboard switcher — shown only when the user can access 2+ SPISM dashboards.
 */
export function SpismDashboardToggle() {
  const user = useSelector((state) => state.userReducer?.data);
  const location = useLocation();
  const navigate = useNavigate();

  const dashboards = useMemo(() => getVisibleSpismDashboards(user), [user]);
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

export default SpismDashboardToggle;
