import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import showToast from "../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { deleteDepartment, getDepartments } from "../department/Queries";
import { UsersContext } from "../../utils/context";
import { useParams } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { getUsers, photoUpload } from "./Queries";
import usePagination from "../../hooks/usePagination";
import { DirectoryDepartmentModal, UserModal } from "./Modal";
import ReactPaginate from "react-paginate";



export const UserOpenPage = () => {
    const pageSizeData = [5, 10, 20, 50, 70, 100];


    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [error, setError] = useState(null);
    const [errorProfile, setErrorPosition] = useState(null);

    const [debounceTimeout, setDebounceTimeout] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
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

    const uploadValues = {
        uid: selectedUser?.guid,
        based64_file: ""
    };

    const [isUploadVisible, setIsUploadVisible] = useState(false); // State to toggle visibility
    const [previewImage, setPreviewImage] = useState(
        selectedUser?.photo && selectedUser.photo.trim() !== ""
            ? selectedUser.photo
            : "/assets/img/avatars/1.png"
    );
    const [isFileSelected, setIsFileSelected] = useState(false);
    const fileInputRef = useRef(null);


    const handleFetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getUsers({
                uid: uid
            });
            if (result.status === 200 || result.status === 8000) {
                setSelectedUser(result.data)
                setPreviewImage(
                    result.data.photo && result.data.photo.trim() !== ""
                        ? result.data.photo
                        : "/assets/img/avatars/1.png"
                );
                setIsFileSelected(false);
                uploadValues.uid = result.data.guid;
            } else {
                setError(true);
                showToast("No User Found", "warning", "Fetch Completed");
            }
        } catch (err) {
            console.error("Error fetching directories:", err);
            setError(true);
            showToast("Unable to Fetch User", "warning", "Failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        setLoadingProfile(true);
        setErrorPosition(null);
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
                setErrorPosition(true);
                showToast("No Department Found", "warning", "Fetch Completed");
            }
        } catch (err) {
            setErrorPosition(true);
            showToast("Unable to Fetch Departments", "warning", "Failed");
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleDelete = async (selectedUser = null) => {
        if (!selectedUser) {
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
                const result = await deleteItem(selectedUser.uid);
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

        setSelectedUser(null);
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


    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPreviewImage(previewUrl);
            setIsFileSelected(true); // Enable buttons when a file is selected
        } else {
            setIsFileSelected(false); // Disable buttons if no file is selected
        }
    };

    const handleResetImage = () => {
        setPreviewImage(
            selectedUser?.photo && selectedUser.photo.trim() !== ""
                ? selectedUser.photo
                : "/assets/img/avatars/1.png"
        );
        setIsFileSelected(false); // Disable buttons after reset

        // Clear the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const toggleUploadVisibility = () => {
        setIsUploadVisible((prev) => !prev);
    };

    const handleupload = async (selectedUser = null) => {
        if (!selectedUser) {
            Swal.fire("Error!", "Sorry Reopen this user to Fix this error.", "error");
            return;
        }

        if (!fileInputRef.current || !fileInputRef.current.files[0]) {
            Swal.fire("Error!", "No file selected. Please choose a file to upload.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                // title: "Save New Profile Photo",
                text: "Your About to Save the new Profile Photo",
                icon: "info",
                showCancelButton: true,
                confirmButtonColor: "#696cff",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Confirm Save",
                customClass: {
                    confirmButton: "btn btn-sm btn-outline-primary",
                    cancelButton: "btn btn-sm",
                    popup: "custom-swal-popup"
                },
            });

            if (confirmation.isConfirmed) {
                const file = fileInputRef.current.files[0];

                // Convert file to Base64
                const toBase64 = (file) =>
                    new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = (error) => reject(error);
                    });

                const base64File = await toBase64(file);

                // Update uploadValues with Base64 string
                uploadValues.based64_file = base64File;

                console.log("Upload Values:", uploadValues);

                const result = await photoUpload(uploadValues);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Process Completed!",
                        "Successfully Uploaded the Photo.",
                        "success"
                    );
                    setSelectedUser(result.data);
                    setIsFileSelected(false);
                    toggleUploadVisibility();
                } else {
                    console.error("Error deleting Directory:", result);
                    Swal.fire("Opps!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error Uploading Photo:", error);
            Swal.fire(
                "Unsuccessful",
                `Unable to Perform Upload. Please Try Again or Contact Support Team`,
                "error"
            );
        }
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
        <UsersContext.Provider
            value={{
                debounceTimeout,
                setDebounceTimeout,
                handleFetchData,
                selectedUser,
                setSelectedUser,
                selectedDepartment,
                setSelectedDepartment,
                fetchDepartments
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h4 className="py-3 mb-4">
                    <span className="text-muted fw-light">Home / <a
                        className="text-link"
                        href="/users/list"
                    >Users</a> /  </span> View
                </h4>
                <div className="py-3 mb-4" style={{ marginRight: "25px" }} id="dropdown-icon-demo">
                    <button aria-label='Click me'
                        type="button"
                        className="btn btn-sm btn-outline-primary  dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false">
                        <i className="bx bx-menu me-1"></i> Options
                    </button>
                    <ul className="dropdown-menu">
                        <li>
                            <button aria-label="dropdown action link" className="dropdown-item d-flex align-items-center" data-bs-toggle="dropdown"
                                aria-expanded="false"
                            ><i className="bx bx-menu me-1"></i>
                                <i className="bx bx-chevron-right scaleX-n1-rtl"></i>Action</button>
                        </li>
                        <li>
                            <a aria-label="dropdown action link" href="#" className="dropdown-item d-flex align-items-center"
                            ><i className="bx bx-chevron-right scaleX-n1-rtl"></i>Another action</a
                            >
                        </li>
                        <li>
                            <a aria-label="dropdown action link" href="#" className="dropdown-item d-flex align-items-center"
                            ><i className="bx bx-chevron-right scaleX-n1-rtl"></i>Something else here</a
                            >
                        </li>
                        <li>
                            <hr className="dropdown-divider" />
                        </li>
                        <li>
                            <a aria-label="dropdown action link" href="#" className="dropdown-item d-flex align-items-center"
                            ><i className="bx bx-chevron-right scaleX-n1-rtl"></i>Separated link</a
                            >
                        </li>
                        <li>
                            <a aria-label="dropdown action link" href="#" className="dropdown-item d-flex align-items-center"
                            ><i className="bx bx-chevron-right scaleX-n1-rtl"></i>Separated link</a
                            >
                        </li>
                        <li>
                            <a aria-label="dropdown action link" href="#" className="dropdown-item d-flex align-items-center"
                            ><i className="bx bx-chevron-right scaleX-n1-rtl"></i>Separated link</a
                            >
                        </li>
                        <li>
                            <a aria-label="dropdown action link" href="#" className="dropdown-item d-flex align-items-center"
                            ><i className="bx bx-chevron-right scaleX-n1-rtl"></i>Separated link</a
                            >
                        </li>
                    </ul>
                </div>
            </div>



            <div className="content-wrapper">
                <div className="animate__animated animate__fadeInUp animate__faster">
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
                                        Fetching Users
                                    </h6>
                                </center>
                            </div>
                        </div>
                    ) : error || selectedUser === null ? (
                        // error || directory.length === 0
                        <div className="alert alert-info" role="alert">
                            <div className="alert-body text-center">
                                    <p className="mb-0">Sorry! Unable to get Users Details Please Contanct System Administrator </p>
                            </div>
                        </div>
                    ) : (
                                <div className="flex-grow-1 container-p-y container-fluid">
                                    <div className="row">

                                        <div className="col-xl-4 col-lg-5 order-1 order-md-0">

                                            <div className="card mb-6 animate__animated animate__fadeInLeft animate__faster">
                                                <div className="card-body pt-12">
                                                    <div className="user-avatar-section">
                                                        <div className=" d-flex align-items-center flex-column">
                                                            <img
                                                                src={previewImage}
                                                                alt="Avatar"
                                                                id="uploadedAvatar"
                                                                className="img-fluid rounded mb-4 shadow  account-image-reset"
                                                                height="120px" width="150px"
                                                                onClick={toggleUploadVisibility} // Toggle input visibility on click
                                                                style={{ height: "120px", width: "120px" }}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "/assets/img/avatars/1.png";
                                                                }}
                                                                ref={fileInputRef}
                                                            />

                                                            <div className="user-info text-center mb-4">
                                                                <h5>{selectedUser.first_name} {selectedUser.middle_name}{" "}
                                                                    {selectedUser.last_name}
                                                                    <div className="button-wrapper" style={{ display: "flex", justifyContent: "center" }}>
                                                                        {isUploadVisible && (

                                                                            <div className="m-3" id="card-image-div">
                                                                                <div className="input-group">
                                                                                    <label htmlFor="inputGroupFile04" className="btn btn-sm btn-outline-success">
                                                                                        Choose File
                                                                                    </label>
                                                                                    <input
                                                                                        type="file"
                                                                                        name="account-file-input"
                                                                                        className="form-control form-control-sm account-file-input visually-hidden"
                                                                                        id="inputGroupFile04"
                                                                                        aria-describedby="inputGroupFileAddon04"
                                                                                        onChange={handlePhotoChange}
                                                                                        accept=".jpg,.jpeg,.png,.gif,.ico"
                                                                                        aria-label="Upload"
                                                                                        ref={fileInputRef}
                                                                                    />
                                                                                    <button aria-label='Click me' className="btn btn-sm btn-outline-danger account-file-input" type="button" onClick={handleResetImage} disabled={!isFileSelected}><strong>X</strong></button>
                                                                                    <button aria-label='Click me' className="btn btn-sm btn-outline-primary account-file-input" type="button" onClick={handleupload} disabled={!isFileSelected}>SAVE</button>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                    </div>
                                                                </h5>

                                                                <span className="badge bg-label-primary me-3">Administratior</span>
                                                                <span className="badge bg-label-secondary me-3">Accountant</span>
                                                                <span className="badge bg-label-primary me-3">User</span>
                                                                <span className="badge bg-label-success me-3">Manager</span>
                                                                <span className="badge bg-label-info me-3">HOD</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="info-container border-top mt-3 ">
                                                        <h5 className="pb-2 mt-3 ">User Details</h5>
                                                        <div className="demo-inline-spacing mt-3 ">
                                                            <h6 className="text-muted">ABOUT</h6>
                                                            <ul className="list-group">
                                                                <li className="list-group-item d-flex align-items-center">
                                                                    <i className="bx bx-user me-2"></i>
                                                                    <strong>Username </strong>&nbsp;:&nbsp; {selectedUser.username}
                                                                </li>
                                                                <li className="list-group-item d-flex align-items-center">
                                                                    <i className="bx bx-box me-2"></i>
                                                                    <strong>PF Number </strong>&nbsp;:&nbsp; {selectedUser.pf_number}
                                                                </li>
                                                                <li className="list-group-item d-flex align-items-center">
                                                                    <i className="bx bxs-detail me-2"></i>
                                                                    <strong>Check Number </strong>&nbsp;:&nbsp; {selectedUser.check_number}
                                                                </li>
                                                                <li className="list-group-item d-flex align-items-center">
                                                                    <i className="bx bx-female-sign "></i>
                                                                    <i className="bx bx-male-sign me-2"></i>

                                                                    <strong>Gender </strong>&nbsp;:&nbsp; {selectedUser.sex}
                                                                </li>
                                                                <li className="list-group-item d-flex align-items-center">
                                                                    <i className="bx bx-calendar me-2"></i>
                                                                    <strong>Age </strong>&nbsp;:&nbsp; {selectedUser.check_number}
                                                                </li>
                                                                <li className="list-group-item d-flex align-items-center">
                                                                    <i className="bx bx-calendar me-2"></i>
                                                                    <strong>Date Of Birth </strong>&nbsp;:&nbsp; {selectedUser.dob}
                                                                </li>
                                                            </ul>
                                                            <h6 className="text-muted">CONTACT</h6>
                                                            <ul className="list-group">
                                                                <li className="list-group-item d-flex align-items-center">
                                                                    <i className="bx bx-envelope me-2"></i>
                                                                    <strong>Email </strong>&nbsp;:&nbsp; <span className="text-primary">{selectedUser.email}</span>
                                                                </li>
                                                                <li className="list-group-item d-flex align-items-center">
                                                                    <i className="bx bxs-contact me-2"></i>
                                                                    <strong>Contact </strong>&nbsp;:&nbsp; <span className="text-primary">{selectedUser.phone_number}</span>
                                                                </li>
                                                                <li className="list-group-item d-flex align-items-center">
                                                                    <i className="bx bx-phone me-2"></i>
                                                                    <strong>Alt Contact </strong>&nbsp;:&nbsp; {selectedUser.alternative_contact}
                                                                </li>
                                                                <li className="list-group-item d-flex align-items-center">
                                                                    <i className="bx bx-credit-card me-2"></i>
                                                                    <strong>Bank Account </strong>&nbsp;:&nbsp; {selectedUser.account_number}
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-xl-8 col-lg-7 order-0 order-md-1">
                                            <div className="nav-align-top mb-4">
                                                <ul className="nav nav-pills mb-3" role="tablist">
                                                    <li className="nav-item">
                                                        <button aria-label='Click me'
                                                            type="button"
                                                            className="nav-link active shadow-sm"
                                                            role="tab"
                                                            data-bs-toggle="tab"
                                                            data-bs-target="#navs-pills-top-position"
                                                            aria-controls="navs-pills-top-position"
                                                            aria-selected="true">
                                                            <i className="icon-base bx bx-user icon-sm me-1_5"></i>
                                                            Positions
                                                        </button>
                                                    </li>
                                                    <li className="nav-item">
                                                        <button aria-label='Click me'
                                                            type="button"
                                                            className="nav-link shadow-sm"
                                                            role="tab"
                                                            data-bs-toggle="tab"
                                                            data-bs-target="#navs-pills-top-signature"
                                                            aria-controls="navs-pills-top-signature"
                                                            aria-selected="false">
                                                            <i className="icon-base bx bx-lock icon-sm me-1_5"></i>
                                                            Signature
                                                        </button>
                                                    </li>
                                                    <li className="nav-item">
                                                        <button aria-label='Click me'
                                                            type="button"
                                                            className="nav-link shadow-sm"
                                                            role="tab"
                                                            data-bs-toggle="tab"
                                                            data-bs-target="#navs-pills-top-signature"
                                                            aria-controls="navs-pills-top-signature"
                                                            aria-selected="false">
                                                            <i className="icon-base bx bx-lock icon-sm me-1_5"></i>
                                                            Password
                                                        </button>
                                                    </li>
                                                    <li className="nav-item">
                                                        <button aria-label='Click me'
                                                            type="button"
                                                            className="nav-link shadow-sm"
                                                            role="tab"
                                                            data-bs-toggle="tab"
                                                            data-bs-target="#navs-pills-top-documents"
                                                            aria-controls="navs-pills-top-documents"
                                                            aria-selected="false">
                                                            <i className="icon-base bx bx-file icon-sm me-1_5"></i>
                                                            Documents
                                                        </button>
                                                    </li>
                                                    <li className="nav-item">
                                                        <button aria-label='Click me'
                                                            type="button"
                                                            className="nav-link shadow-sm me-3"
                                                            role="tab"
                                                            data-bs-toggle="tab"
                                                            data-bs-target="#navs-pills-top-documents"
                                                            aria-controls="navs-pills-top-documents"
                                                            aria-selected="false">
                                                            <i className="icon-base bx bx-group icon-sm me-1_5"></i>
                                                            Roles & Permistions
                                                        </button>
                                                    </li>
                                                </ul>
                                                <div className="tab-content">
                                                    <div className="tab-pane fade show active" style={{ minHeight: "60vh" }} id="navs-pills-top-position" role="tabpanel">
                                                        <div className="card">
                                                            <div>
                                                                <div className="d-flex justify-content-between align-items-center card-header">
                                                                    <h5 className="mb-0">Directories Departments</h5>
                                                                    {loadingProfile || errorProfile || selectedUser == null ? (
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

                                                                <div className=" col-md-12 col-sm-12" style={{ marginBottom: "20px" }}>
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
                                                                <div className="text-nowrap mb-4">
                                                                    <table className="table table-hover table-align-middle mb-0 table-bordered" >
                                                                        <thead style={{ backgroundColor: "#f1f1f1" }}>
                                                                            <tr>
                                                                                <th style={{ width: "50px" }}>S/N</th>
                                                                                <th>Position</th>
                                                                                <th style={{ width: "150px" }}>Status</th>
                                                                                <th style={{ width: "60px" }}>Actions</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="table-border-bottom-0">
                                                                            {loadingProfile ? (
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
                                                                            ) : errorProfile || directoryDepartments.length === 0 ? (
                                                                                <tr>
                                                                                    <td colSpan="100%">
                                                                                        <div className="alert alert-info" role="alert">
                                                                                            <div className="alert-body text-center">
                                                                                                <p className="mb-0">No Position For You</p>
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
                                                                                        <td>
                                                                                            <div className="dropdown">
                                                                                                <button
                                                                                                    aria-label="Click me"
                                                                                                    type="button"
                                                                                                    className="btn p-0 dropdown-toggle hide-arrow"
                                                                                                    data-bs-toggle="dropdown"
                                                                                                >
                                                                                                    <i className="bx bx-dots-vertical-rounded"></i>
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
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="tab-pane fade" style={{ minHeight: "60vh" }} id="navs-pills-top-signature" role="tabpanel">
                                                        <p>
                                                            Donut dragée jelly pie halvah. Danish gingerbread bonbon cookie wafer candy oat cake ice
                                                            cream. Gummies halvah tootsie roll muffin biscuit icing dessert gingerbread. Pastry ice cream
                                                            cheesecake fruitcake.
                                                        </p>
                                                        <p className="mb-0">
                                                            Jelly-o jelly beans icing pastry cake cake lemon drops. Muffin muffin pie tiramisu halvah
                                                            cotton candy liquorice caramels.
                                                        </p>
                                                    </div>

                                                    <div className="tab-pane fade" style={{ minHeight: "60vh" }} id="navs-pills-top-password" role="tabpanel">
                                                        <p>
                                                            Oat cake chupa chups dragée donut toffee. Sweet cotton candy jelly beans macaroon gummies
                                                            cupcake gummi bears cake chocolate.
                                                        </p>
                                                        <p className="mb-0">
                                                            Cake chocolate bar cotton candy apple pie tootsie roll ice cream apple pie brownie cake. Sweet
                                                            roll icing sesame snaps caramels danish toffee. Brownie biscuit dessert dessert. Pudding jelly
                                                            jelly-o tart brownie jelly.
                                                        </p>
                                                    </div>

                                                    <div className="tab-pane fade" style={{ minHeight: "60vh" }} id="navs-pills-top-documents" role="tabpanel">
                                                        <p>
                                                            Oat cake chupa chups dragée donut toffee. Sweet cotton candy jelly beans macaroon gummies
                                                            cupcake gummi bears cake chocolate.
                                                        </p>
                                                        <p className="mb-0">
                                                            Cake chocolate bar cotton candy apple pie tootsie roll ice cream apple pie brownie cake. Sweet
                                                            roll icing sesame snaps caramels danish toffee. Brownie biscuit dessert dessert. Pudding jelly
                                                            jelly-o tart brownie jelly.
                                                        </p>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                    )}
                </div>
            </div>

            <UserModal loadOnlyModal={true} onClose={() => setSelectedUser(null)} />
        </UsersContext.Provider >
    );
};
