import React, { useState } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { deleteInstitution } from "./Queries";
import { InstitutionModal } from "./Modal";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const InstitutionsListPage = () => {
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (institution) => {
        if (!institution) {
            Swal.fire("Error!", "Unable to select this institution.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete ${institution.name}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteInstitution(institution.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The institution has been deleted successfully.",
                        "success"
                    );
                    setRefreshKey((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete institution", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting institution:", error);
            Swal.fire(
                "Error!",
                "Unable to delete institution. Please try again or contact support.",
                "error"
            );
        }
    };

    return (
        <>
            <BreadCumb pageList={["Training", "Institutions"]} />

            {/* Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold">
                                <i className="bx bx-building me-2"></i>Institutions
                            </h4>
                            <p className="text-muted mb-0">Manage training institutions and partner organizations</p>
                        </div>
                        <div className="d-flex gap-2">
                            {hasAccess(user, [["add_institution"]]) && (
                                <button
                                    className="btn btn-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#institutionModal"
                                    onClick={() => setSelectedInstitution(null)}
                                >
                                    <i className="bx bx-plus me-2"></i>Add New Institution
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Paginated Table */}
            <PaginatedTable
                fetchPath="/api/training/institutions"
                title="Institutions List"
                isRefresh={refreshKey}
                isFullPath={true}
                columns={[
                    {
                        key: "name",
                        label: "Name",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => (
                            <div>
                                <h6 className="mb-0">{row.name}</h6>
                                <small className="text-muted">
                                    {row.institution_code}
                                </small>
                            </div>
                        ),
                    },
                    {
                        key: "institution_type",
                        label: "Type",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => (
                            <span className="badge bg-light text-dark">{row.institution_type || "-"}</span>
                        ),
                    },
                    {
                        key: "country",
                        label: "Country",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <small>{row.country?.name || "-"}</small>
                        ),
                    },
                    {
                        key: "contact_person",
                        label: "Contact Person",
                        className: "text-center",
                        style: { width: "150px" },
                        render: (row) => (
                            <small>{row.contact_person || "-"}</small>
                        ),
                    },
                    {
                        key: "contact_email",
                        label: "Email",
                        className: "text-center",
                        style: { width: "180px" },
                        render: (row) => (
                            <small>
                                {row.contact_email ? (
                                    <a href={`mailto:${row.contact_email}`}>{row.contact_email}</a>
                                ) : (
                                    "-"
                                )}
                            </small>
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
                                {hasAccess(user, [["view_institution", "add_institution", "change_institution"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-primary border-0"
                                        title="View"
                                        onClick={() => navigate(`/training/institutions/${row.uid}`)}
                                    >
                                        <i className="bx bx-show"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["change_institution"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-info border-0"
                                        title="Edit"
                                        onClick={() => {
                                            setSelectedInstitution(row);
                                            const modal = document.getElementById("institutionModal");
                                            if (modal) {
                                                new (window.bootstrap || {}).Modal(modal).show();
                                            }
                                        }}
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_institution"]]) && (
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
            <InstitutionModal
                institution={selectedInstitution}
                onSuccess={() => {
                    setRefreshKey((prev) => prev + 1);
                    setSelectedInstitution(null);
                }}
                onClose={() => setSelectedInstitution(null)}
            />
        </>
    );
};
