import React, { useState } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { deleteAllocation } from "./Queries";
import { AllocationModal } from "./Modal";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const AllocationsListPage = () => {
    const [selectedAllocation, setSelectedAllocation] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (allocation) => {
        if (!allocation) {
            Swal.fire("Error!", "Unable to select this allocation.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete this allocation`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteAllocation(allocation.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The allocation has been deleted successfully.",
                        "success"
                    );
                    setRefreshKey((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete allocation", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting allocation:", error);
            Swal.fire(
                "Error!",
                "Unable to delete allocation. Please try again or contact support.",
                "error"
            );
        }
    };

    return (
        <>
            <BreadCumb pageList={["Training", "Department Allocations"]} />

            {/* Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold">
                                <i className="bx bx-sitemap me-2"></i>Department Allocations
                            </h4>
                            <p className="text-muted mb-0">Manage student allocations to departments</p>
                        </div>
                        <div className="d-flex gap-2">
                            {hasAccess(user, [["add_departmentallocation"]]) && (
                                <button
                                    className="btn btn-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#allocationModal"
                                    onClick={() => setSelectedAllocation(null)}
                                >
                                    <i className="bx bx-plus me-2"></i>Add New Allocation
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Paginated Table */}
            <PaginatedTable
                fetchPath="/api/training/department-allocations"
                title="Department Allocations List"
                isRefresh={refreshKey}
                isFullPath={true}
                columns={[
                    {
                        key: "application",
                        label: "Application",
                        className: "fw-bold",
                        style: { width: "150px" },
                        render: (row) => (
                            <div>
                                <h6 className="mb-0">
                                    {row.application?.student?.first_name} {row.application?.student?.last_name}
                                </h6>
                                <small className="text-muted">
                                    {row.application?.reference_number}
                                </small>
                            </div>
                        ),
                    },
                    {
                        key: "department",
                        label: "Department",
                        className: "text-center",
                        style: { width: "150px" },
                        render: (row) => (
                            <span className="badge bg-light text-dark">{row.department?.name || "-"}</span>
                        ),
                    },
                    {
                        key: "supervisor",
                        label: "Supervisor",
                        className: "text-center",
                        style: { width: "150px" },
                        render: (row) => (
                            <span>{row.supervisor?.user?.full_name || "-"}</span>
                        ),
                    },
                    {
                        key: "start_date",
                        label: "Start Date",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <small>{formatDate(row.start_date, "DD/MM/YYYY")}</small>
                        ),
                    },
                    {
                        key: "end_date",
                        label: "End Date",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <small>{formatDate(row.end_date, "DD/MM/YYYY")}</small>
                        ),
                    },
                    {
                        key: "created_at",
                        label: "Created",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => (
                            <small>{formatDate(row.created_at, "DD/MM/YYYY")}</small>
                        ),
                    },
                    {
                        key: "actions",
                        label: "Actions",
                        className: "text-center",
                        style: { width: "140px" },
                        render: (row) => (
                            <div className="btn-group" role="group">
                                {hasAccess(user, [["view_departmentallocation", "add_departmentallocation", "change_departmentallocation"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-primary border-0"
                                        title="View"
                                        onClick={() => navigate(`/training/allocation/${row.uid}`)}
                                    >
                                        <i className="bx bx-show"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["change_departmentallocation"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-info border-0"
                                        title="Edit"
                                        onClick={() => {
                                            setSelectedAllocation(row);
                                            const modal = document.getElementById("allocationModal");
                                            if (modal) {
                                                new (window.bootstrap || {}).Modal(modal).show();
                                            }
                                        }}
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_departmentallocation"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-danger border-0"
                                        title="Delete"
                                        onClick={() => handleDelete(row)}
                                    >
                                        <i className="bx bx-trash"></i>
                                    </button>
                                )}
                            </div>
                        ),
                    },
                ]}
            />

            {/* Modals */}
            <AllocationModal
                allocation={selectedAllocation}
                onSuccess={() => {
                    setRefreshKey((prev) => prev + 1);
                    setSelectedAllocation(null);
                }}
                onClose={() => setSelectedAllocation(null)}
            />
        </>
    );
};
