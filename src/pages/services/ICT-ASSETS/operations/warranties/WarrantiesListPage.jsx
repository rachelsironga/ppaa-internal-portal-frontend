import React, { useState, useEffect, useRef } from "react";
import "animate.css";
import { AssetContext } from "../../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { WarrantiesModal } from "./WarrantiesModal";
import { deleteAsset } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";

export const WarrantiesListPage = () => {
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

    const handleDelete = async (warranty) => {
        if (!warranty) {
            Swal.fire("Error!", "Unable to select this warranty.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete warranty from ${warranty.provider} (${warranty.asset_tag || warranty.asset})`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteAsset(warranty.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The warranty has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete warranty", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting warranty:", error);
            Swal.fire(
                "Error!",
                "Unable to delete warranty. Please try again or contact support.",
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
            <BreadCumb pageList={["Warranties", "List"]} />
            <PaginatedTable
                fetchPath="/asset-warranties"
                title="Warranties"
                onDataFetched={(data) => setTableData(data)}
                columns={[
                    {
                        key: "asset",
                        label: "Asset Tag",
                        className: "fw-bold",
                        style: { width: "120px" },
                        render: (row) => (
                            <div>
                                <span className="text-primary fw-semibold">
                                    {row.asset_tag || row.asset_details?.tag || row.asset || "-"}
                                </span>
                                {row.asset_details?.name && (
                                    <small className="d-block text-muted">
                                        {row.asset_details.name}
                                    </small>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "provider",
                        label: "Provider",
                        style: { width: "150px" },
                        render: (row) => (
                            <div>
                                <span className="fw-semibold text-dark">
                                    {row.provider || "-"}
                                </span>
                                {row.po_number && (
                                    <small className="d-block text-muted">
                                        PO: {row.po_number}
                                    </small>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "start_date",
                        label: "Duration",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                <small className="d-block">
                                    {row.start_date ? formatDate(row.start_date, "DD/MM/YYYY") : "-"}
                                </small>
                                <small className="text-muted">
                                    {row.end_date ? formatDate(row.end_date, "DD/MM/YYYY") : "-"}
                                </small>
                            </div>
                        ),
                    },
                    {
                        key: "po_amount",
                        label: "Amount",
                        style: { width: "120px" },
                        render: (row) => (
                            <span className="text-success fw-semibold">
                                {row.po_amount ? `$${row.po_amount}` : "-"}
                            </span>
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
                                        <div className="ms-2">
                                            <span className="text-dark fs-13">
                                                {row.created_by_details.first_name}{" "}
                                                {row.created_by_details.last_name}
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
                        key: "coverage_details",
                        label: "Coverage",
                        className: "text-left",
                        style: { width: "250px" },
                        render: (row) => (
                            <div>
                                {row.coverage_details ? (
                                    <span className="text-muted text-truncate d-block" title={row.coverage_details}>
                                        {row.coverage_details.length > 60
                                            ? `${row.coverage_details.substring(0, 60)}...`
                                            : row.coverage_details}
                                    </span>
                                ) : (
                                    <span className="text-muted">No coverage details</span>
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
                                {hasAccess(user, [["change_asset"]]) && (
                                    <button
                                        aria-label="Edit"
                                        type="button"
                                        className="btn btn-sm btn-outline-primary border-0"
                                        onClick={() => setSelectedObj(row)}
                                        data-bs-toggle="modal"
                                        data-bs-target="#warrantiesModal"
                                        title="Edit Warranty"
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
                                        title="Delete Warranty"
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
                        label: "Add Warranty",
                        render: () => (
                            hasAccess(user, [["add_asset"]]) && (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#warrantiesModal"
                                    title="Add new warranty"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Warranty
                                </button>
                            )
                        ),
                    },
                ]}
                onSelect={(row) => {
                    setSelectedObj(row);
                }}
                isRefresh={tableRefresh}
            />
            <WarrantiesModal />
        </AssetContext.Provider>
    );
};