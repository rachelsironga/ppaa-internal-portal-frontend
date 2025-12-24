import React, { useState } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { deleteTrainingBatch } from "./Queries";
import { TrainingBatchModal } from "./Modal";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const BatchTrainingsListPage = () => {
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (batch) => {
        if (!batch) {
            Swal.fire("Error!", "Unable to select this training batch.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete training batch ${batch.batch_number}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteTrainingBatch(batch.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The training batch has been deleted successfully.",
                        "success"
                    );
                    setRefreshKey((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete training batch", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting training batch:", error);
            Swal.fire(
                "Error!",
                "Unable to delete training batch. Please try again or contact support.",
                "error"
            );
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            planned: "bg-warning",
            ongoing: "bg-info",
            completed: "bg-success",
            cancelled: "bg-danger",
        };
        return badges[status] || "bg-secondary";
    };

    return (
        <>
            <BreadCumb pageList={["Training", "Batch Trainings"]} />

            {/* Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold">
                                <i className="bx bx-group me-2"></i>Batch Trainings
                            </h4>
                            <p className="text-muted mb-0">Manage training batches and batch allocations</p>
                        </div>
                        <div className="d-flex gap-2">
                            {hasAccess(user, [["add_trainingbatch"]]) && (
                                <button
                                    className="btn btn-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#trainingBatchModal"
                                    onClick={() => setSelectedBatch(null)}
                                >
                                    <i className="bx bx-plus me-2"></i>Add New Batch
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Paginated Table */}
            <PaginatedTable
                fetchPath="/api/training/training-batches"
                title="Training Batches List"
                isRefresh={refreshKey}
                isFullPath={true}
                columns={[
                    {
                        key: "batch_number",
                        label: "Batch Number",
                        className: "fw-bold",
                        style: { width: "140px" },
                        render: (row) => (
                            <div>
                                <h6 className="mb-0">{row.batch_number}</h6>
                                <small className="text-muted">
                                    {row.mou_number || "N/A"}
                                </small>
                            </div>
                        ),
                    },
                    {
                        key: "institution_name",
                        label: "Institution",
                        className: "text-start",
                        style: { width: "180px" },
                        render: (row) => (
                            <small>{row.institution_name || "-"}</small>
                        ),
                    },
                    {
                        key: "number_of_students",
                        label: "Students",
                        className: "text-center",
                        style: { width: "100px" },
                        render: (row) => (
                            <span className="badge bg-light text-dark">{row.number_of_students}</span>
                        ),
                    },
                    {
                        key: "training_start_date",
                        label: "Start Date",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <small>{formatDate(row.training_start_date, "DD/MM/YYYY")}</small>
                        ),
                    },
                    {
                        key: "training_end_date",
                        label: "End Date",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <small>{formatDate(row.training_end_date, "DD/MM/YYYY")}</small>
                        ),
                    },
                    {
                        key: "status",
                        label: "Status",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => (
                            <span className={`badge ${getStatusBadge(row.status)}`}>
                                {row.status_display || row.status}
                            </span>
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
                                {hasAccess(user, [["view_trainingbatch", "add_trainingbatch", "change_trainingbatch"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-primary border-0"
                                        title="View"
                                        onClick={() => navigate(`/training/batch-trainings/${row.uid}`)}
                                    >
                                        <i className="bx bx-show"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["change_trainingbatch"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-info border-0"
                                        title="Edit"
                                        onClick={() => {
                                            setSelectedBatch(row);
                                            const modal = document.getElementById("trainingBatchModal");
                                            if (modal) {
                                                new (window.bootstrap || {}).Modal(modal).show();
                                            }
                                        }}
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_trainingbatch"]]) && (
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
            <TrainingBatchModal
                batch={selectedBatch}
                onSuccess={() => {
                    setRefreshKey((prev) => prev + 1);
                    setSelectedBatch(null);
                }}
                onClose={() => setSelectedBatch(null)}
            />
        </>
    );
};
