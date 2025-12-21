import React, { useState } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";
import { useNavigate, useLocation } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { deleteApplication } from "./Queries";
import { ApplicationModal } from "./Modal";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const ApplicationsListPage = () => {
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (application) => {
        if (!application) {
            Swal.fire("Error!", "Unable to select this application.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete this application`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteApplication(application.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The application has been deleted successfully.",
                        "success"
                    );
                    setRefreshKey((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete application", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting application:", error);
            Swal.fire(
                "Error!",
                "Unable to delete application. Please try again or contact support.",
                "error"
            );
        }
    };

    const isSearchPage = location.pathname === "/training/search-applications";
    const breadcrumbPages = isSearchPage ? ["Training", "Search Applications"] : ["Training", "Applications"];

    return (
        <>
            <BreadCumb pageList={breadcrumbPages} />

            {/* Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold">
                                <i className={`bx ${isSearchPage ? 'bx-search' : 'bx-file-blank'} me-2`}></i>
                                {isSearchPage ? "Search Applications" : "Applications Management"}
                            </h4>
                            <p className="text-muted mb-0">
                                {isSearchPage ? "Search and filter training applications" : "Manage and monitor training applications"}
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            {hasAccess(user, [["add_application"]]) && (
                                <button
                                    className="btn btn-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#applicationModal"
                                    onClick={() => setSelectedApplication(null)}
                                >
                                    <i className="bx bx-plus me-2"></i>Add New Application
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Paginated Table */}
            <PaginatedTable
                fetchPath="/api/training/applications"
                title={isSearchPage ? "Search Results" : "Applications List"}
                isRefresh={refreshKey}
                isFullPath={true}
                columns={[
                    {
                        key: "student_name",
                        label: "Student",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => (
                            <div>
                                <h6 className="mb-0">
                                    {row.student?.first_name} {row.student?.last_name}
                                </h6>
                                <small className="text-muted">
                                    {row.student?.student_id}
                                </small>
                            </div>
                        ),
                    },
                    {
                        key: "reference_number",
                        label: "Reference",
                        className: "text-center",
                        style: { width: "150px" },
                        render: (row) => (
                            <code className="bg-light px-2 py-1 rounded">{row.reference_number}</code>
                        ),
                    },
                    {
                        key: "departments",
                        label: "Departments",
                        className: "text-start",
                        style: { width: "200px" },
                        render: (row) => {
                            const departments = row.department_details || [];
                            if (departments.length === 0) {
                                return <span className="text-muted">-</span>;
                            }
                            return (
                                <div className="d-flex flex-wrap gap-1">
                                    {departments.map((dept, idx) => (
                                        <span key={dept.uid || idx} className="badge bg-light text-dark border" title={dept.name}>
                                            {dept.name}
                                        </span>
                                    ))}
                                </div>
                            );
                        },
                    },
                    {
                        key: "type",
                        label: "Type",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => {
                            const typeConfig = {
                                'internship': { class: 'primary', label: 'Internship' },
                                'attachment': { class: 'info', label: 'Attachment' },
                                'practicum': { class: 'success', label: 'Practicum' },
                                'fieldwork': { class: 'warning', label: 'Fieldwork' },
                                'elective': { class: 'secondary', label: 'Elective' },
                            };
                            const type = typeConfig[row.type?.toLowerCase()] || { class: 'dark', label: row.type || '-' };
                            return <span className={`badge bg-${type.class}`}>{type.label}</span>;
                        },
                    },
                    {
                        key: "status",
                        label: "Status",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => {
                            const statusConfig = {
                                'pending': { class: 'warning', label: 'Pending' },
                                'approved': { class: 'success', label: 'Approved' },
                                'rejected': { class: 'danger', label: 'Rejected' },
                                'submitted': { class: 'info', label: 'Submitted' },
                            };
                            const status = statusConfig[row.status] || { class: 'secondary', label: row.status || 'Unknown' };
                            return <span className={`badge bg-${status.class}`}>{status.label}</span>;
                        },
                    },
                    {
                        key: "submission_date",
                        label: "Submitted",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => (
                            <small>{formatDate(row.submission_date || row.created_at, "DD/MM/YYYY")}</small>
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
                                {hasAccess(user, [["view_application", "add_application", "change_application"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-primary border-0"
                                        title="View"
                                        onClick={() => navigate(`/training/applications/${row.uid}`)}
                                    >
                                        <i className="bx bx-show"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["change_application"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-info border-0"
                                        title="Edit"
                                        onClick={() => {
                                            setSelectedApplication(row);
                                            const modal = document.getElementById("applicationModal");
                                            if (modal) {
                                                new (window.bootstrap || {}).Modal(modal).show();
                                            }
                                        }}
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_application"]]) && (
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
            <ApplicationModal
                application={selectedApplication}
                onSuccess={() => {
                    setRefreshKey((prev) => prev + 1);
                    setSelectedApplication(null);
                }}
                onClose={() => setSelectedApplication(null)}
            />
        </>
    );
};
