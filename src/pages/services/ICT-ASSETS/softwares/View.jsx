import React, { useState, useEffect, useRef } from "react";
import "animate.css";
import { AssetContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { SoftwareAssetModal } from "./SoftwareAssetModal";
import { SoftwareAssetImportModal } from "./ImportModal";
import { deleteAsset } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";

export const SoftwareAssetListPage = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [tableData, setTableData] = useState([]);
    const tableRef = useRef(null);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);


    const platformIcons = {
        windows: "bx bxl-windows text-primary",
        linux: "bx bxl-tux text-success",
        macos: "bx bxl-apple text-dark",
        web: "bx bx-globe text-info",
        cross_platform: "bx bx-shape-triangle text-warning",
        android: "bx bxl-android text-success",
        ios: "bx bxl-apple text-dark",
        other: "bx bx-question-mark text-muted",
    };


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
                text: `You're about to delete software: ${asset.name} ${asset.version}`,
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
                        "The software has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete software", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting software:", error);
            Swal.fire(
                "Error!",
                "Unable to delete software. Please try again or contact support.",
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
            <BreadCumb pageList={["Software Assets", "List"]} />
            <PaginatedTable
                fetchPath="/asset-software"
                title="Software Assets Inventory"
                onDataFetched={(data) => setTableData(data)}
                columns={[
                    {
                        key: "name",
                        label: "Software Details",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => {
                            const platform = row.platform || "other";
                            const iconClass = platformIcons[platform] || platformIcons.other;

                            return (
                                <div className="d-flex align-items-center">
                                    <div className="flex-shrink-0">
                                        <i className={`${iconClass} me-2 fs-5`}></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <span
                                            className="text-primary cursor-pointer fw-semibold"
                                            onClick={() =>
                                                hasAccess(user, [["view_asset", "add_asset", "change_asset"]])
                                                    ? navigate(`/ict-assets/asset-software/${row.uid}`)
                                                    : null
                                            }
                                        >
                                            {row.software_name || "-"}
                                        </span>

                                        {row.version && (
                                            <small className="d-block text-muted fs-12">
                                                Version: {row.version}
                                            </small>
                                        )}
                                        {row.publisher && (
                                            <small className="d-block text-muted fs-12">
                                                🏢 {row.publisher}
                                            </small>
                                        )}
                                    </div>
                                </div>
                            );
                        },
                    },

                    {
                        key: "category",
                        label: "Category & License",
                        className: "text-left",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                {row.category_name ? (
                                    <div className="fw-medium text-dark">{row.category_name}</div>
                                ) : (
                                    <div className="text-muted">-</div>
                                )}
                                {row.license_type && (
                                    <small className="text-muted d-block fs-12">
                                        <i className="bx bx-certificate me-1"></i>
                                        {row.license_type} License
                                    </small>
                                )}
                                {row.cost && (
                                    <small className="text-success d-block fs-12 fw-semibold">
                                        <i className="bx bx-dollar me-1"></i>
                                        ${row.cost}
                                    </small>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "dates",
                        label: "Purchase & Expiry",
                        className: "text-center",
                        style: { width: "160px" },
                        render: (row) => (
                            <div>
                                {row.purchase_date ? (
                                    <div className="fw-medium text-dark">
                                        <small>Purchased:</small>
                                        <div className="text-primary fs-12">
                                            {formatDate(row.purchase_date, "DD/MM/YYYY")}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted fs-12">No purchase date</div>
                                )}
                                {row.expiration_date && (
                                    <small className="text-muted d-block fs-12 mt-1">
                                        <small>Expires:</small>
                                        <div className="text-warning fs-12">
                                            {formatDate(row.expiration_date, "DD/MM/YYYY")}
                                        </div>
                                    </small>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "created_by",
                        label: "Created By",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                {row.created_by_details ? (
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1 ms-2">
                                            <span className="text-dark fs-13">
                                                {row.created_by_details.first_name} {row.created_by_details.last_name}
                                            </span>
                                            <small className="text-muted d-block fs-12">
                                                @{row.created_by_details.username}
                                            </small>
                                            {row.created_at && (
                                                <small className="text-muted d-block fs-11">
                                                    {formatDate(row.created_at, "DD/MM/YYYY")}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-muted">Unknown</span>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "status",
                        label: "License Status",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => {
                            if (!row.expiration_date) {
                                return (
                                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">
                                        No Expiry
                                    </span>
                                );
                            }

                            const expiryDate = new Date(row.expiration_date);
                            const today = new Date();
                            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                            let statusClass = "success";
                            let statusText = "Active";
                            let icon = "✓";

                            if (expiryDate < today) {
                                statusClass = "danger";
                                statusText = "Expired";
                                icon = "⚠";
                            } else if (daysUntilExpiry <= 30) {
                                statusClass = "warning";
                                statusText = "Expiring Soon";
                                icon = "⚠";
                            }

                            return (
                                <span className={`badge bg-${statusClass} bg-opacity-10 text-${statusClass} border border-${statusClass} border-opacity-25`}>
                                    {icon} {statusText}
                                </span>
                            );
                        },
                    },
                    {
                        key: "notes",
                        label: "Notes",
                        className: "text-left",
                        style: { width: "150px" },
                        render: (row) => (
                            <div>
                                {row.notes ? (
                                    <span className="text-truncate d-block" title={row.notes}>
                                        {row.notes.length > 50 ? `${row.notes.substring(0, 50)}...` : row.notes}
                                    </span>
                                ) : (
                                    <span className="text-muted">No notes</span>
                                )}
                            </div>
                        ),
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
                                    onClick={() => navigate(`/ict-assets/asset-software/${row.uid}`)}
                                    title="View Software"
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
                                        data-bs-target="#softwareAssetModal"
                                        title="Edit Software"
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
                                        title="Delete Software"
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
                        label: "Import Software",
                        render: () => (
                            hasAccess(user, [["add_asset"]]) && (
                                <button
                                    type="button"
                                    className="btn btn-success btn-sm me-2"
                                    data-bs-toggle="modal"
                                    data-bs-target="#SoftwareAssetImportModal"
                                    title="Import software assets from file"
                                >
                                    <i className="bx bx-upload me-1"></i> Import
                                </button>
                            )
                        ),
                    },
                    {
                        label: "Add Software",
                        render: () => (
                            hasAccess(user, [["add_asset"]]) && (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#softwareAssetModal"
                                    title="Add new software asset"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Software
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
                        group: "license_type",
                        label: "License Type",
                        placeholder: "Filter by License",
                        options: [
                            { value: "Volume", label: "Volume License" },
                            { value: "Single", label: "Single License" },
                            { value: "Subscription", label: "Subscription" },
                            { value: "Enterprise", label: "Enterprise" },
                            { value: "Open Source", label: "Open Source" }
                        ]
                    },
                    {
                        group: "category",
                        label: "Category",
                        placeholder: "Filter by Category",
                        options: [
                            { value: "1", label: "Software Category 0" },
                            { value: "2", label: "Software Category 1" },
                            // Add more categories as needed
                        ]
                    },
                    {
                        group: "license_status",
                        label: "License Status",
                        placeholder: "Filter by Status",
                        options: [
                            { value: "active", label: "License Active" },
                            { value: "expired", label: "License Expired" },
                            { value: "expiring_soon", label: "Expiring Soon" },
                            { value: "perpetual", label: "Perpetual" }
                        ]
                    }
                ]}
            />
            <SoftwareAssetModal />
            <SoftwareAssetImportModal />
        </AssetContext.Provider>
    );
};