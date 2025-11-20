import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import showToast from "../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { AccountContext } from "../../utils/context";
import { useParams } from "react-router-dom";
import {
  getPositions,
  photoUpload,
  removeDelegatedUser,
  signatureUpload,
} from "./Queries";
import usePagination from "../../hooks/usePagination";
import ReactPaginate from "react-paginate";
import { formatDate } from "../../helpers/DateFormater";
import { useSelector } from "react-redux";
import BreadCumb from "../../layouts/BreadCumb";
import DelegationModal from "./DelegationModal";
import { hasAccess } from "../../hooks/AccessHandler";
import { useDispatch } from "react-redux";
import { userTypes } from "../../redux/types/authentication";
import ResetPasswordModal from "./ResetPasswordModal";

export const AccountPage = () => {
  const pageSizeData = [5, 10, 20, 50, 70, 100];
  const dispatch = useDispatch();

  // Place this above your component or inside the component before the return
  const badgeColors = [
    "bg-label-primary",
    "bg-label-success",
    "bg-label-danger",
    "bg-label-warning",
    "bg-label-info",
    "bg-label-secondary",
    "bg-label-dark",
  ];

  const user = useSelector((state) => state.userReducer?.data);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActingChange, setIsActingChange] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadDelagationModal, setLoadDelagationModal] = useState(false);

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

  const uploadValues = {
    uid: selectedUser?.guid,
    based64_file: "",
  };

  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const [isUploadSignVisible, setIsUploadSignVisible] = useState(false);
  const [isSignSelected, setIsSignSelected] = useState(false);

  const [previewImage, setPreviewImage] = useState(
    selectedUser?.photo && selectedUser.photo.trim() !== ""
      ? selectedUser.photo
      : "/assets/img/avatars/1.png"
  );
  const [previewSign, setPreviewSign] = useState(
    selectedUser?.signature && selectedUser.signature.trim() !== ""
      ? selectedUser.signature
      : "/assets/img/avatars/signature.png"
  );
  const [isFileSelected, setIsFileSelected] = useState(false);
  const fileInputRef = useRef(null);

  const [isSignUploading, setIsSignUploading] = useState(false);
  const fileSignInputRef = useRef(null);

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user !== null) {
        setSelectedUser(user);
        setPreviewImage(
          user.photo && user.photo.trim() !== ""
            ? user.photo
            : "/assets/img/avatars/1.png"
        );
        setPreviewSign(
          user.signature && user.signature.trim() !== ""
            ? user.signature
            : "/assets/img/avatars/signature.png"
        );
        setIsFileSelected(false);
        uploadValues.uid = user.guid;
        fetchPositions(user.guid);
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
      setIsFileSelected(true);
    } else {
      setIsFileSelected(false);
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

  const handleChangeSign = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewSign(previewUrl);
      setIsSignSelected(true); // Enable buttons when a file is selected
    } else {
      setIsSignSelected(false); // Disable buttons if no file is selected
    }
  };

  const handleResetImageSign = () => {
    setPreviewSign(
      selectedUser?.signature && selectedUser.signature.trim() !== ""
        ? selectedUser.signature
        : "/assets/img/avatars/signature.png"
    );
    setIsSignSelected(false); // Disable buttons after reset
    setIsUploadSignVisible(false); // Hide the upload UI
    // Clear the file input for signature
    if (fileSignInputRef.current) {
      fileSignInputRef.current.value = "";
    }
  };

  const toggleUploadVisibility = () => {
    setIsUploadVisible((prev) => !prev);
  };

  const handleUpload = async (selectedUser = null) => {
    if (hasAccess(user, ["can_upload_profile_photo"]) === false) {
      Swal.fire(
        "Error!",
        "Sorry Youdont have permission to change Profile",
        "error"
      );
      return;
    }

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
          dispatch({
            type: userTypes.USER_UPDATE,
            payload: {
              user: result.data, // ✅ wrap in `user`
            },
          });
          window.location.reload();
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
    handleFetchData();
  }, []);

  // Signature upload handler
  const handleUploadSign = async (selectedUserParam = null) => {
    if (hasAccess(user, ["can_upload_profile_signature"]) === false) {
      Swal.fire(
        "Error!",
        "Sorry Youdont have permission to change Signature",
        "error"
      );
      return;
    }
    const userToUse = selectedUserParam || selectedUser;
    if (!userToUse) {
      Swal.fire(
        "Error!",
        "Sorry, reopen this user to fix this error.",
        "error"
      );
      return;
    }
    if (!fileSignInputRef.current || !fileSignInputRef.current.files[0]) {
      Swal.fire(
        "Error!",
        "No file selected. Please choose a file to upload.",
        "error"
      );
      return;
    }
    try {
      setIsSignUploading(true);
      const confirmation = await Swal.fire({
        text: "You are about to save the new Signature",
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
        const file = fileSignInputRef.current.files[0];
        const toBase64 = (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
          });
        const base64File = await toBase64(file);

        const uploadSignValues = {
          uid: userToUse?.guid,
          based64_file: base64File,
        };

        const result = await signatureUpload(uploadSignValues);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "Successfully Uploaded the Signature.",
            "success"
          );
          dispatch({
            type: userTypes.USER_UPDATE,
            payload: {
              user: result.data,
            },
          });
          window.location.reload();
          setSelectedUser((prev) => ({
            ...prev,
            signature: result.data.signature,
          }));
          setPreviewSign(result.data.signature);
          setIsSignSelected(false);
          setIsUploadSignVisible(false);
          if (fileSignInputRef.current) fileSignInputRef.current.value = "";
        } else {
          Swal.fire("Oops!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      Swal.fire(
        "Unsuccessful",
        `Unable to perform upload. Please try again or contact support team.`,
        "error"
      );
    } finally {
      setIsSignUploading(false);
    }
  };

  useEffect(() => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    const timeout = setTimeout(() => {
      handleFetchData();
    }, 1000);

    setDebounceTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [pageSize, currentPage]);

  useEffect(() => {
    handleFetchData();
  }, [isActingChange]);

  const handleRemoveDelegation = async () => {
    if (
      hasAccess(user, ["can_assign_delegate", "can_remove_delegate"]) === false
    ) {
      Swal.fire(
        "Error!",
        "Sorry Youdont have permission to Remove Delegation",
        "error"
      );
      return;
    }
    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "Your About to Remove Delegated User",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DD6B55",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Yes, Remove",
      });

      if (confirmation.isConfirmed) {
        const result = await removeDelegatedUser();
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Process Completed!",
            "The Delegation Removed Successfully.",
            "success"
          );
          dispatch({
            type: userTypes.USER_UPDATE,
            payload: {
              user: result.data, // ✅ wrap in `user`
            },
          });
          window.location.reload();
        } else {
          Swal.fire("Failed", `${result.message}`, "error");
        }
      }
    } catch (error) {
      Swal.fire(
        "Unsuccessful",
        `Unable to Perform Remove. Please Try Again or Contact Support Team`,
        "error"
      );
    }

    setSelectedApprovalRequest(null); // Reset selected ApprovalRequest after deletion
  };

  return (
    <AccountContext.Provider
      value={{
        debounceTimeout,
        setDebounceTimeout,
        handleFetchData,
        selectedUser,
        setSelectedUser,
        isModalOpen,
        setIsModalOpen,
        loadDelagationModal,
        setLoadDelagationModal,
        isActingChange,
        setIsActingChange,
      }}
    >
      <BreadCumb pageList={["Profile"]}>
        <button className="btn btn-primary btn-sm">
          <i className={`bx bx-refresh me-1 ${loading ? "bx-spin" : ""}`}></i>
          <span className="text-bold">Update My Status</span>
        </button>
      </BreadCumb>

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
                <div className="col-xl-4 col-lg-5 col-md-5  order-1 order-md-0">
                  <div className="card mb-6 animate__animated animate__fadeInLeft animate__faster">
                    <div className="card-body pt-12">
                      <div className="user-avatar-section">
                        <div className=" d-flex align-items-center flex-column">
                          <div id="profileImgeDiv">
                            <img
                              src={previewImage}
                              alt="Avatar"
                              id="uploadedAvatar"
                              className="img-fluid rounded mb-4 shadow  account-image-reset cursor-pointer"
                              height="120px"
                              width="150px"
                              onClick={
                                hasAccess(user, ["can_upload_profile_photo"])
                                  ? toggleUploadVisibility
                                  : null
                              } // Toggle input visibility on click
                              style={{ height: "120px", width: "120px" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/assets/img/avatars/1.png";
                              }}
                              ref={fileInputRef}
                            />
                            {hasAccess(user, ["can_upload_profile_photo"]) && (
                              <span
                                className="ms-1 badge bg-label-primary cursor-pointer"
                                onClick={toggleUploadVisibility}
                                style={{
                                  position: "absolute",
                                  top: "120px",
                                  left: "36.5%",
                                }}
                              >
                                change photo
                              </span>
                            )}
                          </div>

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
                                {isUploadVisible &&
                                  hasAccess(user, [
                                    "can_upload_profile_photo",
                                  ]) && (
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

                            <div
                              style={{
                                maxHeight: "80px",
                                overflowY: "auto",
                              }}
                            >
                              {user &&
                                user.groups.map((group, index) => {
                                  // Pick a random color for each badge
                                  const colorClass =
                                    badgeColors[
                                      Math.floor(
                                        Math.random() * badgeColors.length
                                      )
                                    ];
                                  return (
                                    <span
                                      key={`groups_${index}`}
                                      className={`badge ${colorClass} me-3`}
                                    >
                                      {group}
                                    </span>
                                  );
                                })}
                            </div>
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
                        <div className="demo-inline-spacing mt-3 ">
                          <h5 className="text-muted">Personal Details</h5>
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
                            {/* <li
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
                            </li> */}
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
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-8 col-lg-7  col-md-7 order-0 order-md-0">
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
                          Security{""}
                          {selectedUser.signature &&
                            selectedUser.signature.trim() === "" && (
                              <span className="fw-medium badge bg-label-danger ms-3 px-2">
                                <i className="icon-base bx bx-info-circle icon-sm me-1_5"></i>
                              </span>
                            )}
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
                              <div>
                                <div className="d-flex svg-illustration  justify-content-between mb-6 gap-2 align-items-center">
                                  <h4 className=" demo fw-bold ms-50 lh-1">
                                    Current Position
                                  </h4>
                                  {hasAccess(
                                    user,
                                    [
                                      "can_assign_delegate",
                                      "can_assign_delegate",
                                    ],
                                    ["Delegators", "Delegator"]
                                  ) &&
                                    selectedUser.position?.acting_user ===
                                      null && (
                                      <button
                                        className="btn btn-sm btn-info btn-outline-info"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delegatedUserModal"
                                        onClick={() =>
                                          setLoadDelagationModal(true)
                                        }
                                      >
                                        <i className="bx bx-user-plus"></i>
                                        &nbsp;Add Delegate{" "}
                                      </button>
                                    )}
                                </div>
                                <div className="d-flex justify-content-between flex-xl-row flex-md-column flex-sm-row flex-column align-items-xl-center align-items-md-start align-items-sm-center align-items-start">
                                  <div className="mb-xl-2 mb-6 text-heading">
                                    <p className="mb-2">
                                      {" "}
                                      <strong>Position : </strong>{" "}
                                      <span className="text-primary">
                                        {selectedUser?.position?.level_name}
                                      </span>
                                    </p>
                                    <p className="mb-2">
                                      {" "}
                                      <strong>Directory : </strong>{" "}
                                      {selectedUser?.position?.directory_name} -
                                      ({selectedUser?.position?.directory_code})
                                    </p>
                                    <p className="mb-2">
                                      {" "}
                                      <strong>Department/Unit : </strong>{" "}
                                      {selectedUser?.position?.department_name}
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
                              </div>
                            ) : (
                              <div className="text-center m-3">
                                <h3 className=" demo text-center text-muted ms-50 lh-1">
                                  Currently User Dont Have Assigned Position
                                </h3>
                              </div>
                            )}
                          </div>

                          {selectedUser.position?.acting_user && (
                            <div className="card-body invoice-preview-header rounded shadow mb-4">
                              <div>
                                <div className="d-flex svg-illustration  justify-content-between mb-6 gap-2 align-items-center">
                                  <h5 className=" demo fw-bold ms-50 lh-1">
                                    Delegated Responsibility
                                  </h5>

                                  {hasAccess(
                                    user,
                                    ["can_assign_delegate"],
                                    ["can_assign_delegate"]
                                  ) && (
                                    <button
                                      className="btn btn-sm btn-danger btn-outline-danger"
                                      onClick={() => handleRemoveDelegation()}
                                    >
                                      <i className="bx bx-user-minus"></i>
                                      &nbsp;Remove Delegation
                                    </button>
                                  )}
                                </div>
                                <div className="d-flex justify-content-between flex-xl-row flex-md-column flex-sm-row flex-column align-items-xl-center align-items-md-start align-items-sm-center align-items-start">
                                  <div className="mb-xl-2 mb-4 text-heading">
                                    <p className="mb-2">
                                      {" "}
                                      <strong>Name : </strong>{" "}
                                      <span className="text-primary">
                                        {
                                          selectedUser?.position?.acting_user
                                            .name
                                        }
                                      </span>
                                    </p>
                                    <p className="mb-2">
                                      {" "}
                                      <strong>Email Address : </strong>{" "}
                                      {
                                        selectedUser?.position?.acting_user
                                          ?.email
                                      }{" "}
                                    </p>
                                    <p className="mb-2">
                                      {" "}
                                      <strong>PF-Number : </strong>{" "}
                                      {
                                        selectedUser?.position?.acting_user
                                          ?.pf_number
                                      }
                                    </p>
                                  </div>
                                  <div>
                                    <h5 className="mb-6">References</h5>
                                    <div className="mb-1 text-heading">
                                      <strong>Assigned At : </strong>
                                      <span className="fw-medium badge bg-label-success px-3">
                                        {formatDate(
                                          selectedUser?.position?.acting_user
                                            ?.created_at
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
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
                                    <th style={{ width: "50px" }}>
                                      S&nbsp;/&nbsp;N
                                    </th>
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
                                    positions.map((dataRows, index) => (
                                      <tr key={dataRows.uid}>
                                        <td style={{ width: "50px" }}>
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
                                        <td className="fw-medium">
                                          {dataRows?.created_at}
                                        </td>
                                        <td className="fw-medium">
                                          {dataRows.created_at !== null
                                            ? dataRows.end_date
                                            : dataRows.end_date}
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
                                  className="fv-plugins-bootstrap5 fv-plugins-framework"
                                >
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
                                  <button
                                    aria-label="Click me"
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#resetPasswordModal"
                                  >
                                    Change Password
                                  </button>
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
                                <div className="text-center mb-1">
                                  <img
                                    src={previewSign}
                                    alt="Signature"
                                    className="img-fluid rounded mb-4 shadow"
                                    height="100px"
                                    width="85%"
                                    onClick={() =>
                                      setIsUploadSignVisible((prev) => !prev)
                                    }
                                    style={{ height: "100px", width: "85%" }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src =
                                        "/assets/img/avatars/signature.png";
                                    }}
                                  />
                                  {!isUploadSignVisible && (
                                    <button
                                      type="button"
                                      className="ms-1 btn btn-outline-primary btn-sm cursor-pointer"
                                      onClick={() =>
                                        setIsUploadSignVisible((prev) => !prev)
                                      }
                                    >
                                      change Signature
                                    </button>
                                  )}
                                </div>
                                <div
                                  className="button-wrapper"
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                  }}
                                >
                                  {isUploadSignVisible && (
                                    <div className="m-3" id="card-sign-div">
                                      <div className="input-group">
                                        <label
                                          htmlFor="inputGroupFile05"
                                          className="btn btn-sm btn-outline-success"
                                        >
                                          Choose File
                                        </label>
                                        <input
                                          type="file"
                                          name="account-sign-input"
                                          className="form-control form-control-sm account-file-input-sign visually-hidden"
                                          id="inputGroupFile05"
                                          aria-describedby="inputGroupFileAddon05"
                                          onChange={handleChangeSign}
                                          accept=".jpg,.jpeg,.png,.svg,.ico"
                                          aria-label="Upload"
                                          ref={fileSignInputRef}
                                        />
                                        <button
                                          aria-label="Click me"
                                          className="btn btn-sm btn-outline-danger account-file-input-sign"
                                          type="button"
                                          onClick={handleResetImageSign}
                                          disabled={!isSignSelected}
                                        >
                                          <strong>X</strong>
                                        </button>
                                        <button
                                          aria-label="Click me"
                                          className="btn btn-sm btn-outline-primary account-file-input-sign"
                                          type="button"
                                          onClick={() => handleUploadSign()}
                                          disabled={
                                            !isSignSelected || isSignUploading
                                          }
                                        >
                                          {isSignUploading
                                            ? "Saving..."
                                            : "SAVE"}
                                        </button>
                                      </div>
                                    </div>
                                  )}
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* <UserModal loadOnlyModal={true} onClose={() => setSelectedUser(null)} /> */}
      <DelegationModal />
      <ResetPasswordModal />
    </AccountContext.Provider>
  );
};
