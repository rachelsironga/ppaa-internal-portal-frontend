import React, { useState } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { deleteMOU } from "./Queries";
import { MOUModal } from "./Modal";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const MOUsListPage = () => {
    const [selectedMOU, setSelectedMOU] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (mou) => {
        if (!mou) {
            Swal.fire("Error!", "Unable to select this MOU.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete MOU ${mou.mou_number}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteMOU(mou.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The MOU has been deleted successfully.",
                        "success"
                    );
                    setRefreshKey((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete MOU", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting MOU:", error);
            Swal.fire(
                "Error!",
                "Unable to delete MOU. Please try again or contact support.",
                "error"
            );
        }
    };

    const getStatusBadge = (row) => {
        // Note: expiration_status is calculated on backend
        // We'll check dates on frontend as fallback
        const today = new Date();
        const endDate = new Date(row.end_date);
        const daysRemaining = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));

        let statusClass = "bg-success";
        let statusLabel = "Active";

        if (daysRemaining < 0) {
            statusClass = "bg-danger";
            statusLabel = "Expired";
        } else if (daysRemaining <= 30) {
            statusClass = "bg-warning";
            statusLabel = "Expiring Soon";
        }

        return <span className={`badge ${statusClass}`}>{statusLabel}</span>;
    };

    return (
        <>
            <BreadCumb pageList={["Training", "MOU Management"]} />

            {/* Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold">
                                <i className="bx bx-file-doc me-2"></i>MOU Management
                            </h4>
                            <p className="text-muted mb-0">Manage Memorandum of Understanding with institutions</p>
                        </div>
                        <div className="d-flex gap-2">
                            {hasAccess(user, [["add_mou"]]) && (
                                <button
                                    className="btn btn-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#mouModal"
                                    onClick={() => setSelectedMOU(null)}
                                >
                                    <i className="bx bx-plus me-2"></i>Add New MOU
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Paginated Table */}
            <PaginatedTable
                fetchPath="/api/training/mous"
                title="MOUs List"
                isRefresh={refreshKey}
                isFullPath={true}
                columns={[
                    {
                        key: "mou_number",
                        label: "MOU Number",
                        className: "fw-bold",
                        style: { width: "150px" },
                        render: (row) => (
                            <code className="bg-light px-2 py-1 rounded">{row.mou_number}</code>
                        ),
                    },
                    {
                        key: "institution",
                        label: "Institution",
                        className: "text-start",
                        style: { width: "200px" },
                        render: (row) => (
                            <div>
                                <h6 className="mb-0">{row.institution?.name || "-"}</h6>
                                <small className="text-muted">{row.institution?.location || "-"}</small>
                            </div>
                        ),
                    },
                    {
                        key: "start_date",
                        label: "Start Date",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => (
                            <small>{formatDate(row.start_date, "DD/MM/YYYY")}</small>
                        ),
                    },
                    {
                        key: "end_date",
                        label: "End Date",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => (
                            <small>{formatDate(row.end_date, "DD/MM/YYYY")}</small>
                        ),
                    },
                    {
                        key: "status",
                        label: "Status",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => getStatusBadge(row),
                    },
                    {
                        key: "signed_date",
                        label: "Signed",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => (
                            <small>{formatDate(row.signed_date, "DD/MM/YYYY")}</small>
                        ),
                    },
                    {
                        key: "actions",
                        label: "Actions",
                        className: "text-center",
                        style: { width: "140px" },
                        render: (row) => (
                            <div className="btn-group" role="group">
                                {hasAccess(user, [["view_mou", "add_mou", "change_mou"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-primary border-0"
                                        title="View"
                                        onClick={() => navigate(`/training/mous/${row.uid}`)}
                                    >
                                        <i className="bx bx-show"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["change_mou"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-info border-0"
                                        title="Edit"
                                        onClick={() => {
                                            setSelectedMOU(row);
                                            const modal = document.getElementById("mouModal");
                                            if (modal) {
                                                new (window.bootstrap || {}).Modal(modal).show();
                                            }
                                        }}
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_mou"]]) && (
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
            <MOUModal
                mou={selectedMOU}
                onSuccess={() => {
                    setRefreshKey((prev) => prev + 1);
                    setSelectedMOU(null);
                }}
                onClose={() => setSelectedMOU(null)}
            />
        </>
    );
};
