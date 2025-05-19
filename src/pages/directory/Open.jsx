import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { deleteDepartment, getDepartments } from "../department/Queries";
import { DirectoryContext } from "../../utils/context";
import { useParams } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { getDirectories } from "./Queries";
import usePagination from "../../hooks/usePagination";
import { DirectoryDepartmentModal, DirectoryModal } from "./Modal";
import ReactPaginate from "react-paginate";



export const DirectoryOpenPage = () => {
    const pageSizeData = [5, 10, 20, 50, 70, 100];

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [loadingDepartment, setLoadingDepartment] = useState(true);

    const [error, setError] = useState(null);
    const [errorDepartment, setErrorDepartment] = useState(null);

    const [debounceTimeout, setDebounceTimeout] = useState(null);
    const [selectedDirectory, setSelectedDirectory] = useState(null);
    const [directoryDepartments, setDirectoryDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
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
            const result = await getDirectories({
                uid: uid
            });
            if (result.status === 200 || result.status === 8000) {
                setSelectedDirectory(result.data)
            } else {
                setError(true);
                showToast("No Directory Found", "warning", "Fetch Completed");
            }
        } catch (err) {
            console.error("Error fetching directories:", err);
            setError(true);
            showToast("Unable to Fetch Directories", "warning", "Failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        setLoadingDepartment(true);
        setErrorDepartment(null);
        try {
            const result = await getDepartments({
                search: searchQuery,
                directory: uid,
                pagination: {
                    page: currentPage,
                    page_size: pageSize,
                    paginated: true,
                },
            });
            if (result.status === 200 || result.status === 8000) {
                setDirectoryDepartments(result.data);

                if (result.pagination) {
                    updatePagination(result.pagination);
                    updateTotalCount(result.pagination.total || 0);
                } else {
                    updatePagination({});
                }
            } else {
                setErrorDepartment(true);
                showToast("No Department Found", "warning", "Fetch Completed");
            }
        } catch (err) {
            setErrorDepartment(true);
            showToast("Unable to Fetch Departments", "warning", "Failed");
        } finally {
            setLoadingDepartment(false);
        }
    };

    const handleDelete = async (selectedDirectory = null) => {
        if (!selectedDirectory) {
            Swal.fire("Error!", "Unable to Select this Directory.", "error");
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
                const result = await deleteItem(selectedDirectory.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Process Completed!",
                        "The Directory has been deleted.",
                        "success"
                    );
                    handleFetchData();
                } else {
                    console.error("Error deleting Directory:", result);
                    Swal.fire("Error Occurred!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting Directory:", error);
            Swal.fire(
                "Unsuccessful",
                `Unable to Perform Delete. Please Try Again or Contact Support Team`,
                "error"
            );
        }

        setSelectedDirectory(null);
    };

    const handleDeleteDepartment = async (department = null) => {
        if (!department) {
            Swal.fire("Error!", "Unable to Select this Directory Department.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: "Your About to Delete the Department",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteDepartment(department.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Process Completed!",
                        "The Directory Department has been deleted.",
                        "success"
                    );
                    fetchDepartments();
                } else {
                    console.error("Error deleting Department:", result);
                    Swal.fire("Error Occurred!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            Swal.fire(
                "Unsuccessful",
                `Unable to Perform Delete. Please Try Again or Contact Support Team`,
                "error"
            );
        }

        setSelectedPositionalLevelModule(null);
    };


    useEffect(() => {
        if (debounceTimeout) clearTimeout(debounceTimeout);
        const timeout = setTimeout(() => {
            handleFetchData();
            fetchDepartments();
        }, 1000);

        setDebounceTimeout(timeout);

        return () => clearTimeout(timeout);
    }, [searchQuery, pageSize, currentPage]);

    return (
        <DirectoryContext.Provider
            value={{
                debounceTimeout,
                setDebounceTimeout,
                handleFetchData,
                selectedDirectory,
                setSelectedDirectory,
                selectedDepartment,
                setSelectedDepartment,
                fetchDepartments
            }}
        >
            <h4 className="py-3 mb-4">
                <span className="text-muted fw-light">Setting / <a
                    className="text-link"
                    href="/settings/directories"
                >Directories</a> /  </span> View
            </h4>

            <div className="card mb-4 animate__animated animate__fadeInDown animate__faster">

                <div className="d-flex justify-content-between align-items-center card-header shadow-sm mb-4">
                    <h5 className="mb-0">Directories Details</h5>

                    {loading || error || selectedDirectory == null ? (
                        <div className="form-group"></div>
                    ) :
                        (
                            <div className="form-group">

                                <button
                                    aria-label="Open Modal"
                                    type="button"
                                    className="btn btn-primary ms-auto btn-sm me-2"
                                    data-bs-toggle="modal"
                                    data-bs-target="#viewCreateDirectoryModal">
                                    <i className="bx bx-edit-alt me-1"></i> Edit
                                </button>
                                <button
                                    aria-label="Delete Item"
                                    className="btn btn-danger ms-auto btn-sm"
                                    onClick={async () => {
                                        handleDelete(selectedDirectory);
                                    }}
                                    type="button">
                                    <i className="bx bx-trash me-1"></i>  Delete
                                </button>
                            </div>
                        )
                    }
                </div>

                <div className="card-body animate__animated animate__fadeInUp animate__faster">
                    {loading ? (
                        <div className="d-flex justify-content-between align-items-center">
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
                                        Fetching Directories
                                    </h6>
                                </center>
                            </div>
                        </div>
                    ) : error || selectedDirectory === null ? (
                        // error || directory.length === 0
                        <div className="alert alert-info" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">Sorry! Unable to get Directory Details Please Contanct System Administrator </p>
                            </div>
                        </div>
                    ) : (
                        <div className="col-md-12">
                            <div className="row mb-3">
                                <div className="col-md-1 col-sm-12" style={{ minWidth: "120px" }}>
                                    <h6 className="text-muted">Name:</h6>
                                </div>
                                <div className="col-md-9 col-sm-12" >
                                    <p className="text-justify">{selectedDirectory?.name || ""} ({selectedDirectory.code})</p>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-1 col-sm-12" style={{ minWidth: "120px" }}>
                                    <h6 className="text-muted">Description:</h6>
                                </div>
                                <div className="col-md-9 col-sm-12">
                                    <p className="text-justify">{selectedDirectory?.description || ""}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <div className="card">
                <div>
                    <div className="d-flex justify-content-between align-items-center card-header">
                        <h5 className="mb-0">Directories Departments</h5>
                        {loadingDepartment || errorDepartment || selectedDirectory == null ? (
                            <div className="form-group"></div>
                        ) :
                            (
                                <div className="form-group">
                                    <DirectoryDepartmentModal
                                        title="View Departments"
                                        onClose={() => setSelectedDepartment(null)}
                                    />
                                </div>

                            )
                        }
                    </div>
                </div>

                <div className="card-body animate__animated animate__fadeInUp animate__faster">
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
                                                fetchDepartments();
                                            }
                                        }}
                                    />
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="text-nowrap mb-4">
                        <table className="table table-hover table-align-middle mb-0 table-bordered" >
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
                                {loadingDepartment ? (
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
                                                        Fetching Departments
                                                    </h6>
                                                </center>
                                            </div>
                                        </td>
                                    </tr>
                                ) : errorDepartment || directoryDepartments.length === 0 ? (
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
                                    directoryDepartments.map((dataRows, index) => (
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
                                                                setSelectedDepartment(dataRows);
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
                                                                handleDeleteDepartment(dataRows);
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
            <DirectoryModal loadOnlyModal={true} onClose={() => setSelectedDirectory(null)} />
        </DirectoryContext.Provider >
    );
};
