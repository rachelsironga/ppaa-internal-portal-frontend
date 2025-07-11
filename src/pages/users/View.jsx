import React, { createContext, useState, useEffect } from "react";
import { deleteUser, getUsers } from "./Queries";
import Swal from "sweetalert2";
import showToast from "../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import usePagination from "../../hooks/usePagination";
import ReactPaginate from "react-paginate";
import { UsersContext } from "../../utils/context";
import { useNavigate } from "react-router-dom";
import { UserModal } from "./Modal";

import "animate.css";
import BreadCumb from "../../layouts/BreadCumb";

export const UserListPage = () => {
  const navigate = useNavigate();
  const pageSizeData = [5, 10, 20, 50, 70, 100];
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null); //Get data for editing / deleting
  const [searchQuery, setSearchQuery] = useState("");
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const {
    currentPage,
    totalCount,
    pageSize,
    updatePage,
    updatePageSize,
    updatePagination,
    updateTotalCount,
  } = usePagination(10, 1, true);

  const handlePageClick = (event) => {
    updatePage(event.selected + 1);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsers({
        search: searchQuery,
        pagination: {
          page: currentPage,
          page_size: pageSize,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setUsers(result.data);
        if (result.pagination) {
          updatePagination(result.pagination);
          updateTotalCount(result.pagination.total || 0);
        } else {
          updatePagination({});
        }
      } else {
        setError(true);
        showToast("No User Found", "warning", "Fetch Completed");
      }
    } catch (err) {
      setError(true);
      showToast("Unable to Fetch Users", "warning", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user = null) => {
    if (!user) {
      Swal.fire("Error!", "Unable to Select this User.", "error");
      return;
    }

    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "Your About to Delete the data",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Yes, delete it!",
      });

      if (confirmation.isConfirmed) {
        const result = await deleteUser(user.uid);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "The User has been deleted.",
            "success"
          );
          fetchUsers();
        } else {
          console.error("Error deleting User:", result);
          Swal.fire("Error Occurred!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting User:", error);
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Delete. Please Try Again or Contact Support Team`,
        "error"
      );
    }

    setSelectedUser(null); // Reset selected User after deletion
  };

  // Fetch Users on initial load
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    // Set new debounce timeout
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 1500); // 2.5 seconds

    setDebounceTimeout(timeout);

    return () => clearTimeout(timeout); // Cleanup on unmount
  }, [searchQuery, pageSize, currentPage]); // Fetch when search query changes

  return (
    <UsersContext.Provider
      value={{ fetchUsers, selectedUser, setSelectedUser }}
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
                      <h4 className="mb-0 me-2">{totalCount}</h4>
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

      <div className="card">
        <div className="d-flex justify-content-between align-items-center card-header mb-1">
          <h5 className="mb-0">User Managments</h5>
          <UserModal
            title="View User Managment"
            onClose={() => setSelectedUser(null)}
          />
        </div>

        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2 animate__animated animate__fadeInDown animate__faster">
            <div className="d-flex align-items-center col-md-8 col-sm-6">
              <label className="text-sm font-medium me-2 mb-0">
                Rows per page:
              </label>
              <select
                value={pageSize}
                onChange={(e) => {
                  updatePageSize(Number(e.target.value));
                  updatePage(1);
                  updatePagination({
                    page: 1,
                    page_size: Number(e.target.value),
                  });
                }}
                className="form-select"
                aria-label="Default select example"
                style={{ width: "80px" }}
              >
                {pageSizeData.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className=" col-md-4 col-sm-6  animate__animated animate__fadeInRight animate__fast">
              <form className="d-flex">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="tf-icons bx bx-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      updatePage(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        fetchUsers();
                      }
                    }}
                  />
                </div>
              </form>
            </div>
          </div>

          <div className=" text-nowrap animate__animated animate__fadeInUp animate__faster">
            <div className="table-responsive text-nowrap">
              <table className="table table-hover table-align-middle mb-0 table-bordered">
                <thead style={{ backgroundColor: "#f1f1f1" }}>
                  <tr key={"header-user-table"}>
                    <th style={{ width: "50px" }}>S/N</th>
                    <th style={{ width: "400px" }}>Name</th>
                    <th style={{ width: "80px" }}>PF-Number</th>
                    <th style={{ width: "100px" }}>Check-Number</th>
                    <th>Gender</th>
                    <th>Phone Number</th>
                    <th style={{ width: "50px" }}>Status</th>
                    <th style={{ width: "60px" }}>Actions</th>
                  </tr>
                </thead>

                <tbody className="table-border-bottom-0">
                  {loading ? (
                    <tr>
                      <td colSpan="100%">
                        <div className="col-md-12 col-lg-12 col-sm-12 p-2">
                          <center>
                            <ReactLoading
                              type={"cylon"}
                              color={"#696cff"}
                              height={"30px"}
                              width={"50px"}
                            />
                          </center>
                          <center className="mt-1">
                            <h6 className="text-muted">Fetching Users</h6>
                          </center>
                        </div>
                      </td>
                    </tr>
                  ) : error || users.length === 0 ? (
                    <tr>
                      <td colSpan="100%">
                        <div className="alert alert-info" role="alert">
                          <div className="alert-body text-center">
                            <p className="mb-0">No Data Found</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((userData, index) => (
                      <tr key={userData.uid}>
                        <td>{(currentPage - 1) * pageSize + index + 1}</td>
                        <td
                          className="fw-medium cursor-pointer"
                          onClick={() =>
                            navigate(`/users/open/${userData.guid}`)
                          }
                        >
                          <div className="d-flex justify-content-start align-items-center user-name">
                            <div className="avatar-wrapper">
                              <div className="avatar avatar-sm me-4">
                                <img
                                  src={
                                    userData.photo ||
                                    "../../assets/img/avatars/1.png"
                                  }
                                  alt="Avatar"
                                  className="rounded-circle"
                                />
                              </div>
                            </div>
                            <div className="d-flex flex-column">
                              <a
                                href={`/users/open/${userData.uid}`}
                                className="text-heading text-truncate"
                              >
                                <span className="fw-medium">
                                  {userData.first_name} {userData.middle_name}{" "}
                                  {userData.last_name}
                                </span>
                              </a>
                              <small className="text-primary">
                                {userData.email}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td className="fw-medium">{userData.pf_number}</td>
                        <td className="fw-medium">{userData.check_number}</td>
                        <td className="fw-medium">
                          {userData.sex === "MALE"
                            ? "Male"
                            : userData.sex === "FEMALE"
                            ? "Female"
                            : "N/A"}
                        </td>
                        <td className="fw-medium">{userData.phone_number}</td>
                        <td className="fw-medium">
                          <span
                            className={
                              userData.status === "ACTIVE"
                                ? "badge bg-label-primary me-1"
                                : userData.status === "NEW"
                                ? "badge bg-label-warning me-1"
                                : userData.status === "SUSPENDED" ||
                                  userData.status === "CANCELLED" ||
                                  userData.status === "EXPIRED"
                                ? "badge bg-label-danger me-1"
                                : userData.status === "RETIRED"
                                ? "badge bg-label-secondary me-1"
                                : "badge bg-label-info me-1"
                            }
                          >
                            {userData.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="dropdown">
                            <button
                              aria-label="Click me"
                              type="button"
                              className="btn p-0 dropdown-toggle hide-arrow"
                              data-bs-toggle="dropdown"
                            >
                              <i className="bx bx-menu"></i>
                            </button>
                            <div className="dropdown-menu">
                              <button
                                className="dropdown-item"
                                onClick={() =>
                                  navigate(`/users/open/${userData.guid}`)
                                }
                              >
                                <i className="bx bx-edit-alt me-1"></i> View
                              </button>
                              {/* <a
                                                                aria-label="dropdown action option"
                                                                className="dropdown-item text-danger"
                                                                href="#"
                                                                onClick={async () => {
                                                                    handleDelete(userData);
                                                                }}
                                                            >
                                                                <i className="bx bx-trash me-1"></i> Delete
                                                            </a> */}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
              {/* Your content here */}
              <div></div>
              <ReactPaginate
                previousLabel={"Previous"}
                nextLabel={"Next"}
                breakLabel={"..."}
                pageCount={Math.ceil((totalCount || 0) / (pageSize || 1))}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageClick}
                containerClassName={"pagination justify-content-center"}
                pageClassName={"page-item"}
                pageLinkClassName={"page-link"}
                previousClassName={"page-item"}
                previousLinkClassName={"page-link"}
                nextClassName={"page-item"}
                nextLinkClassName={"page-link"}
                breakClassName={"page-item"}
                breakLinkClassName={"page-link"}
                activeClassName={"active"}
              />
            </div>
          </div>
        </div>
      </div>
    </UsersContext.Provider>
  );
};
