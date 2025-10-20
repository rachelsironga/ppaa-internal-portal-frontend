import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import "animate.css";
import { useNavigate } from "react-router-dom";
import { ApprovalRequestsContext } from "../utils/context";
import PaginatedTable from "../components/ui-templates/PaginatedTable";
import { formatDate } from "../helpers/DateFormater";

export const DashboardPage = () => {
  const user = useSelector((state) => state.userReducer?.data);
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAnalitics();
  }, []);
  return (
    <>
      <div className="row">
        <div className="col-lg-8 mb-4 order-0">
          <div className="card">
            <div className="d-flex align-items-end row">
              <div className="col-sm-7">
                <div className="card-body">
                  <h5 className="card-title text-primary">
                    Welcome, {user?.first_name} {user?.last_name}!
                  </h5>
                  <p className="mb-4">
                    Please note that every action you perform in{" "}
                    <span className="fw-medium">E-APPROVAL</span> is crucial to
                    the success of the organization.
                  </p>
                  <button
                    aria-label="view badges"
                    onClick={() => navigate("/requests")}
                    className="btn btn-sm btn-outline-primary"
                  >
                    View My Pending Approvals
                  </button>
                </div>
              </div>
              <div className="col-sm-5 text-center text-sm-left">
                <div className="card-body pb-0 px-0 px-md-4">
                  <img
                    aria-label="dashboard icon image"
                    src="/assets/img/illustrations/man-with-laptop-light.png"
                    height="140"
                    alt="View Badge User"
                    data-app-dark-img="illustrations/man-with-laptop-dark.png"
                    data-app-light-img="illustrations/man-with-laptop-light.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4 col-md-4 order-1">
          <div className="row">
            <div className="col-lg-6 col-md-12 col-6 mb-4">
              <div className="card">
                <div className="card-body">
                  <div className="card-title d-flex align-items-start justify-content-between">
                    <div className="avatar flex-shrink-0">
                      <img
                        aria-label="dashboard icon image"
                        src="/assets/img/icons/unicons/chart-success.png"
                        alt="chart success"
                        className="rounded"
                      />
                    </div>
                    <div className="dropdown">
                      <button
                        aria-label="Click me"
                        className="btn p-0"
                        type="button"
                        id="cardOpt3"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div
                        className="dropdown-menu dropdown-menu-end"
                        aria-labelledby="cardOpt3"
                      >
                        <a
                          aria-label="view more"
                          className="dropdown-item"
                          href="#"
                        >
                          View More
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className="fw-medium d-block mb-1">My Requestes</span>
                  <h3 className="card-title mb-2">--</h3>
                  <small className="text-success fw-medium">
                    <i className="bx bx-count"></i> -- %
                  </small>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-6 mb-4">
              <div className="card">
                <div className="card-body">
                  <div className="card-title d-flex align-items-start justify-content-between">
                    <div className="avatar flex-shrink-0">
                      <img
                        aria-label="dsahboard icon image"
                        src="/assets/img/icons/unicons/wallet-info.png"
                        alt="Credit Card"
                        className="rounded"
                      />
                    </div>
                    <div className="dropdown">
                      <button
                        aria-label="Click me"
                        className="btn p-0"
                        type="button"
                        id="cardOpt6"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                      >
                        <i className="bx bx-dots-vertical-rounded"></i>
                      </button>
                      <div
                        className="dropdown-menu dropdown-menu-end"
                        aria-labelledby="cardOpt6"
                      >
                        <a
                          aria-label="view more"
                          className="dropdown-item"
                          href="#"
                        >
                          View More
                        </a>
                      </div>
                    </div>
                  </div>
                  <span className="fw-medium d-block mb-1">
                    On Approving Process
                  </span>
                  <h3 className="card-title mb-2">--</h3>
                  <small className="text-success fw-medium">
                    <i className="bx bx-up-arrow-alt"></i> -- %
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-12 col-sm-12 col-md-4 order-0">
          <ApprovalRequestsContext.Provider
            value={{
              selectedObj,
              setSelectedObj,
              tableRefresh,
              setTableRefresh,
            }}
          >
            <PaginatedTable
              fetchPath="/approval-request"
              title="List of System  Approval Requests"
              columns={[
                {
                  key: "SN",
                  label: "SN",
                  style: { width: "80px" },
                  className: "text-center",
                },
                {
                  key: "created_at",
                  label: "Request Date",
                  style: { width: "150px" },
                  className: "text-right",
                  render: (row) => (
                    <span className="text-purple">
                      {formatDate(row.created_at, "DD/MM/YYYY HH:mm:ss") || "-"}
                    </span>
                  ),
                },
                {
                  key: "requester_name",
                  label: "Requested by",
                  className: "cursor-pointer text-bold",
                  width: { width: "120px" },
                },
                {
                  key: "title",
                  label: "Request Title",
                  className: "text-justify",
                  render: (row) => {
                    const text = String(row.title || "");
                    return text.length > 50 ? text.slice(0, 50) + "..." : text;
                  },
                },
                {
                  key: "type",
                  label: "Request Types",
                  className: "text-justify",
                  style: { width: "100px" },
                  render: (row) => {
                    return `${row.type}`.replaceAll("_", " ");
                  },
                },
                {
                  key: "status",
                  label: "Status",
                  style: { width: "150px" },
                  render: (row) => (
                    <span
                      className={
                        row.status === "NEW"
                          ? "badge bg-label-primary me-1"
                          : row.status === "PENDING"
                          ? "badge bg-label-warning me-1"
                          : row.status === "REJECTED" ||
                            row.status === "CANCELLED" ||
                            row.status === "EXPIRED"
                          ? "badge bg-label-danger me-1"
                          : row.status === "APPROVED"
                          ? "badge bg-label-success me-1"
                          : "badge bg-label-info me-1"
                      }
                    >
                      {row.status}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  className: "text-center",
                  style: { width: "120px" },
                  render: (row) => (
                    <button
                      aria-label="Click me"
                      type="button"
                      className="btn p-0 dropdown-toggle hide-arrow text-info"
                      data-bs-toggle="dropdown"
                      onClick={() => {
                        navigate(`/requests/open/${row.uid}`);
                      }}
                    >
                      <i className="bx bx-link-external"></i>&nbsp; View
                    </button>
                  ),
                },
              ]}
              isRefresh={tableRefresh}
              // filters={[
              //   { value: "ALL", label: "All Request" },
              //   { value: "MY_REQUEST", label: "My Requests" },
              //   { value: "RELATED", label: "Related Requests" },
              //   { value: "NEW", label: "New" },
              //   { value: "PENDING", label: "Pending" },
              //   { value: "APPROVED", label: "Approved" },
              //   { value: "REJECTED", label: "Rejected" },
              // ]}
              filterSelected={["RELATED"]}
            />
          </ApprovalRequestsContext.Provider>
        </div>
      </div>
    </>
  );
};
