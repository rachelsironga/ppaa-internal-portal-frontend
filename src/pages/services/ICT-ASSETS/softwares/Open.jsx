import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { AssetContext } from "../../../../utils/context";
import { useNavigate, useParams } from "react-router-dom";
import {
    getSoftwareAssets,
    deleteAsset,
    getAssetHistory,
    updateAssetStatus,
    getSupportTickets,
    updateSupportTicket,
    getSoftwareInstallations,
    deleteInstallation,
    verifyInstallation,
    uninstallSoftware
} from "./Queries";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { SoftwareAssetModal } from "./SoftwareAssetModal";
import { SupportTicketModal } from "../assets_list/SupportTicketModal";
import { InstallationModal } from "./InstallationModal";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const SoftwareAssetViewPage = () => {
    const [assetData, setAssetData] = useState(null);
    const [selectedObj, setSelectedObj] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedInstallation, setSelectedInstallation] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const [activeTab, setActiveTab] = useState("overview");
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [loadingInstallations, setLoadingInstallations] = useState(false);

    const [error, setError] = useState(null);
    const [assetHistory, setAssetHistory] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);
    const [installations, setInstallations] = useState([]);

    const handleFetchAsset = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getSoftwareAssets({ uid: uid });
            if (result.status === 200 || result.status === 8000) {
                setAssetData(result.data);
            } else {
                setError(true);
                showToast("warning", "Software Asset Not Found");
            }
        } catch (err) {
            console.error("Error fetching software asset:", err);
            setError(true);
            showToast("warning", "Unable to Fetch Software Asset Details");
        } finally {
            setLoading(false);
        }
    };

    const fetchAssetHistory = async () => {
        if (!uid) return;
        setLoadingHistory(true);
        try {
            const result = await getAssetHistory(uid);
            if (result.status === 200 || result.status === 8000) {
                setAssetHistory(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching asset history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };


    const fetchSupportTickets = async () => {
            if (!uid) {
                console.warn("Asset UID not available for fetching support tickets");
                return;
            }
            setLoadingTickets(true);
            try {
                const result = await getSupportTickets(uid);
                if (result.status === 200 || result.status === 8000) {
                    setSupportTickets(result.data || []);
                }
            } catch (err) {
                console.error("Error fetching support tickets:", err);
            } finally {
                setLoadingTickets(false);
            }
        };

    const fetchInstallations = async () => {
        if (!uid) return;
        setLoadingInstallations(true);
        try {
            const result = await getSoftwareInstallations(uid);
            if (result.status === 200 || result.status === 8000) {
                setInstallations(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching installations:", err);
        } finally {
            setLoadingInstallations(false);
        }
    };
    


    const handleDelete = async () => {
        if (!assetData) {
            Swal.fire("Error!", "Unable to Select this Asset.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: "You're about to delete this asset",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteAsset(assetData.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Process Completed!",
                        "The Asset has been deleted.",
                        "success"
                    );
                    navigate("/ict-assets/asset-software");
                } else {
                    console.error("Error deleting Asset:", result);
                    Swal.fire("Error Occurred!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting Asset:", error);
            Swal.fire(
                "Unsuccessful",
                `Unable to Perform Delete. Please Try Again or Contact Support Team`,
                "error"
            );
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            const confirmation = await Swal.fire({
                title: "Update Asset Status?",
                text: `Change status to ${newStatus}`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, update it!",
            });

            if (confirmation.isConfirmed) {
                const result = await updateAssetStatus(assetData.uid, { status: newStatus });
                if (result.status === 200 || result.status === 8000) {
                    showToast("Status Updated Successfully", "success", "Complete");
                    handleFetchAsset();
                } else {
                    showToast(`${result.message}`, "warning", "Update Failed");
                }
            }
        } catch (error) {
            console.error("Error updating status:", error);
            showToast("Unable to Update Status", "error", "Failed");
        }
    };

    const handleResolveTicket = async (ticket) => {
        const { value: resolutionNotes } = await Swal.fire({
            title: 'Resolve Ticket',
            input: 'textarea',
            inputLabel: 'Resolution Notes',
            inputPlaceholder: 'Describe how the issue was resolved...',
            showCancelButton: true,
            confirmButtonText: 'Mark as Resolved',
            inputValidator: (value) => {
                if (!value) {
                    return 'Please provide resolution notes!';
                }
            }
        });

        if (resolutionNotes) {
            try {
                const result = await updateSupportTicket(ticket.uid, {
                    status: 'resolved',
                    resolution_notes: resolutionNotes,
                    resolved_date: new Date().toISOString()
                });

                if (result.status === 200 || result.status === 8000) {
                    showToast("Ticket Resolved Successfully", "success", "Complete");
                    fetchSupportTickets();
                } else {
                    showToast(`${result.message}`, "warning", "Update Failed");
                }
            } catch (error) {
                console.error("Error resolving ticket:", error);
                showToast("Unable to Resolve Ticket", "error", "Failed");
            }
        }
    };

    const handleDeleteInstallation = async (installation) => {
        try {
            const confirmation = await Swal.fire({
                title: "Delete Installation?",
                text: `Remove ${assetData.software_name} from ${installation.asset_tag}?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteInstallation(installation.uid);
                if (result.status === 200 || result.status === 8000) {
                    showToast("Installation Deleted", "success", "Complete");
                    fetchInstallations();
                    handleFetchAsset(); // Refresh to update license counts
                } else {
                    showToast(`${result.message}`, "warning", "Delete Failed");
                }
            }
        } catch (error) {
            console.error("Error deleting installation:", error);
            showToast("Unable to Delete Installation", "error", "Failed");
        }
    };

    const handleVerifyInstallation = async (installation) => {
        try {
            const confirmation = await Swal.fire({
                title: "Verify Installation?",
                text: `Mark this installation as verified?`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, verify it!",
            });

            if (confirmation.isConfirmed) {
                const result = await verifyInstallation(installation.uid, {
                    last_verified_date: new Date().toISOString().split('T')[0]
                });
                if (result.status === 200 || result.status === 8000) {
                    showToast("Installation Verified", "success", "Complete");
                    fetchInstallations();
                } else {
                    showToast(`${result.message}`, "warning", "Verification Failed");
                }
            }
        } catch (error) {
            console.error("Error verifying installation:", error);
            showToast("Unable to Verify Installation", "error", "Failed");
        }
    };

    const handleUninstallSoftware = async (installation) => {
        const { value: uninstallReason } = await Swal.fire({
            title: 'Uninstall Software',
            input: 'textarea',
            inputLabel: 'Uninstall Reason',
            inputPlaceholder: 'Why is this software being uninstalled?',
            showCancelButton: true,
            confirmButtonText: 'Mark as Uninstalled',
            inputValidator: (value) => {
                if (!value) {
                    return 'Please provide a reason!';
                }
            }
        });

        if (uninstallReason) {
            try {
                const result = await uninstallSoftware(installation.uid, {
                    status: 'uninstalled',
                    uninstall_reason: uninstallReason,
                    uninstall_date: new Date().toISOString().split('T')[0]
                });

                if (result.status === 200 || result.status === 8000) {
                    showToast("Software Marked as Uninstalled", "success", "Complete");
                    fetchInstallations();
                    handleFetchAsset(); // Refresh to update license counts
                } else {
                    showToast(`${result.message}`, "warning", "Uninstall Failed");
                }
            } catch (error) {
                console.error("Error uninstalling software:", error);
                showToast("Unable to Mark as Uninstalled", "error", "Failed");
            }
        }
    };

    useEffect(() => {
        handleFetchAsset();
    }, [uid, tableRefresh]);

    useEffect(() => {
        if (!uid) return;

        switch (activeTab) {
            case "history":
                fetchAssetHistory();
                break;
            case "support":
                fetchSupportTickets();
                break;
            case "installations":
                fetchInstallations();
                break;
            default:
                break;
        }
    }, [activeTab, uid]);

    const getStatusBadge = (status) => {
        const statusConfig = {
            operational: { class: "success", icon: "✓", label: "Operational" },
            active: { class: "success", icon: "✓", label: "Active" },
            inactive: { class: "warning", icon: "⏸", label: "Inactive" },
            in_repair: { class: "info", icon: "🔧", label: "In Repair" },
            under_maintenance: { class: "info", icon: "🔧", label: "Under Maintenance" },
            retired: { class: "secondary", icon: "📦", label: "Retired" },
            lost: { class: "danger", icon: "🔍", label: "Lost" },
            disposed: { class: "dark", icon: "🗑", label: "Disposed" },
        };
        const config = statusConfig[status] || { class: "secondary", icon: "?", label: status || "Unknown" };
        return (
            <span className={`badge bg-${config.class}`}>
                {config.icon} {config.label}
            </span>
        );
    };

    const getConditionBadge = (condition) => {
        const conditionConfig = {
            new: { class: "success", label: "New" },
            excellent: { class: "success", label: "Excellent" },
            good: { class: "info", label: "Good" },
            fair: { class: "warning", label: "Fair" },
            poor: { class: "danger", label: "Poor" },
        };
        const config = conditionConfig[condition] || { class: "secondary", label: condition || "Unknown" };
        return <span className={`badge bg-${config.class}`}>{config.label}</span>;
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

    const getPriorityBadge = (priority) => {
        const config = {
            low: { class: "info", label: "Low" },
            medium: { class: "warning", label: "Medium" },
            high: { class: "danger", label: "High" },
            critical: { class: "danger", label: "Critical" }
        };
        const badge = config[priority] || { class: "secondary", label: priority };
        return <span className={`badge bg-${badge.class}`}>{badge.label}</span>;
    };

    const getTicketStatusBadge = (status) => {
        const config = {
            open: { class: "primary", label: "Open" },
            in_progress: { class: "info", label: "In Progress" },
            resolved: { class: "success", label: "Resolved" },
            closed: { class: "secondary", label: "Closed" }
        };
        const badge = config[status] || { class: "secondary", label: status };
        return <span className={`badge bg-${badge.class}`}>{badge.label}</span>;
    };

    const getInstallationStatusBadge = (status) => {
        const config = {
            active: { class: "success", label: "Active" },
            inactive: { class: "warning", label: "Inactive" },
            pending: { class: "info", label: "Pending" },
            failed: { class: "danger", label: "Failed" },
            uninstalled: { class: "secondary", label: "Uninstalled" }
        };
        const badge = config[status] || { class: "secondary", label: status };
        return <span className={`badge bg-${badge.class}`}>{badge.label}</span>;
    };

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Assets", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading Asset Details...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    if (error || !assetData) {
        return (
            <>
                <BreadCumb pageList={["Software Assets", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <div className="alert alert-danger" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get Software Asset Details. Please Contact System Administrator
                                </p>
                                <button
                                    className="btn btn-primary btn-sm mt-3"
                                    onClick={() => navigate("/ict-assets/asset-software")}
                                >
                                    <i className="bx bx-arrow-back me-1"></i> Back to Software Assets List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <AssetContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Software Assets", assetData?.asset_tag || "View"]} />

            {/* Asset Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                    <div className="avatar avatar-xl me-3">
                                        {assetData?.photo ? (
                                            <img
                                                src={assetData.photo}
                                                alt="Asset"
                                                className="rounded"
                                            />
                                        ) : (
                                            <span className="avatar-initial rounded bg-label-success">
                                                <i className="bx bx-code-alt bx-lg"></i>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fw-bold">
                                        {assetData.asset_tag}
                                        {assetData.software_name && (
                                            <small className="text-muted ms-2 fw-normal">({assetData.software_name})</small>
                                        )}
                                    </h4>
                                    <p className="mb-2 text-muted">
                                        <strong>{assetData.software_name || "N/A"}</strong>
                                        {assetData.version && ` • v${assetData.version}`}
                                        {assetData.publisher && ` • ${assetData.publisher}`}
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {getStatusBadge(assetData.status)}
                                        {assetData.condition && getConditionBadge(assetData.condition)}
                                        {getWarrantyStatus(assetData.warranty_expiry)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            {hasAccess(user, [["change_asset"]]) && (
                                <button
                                    className="btn btn-primary btn-sm me-2"
                                    data-bs-toggle="modal"
                                    data-bs-target="#softwareAssetModal"
                                    onClick={() => setSelectedObj(assetData)}
                                >
                                    <i className="bx bx-edit-alt me-1"></i> Edit
                                </button>
                            )}
                            {hasAccess(user, [["delete_asset"]]) && (
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={handleDelete}
                                >
                                    <i className="bx bx-trash me-1"></i> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="row mb-4">
                <div className="col-xl-3 col-md-6 mb-3">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0 me-3">
                                    <span className="avatar-initial rounded bg-label-success">
                                        <i className="bx bx-dollar fs-4"></i>
                                    </span>
                                </div>
                                <div className="flex-grow-1">
                                    <small className="text-muted d-block mb-1">Purchase Cost</small>
                                    <h5 className="mb-0">
                                        {assetData.purchase_cost
                                            ? `TSH ${Number(assetData.purchase_cost).toLocaleString()}`
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
                                    <small className="text-muted d-block mb-1">Purchase Date</small>
                                    <h6 className="mb-0">
                                        {formatDate(assetData.purchase_date, "DD/MM/YYYY") || "N/A"}
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
                                    <small className="text-muted d-block mb-1">Warranty Expiry</small>
                                    <h6 className="mb-0">
                                        {formatDate(assetData.warranty_expiry, "DD/MM/YYYY") || "N/A"}
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
                                    <span className="avatar-initial rounded bg-label-primary">
                                        <i className="bx bx-user fs-4"></i>
                                    </span>
                                </div>
                                <div className="flex-grow-1">
                                    <small className="text-muted d-block mb-1">Custodian</small>
                                    <h6 className="mb-0 text-truncate">
                                        {assetData.custodian_name || "Unassigned"}
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
                                className={`nav-link ${activeTab === "specifications" ? "active" : ""}`}
                                onClick={() => setActiveTab("specifications")}
                            >
                                <i className="bx bx-cog me-1"></i> Technical Details
                            </button>
                        </li>
                        <li className="nav-item me-1">
                            <button
                                className={`nav-link ${activeTab === "installations" ? "active" : ""}`}
                                onClick={() => setActiveTab("installations")}
                            >
                                <i className="bx bx-download me-1"></i> Installations
                            </button>
                        </li>
                        <li className="nav-item me-1">
                            <button
                                className={`nav-link ${activeTab === "support" ? "active" : ""}`}
                                onClick={() => setActiveTab("support")}
                            >
                                <i className="bx bx-support me-1"></i> Support Tickets
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "history" ? "active" : ""}`}
                                onClick={() => setActiveTab("history")}
                            >
                                <i className="bx bx-history me-1"></i> History
                            </button>
                        </li>
                    </ul>

                    <div className="tab-content">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">Software Information</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Asset Tag:</td>
                                                    <td><span className="badge bg-success">{assetData.asset_tag}</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Software Name:</td>
                                                    <td className="fw-bold">{assetData.software_name || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Version:</td>
                                                    <td><span className="badge bg-info">{assetData.version || "-"}</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Publisher/Vendor:</td>
                                                    <td>{assetData.publisher || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Software Type:</td>
                                                    <td><span className="badge bg-label-primary">{assetData.software_type || "-"}</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Platform:</td>
                                                    <td>{assetData.platform || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Status:</td>
                                                    <td>{getStatusBadge(assetData.status)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Custodian:</td>
                                                    <td>{assetData.custodian_name || "Unassigned"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Location:</td>
                                                    <td>{assetData.location_name || "Not Specified"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">License Management</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>License Type:</td>
                                                    <td><span className="badge bg-label-warning">{assetData.license_type || "-"}</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Total Licenses:</td>
                                                    <td className="fw-bold text-primary">{assetData.total_licenses || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Used Licenses:</td>
                                                    <td className="text-danger">{assetData.used_licenses || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Available Licenses:</td>
                                                    <td className="text-success fw-bold fs-5">
                                                        {assetData.available_licenses || 
                                                         ((assetData.total_licenses || 0) - (assetData.used_licenses || 0)) || "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">License Expiry:</td>
                                                    <td>
                                                        {assetData.license_expiry ? (
                                                            <>
                                                                {formatDate(assetData.license_expiry, "DD/MM/YYYY")}
                                                                {getWarrantyStatus(assetData.license_expiry)}
                                                            </>
                                                        ) : "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">License Key:</td>
                                                    <td>
                                                        {assetData.license_key ? (
                                                            <code className="small bg-light p-2 rounded d-block">{assetData.license_key}</code>
                                                        ) : <span className="text-muted">-</span>}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Purchase Date:</td>
                                                    <td>{formatDate(assetData.purchase_date, "DD/MM/YYYY") || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Purchase Cost:</td>
                                                    <td className="text-success fw-bold">
                                                        {assetData.purchase_cost
                                                            ? `TSH ${Number(assetData.purchase_cost).toLocaleString()}`
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {assetData.notes && (
                                    <div className="mt-4">
                                        <h5 className="mb-2 fw-semibold">Additional Notes</h5>
                                        <div className="alert alert-info">
                                            <p className="mb-0">{assetData.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Specifications Tab */}
                        {activeTab === "specifications" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">Technical Specifications</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Software Version:</td>
                                                    <td><span className="badge bg-info">{assetData.version || "-"}</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Platform/OS:</td>
                                                    <td>{assetData.platform || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">System Requirements:</td>
                                                    <td className="small">{assetData.system_requirements || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Installation Path:</td>
                                                    <td><code className="small bg-light p-2 rounded d-block">{assetData.installation_path || "-"}</code></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Software Type:</td>
                                                    <td><span className="badge bg-label-primary">{assetData.software_type || "-"}</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">License & Support Details</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>License Type:</td>
                                                    <td><span className="badge bg-label-warning">{assetData.license_type || "-"}</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">License Key:</td>
                                                    <td>
                                                        {assetData.license_key ? (
                                                            <code className="small bg-light p-2 rounded d-block">{assetData.license_key}</code>
                                                        ) : <span className="text-muted">-</span>}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Total Licenses:</td>
                                                    <td className="fw-bold text-primary">{assetData.total_licenses || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Support URL:</td>
                                                    <td>
                                                        {assetData.support_url ? (
                                                            <a href={assetData.support_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-success">
                                                                <i className="bx bx-link-external me-1"></i>Visit Support
                                                            </a>
                                                        ) : <span className="text-muted">-</span>}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Documentation URL:</td>
                                                    <td>
                                                        {assetData.documentation_url ? (
                                                            <a href={assetData.documentation_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">
                                                                <i className="bx bx-book me-1"></i>View Docs
                                                            </a>
                                                        ) : <span className="text-muted">-</span>}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <hr />
                                <div className="row mt-4">
                                    <div className="col-md-12">
                                        <h6 className="mb-3 fw-semibold">Supplier & Procurement Information</h6>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "20%" }}>Publisher/Vendor:</td>
                                                    <td>{assetData.publisher || "-"}</td>
                                                    <td className="fw-medium" style={{ width: "20%" }}>Supplier:</td>
                                                    <td>{assetData.supplier_name || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Asset Type:</td>
                                                    <td>{assetData.asset_type_name || "-"}</td>
                                                    <td className="fw-medium">Warranty Expiry:</td>
                                                    <td>
                                                        {assetData.warranty_expiry ? (
                                                            <>
                                                                {formatDate(assetData.warranty_expiry, "DD/MM/YYYY")} {getWarrantyStatus(assetData.warranty_expiry)}
                                                            </>
                                                        ) : "-"}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Installations Tab */}
                        {activeTab === "installations" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0 fw-semibold">Software Installations</h5>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#installationModal"
                                        onClick={() => setSelectedInstallation(null)}
                                    >
                                        <i className="bx bx-plus me-1"></i> New Installation
                                    </button>
                                </div>

                                {loadingInstallations ? (
                                    <div className="text-center py-4">
                                        <ReactLoading type={"cylon"} color={"#696cff"} height={30} width={50} />
                                        <p className="text-muted mt-2">Loading installations...</p>
                                    </div>
                                ) : installations.length === 0 ? (
                                    <div className="alert alert-info">
                                        <i className="bx bx-info-circle me-2"></i>
                                        No installations found for this software.
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Asset</th>
                                                    <th>Version</th>
                                                    <th>Status</th>
                                                    <th>Installed</th>
                                                    <th>Installed By</th>
                                                    <th>Assigned To</th>
                                                    <th>Verified</th>
                                                    <th>Compliant</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.values(installations).map((installation) => (
                                                    <tr key={installation.uid}>
                                                        <td>
                                                            <div>
                                                                <strong>{installation.asset_details.asset_tag || "N/A"}</strong>
                                                                {installation.installation_path && (
                                                                    <div className="small text-muted text-truncate" style={{ maxWidth: "200px" }}>
                                                                        {installation.installation_path}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-info">
                                                                {installation.version_installed || "-"}
                                                            </span>
                                                        </td>
                                                        <td>{getInstallationStatusBadge(installation.status)}</td>
                                                        <td>{formatDate(installation.installation_date, "DD/MM/YYYY")}</td>
                                                        <td>{installation.installed_by_name || "-"}</td>
                                                        <td>{installation.assigned_to_name || "Unassigned"}</td>
                                                        <td>
                                                            {installation.last_verified_date ? (
                                                                <div>
                                                                    <span className="badge bg-success">✓</span>
                                                                    <div className="small text-muted">
                                                                        {formatDate(installation.last_verified_date, "DD/MM/YYYY")}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="badge bg-warning">Not Verified</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {installation.is_compliant ? (
                                                                <span className="badge bg-success">✓ Yes</span>
                                                            ) : (
                                                                <span className="badge bg-danger">✗ No</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="btn-group">
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary border-0"
                                                                    title="Edit"
                                                                    data-bs-toggle="modal"
                                                                    data-bs-target="#installationModal"
                                                                    onClick={() => setSelectedInstallation(installation)}
                                                                >
                                                                    <i className="bx bx-edit"></i>
                                                                </button>
                                                                {installation.status !== 'uninstalled' && (
                                                                    <>
                                                                        {!installation.last_verified_date && (
                                                                            <button
                                                                                className="btn btn-sm btn-outline-success border-0"
                                                                                title="Verify"
                                                                                onClick={() => handleVerifyInstallation(installation)}
                                                                            >
                                                                                <i className="bx bx-check-circle"></i>
                                                                            </button>
                                                                        )}
                                                                        {installation.status === 'active' && (
                                                                            <button
                                                                                className="btn btn-sm btn-outline-warning border-0"
                                                                                title="Uninstall"
                                                                                onClick={() => handleUninstallSoftware(installation)}
                                                                            >
                                                                                <i className="bx bx-trash-alt"></i>
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger border-0"
                                                                    title="Delete"
                                                                    onClick={() => handleDeleteInstallation(installation)}
                                                                >
                                                                    <i className="bx bx-x"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Installation Summary */}
                                {installations.length > 0 && (
                                    <div className="row mt-4">
                                        <div className="col-md-12">
                                            <div className="alert alert-light">
                                                <div className="row text-center">
                                                    <div className="col-md-3">
                                                        <div className="mb-0">
                                                            <strong className="text-primary fs-4">
                                                                {Object.values(installations).filter(i => i.status === 'active').length}
                                                            </strong>
                                                            <div className="small text-muted">Active Installations</div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="mb-0">
                                                            <strong className="text-success fs-4">
                                                                {Object.values(installations).filter(i => i.last_verified_date).length}
                                                            </strong>
                                                            <div className="small text-muted">Verified</div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="mb-0">
                                                            <strong className="text-success fs-4">
                                                                {Object.values(installations).filter(i => i.is_compliant).length}
                                                            </strong>
                                                            <div className="small text-muted">Compliant</div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="mb-0">
                                                            <strong className="text-info fs-4">
                                                                {Object.values(installations).filter(i => i.status === 'pending').length}
                                                            </strong>
                                                            <div className="small text-muted">Pending</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Support Tickets Tab */}
                        {activeTab === "support" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0 fw-semibold">Support Tickets</h5>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#supportTicketModal"
                                        onClick={() => setSelectedTicket(null)}
                                    >
                                        <i className="bx bx-plus me-1"></i> New Ticket
                                    </button>
                                </div>

                                {loadingTickets ? (
                                    <div className="text-center py-4">
                                        <ReactLoading type={"cylon"} color={"#696cff"} height={30} width={50} />
                                        <p className="text-muted mt-2">Loading support tickets...</p>
                                    </div>
                                ) : supportTickets.length === 0 ? (
                                    <div className="alert alert-info">
                                        <i className="bx bx-info-circle me-2"></i>
                                        No support tickets found for this asset.
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Ticket ID</th>
                                                    <th>Issue</th>
                                                    <th>Priority</th>
                                                    <th>Status</th>
                                                    <th>Created</th>
                                                    <th>Technician</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {supportTickets.map((ticket) => (
                                                    <tr key={ticket.uid}>
                                                        <td>
                                                            <span className="badge bg-dark">
                                                                {ticket.ticket_id}
                                                            </span>
                                                        </td>
                                                        <td className="text-truncate" style={{ maxWidth: "250px" }}>
                                                            {ticket.issue_description}
                                                        </td>
                                                        <td>{getPriorityBadge(ticket.priority)}</td>
                                                        <td>{getTicketStatusBadge(ticket.status)}</td>
                                                        <td>{formatDate(ticket.created_date, "DD/MM/YYYY")}</td>
                                                        <td>{ticket.assigned_technician_name || "Unassigned"}</td>
                                                        <td>
                                                            <div className="btn-group">
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary border-0"
                                                                    title="Edit"
                                                                    data-bs-toggle="modal"
                                                                    data-bs-target="#supportTicketModal"
                                                                    onClick={() => setSelectedTicket(ticket)}
                                                                >
                                                                    <i className="bx bx-edit"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-success border-0"
                                                                    title="Resolve"
                                                                    onClick={() => handleResolveTicket(ticket)}
                                                                    disabled={ticket.status === 'resolved' || ticket.status === 'closed'}
                                                                >
                                                                    <i className="bx bx-check"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === "history" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <h5 className="mb-3 fw-semibold">Asset Activity History</h5>
                                {loadingHistory ? (
                                    <div className="text-center py-4">
                                        <ReactLoading type={"cylon"} color={"#696cff"} height={30} width={50} />
                                        <p className="text-muted mt-2">Loading history...</p>
                                    </div>
                                ) : assetHistory.length === 0 ? (
                                    <div className="alert alert-info">
                                        <p className="mb-0">No history records found for this asset.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Action</th>
                                                    <th>User</th>
                                                    <th>Details</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assetHistory.map((record, index) => (
                                                    <tr key={index}>
                                                        <td>{formatDate(record.created_at, "DD/MM/YYYY HH:mm")}</td>
                                                        <td>
                                                            <span className="badge bg-primary">{record.action}</span>
                                                        </td>
                                                        <td>{record.user_name || "-"}</td>
                                                        <td>{record.details || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SoftwareAssetModal loadOnlyModal={true} />
            <InstallationModal
                softwareUid={uid}
                softwareName={assetData?.software_name}
                selectedInstallation={selectedInstallation}
                onSuccess={fetchInstallations}
            />
            <SupportTicketModal
                assetUid={uid}
                assetTag={assetData?.asset_tag}
                selectedTicket={selectedTicket}
                onSuccess={fetchSupportTickets}
            />
        </AssetContext.Provider>
    );
};
