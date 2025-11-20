import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { AssetContext } from "../../../../utils/context";
import { useNavigate, useParams } from "react-router-dom";
import {
    getNetworkAssets,
    deleteAsset,
    getAssetHistory,
    updateAssetStatus,
    getMaintenanceRecords,
    getSupportTickets,
    getCustodianHistory,
    getLocationHistory,
    getAssetAssignments,
    createMaintenanceRecord,
    createSupportTicket,
    updateSupportTicket,
    deleteMaintenanceRecord
} from "./Queries";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { AssetNetworkModal } from "./Modal";
import { MaintenanceRecordModal } from "../assets_list/MaintenanceModal.jsx";
import { SupportTicketModal } from "../assets_list/SupportTicketModal.jsx";
import { NetworkOverviewTab } from "./NetworkOverviewTab";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const NetworkingDeviceViewPage = () => {
    const [assetData, setAssetData] = useState(null);
    const [selectedObj, setSelectedObj] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const [activeTab, setActiveTab] = useState("overview");
    const [assetUid, setAssetUid] = useState(null);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [loadingMaintenance, setLoadingMaintenance] = useState(false);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [loadingCustodianHistory, setLoadingCustodianHistory] = useState(false);
    const [loadingLocationHistory, setLoadingLocationHistory] = useState(false);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    const [error, setError] = useState(null);
    const [assetHistory, setAssetHistory] = useState([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [supportTickets, setSupportTickets] = useState([]);
    const [custodianHistory, setCustodianHistory] = useState([]);
    const [locationHistory, setLocationHistory] = useState([]);
    const [assignments, setAssignments] = useState([]);

    const handleFetchAsset = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getNetworkAssets({ uid: uid });
            if (result.status === 200 || result.status === 8000) {
                setAssetData(result.data);

                // Extract asset UID from network device data
                const extractedAssetUid = result.data?.asset_uid ||
                    result.data?.asset?.uid ||
                    result.data?.asset;

                console.log("Network Device Data Keys:", Object.keys(result.data));
                console.log("Extracted Asset UID:", extractedAssetUid);

                setAssetUid(extractedAssetUid);
            } else {
                setError(true);
                showToast("Asset Not Found", "warning", "Fetch Completed");
            }
        } catch (err) {
            console.error("Error fetching asset:", err);
            setError(true);
            showToast("Unable to Fetch Asset Details", "warning", "Failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchAssetHistory = async () => {
        if (!assetUid) {
            console.warn("Asset UID not available for fetching asset history");
            return;
        }
        setLoadingHistory(true);
        try {
            const result = await getAssetHistory(assetUid);
            if (result.status === 200 || result.status === 8000) {
                setAssetHistory(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching asset history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchMaintenanceRecords = async () => {
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

    const fetchSupportTickets = async () => {
        if (!assetUid) {
            console.warn("Asset UID not available for fetching support tickets");
            return;
        }
        setLoadingTickets(true);
        try {
            const result = await getSupportTickets(assetUid);
            if (result.status === 200 || result.status === 8000) {
                setSupportTickets(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching support tickets:", err);
        } finally {
            setLoadingTickets(false);
        }
    };

    const fetchCustodianHistory = async () => {
        if (!assetUid) {
            console.warn("Asset UID not available for fetching custodian history");
            return;
        }
        setLoadingCustodianHistory(true);
        try {
            const result = await getCustodianHistory(assetUid);
            if (result.status === 200 || result.status === 8000) {
                setCustodianHistory(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching custodian history:", err);
        } finally {
            setLoadingCustodianHistory(false);
        }
    };

    const fetchLocationHistory = async () => {
        if (!assetUid) {
            console.warn("Asset UID not available for fetching location history");
            return;
        }
        setLoadingLocationHistory(true);
        try {
            const result = await getLocationHistory(assetUid);
            if (result.status === 200 || result.status === 8000) {
                setLocationHistory(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching location history:", err);
        } finally {
            setLoadingLocationHistory(false);
        }
    };

    const fetchAssignments = async () => {
        if (!assetUid) {
            console.warn("Asset UID not available for fetching assignments");
            return;
        }
        setLoadingAssignments(true);
        try {
            const result = await getAssetAssignments(assetUid);
            if (result.status === 200 || result.status === 8000) {
                setAssignments(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching assignments:", err);
        } finally {
            setLoadingAssignments(false);
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
                    navigate("/ict-assets/peripheral-devices");
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

    const handleDeleteMaintenanceRecord = async (record) => {
        try {
            const confirmation = await Swal.fire({
                title: "Delete Maintenance Record?",
                text: `Delete ${record.maintenance_type} scheduled for ${formatDate(record.scheduled_date, "DD/MM/YYYY")}?`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteMaintenanceRecord(record.uid);
                if (result.status === 200 || result.status === 8000) {
                    showToast("Maintenance Record Deleted", "success", "Complete");
                    fetchMaintenanceRecords();
                } else {
                    showToast(`${result.message}`, "warning", "Delete Failed");
                }
            }
        } catch (error) {
            console.error("Error deleting maintenance record:", error);
            showToast("Unable to Delete Record", "error", "Failed");
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

    useEffect(() => {
        handleFetchAsset();
    }, [uid, tableRefresh]);

    useEffect(() => {
        if (!assetUid) return;

        switch (activeTab) {
            case "history":
                fetchAssetHistory();
                break;
            case "maintenance":
                fetchMaintenanceRecords();
                break;
            case "support":
                fetchSupportTickets();
                break;
            case "tracking":
                fetchCustodianHistory();
                fetchLocationHistory();
                fetchAssignments();
                break;
            default:
                break;
        }
    }, [activeTab, assetUid]);

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

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Network Devices", assetData?.asset_tag || "View"]} />
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
                <BreadCumb pageList={["Assets", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <div className="alert alert-danger" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get Asset Details. Please Contact System Administrator
                                </p>
                                <button
                                    className="btn btn-primary btn-sm mt-3"
                                    onClick={() => navigate("/ict-assets/assets")}
                                >
                                    <i className="bx bx-arrow-back me-1"></i> Back to Assets List
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
            <BreadCumb pageList={["Network Devices", assetData?.asset_tag || "View"]} />

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
                                            <span className="avatar-initial rounded bg-label-info">
                                                <i className="bx bx-network-chart bx-lg"></i>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fw-bold">
                                        {assetData.asset_tag}
                                        {assetData.barcode && (
                                            <small className="text-muted ms-2 fw-normal">({assetData.barcode})</small>
                                        )}
                                    </h4>
                                    <p className="mb-2 text-muted">
                                        <strong>{assetData.model || "N/A"}</strong>
                                        {assetData.asset_type_name && ` • ${assetData.asset_type_name}`}
                                        {assetData.manufacturer_name && ` • ${assetData.manufacturer_name}`}
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
                                    data-bs-target="#NetworkAssetModal"
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
                                className={`nav-link ${activeTab === "financial" ? "active" : ""}`}
                                onClick={() => setActiveTab("financial")}
                            >
                                <i className="bx bx-dollar me-1"></i> Financial
                            </button>
                        </li>
                        <li className="nav-item me-1">
                            <button
                                className={`nav-link ${activeTab === "tracking" ? "active" : ""}`}
                                onClick={() => setActiveTab("tracking")}
                            >
                                <i className="bx bx-map me-1"></i> Tracking
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
                            <NetworkOverviewTab
                                assetData={assetData}
                                getStatusBadge={getStatusBadge}
                                getConditionBadge={getConditionBadge}
                            />
                        )}

                        {/* Specifications Tab */}
                        {activeTab === "specifications" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <h5 className="mb-3 fw-semibold">Technical Specifications</h5>
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6 className="mb-3 text-primary">
                                            <i className="bx bx-info-circle me-1"></i>Device Information
                                        </h6>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Device Type:</td>
                                                    <td>
                                                        <span className="badge bg-info">
                                                            {assetData.device_type || "-"}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Model:</td>
                                                    <td>{assetData.model || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Manufacturer:</td>
                                                    <td>{assetData.manufacturer_name || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Serial Number:</td>
                                                    <td>
                                                        <span className="badge bg-light text-dark border">
                                                            {assetData.serial_number || "-"}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Asset Tag:</td>
                                                    <td>
                                                        <span className="badge bg-primary">{assetData.asset_tag}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Barcode:</td>
                                                    <td>{assetData.barcode || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Condition:</td>
                                                    <td>{assetData.condition ? getConditionBadge(assetData.condition) : "-"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="mb-3 text-primary">
                                            <i className="bx bx-network-chart me-1"></i>Network Configuration
                                        </h6>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Number of Ports:</td>
                                                    <td>
                                                        {assetData.ports ? (
                                                            <span className="badge bg-success">
                                                                <i className="bx bx-cable-car me-1"></i>
                                                                {assetData.ports} Ports
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">IP Address:</td>
                                                    <td>
                                                        {assetData.ip_address ? (
                                                            <span className="font-monospace text-dark">
                                                                <i className="bx bx-globe me-1 text-info"></i>
                                                                {assetData.ip_address}
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">MAC Address:</td>
                                                    <td>
                                                        {assetData.mac_address ? (
                                                            <span className="font-monospace text-dark">
                                                                <i className="bx bx-network-chart me-1 text-primary"></i>
                                                                {assetData.mac_address}
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Firmware Version:</td>
                                                    <td>{assetData.firmware_version || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Management URL:</td>
                                                    <td>
                                                        {assetData.management_url ? (
                                                            <a href={assetData.management_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                                                <i className="bx bx-link-external me-1"></i>
                                                                Access Panel
                                                            </a>
                                                        ) : "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">VLAN Support:</td>
                                                    <td>
                                                        {assetData.vlan_support !== undefined ? (
                                                            <span className={`badge bg-${assetData.vlan_support ? "success" : "secondary"}`}>
                                                                {assetData.vlan_support ? "Yes" : "No"}
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Additional Technical Details */}
                                {(assetData.power_consumption || assetData.max_throughput || assetData.protocol_support) && (
                                    <div className="row mt-4">
                                        <div className="col-12">
                                            <h6 className="mb-3 text-primary">
                                                <i className="bx bx-chip me-1"></i>Additional Specifications
                                            </h6>
                                            <table className="table table-borderless">
                                                <tbody>
                                                    {assetData.power_consumption && (
                                                        <tr>
                                                            <td className="fw-medium" style={{ width: "20%" }}>Power Consumption:</td>
                                                            <td>{assetData.power_consumption}</td>
                                                        </tr>
                                                    )}
                                                    {assetData.max_throughput && (
                                                        <tr>
                                                            <td className="fw-medium">Max Throughput:</td>
                                                            <td>{assetData.max_throughput}</td>
                                                        </tr>
                                                    )}
                                                    {assetData.protocol_support && (
                                                        <tr>
                                                            <td className="fw-medium">Protocol Support:</td>
                                                            <td>{assetData.protocol_support}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Financial Tab */}
                        {activeTab === "financial" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <h5 className="mb-3 fw-semibold">Financial Information</h5>
                                <div className="row">
                                    <div className="col-md-6">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Purchase Cost:</td>
                                                    <td className="text-success fw-bold">
                                                        {assetData.purchase_cost
                                                            ? `TSH ${Number(assetData.purchase_cost).toLocaleString()}`
                                                            : "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Purchase Date:</td>
                                                    <td>{formatDate(assetData.purchase_date, "DD/MM/YYYY") || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Supplier:</td>
                                                    <td>{assetData.supplier_name || "-"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Warranty Expiry:</td>
                                                    <td>{formatDate(assetData.warranty_expiry, "DD/MM/YYYY") || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Warranty Status:</td>
                                                    <td>{getWarrantyStatus(assetData.warranty_expiry)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tracking Tab - Location, Custodian & Assignment History */}
                        {activeTab === "tracking" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="row">
                                    <div className="col-md-6 mb-4">
                                        <h5 className="mb-3 fw-semibold">Current Assignment</h5>
                                        <div className="card bg-light">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center mb-3">
                                                    <i className="bx bx-user-circle fs-1 text-primary me-3"></i>
                                                    <div>
                                                        <small className="text-muted d-block">Custodian</small>
                                                        <h6 className="mb-0">{assetData.custodian_name || "Unassigned"}</h6>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <i className="bx bx-map fs-1 text-info me-3"></i>
                                                    <div>
                                                        <small className="text-muted d-block">Location</small>
                                                        <h6 className="mb-0">{assetData.location_name || "Not Specified"}</h6>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6 mb-4">
                                        <h5 className="mb-3 fw-semibold">Quick Info</h5>
                                        <div className="card bg-light">
                                            <div className="card-body">
                                                <p className="mb-2">
                                                    <strong>Last Audit:</strong>{" "}
                                                    {formatDate(assetData.last_audit_date, "DD/MM/YYYY") || "Never"}
                                                </p>
                                                <p className="mb-0">
                                                    <strong>Status:</strong>{" "}
                                                    {getStatusBadge(assetData.status)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Custodian History */}
                                <div className="mb-4">
                                    <h5 className="mb-3 fw-semibold">Custodian History</h5>
                                    {loadingCustodianHistory ? (
                                        <div className="text-center py-3">
                                            <ReactLoading type={"spin"} color={"#696cff"} height={30} width={30} />
                                        </div>
                                    ) : custodianHistory.length === 0 ? (
                                        <div className="alert alert-info">No custodian history found</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-sm table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Custodian</th>
                                                        <th>Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {custodianHistory.map((record, idx) => (
                                                        <tr key={idx}>
                                                            <td>{formatDate(record.assigned_date, "DD/MM/YYYY")}</td>
                                                            <td>{record.custodian_name}</td>
                                                            <td>{record.notes || "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Location History */}
                                <div className="mb-4">
                                    <h5 className="mb-3 fw-semibold">Location History</h5>
                                    {loadingLocationHistory ? (
                                        <div className="text-center py-3">
                                            <ReactLoading type={"spin"} color={"#696cff"} height={30} width={30} />
                                        </div>
                                    ) : locationHistory.length === 0 ? (
                                        <div className="alert alert-info">No location history found</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-sm table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Location</th>
                                                        <th>Notes</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {locationHistory.map((record, idx) => (
                                                        <tr key={idx}>
                                                            <td>{formatDate(record.moved_date, "DD/MM/YYYY")}</td>
                                                            <td>{record.location_name}</td>
                                                            <td>{record.notes || "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Maintenance Tab */}
                        {activeTab === "maintenance" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0 fw-semibold">Maintenance Records</h5>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#maintenanceRecordModal"
                                        disabled={!assetUid}
                                        title={!assetUid ? "Loading asset information..." : "Add maintenance record"}
                                        onClick={() => console.log("Opening maintenance modal with assetUid:", assetUid)}
                                    >
                                        <i className="bx bx-plus me-1"></i> Add Record
                                    </button>
                                </div>

                                {loadingMaintenance ? (
                                    <div className="text-center py-4">
                                        <ReactLoading type={"cylon"} color={"#696cff"} height={30} width={50} />
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
                                                    <th>Actions</th>
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
                                                        <td>{formatDate(record.scheduled_date, "DD/MM/YYYY")}</td>
                                                        <td>{formatDate(record.completed_date, "DD/MM/YYYY") || "-"}</td>
                                                        <td>
                                                            <span className={`badge bg-${record.status === 'completed' ? 'success' : record.status === 'scheduled' ? 'warning' : 'info'}`}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                        <td>{record.cost ? `TSH ${Number(record.cost).toLocaleString()}` : "-"}</td>
                                                        <td>{record.technician_name || "-"}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger border-0"
                                                                onClick={() => handleDeleteMaintenanceRecord(record)}
                                                                title="Delete"
                                                            >
                                                                <i className="bx bx-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Quick Actions */}
                                <div className="row mt-4">
                                    <div className="col-md-12">
                                        <h6 className="mb-3 fw-semibold">Quick Status Actions</h6>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <button
                                                className="btn btn-sm btn-outline-warning"
                                                onClick={() => handleStatusUpdate('under_maintenance')}
                                            >
                                                <i className="bx bx-wrench me-1"></i> Mark as Under Maintenance
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-info"
                                                onClick={() => handleStatusUpdate('in_repair')}
                                            >
                                                <i className="bx bx-cog me-1"></i> Mark as In Repair
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-success"
                                                onClick={() => handleStatusUpdate('operational')}
                                            >
                                                <i className="bx bx-check me-1"></i> Mark as Operational
                                            </button>
                                        </div>
                                    </div>
                                </div>
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
                                        disabled={!assetUid}
                                        title={!assetUid ? "Loading asset information..." : "Create new support ticket"}
                                        onClick={() => {
                                            console.log("Opening support ticket modal with assetUid:", assetUid);
                                            setSelectedTicket(null);
                                        }}
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

            <AssetNetworkModal loadOnlyModal={true} />
            <MaintenanceRecordModal
                assetUid={assetUid}
                assetTag={assetData?.asset_tag}
                onSuccess={fetchMaintenanceRecords}
            />
            <SupportTicketModal
                assetUid={assetUid}
                assetTag={assetData?.asset_tag}
                selectedTicket={selectedTicket}
                onSuccess={fetchSupportTickets}
            />
        </AssetContext.Provider>
    );
};
