import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import showToast from "../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { UsersContext } from "../../utils/context";
import { useParams } from "react-router-dom";
import { getPositions, getUsers, photoUpload } from "./Queries";
import usePagination from "../../hooks/usePagination";
// import { UserModal } from "./Modal";
import ReactPaginate from "react-paginate";
import { formatDate } from "../../helpers/DateFormater";
import PositionsModal from "./PositionsModal";
import AccordionContainer from "../../components/accordion/AccordionContainer";
import Select from "react-select";


export const UserOpenPage = () => {
    const pageSizeData = [5, 10, 20, 50, 70, 100];

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);


    const [loadingPositions, setLoadingPositions] = useState(true);
    const [errorPositions, setErrorPositions] = useState(null);
    const [positions, setPositions] = useState(null);


    const [debounceTimeout, setDebounceTimeout] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
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


    const [loadingLeftSelect, setLoadingLeftSelect] = useState(false);
    const [loadingRightSelect, setLoadingRightSelect] = useState(false);
    const [selectedLeft, setSelectedLeft] = useState([]);
    const [selectedRight, setSelectedRight] = useState([]);
    const [leftOptions, setLeftOptions] = useState([]);
    const [rightOptions, setRightOptions] = useState([
        { label: "Roles", options: [] },
        { label: "Permissions", options: [] },
    ]);

    // Helpers
    const removeFromGrouped = (grouped, items) =>
        grouped.map(group => ({
            ...group,
            options: group.options.filter(
                opt => !items.some(sel => sel.value === opt.value)
            ),
        }));

    const addToGrouped = (grouped, items) =>
        grouped.map(group => ({
            ...group,
            options: [
                ...group.options,
                ...items.filter(
                    item =>
                        item.group === group.label &&
                        !group.options.some(opt => opt.value === item.value)
                ),
            ],
        }));

    // Assign: left -> right
    const handleAssign = () => {
        // Get selected with group info
        const selectedWithGroup = [];
        leftOptions.forEach(group => {
            group.options.forEach(opt => {
                if (selectedLeft.some(sel => sel.value === opt.value)) {
                    selectedWithGroup.push({ ...opt, group: group.label });
                }
            });
        });
        setLeftOptions(removeFromGrouped(leftOptions, selectedLeft));
        setSelectedLeft([]);
        setRightOptions(addToGrouped(rightOptions, selectedWithGroup));
    };

    // Remove: right -> left
    const handleRemove = () => {
        const selectedWithGroup = [];
        rightOptions.forEach(group => {
            group.options.forEach(opt => {
                if (selectedRight.some(sel => sel.value === opt.value)) {
                    selectedWithGroup.push({ ...opt, group: group.label });
                }
            });
        });
        setRightOptions(removeFromGrouped(rightOptions, selectedRight));
        setSelectedRight([]);
        setLeftOptions(addToGrouped(leftOptions, selectedWithGroup));
    };


    const uploadValues = {
        uid: selectedUser?.guid,
        based64_file: "",
    };

    const [isUploadVisible, setIsUploadVisible] = useState(false);
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
                uid: uid,
            });
            if (result.status === 200 || result.status === 8000) {
                setSelectedUser(result.data);
                setPreviewImage(
                    result.data.photo && result.data.photo.trim() !== ""
                        ? result.data.photo
                        : "/assets/img/avatars/1.png"
                );
                setIsFileSelected(false);
                setRightOptions([
                    { label: "Roles", options: result.data.groups.map(g => ({ label: g, value: g })) },
                    { label: "Permissions", options: result.data.user_permissions.map(p => ({ label: p, value: p })) },
                ]);
                uploadValues.uid = result.data.guid;
                fetchPositions(result.data.guid);
            } else {
                setError(true);
                showToast("No User Found", "warning", "Fetch Completed");
            }
        } catch (err) {
            setError(true);
            showToast("Unable to Fetch User", "warning", "Failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchPositions = async (guid = "") => {
        setLoadingPositions(true);
        setErrorPositions(null);
        try {
            const result = await getPositions({
                search: searchQuery,
                user_uid: guid,
                old_only: true,
                pagination: {
                    page: 1,
                    page_size: 15,
                    paginated: true,
                },
            });
            if (result.status === 200 || result.status === 8000) {
                setPositions(result.data);

                if (result.pagination) {
                    updatePagination(result.pagination);
                    updateTotalCount(result.pagination.total || 0);
                } else {
                    updatePagination({});
                }
            } else {
                setErrorPositions(true);
            }
        } catch (err) {
            setErrorPositions(true);
        } finally {
            setLoadingPositions(false);
        }
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

    const handleUpload = async (selectedUser = null) => {
        if (!selectedUser) {
            Swal.fire("Error!", "Sorry Reopen this user to Fix this error.", "error");
            return;
        }

        if (!fileInputRef.current || !fileInputRef.current.files[0]) {
            Swal.fire(
                "Error!",
                "No file selected. Please choose a file to upload.",
                "error"
            );
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
                    popup: "custom-swal-popup",
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
                isModalOpen,
                setIsModalOpen,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h4 className="py-3 mb-4">
                    <span className="text-muted fw-light">
                        Home /{" "}
                        <a className="text-link" href="/users/list">
                            Users
                        </a>{" "}
                        /{" "}
                    </span>{" "}
                    View
                </h4>
                <div
                    className="py-3 mb-4"
                    style={{ marginRight: "25px" }}
                    id="dropdown-icon-demo"
                >
                    <button
                        aria-label="Click me"
                        type="button"
                        className="btn btn-sm btn-outline-primary  dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        <i className="bx bx-menu me-1"></i> Options
                    </button>
                    <ul className="dropdown-menu">
                        <li>
                            <button
                                aria-label="dropdown action link"
                                className="dropdown-item d-flex align-items-center"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="bx bx-pencil mx-2"></i>Edit User
                            </button>
                        </li>
                        <li>
                            <button
                                aria-label="dropdown action link"
                                className="dropdown-item d-flex align-items-center"
                                data-bs-toggle="modal"
                                aria-expanded="false"
                                type="button"
                                data-bs-target="#viewCreateUserPossitionModal"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <i className="bx bxs-user-detail mx-2"></i>Change User Position
                            </button>
                        </li>
                        <li>
                            <button
                                aria-label="dropdown action link"
                                className="dropdown-item d-flex align-items-center"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="bx bx-transfer mx-2"></i>Change User Status
                            </button>
                        </li>
                        <li>
                            <hr className="dropdown-divider" />
                        </li>
                        <li className="pl-3 text-center">
                            <button
                                aria-label="dropdown action link"
                                className="btn btn-sm btn-danger btn-block "
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <i className="bx bxs-trash mx-2"></i>Delete This User
                            </button>
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
                                    <h6 className="text-muted">Fetching Users</h6>
                                </center>
                            </div>
                        </div>
                    ) : error || selectedUser === null ? (
                        // error || directory.length === 0
                        <div className="alert alert-info" role="alert">
                            <div className="alert-body text-center">
                                    <p className="mb-0">
                                        Sorry! Unable to get Users Details Please Contanct System
                                        Administrator{" "}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow-1 container-p-y container-fluid">
                                <div className="row">
                                        <div className="col-xl-3 col-lg-4 order-1 order-md-0">
                                            <div className="card mb-6 animate__animated animate__fadeInLeft animate__faster">
                                                <div className="card-body pt-12">
                                                    <div className="user-avatar-section">
                                                        <div className=" d-flex align-items-center flex-column">
                                                            <img
                                                                src={previewImage}
                                                                alt="Avatar"
                                                                id="uploadedAvatar"
                                                                className="img-fluid rounded mb-4 shadow  account-image-reset"
                                                                height="120px"
                                                                width="150px"
                                                                onClick={toggleUploadVisibility} // Toggle input visibility on click
                                                                style={{ height: "120px", width: "120px" }}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "/assets/img/avatars/1.png";
                                                                }}
                                                                ref={fileInputRef}
                                                            />

                                                            <div className="user-info text-center mb-4">
                                                                <h5>
                                                                    {selectedUser.first_name}{" "}
                                                                    {selectedUser.middle_name}{" "}
                                                                    {selectedUser.last_name}
                                                                    <div
                                                                        className="button-wrapper"
                                                                        style={{
                                                                            display: "flex",
                                                                            justifyContent: "center",
                                                                        }}
                                                                    >
                                                                        {isUploadVisible && (
                                                                            <div className="m-3" id="card-image-div">
                                                                                <div className="input-group">
                                                                                    <label
                                                                                        htmlFor="inputGroupFile04"
                                                                                        className="btn btn-sm btn-outline-success"
                                                                                    >
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
                                                                                    <button
                                                                                        aria-label="Click me"
                                                                                        className="btn btn-sm btn-outline-danger account-file-input"
                                                                                        type="button"
                                                                                        onClick={handleResetImage}
                                                                                        disabled={!isFileSelected}
                                                                                    >
                                                                                        <strong>X</strong>
                                                                                    </button>
                                                                                    <button
                                                                                        aria-label="Click me"
                                                                                        className="btn btn-sm btn-outline-primary account-file-input"
                                                                                        type="button"
                                                                                        onClick={handleUpload}
                                                                                        disabled={!isFileSelected}
                                                                                    >
                                                                                        SAVE
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </h5>

                                                                <span className="badge bg-label-primary me-3">
                                                                    Administratior
                                                                </span>
                                                                <span className="badge bg-label-secondary me-3">
                                                                    Accountant
                                                                </span>
                                                                <span className="badge bg-label-primary me-3">
                                                                    User
                                                                </span>
                                                                <span className="badge bg-label-success me-3">
                                                                    Manager
                                                                </span>
                                                                <span className="badge bg-label-info me-3">
                                                                    HOD
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="info-container border-top mt-3 ">
                                                        <div
                                                            className="button-wrapper mt-1"
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "space-between",
                                                                gap: "10px",
                                                                width: "100%",
                                                            }}
                                                        >
                                                            <small className="text-muted">Account Status</small>
                                                            {selectedUser.status === "NEW" ? (
                                                                <span className="ms-1 badge bg-label-info">
                                                                    {selectedUser.status}
                                                                </span>
                                                            ) : selectedUser.status === "ACTIVE" ? (
                                                                <span className="ms-1 badge bg-label-success">
                                                                    {selectedUser.status}
                                                                </span>
                                                            ) : selectedUser.status === "RETIRED" ? (
                                                                <span className="ms-1 badge bg-label-secondary">
                                                                    {selectedUser.status}
                                                                </span>
                                                            ) : (
                                                                <span className="ms-1 badge bg-label-danger">
                                                                    {selectedUser.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h5 className="pb-2 mt-3 ">User Details</h5>
                                                        <div className="demo-inline-spacing mt-3 ">
                                                            <h6 className="text-muted">ABOUT</h6>
                                                            <ul className="list-group">
                                                                <li
                                                                    className="list-group-item d-flex align-items-center"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    <span style={{ minWidth: "90px" }}>
                                                                        <i className="bx bx-user me-2"></i>
                                                                        <strong>Username </strong>&nbsp;:&nbsp;
                                                                    </span>
                                                                    <span>{selectedUser.username}</span>
                                                                </li>
                                                                <li
                                                                    className="list-group-item d-flex align-items-center"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    <span style={{ minWidth: "90px" }}>
                                                                        <i className="bx bx-box me-2"></i>
                                                                        <strong>PF Number </strong>&nbsp;:&nbsp;
                                                                    </span>
                                                                    <span>{selectedUser.pf_number}</span>
                                                                </li>
                                                                <li
                                                                    className="list-group-item d-flex align-items-center"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    <span style={{ minWidth: "90px" }}>
                                                                        <i className="bx bxs-detail me-2"></i>
                                                                        <strong>Check Number </strong>&nbsp;:&nbsp;
                                                                    </span>
                                                                    <span>{selectedUser.check_number}</span>
                                                                </li>
                                                                <li
                                                                    className="list-group-item d-flex align-items-center"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    <span style={{ minWidth: "90px" }}>
                                                                        <i className="bx bx-female-sign"></i>
                                                                        <i className="bx bx-male-sign me-2"></i>
                                                                        <strong>Gender </strong>&nbsp;:&nbsp;
                                                                    </span>
                                                                    <span>{selectedUser.sex}</span>
                                                                </li>
                                                                <li
                                                                    className="list-group-item d-flex align-items-center"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    <span style={{ minWidth: "90px" }}>
                                                                        <i className="bx bx-calendar me-2"></i>
                                                                        <strong>Age </strong>&nbsp;:&nbsp;
                                                                    </span>
                                                                    <span>{selectedUser.check_number}</span>
                                                                </li>
                                                                <li
                                                                    className="list-group-item d-flex align-items-center"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    <span style={{ minWidth: "90px" }}>
                                                                        <i className="bx bx-calendar me-2"></i>
                                                                        <strong>Date Of Birth </strong>&nbsp;:&nbsp;
                                                                    </span>
                                                                    <span>{selectedUser.dob}</span>
                                                                </li>
                                                            </ul>
                                                            <h6 className="text-muted">CONTACT</h6>
                                                            <ul className="list-group overflow-auto">
                                                                <li
                                                                    className="list-group-item d-flex align-items-center"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    <span style={{ minWidth: "90px" }}>
                                                                        <i className="bx bx-envelope me-2"></i>
                                                                        <strong>Email </strong>&nbsp;:&nbsp;
                                                                    </span>
                                                                    <span className="text-primary">
                                                                        {selectedUser.email}
                                                                    </span>
                                                                </li>
                                                                <li
                                                                    className="list-group-item d-flex align-items-center"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    <span style={{ minWidth: "90px" }}>
                                                                        <i className="bx bxs-contact me-2"></i>
                                                                        <strong>Contact </strong>&nbsp;:&nbsp;
                                                                    </span>
                                                                    <span className="text-primary">
                                                                        {selectedUser.phone_number}
                                                                    </span>
                                                                </li>
                                                                <li
                                                                    className="list-group-item d-flex align-items-center"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    <span style={{ minWidth: "90px" }}>
                                                                        <i className="bx bx-phone me-2"></i>
                                                                        <strong>Alt Contact </strong>&nbsp;:&nbsp;
                                                                    </span>
                                                                    <span>{selectedUser.alternative_contact}</span>
                                                                </li>
                                                                <li
                                                                    className="list-group-item d-flex align-items-center"
                                                                    style={{
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    <span style={{ minWidth: "90px" }}>
                                                                        <i className="bx bx-credit-card me-2"></i>
                                                                        <strong>Bank Account </strong>&nbsp;:&nbsp;
                                                                    </span>
                                                                    <span>{selectedUser.account_number}</span>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-xl-9 col-lg-8 order-0 order-md-0">
                                            <div className="nav-align-top mb-4">
                                                <ul className="nav nav-pills mb-3" role="tablist">
                                                    <li className="nav-item">
                                                        <button
                                                            aria-label="Click me"
                                                            type="button"
                                                            className="nav-link active shadow-sm"
                                                            role="tab"
                                                            data-bs-toggle="tab"
                                                            data-bs-target="#navs-pills-top-position"
                                                            aria-controls="navs-pills-top-position"
                                                            aria-selected="true"
                                                        >
                                                            <i className="icon-base bx bx-user icon-sm me-1_5"></i>
                                                            Positions
                                                        </button>
                                                    </li>
                                                    <li className="nav-item">
                                                        <button
                                                            aria-label="Click me"
                                                            type="button"
                                                            className="nav-link shadow-sm"
                                                            role="tab"
                                                            data-bs-toggle="tab"
                                                            data-bs-target="#navs-pills-top-security"
                                                            aria-controls="navs-pills-top-security"
                                                            aria-selected="false"
                                                        >
                                                            <i className="icon-base bx bx-lock icon-sm me-1_5"></i>
                                                            Security
                                                        </button>
                                                    </li>
                                                    <li className="nav-item">
                                                        <button
                                                            aria-label="Click me"
                                                            type="button"
                                                            className="nav-link shadow-sm"
                                                            role="tab"
                                                            data-bs-toggle="tab"
                                                            data-bs-target="#navs-pills-top-documents"
                                                            aria-controls="navs-pills-top-documents"
                                                            aria-selected="false"
                                                        >
                                                            <i className="icon-base bx bx-file icon-sm me-1_5"></i>
                                                            Documents
                                                        </button>
                                                    </li>
                                                    <li className="nav-item">
                                                        <button
                                                            aria-label="Click me"
                                                            type="button"
                                                            className="nav-link shadow-sm me-3"
                                                            role="tab"
                                                            data-bs-toggle="tab"
                                                            data-bs-target="#navs-pills-top-role-permissions"
                                                            aria-controls="navs-pills-top-role-permissions"
                                                            aria-selected="false"
                                                        >
                                                            <i className="icon-base bx bx-group icon-sm me-1_5"></i>
                                                            Roles & Permistions
                                                        </button>
                                                    </li>
                                                </ul>
                                                <div className="tab-content">
                                                    <div
                                                        className="tab-pane fade show active"
                                                        style={{ minHeight: "60vh" }}
                                                        id="navs-pills-top-position"
                                                        role="tabpanel"
                                                    >
                                                        <div className="card">
                                                            <div className="card-body invoice-preview-header rounded shadow mb-4">
                                                                {selectedUser.position ? (
                                                                    <div className="d-flex justify-content-between flex-xl-row flex-md-column flex-sm-row flex-column align-items-xl-center align-items-md-start align-items-sm-center align-items-start">
                                                                        <div className="mb-xl-2 mb-6 text-heading">
                                                                            <div className="d-flex svg-illustration mb-6 gap-2 align-items-center">
                                                                                <h3 className=" demo fw-bold ms-50 lh-1">
                                                                                    Current Position
                                                                                </h3>
                                                                            </div>
                                                                            <p className="mb-2">
                                                                                {" "}
                                                                                <strong>Position : </strong>{" "}
                                                                                <span className="text-primary">
                                                                                    {selectedUser?.position?.level_name} - (
                                                                                    {selectedUser?.position?.level_code})
                                                                                </span>
                                                                            </p>
                                                                            <p className="mb-2">
                                                                                {" "}
                                                                                <strong>Directory : </strong>{" "}
                                                                                {selectedUser?.position?.directory_name} - (
                                                                                {selectedUser?.position?.directory_code})
                                                                            </p>
                                                                            <p className="mb-2">
                                                                                {" "}
                                                                                <strong>Department/Unit : </strong>{" "}
                                                                                {selectedUser?.position?.department_name} -
                                                                                ({selectedUser?.position?.department_code})
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="mb-6">Date & References</h5>
                                                                            <div className="mb-1 text-heading">
                                                                                <strong>Assigned At : </strong>
                                                                                <span className="fw-medium badge bg-label-success px-3">
                                                                                    {formatDate(
                                                                                        selectedUser?.position?.start_date
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="mb-1 text-heading">
                                                                                <strong>Due At : </strong>
                                                                                <span className="fw-medium badge bg-label-danger px-3">
                                                                                    {selectedUser?.position?.last_date
                                                                                        ? formatDate(
                                                                                            selectedUser?.position?.last_date
                                                                                        )
                                                                                        : " - "}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-center m-3">
                                                                        <h3 className=" demo text-center text-muted ms-50 lh-1">
                                                                            Currently User Dont Have Assigned Position
                                                                        </h3>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="card-body animate__animated animate__fadeInUp animate__faster">
                                                                <div>
                                                                    <div className="d-flex justify-content-between align-items-center card-header">
                                                                        <h5 className="mb-0">
                                                                            All Previously Assined Position
                                                                        </h5>
                                                                    </div>
                                                                </div>
                                                                <div className="table-responsive mb-4">
                                                                    <table className="table table-hover table-align-middle mb-0 table-bordered">
                                                                        <thead style={{ backgroundColor: "#f1f1f1" }}>
                                                                            <tr>
                                                                                <th style={{ width: "50px" }}>S/N</th>
                                                                                <th>Position</th>
                                                                                <th>Location</th>
                                                                                <th>From</th>
                                                                                <th>To</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="table-border-bottom-0">
                                                                            {loadingPositions ? (
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
                                                                                                    Fetching Previously Positions
                                                                                                </h6>
                                                                                            </center>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ) : errorPositions ||
                                                                                positions.length === 0 ? (
                                                                                <tr>
                                                                                    <td colSpan="100%">
                                                                                                <div
                                                                                                    className="alert alert-info"
                                                                                                    role="alert"
                                                                                                >
                                                                                                    <div className="alert-body text-center">
                                                                                                    <p className="mb-0">
                                                                                                        No Previous Position
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                ) : (
                                                                                        positions.map(
                                                                                            (dataRows, index) => (
                                                                                                <tr key={dataRows.uid}>
                                                                                                    <td>
                                                                                                        {(currentPage - 1) * pageSize +
                                                                                                            index +
                                                                                                            1}
                                                                                                    </td>
                                                                                                    <td className="fw-medium">
                                                                                                        {dataRows.level.name}
                                                                                                    </td>
                                                                                                    <td className="fw-medium">
                                                                                                        {dataRows.department !== null ? (
                                                                                                            <div className="d-flex flex-column text-start">
                                                                                                                <span className="fw-bold text-muted">
                                                                                                                    {dataRows.directory.name}
                                                                                                                </span>
                                                                                                                <span className="small">
                                                                                                                    Department:{" "}
                                                                                                                    <span className="text-muted">
                                                                                                                        {dataRows.department?.name}
                                                                                                                    </span>
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <span>
                                                                                                                {dataRows.department.name}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className="fw-medium">{dataRows?.created_at}</td>
                                                                                                    <td className="fw-medium">{dataRows.created_at !== null ? dataRows.end_date : dataRows.end_date}</td>
                                                                                                </tr>
                                                                                            )
                                                                                        )
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="tab-pane fade"
                                                        style={{ minHeight: "60vh" }}
                                                        id="navs-pills-top-security"
                                                        role="tabpanel"
                                                    >
                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <div className="card mb-6">
                                                                    <h5 className="card-header">
                                                                        Change User Password
                                                                    </h5>
                                                                    <div className="card-body">
                                                                        <form
                                                                            id="formChangePassword"
                                                                            className="fv-plugins-bootstrap5 fv-plugins-framework">
                                                                            <div
                                                                                className="alert alert-info alert-sm alert-dismissible"
                                                                                role="alert"
                                                                            >
                                                                                <h5 className="alert-heading mb-1">
                                                                                    Ensure that these requirements are met
                                                                                </h5>
                                                                                <span>
                                                                                    Minimum 8 characters long, uppercase &amp;
                                                                                    symbol
                                                                                </span>
                                                                            </div>
                                                                            <div className="row gx-6">
                                                                                <div className="mb-4 col-12 col-sm-6 form-password-toggle form-control-validation fv-plugins-icon-container">
                                                                                    <label
                                                                                        className="form-label"
                                                                                    >
                                                                                        New Password
                                                                                    </label>
                                                                                    <div className="input-group input-group-merge has-validation">
                                                                                        <input
                                                                                            className="form-control"
                                                                                            type="password"
                                                                                            id="newPassword"
                                                                                            name="newPassword"
                                                                                            placeholder="············"
                                                                                        />
                                                                                        <span className="input-group-text cursor-pointer">
                                                                                            <i className="icon-base bx bx-hide"></i>
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
                                                                                </div>

                                                                                <div className="mb-4 col-12 col-sm-6 form-password-toggle form-control-validation fv-plugins-icon-container">
                                                                                    <label
                                                                                        className="form-label"
                                                                                    >
                                                                                        Confirm New Password
                                                                                    </label>
                                                                                    <div className="input-group input-group-merge has-validation">
                                                                                        <input
                                                                                            className="form-control"
                                                                                            type="password"
                                                                                            name="confirmPassword"
                                                                                            id="confirmPassword"
                                                                                            placeholder="············"
                                                                                        />
                                                                                        <span className="input-group-text cursor-pointer">
                                                                                            <i className="icon-base bx bx-hide"></i>
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="fv-plugins-message-container fv-plugins-message-container--enabled invalid-feedback"></div>
                                                                                </div>
                                                                                <div className="text-center">
                                                                                    <button
                                                                                        type="submit"
                                                                                        className="btn btn-sm btn-primary me-2"
                                                                                    >
                                                                                        Change Password
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </form>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <div className="card mb-6">
                                                                    <div className="card-header">
                                                                        <h5 className="mb-3">User Signature</h5>
                                                                        <span className="card-subtitle mt-0">
                                                                            The Signature used to verify documents in
                                                                            Approval
                                                                        </span>
                                                                    </div>
                                                                    <div className="card-body pt-0">
                                                                        <div className="text-center">
                                                                            <img
                                                                                src={
                                                                                    selectedUser?.signature &&
                                                                                        selectedUser.signature.trim() !== ""
                                                                                        ? selectedUser.signature
                                                                                        : "/assets/img/avatars/signature.png"
                                                                                }
                                                                                alt="Avatar"
                                                                                className="img-fluid rounded mb-4 shadow"
                                                                                height="100px"
                                                                                width="85%"
                                                                                style={{ height: "100px", width: "85%" }}
                                                                                onError={(e) => {
                                                                                    e.target.onerror = null;
                                                                                    e.target.src =
                                                                                        "/assets/img/avatars/signature.png";
                                                                                }}
                                                                                ref={fileInputRef}
                                                                            />
                                                                        </div>
                                                                        <p className="mb-0 text-center">
                                                                            Only User will be able to change this
                                                                            signature. <br />
                                                                            <span className="text-primary">
                                                                                Note: This will be used to verify documents
                                                                                in Approval
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="tab-pane fade"
                                                        style={{ minHeight: "60vh" }}
                                                        id="navs-pills-top-documents"
                                                        role="tabpanel"
                                                    >
                                                        <p>
                                                            Oat cake chupa chups dragée donut toffee. Sweet cotton
                                                            candy jelly beans macaroon gummies cupcake gummi bears
                                                            cake chocolate.
                                                        </p>
                                                        <p className="mb-0">
                                                            Cake chocolate bar cotton candy apple pie tootsie roll
                                                            ice cream apple pie brownie cake. Sweet roll icing
                                                            sesame snaps caramels danish toffee. Brownie biscuit
                                                            dessert dessert. Pudding jelly jelly-o tart brownie
                                                            jelly.
                                                        </p>
                                                    </div>

                                                    <div
                                                        className="tab-pane fade"
                                                        style={{ minHeight: "60vh" }}
                                                        id="navs-pills-top-role-permissions"
                                                        role="tabpanel"
                                                    >

                                                        <div className="ibox-content" >
                                                            <div className="ibox-content-body" >
                                                                <div className="row">
                                                                    <div className="col-sm-11" >
                                                                        <AccordionContainer

                                                                            style={{ border: "0.1px solid #dfd9d7", borderRadius: "7px" }}
                                                                            items={[
                                                                                {
                                                                                    id: 3,
                                                                                    title: 'Instructions for Selecting JEEVA Modules and Permissions',
                                                                                    active: false,
                                                                                    content: `On the left, you will find all available JEEVA Modules and Permissions you can request. Please make your selections, then click the green button to confirm your choices. On the right, your selected items will appear. You may also remove selections at any time by clicking the red button. You can use the search feature at any time to make your selection process easier.`,
                                                                                },
                                                                            ]}
                                                                        />
                                                                    </div>
                                                                    <div className="col-sm-5" >
                                                                        <Select
                                                                            isLoading={loadingLeftSelect}
                                                                            closeMenuOnSelect={false}
                                                                            expandOnFocus={false}
                                                                            isSearchable
                                                                            isMulti
                                                                            menuIsOpen={true} // Always show options
                                                                            className="select2-selection fetched-select2"
                                                                            options={leftOptions}
                                                                            value={selectedLeft}
                                                                            onChange={setSelectedLeft}
                                                                            onInputChange={(e) => {
                                                                                // fetchDepartments(e);
                                                                            }}
                                                                            label="Select New Grants"
                                                                            styles={{
                                                                                menu: (base) => ({
                                                                                    ...base,
                                                                                    position: "relative",
                                                                                    zIndex: 9999,
                                                                                    textAlign: "left",
                                                                                    padding: "8px",
                                                                                    minHeight: "300px"
                                                                                }),
                                                                                groupHeading: (base) => ({
                                                                                    ...base,
                                                                                    fontWeight: "bolder",
                                                                                    fontSize: "0.85rem",
                                                                                    color: "#6f6c6b",

                                                                                }),
                                                                                placeholder: (base) => ({
                                                                                    ...base,
                                                                                    textAlign: "left",
                                                                                }),
                                                                                option: (base) => ({
                                                                                    ...base,
                                                                                    paddingLeft: "20px",
                                                                                }),
                                                                            }}
                                                                            isClearable
                                                                        />
                                                                    </div>
                                                                    <div className="col-sm-1">
                                                                        <br /><br /><br />
                                                                        <button
                                                                            id="assignButton"
                                                                            className="btn btn-success btn-sm btn-assign"
                                                                            onClick={handleAssign}
                                                                            title="Assign" >
                                                                            <i className="bx bx-right-arrow-alt" ></i>
                                                                        </button>
                                                                        <br /><br />
                                                                        <button
                                                                            id="removeButton"
                                                                            className="btn btn-danger btn-sm btn-assign"
                                                                            onClick={() => {
                                                                                handleRemove();
                                                                            }
                                                                            }
                                                                            title="Remove">
                                                                            <i className="bx bx-left-arrow-alt" ></i>
                                                                        </button>
                                                                    </div>
                                                                    <div className="col-sm-5" >
                                                                        <Select
                                                                            isLoading={loadingRightSelect}
                                                                            closeMenuOnSelect={false}
                                                                            expandOnFocus={false}
                                                                            isSearchable
                                                                            isMulti
                                                                            placeholder="Selected Grants"
                                                                            menuIsOpen={true} // Always show options
                                                                            className="select2-selection fetched-select2"
                                                                            options={rightOptions}
                                                                            value={selectedRight}
                                                                            onChange={setSelectedRight}
                                                                            onInputChange={(e) => {
                                                                                // fetchDepartments(e);
                                                                            }}
                                                                            styles={{
                                                                                menu: (base) => ({
                                                                                    ...base,
                                                                                    position: "relative",
                                                                                    zIndex: 9999,
                                                                                    textAlign: "left",
                                                                                    padding: "8px",
                                                                                    minHeight: "300px"

                                                                                }),
                                                                                groupHeading: (base) => ({
                                                                                    ...base,
                                                                                    fontWeight: "bolder",
                                                                                    fontSize: "0.85rem",
                                                                                    color: "#6f6c6b",

                                                                                }),
                                                                                placeholder: (base) => ({
                                                                                    ...base,
                                                                                    textAlign: "left",
                                                                                }),
                                                                                option: (base) => ({
                                                                                    ...base,
                                                                                    paddingLeft: "20px",
                                                                                }),
                                                                            }}
                                                                            isClearable
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                    )}
                </div>
            </div>

            {/* <UserModal loadOnlyModal={true} onClose={() => setSelectedUser(null)} /> */}
            <PositionsModal />
        </UsersContext.Provider>
    );
};
