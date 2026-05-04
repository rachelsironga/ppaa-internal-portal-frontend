import React, { useState, useEffect } from "react";
import "animate.css";
import { DisposalRecordContext } from "../../../../../utils/context";
import { useNavigate, useParams } from "react-router-dom";
import BreadCumb from "../../../../../layouts/BreadCumb";
import { formatDate } from "../../../../../helpers/DateFormater";
import { getDisposalRecord, getMaintenanceRecords, approveDisposalRecord, rejectDisposalRecord, deleteDisposalRecord, getDisposalAuditTrail, getDisposalConversations, createDisposalConversation, resubmitDisposalRecord, cancelDisposalRecord } from "./Queries";
import Swal from "sweetalert2";
import showToast from "../../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import { hasAccess } from "../../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
import { DisposalRecordModal } from "./DisposalRecordModal";

export const DisposalRecordsView = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [loadingMaintenance, setLoadingMaintenance] = useState(false);
    const [auditTrail, setAuditTrail] = useState([]);
    const [loadingAudit, setLoadingAudit] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [resubmissionNote, setResubmissionNote] = useState("");
    const [cancellationReason, setCancellationReason] = useState("");

    useEffect(() => {
        handleFetchDisposalRecord();
    }, [uid]);

    // Listen for modal close events to refresh data after edit
    useEffect(() => {
        const modalElement = document.getElementById("disposalrecordModal");
        if (!modalElement) return;

        const handleModalHidden = () => {
            if (uid) {
                handleFetchDisposalRecord();
            }
        };

        modalElement.addEventListener("hidden.bs.modal", handleModalHidden);
        return () => {
            modalElement.removeEventListener("hidden.bs.modal", handleModalHidden);
        };
    }, [uid]);

    // Fetch maintenance records when maintenance tab is active
    useEffect(() => {
        if (activeTab === "maintenance" && selectedObj?.asset?.uid) {
            fetchMaintenanceRecords();
        }
    }, [activeTab, selectedObj]);

    // Fetch audit trail when audit tab is active
    useEffect(() => {
        if (activeTab === "audit" && selectedObj?.uid) {
            fetchAuditTrail();
        }
    }, [activeTab, selectedObj]);

    // Fetch conversations when conversations tab is active
    useEffect(() => {
        if (activeTab === "conversations" && selectedObj?.uid) {
            fetchConversations();
        }
    }, [activeTab, selectedObj]);

    const handleFetchDisposalRecord = async () => {
        setLoading(true);
        setError(false);
        try {
            const result = await getDisposalRecord({
                uid: uid,
            });
            if (result && (result.status === 200 || result.status === 8000)) {
                setSelectedObj(result.data);
            } else {
                setError(true);
                showToast("No Disposal Record Found", "warning", "Fetch Completed");
            }
        } catch (err) {
            console.error("Error fetching disposal record:", err);
            setError(true);
            showToast("Unable to Fetch Disposal Record", "warning", "Failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchMaintenanceRecords = async () => {
        const assetUid = selectedObj?.asset?.uid || selectedObj?.asset;
        if (!assetUid) {
            console.warn("Asset UID not available for fetching maintenance records");
            return;
        }
        setLoadingMaintenance(true);
        try {
            const result = await getMaintenanceRecords(assetUid);
            if (result.status === 200 || result.status === 8000) {
                setMaintenanceRecords(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching maintenance records:", err);
        } finally {
            setLoadingMaintenance(false);
        }
    };

    const fetchAuditTrail = async () => {
        if (!selectedObj?.uid) return;
        setLoadingAudit(true);
        try {
            const result = await getDisposalAuditTrail(selectedObj.uid);
            if (result.status === 200 || result.status === 8000) {
                setAuditTrail(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching audit trail:", err);
        } finally {
            setLoadingAudit(false);
        }
    };

    const fetchConversations = async () => {
        if (!selectedObj?.uid) return;
        setLoadingConversations(true);
        try {
            const result = await getDisposalConversations(selectedObj.uid);
            if (result.status === 200 || result.status === 8000) {
                setConversations(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching conversations:", err);
        } finally {
            setLoadingConversations(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedObj?.uid) return;
        
        setSendingMessage(true);
        try {
            const result = await createDisposalConversation(selectedObj.uid, {
                message: newMessage.trim(),
                message_type: 'comment',
            });
            if (result.status === 200 || result.status === 8000) {
                setNewMessage("");
                fetchConversations();
                showToast("Message sent successfully", "success", "Success");
            } else {
                showToast(result?.message || "Failed to send message", "error", "Error");
            }
        } catch (err) {
            console.error("Error sending message:", err);
            showToast("Failed to send message", "error", "Error");
        } finally {
            setSendingMessage(false);
        }
    };

    const handleResubmitDisposalRecord = async () => {
        if (!selectedObj || !resubmissionNote.trim()) {
            Swal.fire("Error!", "Please provide a resubmission note explaining why this disposal should be approved.", "error");
            return;
        }

        if (resubmissionNote.trim().length < 20) {
            Swal.fire("Error!", "Resubmission note must be at least 20 characters.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Resubmit Disposal Record?",
                html: `
                    <p>You're about to resubmit disposal record for asset: <strong>${selectedObj.asset?.asset_tag || selectedObj.asset_tag || 'Unknown'}</strong></p>
                    <p class="text-muted small">Your note:</p>
                    <p class="text-start bg-light p-2 rounded">${resubmissionNote}</p>
                `,
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#007bff",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, resubmit it!",
                cancelButtonText: "Cancel",
            });

            if (confirmation.isConfirmed) {
                const result = await resubmitDisposalRecord(selectedObj.uid, {
                    resubmission_note: resubmissionNote.trim()
                });
                if (result && (result.status === 200 || result.status === 8000)) {
                    Swal.fire(
                        "Resubmitted!",
                        "The disposal record has been resubmitted for approval.",
                        "success"
                    );
                    setShowRejectionModal(false);
                    setResubmissionNote("");
                    handleFetchDisposalRecord();
                    fetchConversations();
                    fetchAuditTrail();
                } else {
                    Swal.fire("Error!", result?.message || "Failed to resubmit disposal record", "error");
                }
            }
        } catch (error) {
            console.error("Error resubmitting disposal record:", error);
            Swal.fire(
                "Error!",
                "Unable to resubmit disposal record. Please try again or contact support.",
                "error"
            );
        }
    };

    const handleAcceptRejection = async () => {
        if (!selectedObj) {
            Swal.fire("Error!", "Unable to select this disposal record.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Accept Rejection & Keep Asset?",
                html: `
                    <p>By accepting the rejection, you confirm that:</p>
                    <ul class="text-start">
                        <li>The disposal request will be <strong>closed</strong></li>
                        <li>The asset <strong>${selectedObj.asset?.asset_tag || 'Unknown'}</strong> will remain in service</li>
                    </ul>
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#6c757d",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, accept rejection",
                cancelButtonText: "Go back"
            });

            if (confirmation.isConfirmed) {
                const result = await cancelDisposalRecord(selectedObj.uid, {});
                if (result && (result.status === 200 || result.status === 8000)) {
                    Swal.fire(
                        "Rejection Accepted!",
                        "The disposal request has been closed. The asset will remain in service.",
                        "success"
                    );
                    setShowRejectionModal(false);
                    setCancellationReason("");
                    // Navigate back to the list since the record is now soft-deleted
                    navigate("/ict-assets/asset-disposal-records");
                } else {
                    Swal.fire("Error!", result?.message || "Failed to accept rejection", "error");
                }
            }
        } catch (error) {
            console.error("Error accepting rejection:", error);
            Swal.fire(
                "Error!",
                "Unable to accept rejection. Please try again or contact support.",
                "error"
            );
        }
    };

    const handleApproveDisposalRecord = async () => {
        if (!selectedObj) {
            Swal.fire("Error!", "Unable to select this disposal record.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Approve Disposal Record?",
                text: `You're about to approve disposal record for asset: ${selectedObj.asset?.asset_tag || selectedObj.asset_tag || 'Unknown'}. This action cannot be undone.`,
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#28a745",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, approve it!",
                cancelButtonText: "Cancel",
            });

            if (confirmation.isConfirmed) {
                const result = await approveDisposalRecord(selectedObj.uid);
                if (result && (result.status === 200 || result.status === 8000)) {
                    Swal.fire(
                        "Approved!",
                        "The disposal record has been approved successfully.",
                        "success"
                    );
                    handleFetchDisposalRecord();
                } else {
                    Swal.fire("Error!", result?.message || "Failed to approve disposal record", "error");
                }
            }
        } catch (error) {
            console.error("Error approving disposal record:", error);
            Swal.fire(
                "Error!",
                "Unable to approve disposal record. Please try again or contact support.",
                "error"
            );
        }
    };

    const handleRejectDisposalRecord = async () => {
        if (!selectedObj) {
            Swal.fire("Error!", "Unable to select this disposal record.", "error");
            return;
        }

        try {
            const { value: rejectionReason } = await Swal.fire({
                title: "Reject Disposal Record?",
                text: `You're about to reject disposal record for asset: ${selectedObj.asset?.asset_tag || selectedObj.asset_tag || 'Unknown'}`,
                input: "textarea",
                inputLabel: "Rejection Reason",
                inputPlaceholder: "Please provide a reason for rejection...",
                inputAttributes: {
                    "aria-label": "Type your rejection reason here"
                },
                showCancelButton: true,
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, reject it!",
                cancelButtonText: "Cancel",
                inputValidator: (value) => {
                    if (!value || value.trim().length < 10) {
                        return "Please provide a rejection reason (minimum 10 characters)";
                    }
                }
            });

            if (rejectionReason) {
                const result = await rejectDisposalRecord(selectedObj.uid, {
                    rejection_reason: rejectionReason.trim()
                });
                if (result && (result.status === 200 || result.status === 8000)) {
                    Swal.fire(
                        "Rejected!",
                        "The disposal record has been rejected successfully.",
                        "success"
                    );
                    handleFetchDisposalRecord();
                } else {
                    Swal.fire("Error!", result?.message || "Failed to reject disposal record", "error");
                }
            }
        } catch (error) {
            console.error("Error rejecting disposal record:", error);
            Swal.fire(
                "Error!",
                "Unable to reject disposal record. Please try again or contact support.",
                "error"
            );
        }
    };

    const handleDeleteDisposalRecord = async (disposalRecordToDelete = null) => {
        if (!disposalRecordToDelete) {
            Swal.fire("Error!", "Unable to select this disposal record.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete disposal record for asset: ${disposalRecordToDelete.asset?.asset_tag || disposalRecordToDelete.asset_tag || 'Unknown'} `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteDisposalRecord(disposalRecordToDelete.uid);
                if (result && (result.status === 200 || result.status === 8000)) {
                    Swal.fire(
                        "Deleted!",
                        "The disposal record has been deleted successfully.",
                        "success"
                    );
                    navigate("/ict-assets/asset-disposal-records");
                } else {
                    Swal.fire("Error!", result?.message || "Failed to delete disposal record", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting disposal record:", error);
            Swal.fire(
                "Error!",
                "Unable to delete disposal record. Please try again or contact support.",
                "error"
            );
        }
    };

    const getDisposalMethodLabel = (method) => {
        const methods = {
            'recycled': 'Recycled',
            'sold': 'Sold',
            'donated': 'Donated',
            'destroyed': 'Destroyed'
        };
        return methods[method] || method;
    };

    const getDisposalMethodBadge = (method) => {
        const methodLower = method?.toLowerCase();
        switch (methodLower) {
            case 'recycled':
                return { class: 'bg-success', label: 'Recycled' };
            case 'sold':
                return { class: 'bg-info', label: 'Sold' };
            case 'donated':
                return { class: 'bg-primary', label: 'Donated' };
            case 'destroyed':
                return { class: 'bg-danger', label: 'Destroyed' };
            default:
                return { class: 'bg-secondary', label: method || 'Unknown' };
        }
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        switch (statusLower) {
            case 'pending':
                return { class: 'bg-warning', label: 'Pending' };
            case 'approved':
                return { class: 'bg-success', label: 'Approved' };
            case 'rejected':
                return { class: 'bg-danger', label: 'Rejected' };
            default:
                return { class: 'bg-secondary', label: status || 'Unknown' };
        }
    };

    const getWarrantyStatus = (warrantyDate) => {
        if (!warrantyDate) return <span className="badge bg-secondary">No Warranty</span>;

        const warranty = new Date(warrantyDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((warranty - today) / (1000 * 60 * 60 * 24));

        if (warranty < today) {
            return <span className="badge bg-danger">⚠ Expired</span>;
        } else if (daysUntilExpiry <= 30) {
            return <span className="badge bg-warning">⚠ Expiring Soon ({daysUntilExpiry} days)</span>;
        }
        return <span className="badge bg-success">✓ Active</span>;
    };

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Disposal Record", "View"]}>
                    {null}
                </BreadCumb>
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#00853f"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading Disposal Record Details...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    if (error || !selectedObj) {
        return (
            <>
                <BreadCumb pageList={["Disposal Record", "View"]}>
                    {null}
                </BreadCumb>
                <div className="card">
                    <div className="card-body">
                        <div className="alert alert-danger" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get Disposal Record Details. Please Contact System Administrator
                                </p>
                                <button
                                    className="btn btn-primary btn-sm mt-3"
                                    onClick={() => navigate("/ict-assets/asset-disposal-records")}
                                >
                                    <i className="bx bx-arrow-back me-1"></i> Back to Disposal Records
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const asset = selectedObj?.asset || {};
    const methodInfo = getDisposalMethodBadge(selectedObj?.disposal_method);
    const statusInfo = getStatusBadge(selectedObj?.status);

    return (
        <DisposalRecordContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                handleFetchDisposalRecord,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Disposal Record", asset?.asset_tag || "View"]}>
                {null}
            </BreadCumb>

            {/* Disposal Record Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                    <div className="avatar avatar-xl me-3">
                                        <span className="avatar-initial rounded bg-label-danger">
                                            <i className="bx bx-trash bx-lg"></i>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fw-bold">
                                        Disposal Record: {asset?.asset_tag || "N/A"}
                                    </h4>
                                    <p className="mb-2 text-muted">
                                        {asset?.asset_type_name || "Asset Type"} 
                                        {asset?.manufacturer_name && ` • ${asset.manufacturer_name}`}
                                        {asset?.model && ` • ${asset.model}`}
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        <span className={`badge ${methodInfo.class}`}>
                                            {methodInfo.label}
                                        </span>
                                        {statusInfo && (
                                            <span className={`badge ${statusInfo.class}`}>
                                                {statusInfo.label}
                                            </span>
                                        )}
                                        <span className={`badge ${selectedObj?.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                            {selectedObj?.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            {/* Approval/Rejection buttons - only show when status is pending */}
                            {selectedObj?.status?.toLowerCase() === 'pending' && (
                                <>
                                    {hasAccess(user, [["approve_disposal_record"]]) && (
                                        <button
                                            className="btn btn-success btn-sm me-2"
                                            onClick={handleApproveDisposalRecord}
                                            title="Approve this disposal record"
                                        >
                                            <i className="bx bx-check-circle me-1"></i> Approve
                                        </button>
                                    )}
                                    {hasAccess(user, [["reject_disposal_record"]]) && (
                                        <button
                                            className="btn btn-warning btn-sm me-2"
                                            onClick={handleRejectDisposalRecord}
                                            title="Reject this disposal record"
                                        >
                                            <i className="bx bx-x-circle me-1"></i> Reject
                                        </button>
                                    )}
                                </>
                            )}
                            {/* View Rejection button - only show when status is rejected */}
                            {selectedObj?.status?.toLowerCase() === 'rejected' && !showRejectionModal && (
                                <button
                                    className="btn btn-outline-danger btn-sm me-2"
                                    onClick={() => setShowRejectionModal(true)}
                                    title="View rejection details and respond"
                                >
                                    <i className="bx bx-info-circle me-1"></i> View Rejection
                                </button>
                            )}
                            {selectedObj?.status?.toLowerCase() === 'rejected' && showRejectionModal && (
                                <button
                                    className="btn btn-danger btn-sm me-2"
                                    onClick={() => {
                                        setShowRejectionModal(false);
                                        setResubmissionNote("");
                                    }}
                                    title="Hide rejection details"
                                >
                                    <i className="bx bx-x me-1"></i> Hide Rejection
                                </button>
                            )}
                            {hasAccess(user, [["change_disposal_record"]]) && (
                                <button
                                    className="btn btn-primary btn-sm me-2"
                                    data-bs-toggle="modal"
                                    data-bs-target="#disposalrecordModal"
                                    onClick={() => setSelectedObj(selectedObj)}
                                >
                                    <i className="bx bx-edit-alt me-1"></i> Edit
                                </button>
                            )}
                            {hasAccess(user, [["delete_disposal_record"]]) && (
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteDisposalRecord(selectedObj)}
                                >
                                    <i className="bx bx-trash me-1"></i> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rejection Alert - Show when user clicks View Rejection button */}
            {showRejectionModal && selectedObj?.status?.toLowerCase() === 'rejected' && (
                <div className="card border-danger mb-4 animate__animated animate__fadeIn">
                    <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                            <i className="bx bx-x-circle me-2"></i>
                            Disposal Request Rejected
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close btn-close-white" 
                            onClick={() => {
                                setShowRejectionModal(false);
                                setResubmissionNote("");
                            }}
                            aria-label="Close"
                        ></button>
                    </div>
                    <div className="card-body">
                        {/* Rejection Details */}
                        <div className="alert alert-danger mb-4">
                            <div className="row mb-2">
                                <div className="col-sm-3 fw-medium">Rejected By:</div>
                                <div className="col-sm-9">
                                    {selectedObj.rejected_by?.first_name} {selectedObj.rejected_by?.last_name || selectedObj.rejected_by_name || 'Unknown'}
                                </div>
                            </div>
                            <div className="row mb-2">
                                <div className="col-sm-3 fw-medium">Rejection Date:</div>
                                <div className="col-sm-9">
                                    {selectedObj.decision_date ? formatDate(selectedObj.decision_date) : 'N/A'}
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-3 fw-medium">Reason:</div>
                                <div className="col-sm-9">
                                    <div className="bg-white p-2 rounded border">
                                        {selectedObj.rejection_reason || 'No reason provided.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Response Options */}
                        <h6 className="fw-semibold mb-3">
                            <i className="bx bx-edit me-1"></i>
                            Respond to Rejection
                        </h6>
                        
                        <div className="row">
                            {/* Option 1: Resubmit */}
                            <div className="col-md-7 mb-3">
                                <div className="card h-100 border-primary">
                                    <div className="card-header bg-primary bg-opacity-10">
                                        <h6 className="mb-0 text-primary">
                                            <i className="bx bx-revision me-1"></i>
                                            Resubmit for Approval
                                        </h6>
                                    </div>
                                    <div className="card-body">
                                        <p className="text-muted small mb-2">
                                            Explain why this disposal should be reconsidered and approved.
                                        </p>
                                        <textarea
                                            className="form-control mb-2"
                                            rows="3"
                                            placeholder="Explain why this disposal should be approved (minimum 20 characters)..."
                                            value={resubmissionNote}
                                            onChange={(e) => setResubmissionNote(e.target.value)}
                                        ></textarea>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <small className={`${resubmissionNote.length < 20 ? 'text-muted' : 'text-success'}`}>
                                                {resubmissionNote.length}/20 min
                                            </small>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={handleResubmitDisposalRecord}
                                                disabled={resubmissionNote.trim().length < 20}
                                            >
                                                <i className="bx bx-revision me-1"></i>
                                                Resubmit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Option 2: Accept Rejection */}
                            <div className="col-md-5 mb-3">
                                <div className="card h-100 bg-light">
                                    <div className="card-header">
                                        <h6 className="mb-0 text-secondary">
                                            <i className="bx bx-check me-1"></i>
                                            Accept Rejection
                                        </h6>
                                    </div>
                                    <div className="card-body d-flex flex-column">
                                        <p className="text-muted small mb-3 flex-grow-1">
                                            Accept the rejection and close this disposal request. The asset will remain in service.
                                        </p>
                                        <button
                                            className="btn btn-outline-secondary btn-sm w-100"
                                            onClick={handleAcceptRejection}
                                        >
                                            <i className="bx bx-check me-1"></i>
                                            Accept & Keep Asset
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="row mb-4">
                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0 me-3">
                                    <span className="avatar-initial rounded bg-label-danger">
                                        <i className="bx bx-dollar fs-4"></i>
                                    </span>
                                </div>
                                <div className="flex-grow-1">
                                    <small className="text-muted d-block mb-1">Disposal Value</small>
                                    <h5 className="mb-0">
                                        {selectedObj?.disposal_value
                                            ? `TZS ${parseFloat(selectedObj.disposal_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : "N/A"}
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0 me-3">
                                    <span className="avatar-initial rounded bg-label-info">
                                        <i className="bx bx-calendar fs-4"></i>
                                    </span>
                                </div>
                                <div className="flex-grow-1">
                                    <small className="text-muted d-block mb-1">Disposal Date</small>
                                    <h6 className="mb-0">
                                        {selectedObj?.disposal_date 
                                            ? formatDate(selectedObj.disposal_date)
                                            : "N/A"}
                                    </h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0 me-3">
                                    <span className="avatar-initial rounded bg-label-warning">
                                        <i className="bx bx-shield fs-4"></i>
                                    </span>
                                </div>
                                <div className="flex-grow-1">
                                    <small className="text-muted d-block mb-1">Warranty Status</small>
                                    <div className="mb-0">
                                        {getWarrantyStatus(asset?.warranty_expiry)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0 me-3">
                                    <span className="avatar-initial rounded bg-label-primary">
                                        <i className="bx bx-wrench fs-4"></i>
                                    </span>
                                </div>
                                <div className="flex-grow-1">
                                    <small className="text-muted d-block mb-1">Maintenance Records</small>
                                    <h6 className="mb-0">
                                        {maintenanceRecords.length || 0} Record(s)
                                    </h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nav Pills Tabs */}
            <div className="card shadow-sm">
                <div className="card-body">
                    <ul className="nav nav-pills mb-3 flex-wrap" role="tablist">
                        <li className="nav-item me-1">
                            <button
                                className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                                onClick={() => setActiveTab("overview")}
                            >
                                <i className="bx bx-info-circle me-1"></i> Overview
                            </button>
                        </li>
                        <li className="nav-item me-1">
                            <button
                                className={`nav-link ${activeTab === "asset" ? "active" : ""}`}
                                onClick={() => setActiveTab("asset")}
                            >
                                <i className="bx bx-cube me-1"></i> Asset Details
                            </button>
                        </li>
                        <li className="nav-item me-1">
                            <button
                                className={`nav-link ${activeTab === "financial" ? "active" : ""}`}
                                onClick={() => setActiveTab("financial")}
                            >
                                <i className="bx bx-dollar me-1"></i> Financial
                            </button>
                        </li>
                        <li className="nav-item me-1">
                            <button
                                className={`nav-link ${activeTab === "maintenance" ? "active" : ""}`}
                                onClick={() => setActiveTab("maintenance")}
                            >
                                <i className="bx bx-wrench me-1"></i> Maintenance
                            </button>
                        </li>
                        <li className="nav-item me-1">
                            <button
                                className={`nav-link ${activeTab === "audit" ? "active" : ""}`}
                                onClick={() => setActiveTab("audit")}
                            >
                                <i className="bx bx-history me-1"></i> Audit Trail
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "conversations" ? "active" : ""}`}
                                onClick={() => setActiveTab("conversations")}
                            >
                                <i className="bx bx-message-dots me-1"></i> Conversations
                            </button>
                        </li>
                    </ul>

                    <div className="tab-content">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">Disposal Information</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Asset Tag:</td>
                                                    <td>
                                                        <span className="badge bg-primary">
                                                            {asset?.asset_tag || "-"}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Disposal Date:</td>
                                                    <td>{selectedObj?.disposal_date ? formatDate(selectedObj.disposal_date) : "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Disposal Method:</td>
                                                    <td>
                                                        <span className={`badge ${methodInfo.class}`}>
                                                            {methodInfo.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Status:</td>
                                                    <td>
                                                        {statusInfo && (
                                                            <span className={`badge ${statusInfo.class}`}>
                                                                {statusInfo.label}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Record Status:</td>
                                                    <td>
                                                        <span className={`badge ${selectedObj?.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                                            {selectedObj?.is_active ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">Financial Summary</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Disposal Value:</td>
                                                    <td className="text-danger fw-bold">
                                                        {selectedObj?.disposal_value
                                                            ? `TZS ${parseFloat(selectedObj.disposal_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                            : "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Original Cost:</td>
                                                    <td className="text-success">
                                                        {asset?.purchase_cost
                                                            ? `TZS ${Number(asset.purchase_cost).toLocaleString()}`
                                                            : "-"}
                                                    </td>
                                                </tr>
                                                {asset?.purchase_cost && selectedObj?.disposal_value && (
                                                    <tr>
                                                        <td className="fw-medium">Loss/Gain:</td>
                                                        <td>
                                                            {parseFloat(selectedObj.disposal_value) < parseFloat(asset.purchase_cost) ? (
                                                                <span className="text-danger fw-bold">
                                                                    -TZS {(parseFloat(asset.purchase_cost) - parseFloat(selectedObj.disposal_value)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            ) : (
                                                                <span className="text-success fw-bold">
                                                                    +TZS {(parseFloat(selectedObj.disposal_value) - parseFloat(asset.purchase_cost)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {selectedObj?.disposal_reason && (
                                    <div className="mt-4">
                                        <h5 className="mb-2 fw-semibold">Disposal Reason</h5>
                                        <div className="alert alert-info">
                                            <p className="mb-0">{selectedObj.disposal_reason}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Asset Details Tab */}
                        {activeTab === "asset" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <h5 className="mb-3 fw-semibold">Asset Information</h5>
                                <div className="row">
                                    <div className="col-md-6">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Asset Tag:</td>
                                                    <td>{asset?.asset_tag || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Serial Number:</td>
                                                    <td>{asset?.serial_number || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Barcode:</td>
                                                    <td>{asset?.barcode || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Asset Type:</td>
                                                    <td>{asset?.asset_type_name || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Model:</td>
                                                    <td>{asset?.model || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Manufacturer:</td>
                                                    <td>{asset?.manufacturer_name || "-"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Purchase Date:</td>
                                                    <td>{asset?.purchase_date ? formatDate(asset.purchase_date) : "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Purchase Cost:</td>
                                                    <td>
                                                        {asset?.purchase_cost
                                                            ? `TZS ${Number(asset.purchase_cost).toLocaleString()}`
                                                            : "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Warranty Expiry:</td>
                                                    <td>
                                                        {asset?.warranty_expiry ? formatDate(asset.warranty_expiry) : "-"}
                                                        {asset?.warranty_expiry && (
                                                            <div className="mt-1">
                                                                {getWarrantyStatus(asset.warranty_expiry)}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Location:</td>
                                                    <td>{asset?.location_name || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Custodian:</td>
                                                    <td>{asset?.custodian_name || "Unassigned"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Status:</td>
                                                    <td>
                                                        <span className={`badge bg-${asset?.status === 'operational' ? 'success' : asset?.status === 'in_repair' ? 'info' : 'warning'}`}>
                                                            {asset?.status || "-"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Financial Tab */}
                        {activeTab === "financial" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <h5 className="mb-3 fw-semibold">Financial Information</h5>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="card bg-light mb-3">
                                            <div className="card-body">
                                                <h6 className="text-muted mb-3">Purchase Information</h6>
                                                <table className="table table-sm table-borderless mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-medium">Purchase Cost:</td>
                                                            <td className="text-end text-success fw-bold">
                                                                {asset?.purchase_cost
                                                                    ? `TZS ${Number(asset.purchase_cost).toLocaleString()}`
                                                                    : "N/A"}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Purchase Date:</td>
                                                            <td className="text-end">
                                                                {asset?.purchase_date ? formatDate(asset.purchase_date) : "N/A"}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Supplier:</td>
                                                            <td className="text-end">{asset?.supplier_name || "N/A"}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="card bg-light mb-3">
                                            <div className="card-body">
                                                <h6 className="text-muted mb-3">Disposal Information</h6>
                                                <table className="table table-sm table-borderless mb-0">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-medium">Disposal Value:</td>
                                                            <td className="text-end text-danger fw-bold">
                                                                {selectedObj?.disposal_value
                                                                    ? `TZS ${parseFloat(selectedObj.disposal_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                                    : "N/A"}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Disposal Date:</td>
                                                            <td className="text-end">
                                                                {selectedObj?.disposal_date ? formatDate(selectedObj.disposal_date) : "N/A"}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-medium">Method:</td>
                                                            <td className="text-end">
                                                                <span className={`badge ${methodInfo.class}`}>
                                                                    {methodInfo.label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {asset?.purchase_cost && selectedObj?.disposal_value && (
                                    <div className="card border-primary">
                                        <div className="card-body">
                                            <h6 className="mb-3">Financial Analysis</h6>
                                            <div className="row">
                                                <div className="col-md-4 text-center">
                                                    <small className="text-muted d-block">Original Cost</small>
                                                    <h5 className="text-success mb-0">
                                                        TZS {Number(asset.purchase_cost).toLocaleString()}
                                                    </h5>
                                                </div>
                                                <div className="col-md-4 text-center">
                                                    <small className="text-muted d-block">Disposal Value</small>
                                                    <h5 className="text-danger mb-0">
                                                        TZS {parseFloat(selectedObj.disposal_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </h5>
                                                </div>
                                                <div className="col-md-4 text-center">
                                                    <small className="text-muted d-block">Net Loss/Gain</small>
                                                    {parseFloat(selectedObj.disposal_value) < parseFloat(asset.purchase_cost) ? (
                                                        <h5 className="text-danger mb-0">
                                                            -TZS {(parseFloat(asset.purchase_cost) - parseFloat(selectedObj.disposal_value)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </h5>
                                                    ) : (
                                                        <h5 className="text-success mb-0">
                                                            +TZS {(parseFloat(selectedObj.disposal_value) - parseFloat(asset.purchase_cost)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </h5>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Maintenance Tab */}
                        {activeTab === "maintenance" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <h5 className="mb-3 fw-semibold">Maintenance Records</h5>
                                {loadingMaintenance ? (
                                    <div className="text-center py-4">
                                        <ReactLoading type={"cylon"} color={"#00853f"} height={30} width={50} />
                                        <p className="text-muted mt-2">Loading maintenance records...</p>
                                    </div>
                                ) : maintenanceRecords.length === 0 ? (
                                    <div className="alert alert-info">
                                        <i className="bx bx-info-circle me-2"></i>
                                        No maintenance records found for this asset.
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Scheduled</th>
                                                    <th>Completed</th>
                                                    <th>Status</th>
                                                    <th>Cost</th>
                                                    <th>Technician</th>
                                                    <th>Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {maintenanceRecords.map((record) => (
                                                    <tr key={record.uid}>
                                                        <td>
                                                            <span className="badge bg-label-primary">
                                                                {record.maintenance_type}
                                                            </span>
                                                        </td>
                                                        <td>{record.scheduled_date ? formatDate(record.scheduled_date) : "-"}</td>
                                                        <td>{record.completed_date ? formatDate(record.completed_date) : "-"}</td>
                                                        <td>
                                                            <span className={`badge bg-${record.status === 'completed' ? 'success' : record.status === 'scheduled' ? 'warning' : 'info'}`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td>{record.cost ? `TZS ${Number(record.cost).toLocaleString()}` : "-"}</td>
                                                        <td>{record.technician_name || "-"}</td>
                                                        <td className="text-truncate" style={{ maxWidth: "200px" }}>
                                                            {record.notes || "-"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Audit Tab */}
                        {activeTab === "audit" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="mb-0 fw-semibold">
                                        <i className="bx bx-history me-2 text-primary"></i>
                                        Audit Trail
                                    </h5>
                                    <span className="badge bg-primary rounded-pill">
                                        {auditTrail.length} event{auditTrail.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                
                                {/* Quick Stats Cards */}
                                <div className="row mb-4 g-3">
                                    <div className="col-md-6">
                                        <div className="card border shadow-sm h-100" style={{ borderLeft: '4px solid #00853f !important' }}>
                                            <div className="card-body py-3">
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar avatar-sm me-3" style={{ width: '40px', height: '40px' }}>
                                                        <span className="avatar-initial rounded-circle bg-primary">
                                                            <i className="bx bx-plus"></i>
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h6 className="text-muted mb-1 small">Created By</h6>
                                                {selectedObj?.created_by_details ? (
                                                    <>
                                                            <span className="fw-semibold">
                                                                {selectedObj.created_by_details.first_name}{" "}
                                                                {selectedObj.created_by_details.last_name}
                                                            </span>
                                                                <small className="text-muted d-block">
                                                                    {selectedObj.created_at ? formatDate(selectedObj.created_at) : "N/A"}
                                                            </small>
                                                    </>
                                                ) : (
                                                            <span className="text-muted">N/A</span>
                                                )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedObj?.updated_by_details && (
                                        <div className="col-md-6">
                                            <div className="card border shadow-sm h-100" style={{ borderLeft: '4px solid #03c3ec !important' }}>
                                                <div className="card-body py-3">
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar avatar-sm me-3" style={{ width: '40px', height: '40px' }}>
                                                            <span className="avatar-initial rounded-circle bg-info">
                                                                <i className="bx bx-edit"></i>
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h6 className="text-muted mb-1 small">Last Updated By</h6>
                                                        <span className="fw-semibold">
                                                            {selectedObj.updated_by_details.first_name}{" "}
                                                            {selectedObj.updated_by_details.last_name}
                                                        </span>
                                                            <small className="text-muted d-block">
                                                                {selectedObj.updated_at ? formatDate(selectedObj.updated_at) : "N/A"}
                                                        </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Audit Trail Timeline */}
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-light">
                                        <h6 className="mb-0 fw-semibold">
                                            <i className="bx bx-list-ul me-2"></i>
                                            Activity History
                                        </h6>
                                    </div>
                                    <div className="card-body position-relative" style={{ paddingLeft: '50px' }}>
                                        {/* Timeline vertical line */}
                                        <div 
                                            className="position-absolute" 
                                            style={{ 
                                                left: '28px', 
                                                top: '20px', 
                                                bottom: '20px', 
                                                width: '3px', 
                                                background: 'linear-gradient(180deg, #00853f 0%, #71dd37 50%, #e0e0e0 100%)',
                                                borderRadius: '3px'
                                            }}
                                        ></div>

                                        {loadingAudit ? (
                                            <div className="text-center py-5">
                                                <ReactLoading type={"cylon"} color={"#00853f"} height={30} width={50} />
                                                <p className="text-muted mt-2">Loading activity history...</p>
                                            </div>
                                        ) : auditTrail.length === 0 ? (
                                            <div className="text-center py-5">
                                                <div className="avatar avatar-xl mb-3 mx-auto" style={{ width: '80px', height: '80px' }}>
                                                    <span className="avatar-initial rounded-circle bg-label-secondary" style={{ fontSize: '2rem' }}>
                                                        <i className="bx bx-history"></i>
                                                    </span>
                                                </div>
                                                <h6 className="text-muted mb-2">No Activity Recorded</h6>
                                                <p className="text-muted small mb-0">
                                                    Activity will appear here as changes are made.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="audit-timeline">
                                                {auditTrail.map((entry, index) => {
                                                    const actionConfig = {
                                                        'Approved': { color: 'success', icon: 'bx-check-circle', bg: '#71dd37' },
                                                        'Rejected': { color: 'danger', icon: 'bx-x-circle', bg: '#ff3e1d' },
                                                        'Created': { color: 'primary', icon: 'bx-plus-circle', bg: '#00853f' },
                                                        'Updated': { color: 'info', icon: 'bx-edit', bg: '#03c3ec' },
                                                        'Deleted': { color: 'warning', icon: 'bx-trash', bg: '#ffab00' },
                                                        'Resubmitted': { color: 'info', icon: 'bx-revision', bg: '#03c3ec' },
                                                        'Cancelled': { color: 'secondary', icon: 'bx-block', bg: '#8592a3' }
                                                    };
                                                    const config = actionConfig[entry.action] || { color: 'secondary', icon: 'bx-history', bg: '#8592a3' };

                                                    return (
                                                        <div 
                                                            key={entry.uid || index} 
                                                            className="audit-item position-relative mb-4 animate__animated animate__fadeInLeft"
                                                            style={{ animationDelay: `${index * 0.08}s` }}
                                                        >
                                                            {/* Timeline dot */}
                                                            <div 
                                                                className="position-absolute d-flex align-items-center justify-content-center"
                                                                style={{ 
                                                                    left: '-34px', 
                                                                    top: '4px', 
                                                                    width: '32px', 
                                                                    height: '32px', 
                                                                    borderRadius: '50%',
                                                                    background: config.bg,
                                                                    boxShadow: `0 3px 10px ${config.bg}40`,
                                                                    zIndex: 1
                                                                }}
                                                            >
                                                                <i className={`bx ${config.icon} text-white`} style={{ fontSize: '16px' }}></i>
                                                            </div>

                                                            {/* Content Card */}
                                                            <div className={`card border-0 bg-${config.color} bg-opacity-10 shadow-sm`}
                                                                 style={{ borderRadius: '10px' }}>
                                                                <div className="card-body py-3">
                                                                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                                                                        <div className="d-flex align-items-center">
                                                                            <span className={`badge bg-${config.color} me-2`}>
                                                                                <i className={`bx ${config.icon} me-1`}></i>
                                                                                {entry.action}
                                                                            </span>
                                                                            <span className="fw-semibold">
                                                                                {entry.performed_by_name || 'System'}
                                                                            </span>
                                                                        </div>
                                                        <small className="text-muted">
                                                                            <i className="bx bx-time-five me-1"></i>
                                                                            {entry.action_date ? formatDate(entry.action_date) : entry.created_at ? formatDate(entry.created_at) : "N/A"}
                                                        </small>
                                                                    </div>
                                                                    {entry.comments && (
                                                                        <div className="mt-2 pt-2 border-top">
                                                                            <p className="mb-0 text-muted small">
                                                                                <i className="bx bx-message-detail me-1"></i>
                                                                                {entry.comments}
                                                    </p>
                                                </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Timeline End */}
                                                <div className="text-center pt-2">
                                                    <div 
                                                        className="position-absolute"
                                                        style={{ 
                                                            left: '-22px', 
                                                            width: '12px', 
                                                            height: '12px', 
                                                            borderRadius: '50%',
                                                            background: '#e0e0e0',
                                                            border: '3px solid #fff',
                                                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                                                        }}
                                                    ></div>
                                                    <small className="text-muted fst-italic">
                                                        — Beginning of record history —
                                                    </small>
                                            </div>
                                        </div>
                                    )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Conversations Tab */}
                        {activeTab === "conversations" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="mb-0 fw-semibold">
                                        <i className="bx bx-conversation me-2 text-primary"></i>
                                        Conversation Timeline
                                    </h5>
                                    <span className="badge bg-primary rounded-pill">
                                        {conversations.length} message{conversations.length !== 1 ? 's' : ''}
                                    </span>
                    </div>
                                
                                {/* Conversation Timeline */}
                                <div className="conversation-timeline position-relative" style={{ 
                                    maxHeight: '500px', 
                                    overflowY: 'auto',
                                    paddingLeft: '40px'
                                }}>
                                    {/* Timeline vertical line */}
                                    <div 
                                        className="position-absolute" 
                                        style={{ 
                                            left: '18px', 
                                            top: '0', 
                                            bottom: '60px', 
                                            width: '3px', 
                                            background: 'linear-gradient(180deg, #00853f 0%, #8592ff 50%, #e0e0e0 100%)',
                                            borderRadius: '3px'
                                        }}
                                    ></div>

                                    {loadingConversations ? (
                                        <div className="text-center py-5">
                                            <ReactLoading type={"cylon"} color={"#00853f"} height={30} width={50} />
                                            <p className="text-muted mt-2">Loading conversation history...</p>
                </div>
                                    ) : conversations.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar avatar-xl mb-3 mx-auto" style={{ width: '80px', height: '80px' }}>
                                                <span className="avatar-initial rounded-circle bg-label-primary" style={{ fontSize: '2rem' }}>
                                                    <i className="bx bx-message-dots"></i>
                                                </span>
                                            </div>
                                            <h6 className="text-muted mb-2">No Conversations Yet</h6>
                                            <p className="text-muted small mb-0">
                                                Start the discussion by sending a message below.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {conversations.map((msg, index) => {
                                                const isCurrentUser = msg.sender?.guid === user?.guid;
                                                const messageTypeConfig = {
                                                    'decision': { 
                                                        color: 'warning', 
                                                        icon: 'bx-gavel', 
                                                        label: 'Decision',
                                                        bgClass: 'bg-warning bg-opacity-10 border-warning'
                                                    },
                                                    'clarification': { 
                                                        color: 'info', 
                                                        icon: 'bx-revision', 
                                                        label: 'Clarification',
                                                        bgClass: 'bg-info bg-opacity-10 border-info'
                                                    },
                                                    'rejection': { 
                                                        color: 'danger', 
                                                        icon: 'bx-x-circle', 
                                                        label: 'Rejection',
                                                        bgClass: 'bg-danger bg-opacity-10 border-danger'
                                                    },
                                                    'approval': { 
                                                        color: 'success', 
                                                        icon: 'bx-check-circle', 
                                                        label: 'Approval',
                                                        bgClass: 'bg-success bg-opacity-10 border-success'
                                                    },
                                                    'comment': { 
                                                        color: 'secondary', 
                                                        icon: 'bx-message', 
                                                        label: 'Comment',
                                                        bgClass: 'bg-light'
                                                    }
                                                };
                                                const msgConfig = messageTypeConfig[msg.message_type] || messageTypeConfig['comment'];
                                                
                                                // Check if message contains resubmission info
                                                const isResubmission = msg.message?.toLowerCase().includes('resubmit') || 
                                                                       msg.message_type === 'clarification';
                                                const isRejectionNote = msg.message?.toLowerCase().includes('rejected') ||
                                                                        msg.message_type === 'rejection';
                                                const isCancellation = msg.message?.toLowerCase().includes('cancelled') ||
                                                                       msg.message?.toLowerCase().includes('cancell');

                                                return (
                                                    <div 
                                                        key={msg.uid || index} 
                                                        className="conversation-item position-relative mb-4 animate__animated animate__fadeInUp"
                                                        style={{ animationDelay: `${index * 0.05}s` }}
                                                    >
                                                        {/* Timeline dot */}
                                                        <div 
                                                            className="position-absolute d-flex align-items-center justify-content-center"
                                                            style={{ 
                                                                left: '-32px', 
                                                                top: '8px', 
                                                                width: '28px', 
                                                                height: '28px', 
                                                                borderRadius: '50%',
                                                                background: isResubmission ? '#03c3ec' : 
                                                                           isRejectionNote ? '#ff3e1d' : 
                                                                           isCancellation ? '#8592a3' :
                                                                           isCurrentUser ? '#00853f' : '#a8aaae',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                                                zIndex: 1
                                                            }}
                                                        >
                                                            <i className={`bx ${
                                                                isResubmission ? 'bx-revision' : 
                                                                isRejectionNote ? 'bx-x' :
                                                                isCancellation ? 'bx-block' :
                                                                msgConfig.icon
                                                            } text-white`} style={{ fontSize: '14px' }}></i>
                                                        </div>

                                                        {/* Message Card */}
                                                        <div className={`card border ${msgConfig.bgClass} shadow-sm`} 
                                                             style={{ 
                                                                 borderRadius: '12px',
                                                                 borderLeft: `4px solid var(--bs-${msgConfig.color}) !important`
                                                             }}>
                                                            <div className="card-body p-3">
                                                                {/* Header */}
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <div className="d-flex align-items-center">
                                                                        {/* Avatar */}
                                                                        <div 
                                                                            className="avatar avatar-sm me-2"
                                                                            style={{ width: '32px', height: '32px' }}
                                                                        >
                                                                            <span 
                                                                                className={`avatar-initial rounded-circle bg-${isCurrentUser ? 'primary' : 'label-secondary'}`}
                                                                                style={{ fontSize: '12px' }}
                                                                            >
                                                                                {(msg.sender_name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <span className="fw-semibold d-block" style={{ fontSize: '0.9rem' }}>
                                                                                {msg.sender_name || 'Unknown User'}
                                                                                {isCurrentUser && (
                                                                                    <span className="badge bg-primary ms-2" style={{ fontSize: '0.65rem' }}>You</span>
                                                                                )}
                                                                            </span>
                                                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                                {msg.created_at ? formatDate(msg.created_at) : "N/A"}
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                    <span className={`badge bg-${msgConfig.color}`} style={{ fontSize: '0.7rem' }}>
                                                                        <i className={`bx ${msgConfig.icon} me-1`}></i>
                                                                        {msgConfig.label}
                                                                    </span>
                                                                </div>

                                                                {/* Message Content */}
                                                                <div className="message-content ps-5">
                                                                    {/* Parse and format message with bold markers */}
                                                                    <p className="mb-0" style={{ 
                                                                        lineHeight: '1.6', 
                                                                        fontSize: '0.9rem',
                                                                        whiteSpace: 'pre-wrap'
                                                                    }}>
                                                                        {msg.message?.split('**').map((part, i) => 
                                                                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                {/* Action indicator for special messages */}
                                                                {(isResubmission || isRejectionNote || isCancellation) && (
                                                                    <div className="mt-3 pt-2 border-top">
                                                                        <small className={`text-${
                                                                            isResubmission ? 'info' : 
                                                                            isRejectionNote ? 'danger' : 'secondary'
                                                                        }`}>
                                                                            <i className={`bx ${
                                                                                isResubmission ? 'bx-check-double' : 
                                                                                isRejectionNote ? 'bx-error' : 'bx-info-circle'
                                                                            } me-1`}></i>
                                                                            {isResubmission ? 'Disposal record resubmitted for approval' : 
                                                                             isRejectionNote ? 'Rejection decision recorded' :
                                                                             'Disposal request cancelled'}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Connector arrow for flow */}
                                                        {index < conversations.length - 1 && (
                                                            <div className="text-center my-2" style={{ marginLeft: '-20px' }}>
                                                                <i className="bx bx-down-arrow-alt text-muted" style={{ fontSize: '1.2rem' }}></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {/* End of timeline indicator */}
                                            <div className="text-center py-3 position-relative">
                                                <div 
                                                    className="position-absolute"
                                                    style={{ 
                                                        left: '-22px', 
                                                        top: '50%', 
                                                        transform: 'translateY(-50%)',
                                                        width: '12px', 
                                                        height: '12px', 
                                                        borderRadius: '50%',
                                                        background: '#e0e0e0',
                                                        border: '3px solid #fff',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                                                    }}
                                                ></div>
                                                <small className="text-muted fst-italic">
                                                    — End of conversation history —
                                                </small>
                                            </div>
                                        </>
                                    )}
                                </div>

                             
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DisposalRecordModal />

        </DisposalRecordContext.Provider>
    );
};
