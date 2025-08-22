import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect, useContext } from "react";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";
import { RolesManagementContext } from "../../../../utils/context";
import BreadCumb from "../../../../layouts/BreadCumb";
import { HashUtil } from "../../../../helpers/HashUtil";
import { deleteData, fetchData } from "../../../../utils/GlobalQueries";
import AnimatedTabs from "../../../../components/ui-templates/AnimatedTabs";
import SystemRoleModal from "./Modal";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import ReactLoading from "react-loading";
import UsersModal from "./UsersModal";

export const OpenRolesManagementPage = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [selectedObj, setSelectedObj] = useState(null);
  const [tableRefresh, setTableRefresh] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredPermissions = selectedObj?.permissions?.filter((perm) =>
    perm.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const result = await fetchData({
        uid: HashUtil.unhashNumber(uid),
        url: "/system/roles",
      });

      if (result.status === 200 || result.status === 8000) {
        setSelectedObj(result.data);
      } else {
        setSelectedObj(null);
        showToast(
          "Unable to Fetch Role Details",
          "warning",
          "Fetch Completed!"
        );
      }
    } catch (err) {
      setSelectedObj(null);
      showToast("Unable to Fetch Role Details", "danger", "Failed!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, []);

  const handleDelete = async (selectedUser = "") => {
    if (!selectedObj) {
      Swal.fire("Error!", "Unable to Read Selected Role", "error");
      return;
    }

    if (selectedUser === "") {
      Swal.fire("Error!", "Unable to Read Selected User", "error");
      return;
    }

    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "Your About to Remove Users Role",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Yes, delete it!",
      });

      if (confirmation.isConfirmed) {
        const result = await deleteData({
          url: "/system/roles-assign-users",
          filter: {
            page: 1,
            page_size: 10,
            paginated: true,
            user: selectedUser,
            role: selectedObj?.id,
          },
        });
        if (result.status === 200 || result.status === 8000) {
          setTableRefresh((prev) => prev + 1);
          Swal.fire(
            "Process Completed!",
            "The User has been deleted From Role.",
            "success"
          );
        } else {
          Swal.fire("Process Failed", `${result.message}`, "warning");
        }
      }
    } catch (error) {
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Remove. Please Try Again or Contact Support Team`,
        "error"
      );
    }
  };

  return (
    <RolesManagementContext.Provider
      value={{
        selectedObj,
        setSelectedObj,
        tableRefresh,
        setTableRefresh,
      }}
    >
      {selectedObj && <span className="d-none">{selectedObj.name}</span>}
      <BreadCumb pageList={["Roles Managements", "view"]} />

      <div className="card animate__animated animate__fadeInUp animate__fast mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap mb-6 gap-2 mb-2">
            <div className="me-1">
              <h5 className="mb-0">Preview System Role</h5>
              <p className="mb-0 text-muted">
                Use Right Options Button to perform different Actions
              </p>
            </div>

            <div className="d-flex align-items-center">
              <button
                aria-label="Click me"
                type="button"
                className="btn btn-primary ms-auto btn-sm   animate__animated animate__fadeInRight animate__slow me-1"
                data-bs-toggle="modal"
                data-bs-target="#viewCreateRoleModal"
              >
                <i className="bx bx-edit-alt me-1"></i> Update Role &
                Permissions
              </button>
            </div>
          </div>
          {loading ? (
            <div className="col-md-12 col-lg-12 col-sm-12 p-2  animate__animated animate__fadeInUp animate__fast">
              <center>
                <ReactLoading
                  type={"cylon"}
                  color={"#696cff"}
                  height={"30px"}
                  width={"50px"}
                />
              </center>
              <center className="mt-1">
                <h6 className="text-muted">Fetching Data</h6>
              </center>
            </div>
          ) : (
            <div className="col-lg-12 col-md-12 animate__animated animate__fadeInUp animate__fast">
              <div className="m-4">
                <p className="text-nowrap mb-2">
                  <i className="icon-base bx bx-user me-2 align-top" />
                  <span className=" me-3 ">Name:</span>
                  <strong className="bold">{selectedObj?.name}</strong>
                </p>
                <p className="text-nowrap mb-2">
                  <i className="icon-base bx bx-card me-2 align-bottom" />
                  <span className=" me-3 ">Last Update:</span>
                  {selectedObj?.last_update_at && (
                    <strong className="bold">
                      {formatDate(
                        selectedObj?.last_update_at,
                        "DD/MM/YYYY HH:mm:ss"
                      )}
                    </strong>
                  )}
                  {selectedObj?.last_updated_by && (
                    <span className="ms-2">
                      &nbsp; By &nbsp;
                      <i className="icon-base bx bx-user me-2 align-top" />
                      <strong className="bold">
                        {selectedObj?.last_updated_by}
                      </strong>
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="nav-align-top mb-4 ">
        <ul
          className="nav nav-pills mb-3 animate__animated animate__fadeInLeft animate__fast"
          role="tablist"
        >
          <li className="nav-item">
            <button
              aria-label="Click me"
              type="button"
              className="nav-link active shadow-sm mr-1"
              role="tab"
              data-bs-toggle="tab"
              data-bs-target="#navs-pills-top-granted-users"
              aria-controls="navs-pills-top-granted-users"
              aria-selected="true"
            >
              <i className="icon-base bx bx-user icon-sm me-1_5"></i>
              Granted Users
            </button>
          </li>
          <li className="nav-item">
            <button
              aria-label="Click me"
              type="button"
              className="nav-link shadow-sm"
              role="tab"
              data-bs-toggle="tab"
              data-bs-target="#navs-pills-top-permissions"
              aria-controls="navs-pills-top-permissions"
              aria-selected="false"
            >
              <i className="icon-base bx bx-lock icon-sm me-1_5"></i>
              Permissions
            </button>
          </li>
        </ul>
        <div className="tab-content">
          <div
            className="tab-pane fade show active"
            style={{ minHeight: "40vh" }}
            id="navs-pills-top-granted-users"
            role="tabpanel"
          >
            {loading ? (
              <div className="col-md-12 col-lg-12 col-sm-12 p-2  animate__animated animate__fadeInUp animate__fast">
                <center>
                  <ReactLoading
                    type={"cylon"}
                    color={"#696cff"}
                    height={"30px"}
                    width={"50px"}
                  />
                </center>
                <center className="mt-1">
                  <h6 className="text-muted">Fetching Data</h6>
                </center>
              </div>
            ) : (
              <PaginatedTable
                fetchPath={`/system/roles-users?role_id=${selectedObj?.id}`}
                filters={[]}
                title="List Of Users"
                columns={[
                  {
                    key: "SN",
                    label: "SN",
                    style: { width: "80px" },
                    className: "text-center",
                  },
                  {
                    key: "granted_user_name",
                    label: "Name",
                    className: "cursor-pointer",
                    render: (row) => (
                      <div
                        className="d-flex justify-content-start align-items-center user-name"
                        onClick={() => {
                          navigate(`/users/open/${row.guid}`);
                        }}
                      >
                        <div className="avatar-wrapper">
                          <div className="avatar avatar-sm me-4">
                            <img
                              src={
                                row.photo || "../../assets/img/avatars/1.png"
                              }
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
                          <small className="text-primary">
                            {row.email && row.email !== ""
                              ? row.email
                              : "- - -"}
                          </small>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "granted_user_pf_number",
                    label: "PF-Number",
                    className: "cursor-pointer",
                    style: { width: "150px" },
                    render: (row) => (
                      <span className="text-bold">{row.pf_number}</span>
                    ),
                  },
                  {
                    key: "granted_user_status",
                    label: "Status",
                    className: "cursor-pointer",
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
                        className="btn btn-sm btn-outline-danger text-center"
                        onClick={() => {
                          handleDelete(row?.guid);
                        }}
                      >
                        <i className="bx bx-trash"></i>
                        Remove user
                      </button>
                    ),
                  },
                ]}
                buttons={[
                  {
                    label: "Add System Roles",
                    render: () => (
                      <button
                        aria-label="Click me"
                        type="button"
                        className="btn btn-primary ms-auto btn-sm   animate__animated animate__fadeInRight animate__slow me-1"
                        data-bs-toggle="modal"
                        data-bs-target="#permiteUserModal"
                      >
                        <i className="bx bx-edit-alt me-1"></i> Grant New User
                      </button>
                    ),
                  },
                ]}
                isRefresh={tableRefresh}
              />
            )}
          </div>
          <div
            className="tab-pane fade"
            style={{ minHeight: "40vh" }}
            id="navs-pills-top-permissions"
            role="tabpanel"
          >
            {loading ? (
              <>
                <center>
                  <ReactLoading
                    type={"cylon"}
                    color={"#696cff"}
                    height={"30px"}
                    width={"50px"}
                  />
                </center>
                <center className="mt-1">
                  <h6 className="text-muted">Fetching Data</h6>
                </center>
              </>
            ) : (
              <div className="col-md-8 col-lg-6 col-sm-12 p-2  animate__animated animate__fadeInUp animate__fast">
                <div className="me-3">
                  <h5 className="mb-0">All Role Permissions</h5>
                  <p className="mb-0 text-muted">
                    The bellow is List of All System Permissions Assignet to
                    This Role/Group. press Edit to change add or remove Role
                    Permission
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Search permission..."
                  className="form-control mb-2 my-3"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div
                  style={{
                    flex: 1,
                    minHeight: "120px",
                    maxHeight: "350px",
                    overflowY: "auto",
                    border: "1px solid #f0f0f0",
                    borderRadius: "6px",
                    background: "#fafbfc",
                    padding: "0.5rem",
                    textAlign: "left",
                  }}
                >
                  <ul className="list-group list-group-flush small">
                    {filteredPermissions?.map((perm) => (
                      <li
                        key={perm.codename}
                        className="list-group-item py-3 px-2 p-3 me-3"
                      >
                        <i
                          className="bx bx-check-shield me-2"
                          style={{
                            color: "#696cff",
                            fontSize: "1.1em",
                          }}
                        ></i>
                        {perm.name}
                      </li>
                    ))}

                    {filteredPermissions?.length === 0 && (
                      <li className="list-group-item justify-context-center text-center text-muted mt-4 py-3 px-2">
                        No permissions found
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <SystemRoleModal onSelect />
      <UsersModal />
    </RolesManagementContext.Provider>
  );
};
