import React, { useState } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { deleteSupervisor } from "./Queries";
import { SupervisorModal } from "./Modal";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const SupervisorsListPage = () => {
    const [selectedSupervisor, setSelectedSupervisor] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (supervisor) => {
        if (!supervisor) {
            Swal.fire("Error!", "Unable to select this supervisor.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete this supervisor`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteSupervisor(supervisor.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The supervisor has been deleted successfully.",
                        "success"
                    );
                    setRefreshKey((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete supervisor", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting supervisor:", error);
            Swal.fire(
                "Error!",
                "Unable to delete supervisor. Please try again or contact support.",
                "error"
            );
        }
    };

    return (
        <>
            <BreadCumb pageList={["Training", "Supervisors"]} />

            {/* Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold">
                                <i className="bx bx-user-check me-2"></i>Supervisors Management
                            </h4>
                            <p className="text-muted mb-0">Manage and monitor training supervisors</p>
                        </div>
                        <div className="d-flex gap-2">
                            {hasAccess(user, [["add_supervisor"]]) && (
                                <button
                                    className="btn btn-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#supervisorModal"
                                    onClick={() => setSelectedSupervisor(null)}
                                >
                                    <i className="bx bx-plus me-2"></i>Add New Supervisor
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Paginated Table */}
            <PaginatedTable
                fetchPath="/api/training/supervisors"
                title="Supervisors List"
                isRefresh={refreshKey}
                isFullPath={true}
                columns={[
                    {
                        key: "full_name",
                        label: "Full Name",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                {row.profile_picture ? (
                                    <img
                                        src={row.profile_picture}
                                        alt={row.first_name}
                                        className="rounded-circle me-2"
                                        width="32"
                                        height="32"
                                    />
                                ) : (
                                    <div className="avatar avatar-sm me-2">
                                        <span className="avatar-initial rounded-circle bg-label-primary">
                                            {row.first_name?.[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h6 className="mb-0">
                                        {row.full_name || `${row.first_name} ${row.last_name}`}
                                    </h6>
                                    <small className="text-muted">
                                        {row.user_guid ? `GUID: ${row.user_guid}` : '-'}
                                    </small>
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: "user_guid",
                        label: "User GUID",
                        className: "text-center",
                        style: { width: "200px" },
                        render: (row) => (
                            <code className="bg-light px-2 py-1 rounded">{row.user_guid}</code>
                        ),
                    },
                    {
                        key: "department",
                        label: "Department",
                        className: "text-left",
                        style: { width: "200px" },
                        render: (row) => (
                            row.department_name ? (
                                <span>{row.department_name}</span>
                            ) : (
                                <span className="text-muted">-</span>
                            )
                        ),
                    },
                    {
                        key: "email",
                        label: "Email",
                        className: "text-left",
                        style: { width: "220px" },
                        render: (row) => (
                            row.email ? (
                                <a href={`mailto:${row.email}`} className="text-truncate">
                                    {row.email}
                                </a>
                            ) : (
                                <span className="text-muted">-</span>
                            )
                        ),
                    },
                    {
                        key: "description",
                        label: "Description",
                        className: "text-left",
                        style: { width: "200px" },
                        render: (row) => (
                            row.description ? (
                                <span className="text-truncate d-inline-block" style={{ maxWidth: "180px" }}>
                                    {row.description}
                                </span>
                            ) : (
                                <span className="text-muted">-</span>
                            )
                        ),
                    },
                    {
                        key: "is_active",
                        label: "Status",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            row.is_active ? (
                                <span className="badge bg-success">
                                    <i className="bx bx-check me-1"></i>Active
                                </span>
                            ) : (
                                <span className="badge bg-secondary">Inactive</span>
                            )
                        ),
                    },
                    {
                        key: "actions",
                        label: "Actions",
                        className: "text-center",
                        style: { width: "140px" },
                        render: (row) => (
                            <div className="btn-group" role="group">
                                {hasAccess(user, [["view_supervisor", "add_supervisor", "change_supervisor"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-primary border-0"
                                        title="View"
                                        onClick={() => navigate(`/training/supervisors/${row.uid}`)}
                                    >
                                        <i className="bx bx-show"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["change_supervisor"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-info border-0"
                                        title="Edit"
                                        onClick={() => {
                                            setSelectedSupervisor(row);
                                            const modal = document.getElementById("supervisorModal");
                                            if (modal) {
                                                new (window.bootstrap || {}).Modal(modal).show();
                                            }
                                        }}
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_supervisor"]]) && (
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

            {/* Modal */}
            <SupervisorModal
                supervisor={selectedSupervisor}
                onSuccess={() => {
                    setRefreshKey((prev) => prev + 1);
                    setSelectedSupervisor(null);
                }}
                onClose={() => setSelectedSupervisor(null)}
            />
        </>
    );
};