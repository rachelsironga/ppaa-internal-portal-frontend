import React, { useState, useEffect, useRef } from "react";
import "animate.css";
import { DisposalRecordContext } from "../../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { deleteDisposalRecord } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { DisposalRecordModal } from "./DisposalRecordModal";

export const DisposalRecordsListPage = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [tableData, setTableData] = useState([]);
    const tableRef = useRef(null);
    const navigate = useNavigate();
    const user = useSelector((state: any) => state.userReducer?.data);

    useEffect(() => {
        setShowBulkActions(selectedAssets.length > 0);
    }, [selectedAssets]);

    const handleDelete = async (disposal_record) => {
        if (!disposal_record) {
            Swal.fire("Error!", "Unable to select this disposal record.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete disposal record: ${disposal_record.asset?.asset_tag} `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteDisposalRecord(disposal_record.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The disposal record has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete disposal record", "error");
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

    return (
        <DisposalRecordContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Disposal Record", "List"] as any}>
                {null}
            </BreadCumb>
            <PaginatedTable
                fetchPath="/asset-disposal-records"
                title="Disposal Records"
                columns={[

                    {
                        key: "SN",
                        label: "SN",
                        style: { width: "80px" },
                        className: "text-center",
                    },
                    {
                        key: "asset",
                        label: "Asset",
                        className: "fw-bold",
                        style: { width: "280px" },
                        render: (row) => {
                            const asset = row.asset || {};
                            const assetTag = asset.asset_tag || row.asset_tag || "-";
                            const barcode = asset.barcode || row.barcode || null;
                            const serialNumber = asset.serial_number || row.serial_number || null;
                            
                            return (
                                <div className="d-flex align-items-start">
                                    <i className="bx bx-cube text-primary me-2 fs-5 mt-1"></i>
                                    <div className="flex-grow-1">
                                        <div className="mb-1">
                                            <span
                                                className="text-primary cursor-pointer fw-semibold d-block"
                                                style={{ textTransform: 'uppercase', fontSize: '0.875rem' }}
                                            >
                                                {assetTag}
                                            </span>
                                        </div>
                                        {barcode && (
                                            <div className="mb-1 d-flex align-items-center">
                                                <i className="bx bx-barcode text-muted me-1" style={{ fontSize: '0.75rem' }}></i>
                                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                    <span className="fw-medium">BC:</span> {barcode}
                                                </small>
                                            </div>
                                        )}
                                        {serialNumber && (
                                            <div className="d-flex align-items-center">
                                                <i className="bx bx-hash text-muted me-1" style={{ fontSize: '0.75rem' }}></i>
                                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                    <span className="fw-medium">SN:</span> {serialNumber}
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        },
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
                                                    {formatDate(row.created_at)}
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
                        key: "disposal_date",
                        label: "Disposal Date",
                        className: "text-left",
                        style: { width: "150px" },
                        render: (row) => (
                            <div>
                                {row.disposal_date ? (
                                    <span className="text-dark">
                                        {formatDate(row.disposal_date)}
                                    </span>
                                ) : (
                                    <span className="text-muted">N/A</span>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "disposal_method",
                        label: "Disposal Method",
                        className: "text-left",
                        style: { width: "150px" },
                        render: (row) => {
                            const getMethodBadge = (method) => {
                                if (!method) return { class: 'bg-secondary', label: 'N/A' };
                                
                                const methodLower = method.toLowerCase();
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
                                        return { class: 'bg-secondary', label: method };
                                }
                            };
                            
                            const methodInfo = getMethodBadge(row.disposal_method);
                            return (
                                <div>
                                    <span className={`badge ${methodInfo.class}`}>
                                        {methodInfo.label}
                                    </span>
                                </div>
                            );
                        },
                    },
                    {
                        key: "disposal_value",
                        label: "Disposal Value",
                        className: "text-left",
                        style: { width: "150px" },
                        render: (row) => (
                            <div>
                                {row.disposal_value ? (
                                    <span className="text-dark fw-semibold">
                                        TZS {parseFloat(row.disposal_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                ) : (
                                    <span className="text-muted">N/A</span>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "status",
                        label: "Status",
                        className: "text-left",
                        style: { width: "120px" },
                        render: (row) => {
                            const getStatusBadge = (status) => {
                                if (!status) return { class: 'bg-secondary', label: 'N/A' };
                                
                                const statusLower = status.toLowerCase();
                                switch (statusLower) {
                                    case 'pending':
                                        return { class: 'bg-warning', label: 'Pending' };
                                    case 'approved':
                                        return { class: 'bg-success', label: 'Approved' };
                                    case 'rejected':
                                        return { class: 'bg-danger', label: 'Rejected' };
                                    default:
                                        return { class: 'bg-secondary', label: status };
                                }
                            };
                            
                            const statusInfo = getStatusBadge(row.status);
                            return (
                                <div>
                                    <span className={`badge ${statusInfo.class}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>
                            );
                        },
                    },
                 
                    {
                        key: "actions",
                        label: "Actions",
                        style: { width: "120px" },
                        className: "text-center",
                        render: (row) => (
                            <button
                                aria-label="View"
                                type="button"
                                className="btn p-0 dropdown-toggle hide-arrow text-info"
                                data-bs-toggle="dropdown"
                                onClick={() =>
                                    hasAccess(user,
                                        [
                                        "view_disposal_record",
                                        ],
                                        []
                                    )   
                                        ? navigate(
                                            `/ict-assets/view-disposal-record/${row.uid}`
                                        )
                                        : null
                                }
                            >
                                <i className="bx bx-link-external"></i>&nbsp; View
                            </button>
                        
                        ),
                    },
                ]}
                buttons={[

                    {
                        label: "Add Disposal Record",
                        render: () => (
                            hasAccess(user, ["add_disposal_record"], []) && (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#disposalrecordModal"
                                    title="Add new disposal record"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Disposal Record
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
                            { value: "pending", label: "Pending" },
                            { value: "approved", label: "Approved" },
                            { value: "rejected", label: "Rejected" }
                        ]
                    },
                    {
                        group: "disposal_method",
                        label: "Disposal Method",
                        placeholder: "Filter by Disposal Method",
                        options: [
                            { value: "recycled", label: "Recycled" },
                            { value: "sold", label: "Sold" },
                            { value: "donated", label: "Donated" },
                            { value: "destroyed", label: "Destroyed" }
                        ]
                    },
                    {
                        group: "is_active",
                        label: "Record Status",
                        placeholder: "Filter by Record Status",
                        options: [
                            { value: "true", label: "Active" },
                            { value: "false", label: "Inactive" }
                        ]
                    }
                ] as any}
            />
            <DisposalRecordModal />
        </DisposalRecordContext.Provider>
    );
};