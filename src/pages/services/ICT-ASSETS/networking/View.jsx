import React, { useState, useEffect, useRef } from "react";
import "animate.css";
import { AssetContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { NetworkAssetModal } from "./NetworkAssetModal";
import { NetworkAssetImportModal } from "./ImportModal";
import { deleteAsset } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";

export const NetworkingDeviceListPage = () => {
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

    const handleBulkDelete = async () => {
        if (selectedAssets.length === 0) return;

        const confirmation = await Swal.fire({
            title: "Delete Multiple Assets?",
            text: `You're about to delete ${selectedAssets.length} asset(s)`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            cancelButtonColor: "#aaa",
            confirmButtonText: "Yes, delete them!",
        });

        if (confirmation.isConfirmed) {
            let successCount = 0;
            let errorCount = 0;

            for (const asset of selectedAssets) {
                try {
                    const result = await deleteAsset(asset.uid);
                    if (result.status === 200 || result.status === 8000) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                }
            }

            if (errorCount === 0) {
                showToast("success", `${successCount} asset(s) deleted successfully`);
            } else {
                showToast("warning", `${successCount} succeeded, ${errorCount} failed`);
            }

            setSelectedAssets([]);
            setTableRefresh((prev) => prev + 1);
        }
    };

    const handleExportExcel = () => {
        if (!tableData || tableData.length === 0) {
            showToast("error", "No data to export");
            return;
        }

        const exportData = tableData.map(row => ({
            "Asset Tag": row.asset_tag || "-",
            "Serial Number": row.serial_number || "-",
            "Barcode": row.barcode || "-",
            "Device Type": row.device_type || "-",
            "Model": row.model || "-",
            "Manufacturer": row.manufacturer_name || "-",
            "Ports": row.ports || "-",
            "IP Address": row.ip_address || "-",
            "MAC Address": row.mac_address || "-",
            "Custodian": row.custodian_name || "Unassigned",
            "Location": row.location_name || "-",
            "Status": row.status || "-",
            "Condition": row.condition || "-",
            "Warranty Expiry": row.warranty_expiry ? formatDate(row.warranty_expiry, "DD/MM/YYYY") : "-",
            "Purchase Date": row.purchase_date ? formatDate(row.purchase_date, "DD/MM/YYYY") : "-",
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Network Devices");

        const colWidths = Object.keys(exportData[0] || {}).map(key => ({ wch: 20 }));
        ws['!cols'] = colWidths;

        XLSX.writeFile(wb, `Network_Devices_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast("success", "Data exported successfully");
    };

    const handleExportCSV = () => {
        if (!tableData || tableData.length === 0) {
            showToast("error", "No data to export");
            return;
        }

        const exportData = tableData.map(row => ({
            "Asset Tag": row.asset_tag || "-",
            "Serial Number": row.serial_number || "-",
            "Barcode": row.barcode || "-",
            "Device Type": row.device_type || "-",
            "Model": row.model || "-",
            "Manufacturer": row.manufacturer_name || "-",
            "Ports": row.ports || "-",
            "IP Address": row.ip_address || "-",
            "MAC Address": row.mac_address || "-",
            "Custodian": row.custodian_name || "Unassigned",
            "Location": row.location_name || "-",
            "Status": row.status || "-",
            "Condition": row.condition || "-",
            "Warranty Expiry": row.warranty_expiry ? formatDate(row.warranty_expiry, "DD/MM/YYYY") : "-",
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Network_Devices_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("success", "Data exported successfully");
    };

    const handlePrint = () => {
        window.print();
    };

    const handleRefresh = () => {
        setTableRefresh((prev) => prev + 1);
        showToast("info", "Data refreshed");
    };

    const handleBulkAssign = async () => {
        if (selectedAssets.length === 0) return;

        const { value: custodianId } = await Swal.fire({
            title: "Assign Custodian",
            html: '<input id="custodian-select" class="swal2-input" placeholder="Enter custodian ID">',
            showCancelButton: true,
            confirmButtonText: "Assign",
            preConfirm: () => {
                return document.getElementById("custodian-select").value;
            }
        });

        if (custodianId) {
            showToast("info", `Assigning ${selectedAssets.length} asset(s) to custodian...`);
            setSelectedAssets([]);
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
            <BreadCumb pageList={["Network Devices", "List"]} />

            {showBulkActions && (
                <div className="alert alert-info alert-dismissible fade show d-flex align-items-center justify-content-between mb-3" role="alert">
                    <div>
                        <i className="bx bx-check-square me-2"></i>
                        <strong>{selectedAssets.length}</strong> asset(s) selected
                    </div>
                    <div className="btn-group">
                        {hasAccess(user, [["change_asset"]]) && (
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={handleBulkAssign}
                                title="Assign Custodian"
                            >
                                <i className="bx bx-user-plus me-1"></i> Assign
                            </button>
                        )}
                        {hasAccess(user, [["delete_asset"]]) && (
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={handleBulkDelete}
                                title="Delete Selected"
                            >
                                <i className="bx bx-trash me-1"></i> Delete ({selectedAssets.length})
                            </button>
                        )}
                        <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSelectedAssets([])}
                            title="Clear Selection"
                        >
                            <i className="bx bx-x"></i> Clear
                        </button>
                    </div>
                </div>
            )}

            <PaginatedTable
                ref={tableRef}
                fetchPath="/asset-network-devices"
                title="Network Devices Inventory"
                onDataFetched={(data) => setTableData(data)}
                columns={[
                    {
                        key: "select",
                        label: (
                            <input
                                type="checkbox"
                                className="form-check-input"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedAssets(tableData);
                                    } else {
                                        setSelectedAssets([]);
                                    }
                                }}
                                checked={selectedAssets.length === tableData.length && tableData.length > 0}
                            />
                        ),
                        style: { width: "40px" },
                        className: "text-center",
                        render: (row) => (
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedAssets.some(asset => asset.uid === row.uid)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedAssets([...selectedAssets, row]);
                                    } else {
                                        setSelectedAssets(selectedAssets.filter(asset => asset.uid !== row.uid));
                                    }
                                }}
                            />
                        ),
                    },
                    {
                        key: "asset_tag",
                        label: "Asset Tag",
                        className: "fw-bold",
                        style: { width: "140px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <i className={`bx ${row.device_type === 'Switch' ? 'bx-network-chart text-info' :
                                            row.device_type === 'Router' ? 'bx-router text-primary' :
                                                row.device_type === 'Firewall' ? 'bx-shield-alt text-warning' :
                                                    row.device_type === 'Access Point' ? 'bx-wifi text-success' :
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
                                                ? navigate(`/ict-assets/network-devices/${row.uid}`)
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
                                    {row.device_type && (
                                        <small className="d-block text-muted fs-12">
                                            {row.device_type}
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
                        key: "model_specs",
                        label: "Model & Specs",
                        className: "text-left",
                        style: { width: "200px" },
                        render: (row) => (
                            <div>
                                <div className="fw-medium text-dark">{row.model || "-"}</div>
                                {row.manufacturer_name && (
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
                                {row.asset_type_name && (
                                    <small className="text-muted d-block fs-12">
                                        {row.asset_type_name}
                                    </small>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "network_info",
                        label: "Network Info",
                        className: "text-left",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                {row.ip_address ? (
                                    <div className="fw-medium text-dark">
                                        <i className="bx bx-globe me-1"></i>
                                        {row.ip_address}
                                    </div>
                                ) : (
                                    <div className="text-muted">No IP</div>
                                )}
                                {row.mac_address && (
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
                                    onClick={() => navigate(`/ict-assets/network-devices/${row.uid}`)}
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
                                        data-bs-target="#networkAssetModal"
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
                buttons={[
                    {
                        label: "Refresh",
                        render: () => (
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm me-2"
                                onClick={handleRefresh}
                                title="Refresh data"
                            >
                                <i className="bx bx-refresh me-1"></i> Refresh
                            </button>
                        ),
                    },
                    {
                        label: "Export",
                        render: () => (
                            <div className="btn-group me-2">
                                <button
                                    type="button"
                                    className="btn btn-info btn-sm dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <i className="bx bx-download me-1"></i> Export
                                </button>
                                <ul className="dropdown-menu">
                                    <li>
                                        <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleExportExcel(); }}>
                                            <i className="bx bx-file me-2"></i> Export to Excel
                                        </a>
                                    </li>
                                    <li>
                                        <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handleExportCSV(); }}>
                                            <i className="bx bx-file-blank me-2"></i> Export to CSV
                                        </a>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); handlePrint(); }}>
                                            <i className="bx bx-printer me-2"></i> Print
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        ),
                    },
                    {
                        label: "Import Assets",
                        render: () => (
                            hasAccess(user, [["add_asset"]]) && (
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm me-2"
                                    data-bs-toggle="modal"
                                    data-bs-target="#networkAssetImportModal"
                                    title="Import network devices from file"
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
                                    data-bs-target="#networkAssetModal"
                                    title="Add new network device"
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
            <NetworkAssetModal />
            <NetworkAssetImportModal />
        </AssetContext.Provider>
    );
};
