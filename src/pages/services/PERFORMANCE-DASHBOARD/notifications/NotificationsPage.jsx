import React from "react";
import BreadCumb from "../../../../layouts/BreadCumb";

export const NotificationsPage = () => {
  return (
    <>
      <BreadCumb pageList={["SPISM", "Notifications"]} />
      <div className="card shadow-sm animate__animated animate__fadeInUp animate__fast">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-semibold">
            <i className="bx bx-bell me-2 text-primary"></i>
            Alerts & Notifications
          </h5>
        </div>
        <div className="card-body">
          <p className="text-muted mb-0">
            Approval notifications, return notifications, deadline reminders, and underperformance alerts can be integrated here. This area is reserved for future notification and workflow automation.
          </p>
        </div>
      </div>
    </>
  );
};
