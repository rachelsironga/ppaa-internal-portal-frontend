import React, { useState, useEffect, useRef } from "react";
import "animate.css";
import { AssetContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { PeripheralAssetModal } from "./PeripheralAssetModal";
import { PeripheralAssetImportModal } from "./ImportModal";
import { deleteAsset } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";

export const PeripheralDeviceListPage = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [tableData, setTableData] = useState([]);
    const tableRef = useRef(null);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    useEffect(() => {
        setShowBulkActions(selectedAssets.length > 0);
    }, [selectedAssets]);

    const handleDelete = async (asset) => {
        if (!asset) {
            Swal.fire("Error!", "Unable to select this asset.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete asset: ${asset.asset_tag}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteAsset(asset.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The asset has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete asset", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting asset:", error);
            Swal.fire(
                "Error!",
                "Unable to delete asset. Please try again or contact support.",
                "error"
            );
        }
    };
    return (
        <AssetContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Peripheral Assets", "List"]} />
            <PaginatedTable
                fetchPath="/asset-peripherals"
                title="Peripheral Assets Inventory"
                onDataFetched={(data) => setTableData(data)}
                columns={[
                    {
                        key: "asset_tag",
                        label: "Asset Tag",
                        className: "fw-bold",
                        style: { width: "140px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <i className={`bx ${
                                        // Computer icons
                                        row.processor ? 'bx-desktop text-primary' :
                                        // Network device icons
                                        row.device_type === 'Switch' ? 'bx-network-chart text-info' :
                                        row.device_type === 'Router' ? 'bx-router text-primary' :
                                        row.device_type === 'Firewall' ? 'bx-shield-alt text-warning' :
                                        row.device_type === 'Access Point' ? 'bx-wifi text-success' :
                                        // Peripheral icons
                                        row.peripheral_type === 'Monitor' ? 'bx-tv text-info' :
                                        row.peripheral_type === 'Keyboard' ? 'bx-keyboard text-secondary' :
                                        row.peripheral_type === 'Mouse' ? 'bx-mouse text-secondary' :
                                        row.peripheral_type === 'Printer' ? 'bx-printer text-dark' :
                                        row.peripheral_type === 'Scanner' ? 'bx-scan text-warning' :
                                        row.peripheral_type === 'Speaker' ? 'bx-volume-full text-success' :
                                        // Default
                                        'bx-chip text-secondary'
                                    } me-2 fs-5`}></i>
                                </div>
                                <div className="flex-grow-1">
                                    <span
                                        className="text-primary cursor-pointer fw-semibold"
                                        onClick={() =>
                                            hasAccess(user, [
                                                ["view_asset", "add_asset", "change_asset"]
                                            ])
                                                ? navigate(`/ict-assets/peripheral-devices/${row.uid}`)
                                                : null
                                        }
                                    >
                                        {row.asset_tag || "-"}
                                    </span>
                                    {row.barcode && (
                                        <small className="d-block text-muted fs-12">
                                            📋 {row.barcode}
                                        </small>
                                    )}
                                    {/* Computer */}
                                    {row.hostname && (
                                        <small className="d-block text-muted fs-12">
                                            🖥️ {row.hostname}
                                        </small>
                                    )}
                                    {/* Network Device */}
                                    {row.device_type && (
                                        <small className="d-block text-muted fs-12">
                                            {row.device_type}
                                        </small>
                                    )}
                                    {/* Peripheral */}
                                    {row.peripheral_type && (
                                        <small className="d-block text-muted fs-12">
                                            {row.peripheral_type}
                                        </small>
                                    )}
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: "serial_number",
                        label: "Serial No.",
                        className: "text-center",
                        style: { width: "140px" },
                        render: (row) => (
                            <div>
                                {row.serial_number ? (
                                    <span className="badge bg-light text-dark border">
                                        {row.serial_number}
                                    </span>
                                ) : (
                                    <span className="text-muted">-</span>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "specifications",
                        label: "Specifications",
                        className: "text-left",
                        style: { width: "220px" },
                        render: (row) => (
                            <div>
                                <div className="fw-medium text-dark">{row.model || "-"}</div>
                                
                                {/* Computer Specifications */}
                                {row.processor && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-chip me-1"></i>
                                        {row.processor} ({row.cpu_cores} cores)
                                    </small>
                                )}
                                {row.ram_gb && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-memory-card me-1"></i>
                                        {row.ram_gb}GB RAM
                                    </small>
                                )}
                                {row.storage_gb && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-hdd me-1"></i>
                                        {row.storage_gb}GB {row.storage_type || "Storage"}
                                    </small>
                                )}
                                
                                {/* Network Device Specifications */}
                                {row.manufacturer_name && !row.processor && !row.peripheral_type && (
                                    <small className="text-muted d-block fs-12">
                                        🏭 {row.manufacturer_name}
                                    </small>
                                )}
                                {row.ports && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-cable-car me-1"></i>
                                        {row.ports} Ports
                                    </small>
                                )}
                                
                                {/* Peripheral Specifications */}
                                {row.peripheral_type && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-category me-1"></i>
                                        {row.peripheral_type}
                                    </small>
                                )}
                                {row.connection_type && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-plug me-1"></i>
                                        {row.connection_type}
                                    </small>
                                )}
                                
                                {/* Asset Type for generic items */}
                                {row.asset_type_name && !row.processor && !row.device_type && !row.peripheral_type && (
                                    <small className="text-muted d-block fs-12">
                                        {row.asset_type_name}
                                    </small>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "network_connection",
                        label: "Network/Connection",
                        className: "text-left",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                {/* Computer Network Info */}
                                {row.operating_system ? (
                                    <div className="fw-medium text-dark">
                                        {row.operating_system}
                                        {row.os_version && ` v${row.os_version}`}
                                    </div>
                                ) : row.ip_address ? (
                                    <div className="fw-medium text-dark">
                                        <i className="bx bx-globe me-1"></i>
                                        {row.ip_address}
                                    </div>
                                ) : row.peripheral_type ? (
                                    <div className="fw-medium text-dark">
                                        {row.peripheral_type}
                                    </div>
                                ) : (
                                    <div className="text-muted">-</div>
                                )}
                                
                                {/* Computer Network Details */}
                                {row.ip_addresses && row.ip_addresses.length > 0 && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-globe me-1"></i>
                                        {row.ip_addresses[0]}
                                        {row.ip_addresses.length > 1 && ` +${row.ip_addresses.length - 1}`}
                                    </small>
                                )}
                                {row.mac_addresses && row.mac_addresses.length > 0 && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-network-chart me-1"></i>
                                        {row.mac_addresses[0]}
                                    </small>
                                )}
                                
                                {/* Network Device Details */}
                                {row.mac_address && !row.processor && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-network-chart me-1"></i>
                                        {row.mac_address}
                                    </small>
                                )}
                                {row.device_type && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-devices me-1"></i>
                                        {row.device_type}
                                    </small>
                                )}
                                
                                {/* Peripheral Connection Details */}
                                {row.connection_type && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-plug me-1"></i>
                                        {row.connection_type} Connection
                                    </small>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "warranty",
                        label: "Warranty Status",
                        className: "text-center",
                        style: { width: "160px" },
                        render: (row) => {
                            if (!row.warranty_expiry) {
                                return (
                                    <div className="text-center">
                                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">
                                            No warranty
                                        </span>
                                    </div>
                                );
                            }

                            const warrantyDate = new Date(row.warranty_expiry);
                            const today = new Date();
                            const daysUntilExpiry = Math.ceil((warrantyDate - today) / (1000 * 60 * 60 * 24));

                            let statusClass = "success";
                            let statusText = "Active";
                            let icon = "✓";

                            if (warrantyDate < today) {
                                statusClass = "danger";
                                statusText = "Expired";
                                icon = "⚠";
                            } else if (daysUntilExpiry <= 30) {
                                statusClass = "warning";
                                statusText = "Expiring Soon";
                                icon = "⚠";
                            }

                            return (
                                <div className="text-center">
                                    <span className={`badge bg-${statusClass} bg-opacity-10 text-${statusClass} border border-${statusClass} border-opacity-25`}>
                                        {icon} {statusText}
                                    </span>
                                    <small className="d-block text-muted fs-12 mt-1">
                                        {formatDate(row.warranty_expiry, "DD/MM/YYYY")}
                                    </small>
                                    {daysUntilExpiry > 0 && daysUntilExpiry <= 60 && (
                                        <small className="d-block text-warning fs-11">
                                            {daysUntilExpiry} days left
                                        </small>
                                    )}
                                </div>
                            );
                        },
                    },
                    {
                        key: "custodian",
                        label: "Custodian & Location",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                {row.custodian_name ? (
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 ms-2">
                                            <span className="text-dark fs-13">{row.custodian_name}</span>
                                            {row.location_name && (
                                                <small className="text-muted d-block fs-12">
                                                    📍 {row.location_name}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-muted">Unassigned</span>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "status",
                        label: "Asset Status",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => {
                            const statusConfig = {
                                operational: { class: "success", icon: "✓", label: "Operational" },
                                active: { class: "success", icon: "✓", label: "Active" },
                                inactive: { class: "warning", icon: "⏸", label: "Inactive" },
                                in_repair: { class: "info", icon: "🔧", label: "In Repair" },
                                maintenance: { class: "warning", icon: "🛠️", label: "Maintenance" },
                                retired: { class: "secondary", icon: "📦", label: "Retired" },
                                lost: { class: "danger", icon: "🔍", label: "Lost" },
                                disposed: { class: "dark", icon: "🗑", label: "Disposed" },
                                offline: { class: "danger", icon: "🔌", label: "Offline" },
                                online: { class: "success", icon: "🌐", label: "Online" }
                            };

                            const config = statusConfig[row.status] || { class: "secondary", icon: "?", label: row.status || "Unknown" };

                            return (
                                <span className={`badge bg-${config.class} bg-opacity-10 text-${config.class} border border-${config.class} border-opacity-25`}>
                                    {config.icon} {config.label}
                                </span>
                            );
                        },
                    },
                    {
                        key: "condition",
                        label: "Condition",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => {
                            const conditionConfig = {
                                new: { class: "success", label: "New" },
                                excellent: { class: "success", label: "Excellent" },
                                good: { class: "info", label: "Good" },
                                fair: { class: "warning", label: "Fair" },
                                poor: { class: "danger", label: "Poor" }
                            };

                            const config = conditionConfig[row.condition] || { class: "secondary", label: row.condition || "Unknown" };

                            return (
                                <span className={`badge bg-${config.class} bg-opacity-10 text-${config.class} border border-${config.class} border-opacity-25`}>
                                    {config.label}
                                </span>
                            );
                        },
                    },
                    {
                        key: "actions",
                        label: "Actions",
                        style: { width: "120px" },
                        className: "text-center",
                        render: (row) => (
                            <div className="btn-group">
                                <button
                                    aria-label="View"
                                    type="button"
                                    className="btn btn-sm btn-outline-info border-0"
                                    onClick={() => navigate(`/ict-assets/peripheral-devices/${row.uid}`)}
                                    title="View Asset"
                                >
                                    <i className="bx bx-show"></i>
                                </button>
                                {hasAccess(user, [["change_asset"]]) && (
                                    <button
                                        aria-label="Edit"
                                        type="button"
                                        className="btn btn-sm btn-outline-primary border-0"
                                        onClick={() => {
                                            setSelectedObj(row);
                                        }}
                                        data-bs-toggle="modal"
                                        data-bs-target="#peripheralAssetModal"
                                        title="Edit Asset"
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_asset"]]) && (
                                    <button
                                        aria-label="Delete"
                                        type="button"
                                        className="btn btn-sm btn-outline-danger border-0"
                                        onClick={() => handleDelete(row)}
                                        title="Delete Asset"
                                    >
                                        <i className="bx bx-trash"></i>
                                    </button>
                                )}
                            </div>
                        ),
                    },
                ]}
                //Paginated table top-right buttons 
                buttons={[
                    {
                        label: "Import Assets",
                        render: () => (
                            hasAccess(user, [["add_asset"]]) && (
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm me-2"
                                    data-bs-toggle="modal"
                                    data-bs-target="#peripheralAssetImportModal"
                                    title="Import peripheral assets from file"
                                >
                                    <i className="bx bx-upload me-1"></i> Import
                                </button>
                            )
                        ),
                    },
                    {
                        label: "Add Asset",
                        render: () => (
                            hasAccess(user, [["add_asset"]]) && (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#peripheralAssetModal"
                                    title="Add new peripheral asset"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Asset
                                </button>
                            )
                        ),
                    },
                ]}
                onSelect={(row) => {
                    setSelectedObj(row);
                }}
                isRefresh={tableRefresh}
                filterGroups={[
                    {
                        group: "status",
                        label: "Status",
                        placeholder: "Filter by Status",
                        options: [
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" },
                            { value: "in_repair", label: "In Repair" },
                            { value: "retired", label: "Retired" },
                            { value: "lost", label: "Lost" },
                            { value: "disposed", label: "Disposed" }
                        ]
                    },
                    {
                        group: "condition",
                        label: "Condition",
                        placeholder: "Filter by Condition",
                        options: [
                            { value: "excellent", label: "Excellent" },
                            { value: "good", label: "Good" },
                            { value: "fair", label: "Fair" },
                            { value: "poor", label: "Poor" },
                            { value: "broken", label: "Broken" },
                            { value: "for_parts", label: "For Parts" }
                        ]
                    },
                    {
                        group: "warranty_status",
                        label: "Warranty",
                        placeholder: "Filter by Warranty",
                        options: [
                            { value: "active", label: "Warranty Active" },
                            { value: "expired", label: "Warranty Expired" },
                            { value: "expiring_soon", label: "Warranty Expiring Soon" },
                            { value: "none", label: "No Warranty" }
                        ]
                    },
                    {
                        group: "audit_status",
                        label: "Audit Status",
                        placeholder: "Filter by Audit",
                        options: [
                            { value: "up_to_date", label: "Audit Up to Date" },
                            { value: "due_soon", label: "Audit Due Soon" },
                            { value: "overdue", label: "Audit Overdue" },
                            { value: "never_audited", label: "Never Audited" }
                        ]
                    }
                ]}
            />
            <PeripheralAssetModal />
            <PeripheralAssetImportModal />
        </AssetContext.Provider>
    );
};
