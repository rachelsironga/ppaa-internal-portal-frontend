import React, { useState, useEffect, useRef } from "react";
import "animate.css";
import { AssetContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { AssetLocationModal } from "./AssetLocationModal";
import { deleteLocation } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";

export const AssetLocationListPage = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const [tableData, setTableData] = useState([]);
    const tableRef = useRef(null);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (location) => {
        if (!location) {
            Swal.fire("Error!", "Unable to select this location.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete location: ${location.name}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteLocation(location.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The location has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete location", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting location:", error);
            Swal.fire(
                "Error!",
                "Unable to delete location. Please try again or contact support.",
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
            <BreadCumb pageList={["Asset Locations", "List"]} />
            <PaginatedTable
                fetchPath="/asset-locations"
                title="Asset Locations"
                onDataFetched={(data) => setTableData(data)}
                columns={[
                    {
                        key: "name",
                        label: "Location",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <i className="bx bx-map text-primary me-2 fs-5"></i>
                                <div>
                                    <span className="text-primary cursor-pointer fw-semibold">
                                        {row.name || "-"}
                                    </span>
                                    {row.code && (
                                        <small className="d-block text-muted fs-12">
                                            Code: {row.code}
                                        </small>
                                    )}
                                </div>
                            </div>
                        ),
                    },

                    {
                        key: "building",
                        label: "Building / Floor",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                {row.building_details ? (
                                    <div className="d-flex align-items-center">
                                        <i className="bx bx-building text-secondary me-1"></i>
                                        <div>
                                            <span className="text-dark fs-13">
                                                {row.building_details.name}
                                            </span>
                                            {row.floor_details && (
                                                <small className="text-muted d-block fs-12">
                                                    <i className="bx bx-layer me-1"></i>
                                                    {row.floor_details.name}
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-muted">-</span>
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
                        key: "description",
                        label: "Description",
                        className: "text-left",
                        style: { width: "250px" },
                        render: (row) => (
                            <div>
                                {row.description ? (
                                    <span className="text-muted text-truncate d-block" title={row.description}>
                                        {row.description.length > 80
                                            ? `${row.description.substring(0, 80)}...`
                                            : row.description}
                                    </span>
                                ) : (
                                    <span className="text-muted">No description</span>
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
                                        data-bs-target="#AssetLocationModal"
                                        title="Edit Location"
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
                                        title="Delete Location"
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
                        label: "Add Location",
                        render: () => (
                            hasAccess(user, [["add_asset"]]) && (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#AssetLocationModal"
                                    title="Add new location"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Location
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
            <AssetLocationModal />
        </AssetContext.Provider>
    );
};
