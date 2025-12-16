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
    const user = useSelector((state) => state.userReducer?.data);

    useEffect(() => {
        setShowBulkActions(selectedAssets.length > 0);
    }, [selectedAssets]);

    const handleDelete = async (asset) => {
        if (!asset) {
            Swal.fire("Error!", "Unable to select this disposal record.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete disposal record: ${asset.name} `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteDisposalRecord(asset.uid);
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
            <BreadCumb pageList={["Disposal Record", "List"]} />
            <PaginatedTable
                fetchPath="/asset-disposal-records"
                title="Assets Types"
                onDataFetched={(data) => setTableData(data)}
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
                        style: { width: "200px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <i className="bx bx-cube text-primary me-2 fs-5"></i>
                                <div>
                                    <span
                                        className="text-primary cursor-pointer fw-semibold"
                                        style={{ textTransform: 'uppercase' }}
                                    >
                                        {row.asset || "-"}
                                    </span>

                                </div>
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
                        key: "disposal_date",
                        label: "Disposal date",
                        className: "text-left",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                {row.disposal_date ? (
                                    <span
                                        className="text-muted text-truncate d-block"
                                        style={{ textTransform: 'uppercase' }}

                                        title={row.disposal_date}>
                                  
                                    </span>
                                ) : (
                                    <span className="text-muted">No Disposal Date</span>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "disposal_method",
                        label: "Disposal Method",
                        className: "text-left",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                {row.disposal_method ? (
                                    <span
                                        className="text-muted text-truncate d-block"
                                        style={{ textTransform: 'uppercase' }}

                                        title={row.disposal_method}>
                                  
                                    </span>
                                ) : (
                                    <span className="text-muted">No Disposal Method</span>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "status",
                        label: "Status",
                        className: "text-left",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                {row.status ? (
                                    <span
                                        className="text-muted text-truncate d-block"
                                        style={{ textTransform: 'uppercase' }}

                                        title={row.status}>
                                  
                                    </span>
                                ) : (
                                    <span className="text-muted">No Disposal Record Status</span>
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
                            <button
                                aria-label="View"
                                type="button"
                                className="btn p-0 dropdown-toggle hide-arrow text-info"
                                data-bs-toggle="dropdown"
                                onClick={() =>
                                    hasAccess(user,
                                        [
                                        "view_asset",
                                        ],
                                        []
                                    )   
                                        ? navigate(
                                            `/ict-assets/view-asset-type/${row.uid}`
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
                        label: "Add  Asset Type",
                        render: () => (
                            hasAccess(user, ["add_asset"], []) && (
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
            />
            <DisposalRecordModal />
        </DisposalRecordContext.Provider>
    );
};