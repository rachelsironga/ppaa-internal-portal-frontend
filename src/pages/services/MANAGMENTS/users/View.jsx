import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserModal } from "./Modal";

import "animate.css";
import BreadCumb from "../../../../layouts/BreadCumb";
import { UserImportModal } from "./ImportModal";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import { UsersContext } from "../../../../utils/context";

export const UserListPage = () => {
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const navigate = useNavigate();

  return (
    <UsersContext.Provider
      value={{
        selectedObj,
        setSelectedObj,
        tableRefresh,
        setTableRefresh,
      }}
    >
      <BreadCumb pageList={["Users"]} />
      <div className="flex-grow-1 container-p-y container-fluid">
        <div className="row g-6 mb-6" style={{ marginBottom: "20px" }}>
          <div className="col-sm-6 col-xl-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between">
                  <div className="content-left">
                    <span className="text-heading">Syatem Users</span>
                    <div className="d-flex align-items-center my-1">
                      <h4 className="mb-0 me-2">0</h4>
                      <p className="text-success mb-0">(100%)</p>
                    </div>
                    <small className="mb-0">Total Users</small>
                  </div>
                  <div className="avatar">
                    <span className="avatar-initial rounded bg-label-primary">
                      <i className="icon-base bx bx-group icon-lg"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-xl-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between">
                  <div className="content-left">
                    <span className="text-heading">Active Users</span>
                    <div className="d-flex align-items-center my-1">
                      <h4 className="mb-0 me-2">0</h4>
                      <p className="text-danger mb-0">(0%)</p>
                    </div>
                    <small className="mb-0">Last week analytics</small>
                  </div>
                  <div className="avatar">
                    <span className="avatar-initial rounded bg-label-success">
                      <i className="icon-base bx bx-user-check icon-lg"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-xl-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between">
                  <div className="content-left">
                    <span className="text-heading">Suspend Users</span>
                    <div className="d-flex align-items-center my-1">
                      <h4 className="mb-0 me-2">0</h4>
                      <p className="text-success mb-0">(0%)</p>
                    </div>
                    <small className="mb-0">Last week analytics </small>
                  </div>
                  <div className="avatar">
                    <span className="avatar-initial rounded bg-label-danger">
                      <i className="icon-base bx bx-user-plus icon-lg"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-xl-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex align-items-start justify-content-between">
                  <div className="content-left">
                    <span className="text-heading">Retired Users</span>
                    <div className="d-flex align-items-center my-1">
                      <h4 className="mb-0 me-2">0</h4>
                      <p className="text-success mb-0">(0%)</p>
                    </div>
                    <small className="mb-0">Last week analytics</small>
                  </div>
                  <div className="avatar">
                    <span className="avatar-initial rounded bg-label-warning">
                      <i className="icon-base bx bx-user-voice icon-lg"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaginatedTable
        fetchPath="/user/setup"
        isFullPath={true}
        title="List of System Users"
        columns={[
          {
            key: "SN",
            label: "SN",
            style: { width: "80px" },
            className: "text-center",
          },
          {
            key: "name",
            label: "Name",
            className: "cursor-pointer",
            style: { maxWidth: "300px", overFlow: "hidden" },

            render: (row) => (
              <div
                className="d-flex justify-content-start align-items-center user-name  text-truncate"
                onClick={() => {
                  navigate(`/users/open/${row.guid}`);
                }}
              >
                <div className="avatar-wrapper">
                  <div className="avatar avatar-sm me-4">
                    <img
                      src={row.photo || "../../assets/img/avatars/1.png"}
                      alt="Avatar"
                      className="rounded-circle"
                    />
                  </div>
                </div>
                <div className="d-flex flex-column">
                  <span className="text-heading text-truncate">
                    <span className="fw-medium">
                      {row.first_name} {row.middle_name} {row.last_name}
                    </span>
                  </span>
                  <small className="text-primary  text-truncate">
                    {row.current_level_name
                      ? row.current_level_name
                      : row.email !== ""
                      ? row.email
                      : "- - -"}
                  </small>
                </div>
              </div>
            ),
          },
          {
            key: "location",
            label: "Allocation",
            className: "cursor-pointer",
            style: { maxWidth: "400px", overFlow: "hidden" },
            render: (row) =>
              row.current_department_name && row.current_directory_name ? (
                <div className="d-flex flex-column">
                  <span className="text-heading text-truncate">
                    <span className="fw-medium">
                      {row.current_directory_name}
                    </span>
                  </span>
                  <small className="text-primary text-truncate">
                    {row.current_department_name}
                  </small>
                </div>
              ) : (
                <div className="text-muted p-2text-center">Not Assigned</div>
              ),
          },
          {
            key: "user_pf_number",
            label: "PF-Number",
            className: "fw-medium",
            style: { width: "120px" },

            render: (row) => <span className="text-bold">{row.pf_number}</span>,
          },
          {
            key: "user_check_number",
            label: "Check-Number",
            className: "fw-medium",
            style: { width: "120px" },
            render: (row) => (
              <span className="text-bold">{row.check_number}</span>
            ),
          },
          {
            key: "user_status",
            label: "Status",
            className: "fw-medium",
            style: { width: "150px" },
            render: (row) => (
              <span
                className={
                  row.status === "ACTIVE"
                    ? "badge bg-label-primary me-1"
                    : row.status === "NEW"
                    ? "badge bg-label-warning me-1"
                    : row.status === "SUSPENDED" ||
                      row.status === "CANCELLED" ||
                      row.status === "EXPIRED"
                    ? "badge bg-label-danger me-1"
                    : row.status === "RETIRED"
                    ? "badge bg-label-secondary me-1"
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
                onClick={() => navigate(`/users/open/${row.guid}`)}
              >
                <i className="bx bx-link-external"></i>&nbsp; View
              </button>
            ),
          },
        ]}
        buttons={[
          {
            label: "Import Users",
            render: () => (
              <button
                aria-label="Click me"
                type="button"
                className="btn btn-success ms-auto btn-sm me-4 animate__animated animate__fadeInRight animate__fast"
                data-bs-toggle="modal"
                data-bs-target="#viewCreateUserImportModal"
              >
                <i className="bx bx-table me-1"></i> Import &nbsp;Users
              </button>
            ),
          },
          {
            label: "Add System Roles",
            render: () => (
              <button
                aria-label="Click me"
                type="button"
                className="btn btn-primary ms-auto btn-sm   animate__animated animate__fadeInRight animate__slow me-1"
                data-bs-toggle="modal"
                data-bs-target="#viewCreateUserModal"
              >
                <i className="bx bx-edit-alt me-1"></i> Add System Users
              </button>
            ),
          },
        ]}
        filters={[
          { value: "ALL", label: "All" },
          { value: "ACTIVE", label: "Active" },
          { value: "NEW", label: "New" },
        ]}
        isRefresh={tableRefresh}
      />
      <UserModal />
      <UserImportModal />
    </UsersContext.Provider>
  );
};
