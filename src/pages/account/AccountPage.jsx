import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import showToast from "../../helpers/ToastHelper";
import { AccountContext } from "../../utils/context";
import {
  getPositions,
  photoUpload,
  removeDelegatedUser,
  signatureUpload,
} from "./Queries";
import usePagination from "../../hooks/usePagination";
import { formatDate } from "../../helpers/DateFormater";
import { useSelector } from "react-redux";
import DelegationModal from "./DelegationModal";
import { hasAccess } from "../../hooks/AccessHandler";
import { useDispatch } from "react-redux";
import { userTypes } from "../../redux/types/authentication";
import ResetPasswordModal from "./ResetPasswordModal";
import {
  User,
  Camera,
  Shield,
  Lock,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  RefreshCw,
  Upload,
  X,
  Key,
  FileSignature,
  UserPlus,
  UserMinus,
  ChevronDown,
  ClipboardList,
  Building,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import "../../css/AccountPage.css";

export const AccountPage = () => {
  const dispatch = useDispatch();

  const badgeColors = [
    "badge-primary",
    "badge-success",
    "badge-warning",
    "badge-info",
    "badge-secondary",
  ];

  const user = useSelector((state) => state.userReducer?.data);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("positions");
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    contact: false,
    currentPosition: true,
    previousPositions: false,
  });

  const [loadDelagationModal, setLoadDelagationModal] = useState(false);

  const [loadingPositions, setLoadingPositions] = useState(true);
  const [positions, setPositions] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    currentPage,
    pageSize,
    updatePage,
    updatePagination,
    updateTotalCount,
  } = usePagination(10, 1, true);

  const uploadValues = {
    uid: selectedUser?.guid,
    based64_file: "",
  };

  const [isSignSelected, setIsSignSelected] = useState(false);

  const [previewImage, setPreviewImage] = useState("/assets/img/avatars/1.png");
  const [previewSign, setPreviewSign] = useState(
    "/assets/img/avatars/signature.png"
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
        }
      }
    } catch (err) {
      console.error(err);
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
    setIsFileSelected(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChangeSign = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewSign(previewUrl);
      setIsSignSelected(true);
    } else {
      setIsSignSelected(false);
    }
  };

  const handleResetImageSign = () => {
    setPreviewSign(
      selectedUser?.signature && selectedUser.signature.trim() !== ""
        ? selectedUser.signature
        : "/assets/img/avatars/signature.png"
    );
    setIsSignSelected(false);
    if (fileSignInputRef.current) {
      fileSignInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (hasAccess(user, ["can_upload_profile_photo"]) === false) {
      Swal.fire(
        "Error!",
        "Sorry You don't have permission to change Profile",
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
        text: "You're about to save the new Profile Photo",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#696cff",
        cancelButtonColor: "#aaa",
        confirmButtonText: "Confirm Save",
      });

      if (confirmation.isConfirmed) {
        setIsUploadingPhoto(true);
        const file = fileInputRef.current.files[0];
        const toBase64 = (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
          });

        const base64File = await toBase64(file);
        uploadValues.based64_file = base64File;

        const result = await photoUpload(uploadValues);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire(
            "Success!",
            "Profile photo updated successfully.",
            "success"
          );
          dispatch({
            type: userTypes.USER_UPDATE,
            payload: {
              user: result.data,
            },
          });
          window.location.reload();
          setSelectedUser(result.data);
          setIsFileSelected(false);
        } else {
          Swal.fire("Error!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      Swal.fire("Error", "Unable to upload photo. Please try again.", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  useEffect(() => {
    handleFetchData();
  }, []);

  const handleUploadSign = async () => {
    if (hasAccess(user, ["can_upload_profile_signature"]) === false) {
      Swal.fire(
        "Error!",
        "Sorry You don't have permission to change Signature",
        "error"
      );
      return;
    }
    if (!selectedUser) {
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
          uid: selectedUser?.guid,
          based64_file: base64File,
        };

        const result = await signatureUpload(uploadSignValues);
        if (result.status === 200 || result.status === 8000) {
          Swal.fire("Success!", "Signature updated successfully.", "success");
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
          if (fileSignInputRef.current) fileSignInputRef.current.value = "";
        } else {
          Swal.fire("Error!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      Swal.fire(
        "Error",
        "Unable to upload signature. Please try again.",
        "error"
      );
    } finally {
      setIsSignUploading(false);
    }
  };

  const handleRemoveDelegation = async () => {
    if (
      hasAccess(user, ["can_assign_delegate", "can_remove_delegate"]) === false
    ) {
      Swal.fire(
        "Error!",
        "Sorry You don't have permission to Remove Delegation",
        "error"
      );
      return;
    }
    try {
      const confirmation = await Swal.fire({
        title: "Are you sure?",
        text: "You're about to remove delegated user",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#DC3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, Remove",
        cancelButtonText: "Cancel",
      });

      if (confirmation.isConfirmed) {
        const result = await removeDelegatedUser();
        if (result.status === 200 || result.status === 8000) {
          Swal.fire("Success!", "Delegation removed successfully.", "success");
          dispatch({
            type: userTypes.USER_UPDATE,
            payload: {
              user: result.data,
            },
          });
          window.location.reload();
        } else {
          Swal.fire("Error!", `${result.message}`, "error");
        }
      }
    } catch (error) {
      Swal.fire(
        "Error",
        "Unable to remove delegation. Please try again.",
        "error"
      );
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "text-success";
      case "NEW":
        return "text-info";
      case "RETIRED":
        return "text-danger";
      default:
        return "text-muted";
    }
  };

  return (
    <AccountContext.Provider
      value={{
        handleFetchData,
        selectedUser,
        loadDelagationModal,
        setLoadDelagationModal,
      }}
    >
      <style>
        {`
  /* Profile Container */
.profile-container {
  min-height: 100vh;
  background: #f8fafc;
  padding: 20px;
}

/* Header */
.profile-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.profile-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.refresh-btn {
  background: linear-gradient(135deg, #1976d2, #e53935);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

/* Profile Card */
.profile-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

/* Avatar */
.profile-avatar-container {
  text-align: center;
  margin-bottom: 20px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.camera-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  background: #1976d2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 3px solid white;
  transition: all 0.3s ease;
}

.camera-btn:hover {
  background: #1565c0;
  transform: scale(1.1);
}

.uploading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 16px 0 8px;
}

.user-status {
  margin-bottom: 20px;
}

.text-success { color: #2e7d32; }
.text-info { color: #0288d1; }
.text-danger { color: #c62828; }
.text-muted { color: #64748b; }

/* Upload Controls */
.upload-controls {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
}

/* Info Items */
.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 8px;
}

.info-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1976d2;
}

.info-item-content {
  flex: 1;
}

.info-item-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.info-item-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* Section Headers */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chevron-icon {
  transition: transform 0.3s ease;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  color: #64748b;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  border-color: #1976d2;
  color: #1976d2;
}

.tab-button.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.alert-badge {
  background: #dc3545;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-badge {
  background: #6c757d;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

/* Position Cards */
.position-card {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #f8fafc;
  margin-bottom: 12px;
}

.position-card.current {
  border-left-color: #1976d2;
}

.position-card.delegated {
  border-left-color: #ff9800;
  background: #fff8e1;
}

.position-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.position-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.position-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.position-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

.delegate-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.delegate-btn:hover {
  background: #1565c0;
}

.remove-delegate-btn {
  background: white;
  color: #ff9800;
  border: 1px solid #ff9800;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.remove-delegate-btn:hover {
  background: #ff9800;
  color: white;
}

.position-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

/* Table */
.table-container {
  overflow-x: auto;
}

.faded-table {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border-collapse: collapse;
  opacity: 0.8;
}

.faded-table thead {
  background: #f1f1f1;
}

.faded-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 2px solid #e2e8f0;
}

.faded-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #666;
  font-size: 14px;
}

.faded-table tbody tr:hover {
  background: #f8fafc;
}

/* Signature Preview */
.signature-preview {
  width: 100%;
  height: 140px;
  background: white;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.signature-preview:hover {
  border-color: #1976d2;
  background: #f8fafc;
}

.signature-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Roles */
.roles-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #e3f2fd;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #1976d2;
  border: 1px solid rgba(25, 118, 210, 0.2);
}

/* Buttons */
.btn-primary {
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background: white;
  color: #1976d2;
  border: 2px solid #1976d2;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-outline:hover {
  background: #f0f7ff;
}

/* Loading & Error States */
.loading-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
}

.error-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 40px;
}

.error-badge {
  background: #dc3545;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.retry-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #1565c0;
}

.loading-positions,
.no-data {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #64748b;
}

.empty-state svg {
  margin-bottom: 16px;
  color: #a0aec0;
}

/* Badges */
.badge-primary {
  background: #1976d2;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-success {
  background: #2e7d32;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-warning {
  background: #ff9800;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-info {
  background: #0288d1;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-secondary {
  background: #6c757d;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.active-badge {
  background: #2e7d32;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-container {
    padding: 12px;
  }
  
  .profile-header {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .profile-card {
    padding: 16px;
  }
  
  .profile-avatar {
    width: 100px;
    height: 100px;
  }
  
  .position-details {
    grid-template-columns: 1fr;
  }
  
  .tab-navigation {
    flex-direction: column;
  }
  
  .tab-button {
    width: 100%;
    justify-content: center;
  }
}
`}
      </style>

      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="header-content">
            <div>
              <h2 className="profile-title">User Profile</h2>
              <p className="profile-subtitle">
                Manage your account settings and preferences
              </p>
            </div>
            <button className="refresh-btn" onClick={handleFetchData}>
              <RefreshCw size={18} />
              Refresh Profile
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h4 className="text-primary mt-3">Loading Profile...</h4>
          </div>
        ) : error || selectedUser === null ? (
          <div className="error-container">
            <div className="error-badge">
              <XCircle size={24} />
              Error Loading Profile
            </div>
            <p className="text-muted mt-3">
              Unable to retrieve user details. Please contact system
              administrator.
            </p>
            <button className="retry-btn mt-3" onClick={handleFetchData}>
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        ) : (
          <div className="row animate-fade-in">
            {/* Left Column - Profile Info */}
            <div className="col-xl-4 col-lg-4 col-md-12 mb-4">
              {/* Profile Card */}
              <div className="profile-card">
                <div className="profile-avatar-container">
                  <div className="avatar-wrapper">
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="profile-avatar"
                    />
                    {isUploadingPhoto && (
                      <div className="uploading-overlay">
                        <div className="spinner-border" role="status">
                          <span className="visually-hidden">Uploading...</span>
                        </div>
                      </div>
                    )}
                    {hasAccess(user, ["can_upload_profile_photo"]) && (
                      <>
                        <input
                          type="file"
                          className="d-none"
                          onChange={handlePhotoChange}
                          accept=".jpg,.jpeg,.png,.gif"
                          ref={fileInputRef}
                          id="photo-upload"
                        />
                        <label htmlFor="photo-upload" className="camera-btn">
                          <Camera size={18} />
                        </label>
                      </>
                    )}
                  </div>

                  <h5 className="user-name mt-4">
                    {selectedUser.first_name} {selectedUser.middle_name}{" "}
                    {selectedUser.last_name}
                  </h5>

                  <div className="user-status">
                    <span className={getStatusColor(selectedUser.status)}>
                      <CheckCircle size={14} className="me-1" />
                      {selectedUser.status}
                    </span>
                  </div>
                </div>

                {/* Photo Upload Controls - Only show when file is selected */}
                {isFileSelected &&
                  hasAccess(user, ["can_upload_profile_photo"]) && (
                    <div className="upload-controls mt-3">
                      <div className="d-flex gap-2">
                        <button
                          className="btn-outline w-100"
                          onClick={handleResetImage}
                        >
                          <X size={16} />
                          Cancel
                        </button>
                        <button
                          className="btn-primary w-100"
                          onClick={handleUpload}
                          disabled={isUploadingPhoto}
                        >
                          {isUploadingPhoto ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload size={16} />
                              Save Photo
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                {/* Personal Information */}
                <div
                  className="section-header"
                  onClick={() => toggleSection("personal")}
                >
                  <div className="section-title">
                    <User size={18} />
                    Personal Information
                  </div>
                  <ChevronDown
                    size={18}
                    className={`chevron-icon ${
                      expandedSections.personal ? "rotated" : ""
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {expandedSections.personal && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="info-item">
                        <div className="info-item-icon">
                          <User size={16} />
                        </div>
                        <div className="info-item-content">
                          <div className="info-item-label">Username</div>
                          <div className="info-item-value">
                            {selectedUser.username}
                          </div>
                        </div>
                      </div>

                      <div className="info-item">
                        <div className="info-item-icon">
                          <Briefcase size={16} />
                        </div>
                        <div className="info-item-content">
                          <div className="info-item-label">PF Number</div>
                          <div className="info-item-value">
                            {selectedUser.pf_number}
                          </div>
                        </div>
                      </div>

                      <div className="info-item">
                        <div className="info-item-icon">
                          <Award size={16} />
                        </div>
                        <div className="info-item-content">
                          <div className="info-item-label">Check Number</div>
                          <div className="info-item-value">
                            {selectedUser.check_number}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Contact Information */}
                <div
                  className="section-header mt-3"
                  onClick={() => toggleSection("contact")}
                >
                  <div className="section-title">
                    <Phone size={18} />
                    Contact Information
                  </div>
                  <ChevronDown
                    size={18}
                    className={`chevron-icon ${
                      expandedSections.contact ? "rotated" : ""
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {expandedSections.contact && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="info-item">
                        <div className="info-item-icon">
                          <Mail size={16} />
                        </div>
                        <div className="info-item-content">
                          <div className="info-item-label">Email</div>
                          <div className="info-item-value text-primary">
                            {selectedUser.email}
                          </div>
                        </div>
                      </div>

                      <div className="info-item">
                        <div className="info-item-icon">
                          <Phone size={16} />
                        </div>
                        <div className="info-item-content">
                          <div className="info-item-label">Primary Contact</div>
                          <div className="info-item-value">
                            {selectedUser.phone_number}
                          </div>
                        </div>
                      </div>

                      <div className="info-item">
                        <div className="info-item-icon">
                          <Phone size={16} />
                        </div>
                        <div className="info-item-content">
                          <div className="info-item-label">
                            Alternative Contact
                          </div>
                          <div className="info-item-value">
                            {selectedUser.alternative_contact || "N/A"}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Column - Positions, Security & Roles */}
            <div className="col-xl-8 col-lg-8 col-md-12">
              {/* Tab Navigation */}
              <div className="tab-navigation">
                <button
                  className={`tab-button ${
                    activeTab === "positions" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("positions")}
                >
                  <Briefcase size={16} />
                  Positions
                </button>
                <button
                  className={`tab-button ${
                    activeTab === "security" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("security")}
                >
                  <Shield size={16} />
                  Security
                  {selectedUser.signature?.trim() === "" && (
                    <span className="alert-badge">!</span>
                  )}
                </button>
                <button
                  className={`tab-button ${
                    activeTab === "roles" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("roles")}
                >
                  <ClipboardList size={16} />
                  My Roles
                  <span className="count-badge">{user?.groups?.length}</span>
                </button>
              </div>

              {activeTab === "positions" ? (
                <div className="profile-card">
                  {/* Current Position */}
                  <div
                    className="section-header"
                    onClick={() => toggleSection("currentPosition")}
                  >
                    <div className="section-title">
                      <Briefcase size={18} />
                      Current Position
                      {selectedUser.position && (
                        <span className="active-badge ms-2">Active</span>
                      )}
                    </div>
                    <ChevronDown
                      size={18}
                      className={`chevron-icon ${
                        expandedSections.currentPosition ? "rotated" : ""
                      }`}
                    />
                  </div>

                  <AnimatePresence>
                    {expandedSections.currentPosition && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {selectedUser.position ? (
                          <>
                            {/* Current Position Card */}
                            <div className="position-card current">
                              <div className="position-header">
                                <div>
                                  <h6 className="position-title">
                                    {selectedUser.position.level_name}
                                  </h6>
                                  <div className="position-meta">
                                    <span className="meta-item">
                                      <MapPin size={12} />
                                      {selectedUser.position.directory_name}
                                    </span>
                                    <span className="meta-item">
                                      <Building size={12} />
                                      {selectedUser.position.department_name}
                                    </span>
                                  </div>
                                </div>
                                {hasAccess(
                                  user,
                                  ["can_assign_delegate"],
                                  ["Delegators", "Delegator"]
                                ) &&
                                  selectedUser.position?.acting_user ===
                                    null && (
                                    <button
                                      className="delegate-btn"
                                      data-bs-toggle="modal"
                                      data-bs-target="#delegatedUserModal"
                                      onClick={() =>
                                        setLoadDelagationModal(true)
                                      }
                                    >
                                      <UserPlus size={14} />
                                      Add Delegate
                                    </button>
                                  )}
                              </div>

                              <div className="position-details">
                                <div className="detail-item">
                                  <span className="detail-label">
                                    Assigned Date
                                  </span>
                                  <span className="detail-value">
                                    {formatDate(
                                      selectedUser.position.start_date
                                    )}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">End Date</span>
                                  <span className="detail-value">
                                    {selectedUser.position.last_date
                                      ? formatDate(
                                          selectedUser.position.last_date
                                        )
                                      : "Ongoing"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Delegated Responsibility */}
                            {selectedUser.position?.acting_user && (
                              <div className="position-card delegated mt-3">
                                <div className="position-header">
                                  <div>
                                    <h6 className="position-title">
                                      Delegated Responsibility
                                    </h6>
                                    <p className="position-subtitle">
                                      Currently assigned to acting user
                                    </p>
                                  </div>
                                  {hasAccess(user, ["can_assign_delegate"]) && (
                                    <button
                                      className="remove-delegate-btn"
                                      onClick={handleRemoveDelegation}
                                    >
                                      <UserMinus size={14} />
                                      Remove
                                    </button>
                                  )}
                                </div>

                                <div className="position-details">
                                  <div className="detail-item">
                                    <span className="detail-label">
                                      Acting User
                                    </span>
                                    <span className="detail-value">
                                      {selectedUser.position.acting_user.name}
                                    </span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">
                                      Delegated Since
                                    </span>
                                    <span className="detail-value">
                                      {formatDate(
                                        selectedUser.position.acting_user
                                          ?.created_at
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="empty-state">
                            <Briefcase size={32} />
                            <p>No current position assigned</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Previous Positions */}
                  <div
                    className="section-header mt-4"
                    onClick={() => toggleSection("previousPositions")}
                  >
                    <div className="section-title">
                      <Clock size={18} />
                      Previously Assigned Positions
                      <span className="count-badge ms-2">
                        {positions?.length || 0}
                      </span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`chevron-icon ${
                        expandedSections.previousPositions ? "rotated" : ""
                      }`}
                    />
                  </div>

                  <AnimatePresence>
                    {expandedSections.previousPositions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="table-container">
                          <table className="faded-table">
                            <thead>
                              <tr>
                                <th>S/N</th>
                                <th>Position</th>
                                <th>Location</th>
                                <th>From</th>
                                <th>To</th>
                              </tr>
                            </thead>
                            <tbody>
                              {loadingPositions ? (
                                <tr>
                                  <td colSpan="5">
                                    <div className="loading-positions">
                                      Loading previous positions...
                                    </div>
                                  </td>
                                </tr>
                              ) : positions?.length === 0 ? (
                                <tr>
                                  <td colSpan="5">
                                    <div className="no-data">
                                      No previous positions found
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                positions.map((dataRows, index) => (
                                  <tr key={dataRows.uid}>
                                    <td>
                                      {(currentPage - 1) * pageSize + index + 1}
                                    </td>
                                    <td>{dataRows.level.name}</td>
                                    <td>
                                      <div>
                                        <div className="fw-bold">
                                          {dataRows.directory.name}
                                        </div>
                                        {dataRows.department?.name && (
                                          <small className="text-muted">
                                            {dataRows.department.name}
                                          </small>
                                        )}
                                      </div>
                                    </td>
                                    <td>{dataRows?.created_at}</td>
                                    <td>{dataRows.end_date || "Present"}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : activeTab === "security" ? (
                <div className="profile-card">
                  <div className="row">
                    {/* Change Password */}
                    <div className="col-md-6 mb-4">
                      <h6 className="section-title mb-3">
                        <Key size={18} />
                        Password Security
                      </h6>
                      <div className="info-item">
                        <div className="info-item-icon">
                          <Lock size={16} />
                        </div>
                        <div className="info-item-content">
                          <div className="info-item-label">Password Status</div>
                          <div className="info-item-value">
                            Last changed: Recently
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          className="btn-primary w-100"
                          data-bs-toggle="modal"
                          data-bs-target="#resetPasswordModal"
                        >
                          <Key size={16} />
                          Change Password
                        </button>
                        <p className="text-muted small mt-2">
                          Minimum 8 characters with uppercase, lowercase, and
                          special characters.
                        </p>
                      </div>
                    </div>

                    {/* Signature Management */}
                    <div className="col-md-6">
                      <h6 className="section-title mb-3">
                        <FileSignature size={18} />
                        Digital Signature
                      </h6>

                      <input
                        type="file"
                        className="d-none"
                        onChange={handleChangeSign}
                        accept=".jpg,.jpeg,.png,.svg"
                        ref={fileSignInputRef}
                        id="signature-upload"
                      />

                      <label
                        htmlFor="signature-upload"
                        className="signature-preview"
                      >
                        <img src={previewSign} alt="Signature" />
                      </label>

                      {isSignSelected && (
                        <div className="upload-controls mt-3">
                          <div className="d-flex gap-2">
                            <button
                              className="btn-outline w-100"
                              onClick={handleResetImageSign}
                            >
                              <X size={16} />
                              Cancel
                            </button>
                            <button
                              className="btn-primary w-100"
                              onClick={handleUploadSign}
                              disabled={isSignUploading}
                            >
                              {isSignUploading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Upload size={16} />
                                  Save Signature
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="text-muted small mt-3">
                        Click on the signature to upload a new one.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="profile-card">
                  <h6 className="section-title mb-4">
                    <ClipboardList size={18} />
                    Assigned Roles
                  </h6>

                  {user?.groups?.length === 0 ? (
                    <div className="empty-state">
                      <ClipboardList size={32} />
                      <p>No roles assigned</p>
                    </div>
                  ) : (
                    <div className="roles-container">
                      {user?.groups?.map((group, index) => (
                        <div key={index} className="role-badge">
                          <Shield size={14} />
                          {group}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <DelegationModal />
      <ResetPasswordModal />
    </AccountContext.Provider>
  );
};