import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import "animate.css";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { deleteStudent } from "./Queries";
import { StudentModal } from "./Modal";
import { ImportStudentModal } from "./ImportModal";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const StudentsListPage = () => {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (student) => {
        if (!student) {
            Swal.fire("Error!", "Unable to select this student.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete ${student.first_name} ${student.last_name}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteStudent(student.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The student has been deleted successfully.",
                        "success"
                    );
                    setRefreshKey((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete student", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting student:", error);
            Swal.fire(
                "Error!",
                "Unable to delete student. Please try again or contact support.",
                "error"
            );
        }
    };

    return (
        <>
            <BreadCumb pageList={["Training", "Students"]} />

            {/* Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold">
                                <i className="bx bx-user-circle me-2"></i>Students Management
                            </h4>
                            <p className="text-muted mb-0">Manage and monitor training students</p>
                        </div>
                        <div className="d-flex gap-2">
                            {hasAccess(user, [["add_student"]]) && (
                                <>
                                    <button
                                        className="btn btn-outline-info"
                                        data-bs-toggle="modal"
                                        data-bs-target="#importStudentModal"
                                    >
                                        <i className="bx bx-upload me-2"></i>Import
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#studentModal"
                                        onClick={() => setSelectedStudent(null)}
                                    >
                                        <i className="bx bx-plus me-2"></i>Add New Student
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Paginated Table */}
            <PaginatedTable
                fetchPath="/api/training/students"
                title="Students List"
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
                                        {row.sex === 'M' ? 'Male' : row.sex === 'F' ? 'Female' : '-'}
                                    </small>
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: "student_id",
                        label: "Student ID",
                        className: "text-center",
                        style: { width: "140px" },
                        render: (row) => (
                            <code className="bg-light px-2 py-1 rounded">{row.student_id}</code>
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
                        key: "primary_phone",
                        label: "Phone",
                        className: "text-center",
                        style: { width: "140px" },
                        render: (row) => (
                            row.primary_phone ? (
                                <a href={`tel:${row.primary_phone}`}>{row.primary_phone}</a>
                            ) : (
                                <span className="text-muted">-</span>
                            )
                        ),
                    },
                    {
                        key: "type",
                        label: "Type",
                        className: "text-center",
                        style: { width: "100px" },
                        render: (row) => (
                            row.type === 'LC' ? (
                                <span className="badge bg-success">Local</span>
                            ) : (
                                <span className="badge bg-info">Foreign</span>
                            )
                        ),
                    },
                    {
                        key: "are_you_currently_studying",
                        label: "Status",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            row.are_you_currently_studying ? (
                                <span className="badge bg-success">
                                    <i className="bx bx-check me-1"></i>Active
                                </span>
                            ) : (
                                <span className="badge bg-secondary">Inactive</span>
                            )
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
                                {hasAccess(user, [["view_student", "add_student", "change_student"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-primary border-0"
                                        title="View"
                                        onClick={() => navigate(`/training/students/${row.uid}`)}
                                    >
                                        <i className="bx bx-show"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["change_student"]]) && (
                                    <button
                                        className="btn btn-sm btn-outline-info border-0"
                                        title="Edit"
                                        onClick={() => {
                                            setSelectedStudent(row);
                                            const modal = document.getElementById("studentModal");
                                            if (modal) {
                                                new (window.bootstrap || {}).Modal(modal).show();
                                            }
                                        }}
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_student"]]) && (
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
            <StudentModal
                student={selectedStudent}
                onSuccess={() => {
                    setRefreshKey((prev) => prev + 1);
                    setSelectedStudent(null);
                }}
                onClose={() => setSelectedStudent(null)}
            />
            <ImportStudentModal onSuccess={() => setRefreshKey((prev) => prev + 1)} />
        </>
    );
};
