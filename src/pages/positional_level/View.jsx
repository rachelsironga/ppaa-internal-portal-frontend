import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import usePagination from "../../hooks/usePagination";
import ReactPaginate from "react-paginate";
import "animate.css";
import { deletePositionalLevel, getPositionalLevels } from "./Queries";
import { PositionalLevelContext } from "../../utils/context";
import PositionalLevelModal from "./Modal";

export const PositionalLevelPage = () => {
    const pageSizeData = [5, 10, 20, 50, 70, 100];
    const [positionalLevels, setPositionalLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectPositionalLevel, setSelectedPositionalLevel] = useState(null);
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

    const fetchPositionalLevels = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getPositionalLevels({
                search: searchQuery,
                pagination: {
                    page: currentPage,
                    page_size: pageSize,
                    paginated: true,
                },
            });
            if (result.status === 200 || result.status === 8000) {
                setPositionalLevels(result.data);
                if (result.pagination) {
                    updatePagination(result.pagination);
                    updateTotalCount(result.pagination.total || 0);
                } else {
                    updatePagination({});
                }
            } else {
                setError(true);
                showToast("No Positional Level Found", "warning", "Fetch Completed");
            }
        } catch (err) {
            setError(true);
            showToast("Unable to Fetch PositionalLevels", "warning", "Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (positionalLevel = null) => {
        if (!positionalLevel) {
            Swal.fire("Error!", "Unable to Select this Positional Level.", "error");
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
                const result = await deletePositionalLevel(positionalLevel.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Process Completed!",
                        "The Positional Level has been deleted.",
                        "success"
                    );
                    fetchPositionalLevels();
                } else {
                    console.error("Error deleting Positional Level:", result);
                    Swal.fire("Error Occurred!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting Positional Level:", error);
            Swal.fire(
                "Unsuccessful",
                `Unable to Perform Delete. Please Try Again or Contact Support Team`,
                "error"
            );
        }

        setSelectedPositionalLevel(null); // Reset selected PositionalLevel after deletion
    };
    // Fetch PositionalLevels on initial load
    useEffect(() => {
        if (debounceTimeout) clearTimeout(debounceTimeout);

        // Set new debounce timeout
        const timeout = setTimeout(() => {
            fetchPositionalLevels();
        }, 1500); // 2.5 seconds

        setDebounceTimeout(timeout);

        return () => clearTimeout(timeout); // Cleanup on unmount
    }, [searchQuery, pageSize, currentPage]); // Fetch when search query changes

    return (
        <PositionalLevelContext.Provider
            value={{
                fetchPositionalLevels,
                selectPositionalLevel,
                setSelectedPositionalLevel,
            }}
        >
            <h4 className="py-3 mb-4">
                <span className="text-muted fw-light">Setting /</span> Positional Levels
            </h4>
            <div className="card">
                <div className="d-flex justify-content-between align-items-center card-header mb-1">
                    <h5 className="mb-0">Positional Levels</h5>
                    <PositionalLevelModal
                        title="View Positional Levels"
                        onClose={() => setSelectedPositionalLevel(null)}
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
                                                fetchPositionalLevels();
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
                                    <th>Code</th>
                                    <th style={{ width: "100px" }}>Status</th>
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
                                                        Fetching Positional Levels
                                                    </h6>
                                                </center>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error || positionalLevels.length === 0 ? (
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
                                    positionalLevels.map((dataRows, index) => (
                                        <tr key={dataRows.uid}>
                                            <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                            <td className="fw-medium">{dataRows.name}</td>
                                            <td className="fw-medium">{dataRows.code}</td>
                                            <td>
                                                <span
                                                    className={
                                                        dataRows.is_active
                                                            ? "badge bg-label-success me-1"
                                                            : "badge bg-label-danger me-1"
                                                    }
                                                >
                                                    {dataRows.is_active ? "Active" : "Disabled"}
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
                                                        <a
                                                            className="dropdown-item"
                                                            href="#"
                                                            onClick={() => {
                                                                setSelectedPositionalLevel(dataRows);
                                                            }}
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#viewCreateDataModal"
                                                        >
                                                            <i className="bx bx-edit-alt me-1"></i> View /
                                                            Edit
                                                        </a>
                                                        <a
                                                            aria-label="dropdown action option"
                                                            className="dropdown-item text-danger"
                                                            href="#"
                                                            onClick={async () => {
                                                                handleDelete(dataRows);
                                                            }}
                                                        >
                                                            <i className="bx bx-trash me-1"></i> Delete
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
        </PositionalLevelContext.Provider>
    );
};
