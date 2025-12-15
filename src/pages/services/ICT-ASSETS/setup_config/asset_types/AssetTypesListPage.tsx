import React, { useState, useEffect, useRef } from "react";
import "animate.css";
import { AssetContext } from "../../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { deleteAsset } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { AssetTypeModal } from "./AssetTypeModal";

export const AssetTypesListPage = () => {
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
            Swal.fire("Error!", "Unable to select this asset type.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete asset type: ${asset.name} `,
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
                        "The asset type has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete asset type", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting asset type:", error);
            Swal.fire(
                "Error!",
                "Unable to delete asset type. Please try again or contact support.",
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
            <BreadCumb pageList={["Asset Types", "List"]} />
            <PaginatedTable
                fetchPath="/asset-types"
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
                        key: "name",
                        label: "Asset Type",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <i className="bx bx-category text-primary me-2 fs-5"></i>
                                <div>
                                    <span
                                        className="text-primary cursor-pointer fw-semibold"
                                        style={{ textTransform: 'uppercase' }}
                                    >
                                        {row.name || "-"}
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
                        key: "category",
                        label: "Category Name",
                        className: "text-left",
                        style: { width: "250px" },
                        render: (row) => (
                            <div>
                                {row.category ? (
                                    <span
                                        className="text-muted text-truncate d-block"
                                        style={{ textTransform: 'uppercase' }}

                                        title={row.category.name}>
                                        {row.name.length > 50
                                            ? `${row.category.substring(0, 50)}...`
                                            : row.category.name}
                                    </span>
                                ) : (
                                    <span className="text-muted">No Category</span>
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
                                    data-bs-target="#assetTypeModal"
                                    title="Add new asset type"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Asset Type
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
            <AssetTypeModal />
        </AssetContext.Provider>
    );
};