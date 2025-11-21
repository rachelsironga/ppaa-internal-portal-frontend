import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import usePagination from "../../../../hooks/usePagination";
import ReactPaginate from "react-paginate";
import "animate.css";
import { deletePatientAgeGroup, getPatientAgeGroups } from "./Queries";
import { PatientAgeGroupContext } from "../../../../utils/context";
import PatientAgeGroupsModal from "./Modal";

export const PatientAgeGroupPage = () => {
  const pageSizeData = [5, 10, 20, 50, 70, 100];
  const [patientAgeGroups, setPatientAgeGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectPatientAgeGroup, setSelectedPatientAgeGroup] = useState(null);
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

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPatientAgeGroups({
        search: searchQuery,
        pagination: {
          page: currentPage,
          page_size: pageSize,
          paginated: true,
        },
      });
      if (result.status === 200 || result.status === 8000) {
        setPatientAgeGroups(result.data);
        if (result.pagination) {
          updatePagination(result.pagination);
          updateTotalCount(result.pagination.total || 0);
        } else {
          updatePagination({});
        }
      } else {
        setError(true);
        showToast("No Patient Age Group Found", "warning", "Fetch Completed");
      }
    } catch (err) {
      setError(true);
      showToast("Unable to Fetch Patient Age Groups", "warning", "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patientAgeGroup = null) => {
    if (!patientAgeGroup) {
      Swal.fire("Error!", "Unable to Select this Patient Age Group.", "error");
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
        const result = await deletePatientAgeGroup(patientAgeGroup.uid);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "The Patient Age Group has been deleted.",
            "success"
          );
          handleFetchData();
        } else {
          console.error("Error deleting Patient Age Group:", result);
          Swal.fire("Error Occurred!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      console.error("Error deleting Patient Age Group:", error);
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Delete. Please Try Again or Contact Support Team`,
        "error"
      );
    }

    setSelectedPatientAgeGroup(null); // Reset selected PatientAgeGroup after deletion
  };

  // Fetch PatientAgeGroups on initial load
  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    // Set new debounce timeout
    const timeout = setTimeout(() => {
      handleFetchData();
    }, 1500); // 1.5 seconds

    setDebounceTimeout(timeout);

    return () => clearTimeout(timeout); // Cleanup on unmount
  }, [searchQuery, pageSize, currentPage]); // Fetch when search query changes

  return (
    <PatientAgeGroupContext.Provider
      value={{
        handleFetchData,
        selectPatientAgeGroup,
        setSelectedPatientAgeGroup,
      }}
    >
      <h4 className="py-3 mb-4">
        <span className="text-muted fw-light">Setting /</span> Patient Age
        Groups
      </h4>
      <div className="card">
        <div className="d-flex justify-content-between align-items-center card-header">
          <h5 className="mb-0">All Patient Age Group</h5>
          <PatientAgeGroupsModal
            title="View Patient Age Groups"
            onClose={() => setSelectedPatientAgeGroup(null)}
          />
        </div>

        <div className="card-body ">
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
            <div className=" col-md-4 col-sm-6">
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
                        handleFetchData();
                      }
                    }}
                  />
                </div>
              </form>
            </div>
          </div>
          <div className="text-nowrap animate__animated animate__fadeInUp animate__faster">
            <table className="table table-hover table-align-middle mb-0 table-bordered">
              <thead style={{ backgroundColor: "#f1f1f1" }}>
                <tr>
                  <th style={{ width: "50px" }}>S/N</th>
                  <th>Name</th>
                  <th>Min Age</th>
                  <th>Max Age</th>
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
                          <h6 className="text-muted">
                            Fetching Patient Age Groups
                          </h6>
                        </center>
                      </div>
                    </td>
                  </tr>
                ) : error || patientAgeGroups.length === 0 ? (
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
                  patientAgeGroups.map((dataRow, index) => (
                    <tr key={dataRow.uid}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td className="fw-medium">{dataRow.name}</td>
                      <td className="fw-medium">
                        {dataRow.min_age}
                        <br></br>
                      </td>
                      <td className="fw-medium">{dataRow.max_age}</td>
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
                            <a
                              className="dropdown-item"
                              href="#"
                              onClick={() => {
                                setSelectedPatientAgeGroup(dataRow);
                              }}
                              data-bs-toggle="modal"
                              data-bs-target="#viewCreateDataModal"
                            >
                              <i className="bx bx-edit-alt me-1"></i> View /
                              Edit
                            </a>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

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
    </PatientAgeGroupContext.Provider>
  );
};
