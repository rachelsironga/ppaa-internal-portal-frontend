import React, { useState, useEffect, useRef } from "react";
import "animate.css";
import { SupplierContext } from "../../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { SupplierModal } from "./SupplierModal";
import { deleteSupplier } from "./Queries";
import showToast from "../../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";

export const SuppliersListPage = () => {
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

    const handleDelete = async (supplier) => {
        if (!supplier) {
            Swal.fire("Error!", "Unable to select this supplier.", "error");
            showToast("Unable to select supplier", "error", "Error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete supplier: ${supplier.name}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
                cancelButtonText: "Cancel",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteSupplier(supplier.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The Supplier has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    const errorMessage = result?.message || "Failed to delete supplier";
                    Swal.fire("Error!", errorMessage, "error");
                    showToast(errorMessage, "error", "Error");
                }
            }
        } catch (error) {
            console.error("Error deleting supplier:", error);
            const errorMessage = "Unable to delete supplier. Please try again or contact support.";
            Swal.fire("Error!", errorMessage, "error");
            showToast(errorMessage, "error", "Error");
        }
    };

    return (
        <SupplierContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Suppliers", "List"]} />
            <PaginatedTable
                fetchPath="/asset-suppliers"
                title="Suppliers"
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
                        label: "Supplier Name",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <i className="bx bx-store text-primary me-2 fs-5"></i>
                                <div>
                                    <span className="text-primary cursor-pointer fw-semibold"
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
                        key: "contact_email",
                        label: "Contact Email",
                        className: "text-left",
                        style: { width: "200px" },
                        render: (row) => (
                            <div>
                                {row.contact_email ? (
                                          <span className="text-muted d-block "
                                      >
                                          {row.contact_email || "-"}
                                      </span>
                                  
                                ) : (
                                    <span className="text-muted">No Email</span>
                                )}
                            </div>
                        ),
                    }, 
                    {
                        key: "support_phone",
                        label: "Phone Number",
                        className: "text-left",
                        style: { width: "200px" },
                        render: (row) => (
                            <div>
                                {row.support_phone ? (
                                          <span className="text-muted d-block "
                                      >
                                          {row.support_phone || "-"}
                                      </span>
                                  
                                ) : (
                                    <span className="text-muted">No Phone Number</span>
                                )}
                            </div>
                        ),
                    },

                    {
                        key: "website",
                        label: "Website",
                        className: "text-left",
                        style: { width: "200px" },
                        render: (row) => (
                            <div>
                                {row.website ? (
                                    <a 
                                        href={row.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-primary text-decoration-none"
                                    >
                                        {row.website}
                                    </a>
                                ) : (
                                    <span className="text-muted">No Website</span>
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
                                {hasAccess(user, [["change_supplier"]]) && (
                                    <button
                                        aria-label="Edit"
                                        type="button"
                                        className="btn btn-sm btn-outline-primary border-0"
                                        onClick={() => setSelectedObj(row)}
                                        data-bs-toggle="modal"
                                        data-bs-target="#suppliersModal"
                                        title="Edit Supplier"
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}

                                {hasAccess(user, [["delete_supplier"]]) && (
                                    <button
                                        aria-label="Delete"
                                        type="button"
                                        className="btn btn-sm btn-outline-danger border-0"
                                        onClick={() => handleDelete(row)}
                                        title="Delete Supplier"
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
                        label: "Add Supplier",
                        render: () => (
                            hasAccess(user, [["add_supplier"]]) && (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#suppliersModal"
                                    title="Add Supplier"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Supplier
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
            <SupplierModal />
        </SupplierContext.Provider>
    );
};
