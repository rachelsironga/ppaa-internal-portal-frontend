import React, { useState, createContext } from "react";
import "animate.css";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import Swal from "sweetalert2";
import { AttendanceModal } from "./AttendanceModal";
import { deleteAttendance, processAttendance } from "./Queries";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import showToast from "../../../../helpers/ToastHelper";

export const AttendanceContext = createContext();

export const AttendanceListPage = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (attendance) => {
        if (!attendance) {
            Swal.fire("Error!", "Unable to select this attendance record.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete attendance record for: ${attendance.date}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteAttendance(attendance.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The attendance record has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete attendance", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting attendance:", error);
            Swal.fire(
                "Error!",
                "Unable to delete attendance record. Please try again or contact support.",
                "error"
            );
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleProcess = async (attendance) => {
        if (!attendance) {
            Swal.fire("Error!", "Unable to select this attendance record.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Process Attendance?",
                text: `Process the attendance report for: ${formatDate(attendance.date)}?`,
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#00853f",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, process it!",
            });

            if (confirmation.isConfirmed) {
                Swal.fire({
                    title: 'Processing...',
                    text: 'Please wait while the report is being processed.',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const result = await processAttendance(attendance.uid);
                
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Processed!",
                        result.message || "Attendance processed successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to process attendance", "error");
                }
            }
        } catch (error) {
            console.error("Error processing attendance:", error);
            Swal.fire(
                "Error!",
                "Unable to process attendance. Please try again or contact support.",
                "error"
            );
        }
    };

    return (
        <AttendanceContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Analytics", "Attendances"]} />
            <PaginatedTable
                fetchPath="/analytical/attendances"
                title="Attendance Records"
                columns={[
                    {
                        key: "date",
                        label: "Date",
                        className: "fw-bold",
                        style: { width: "150px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <i className="bx bx-calendar text-primary me-2 fs-5"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <span className="text-dark fw-semibold">
                                        {formatDate(row.date)}
                                    </span>
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: "grand_total_patients",
                        label: "Total Patients",
                        className: "text-center",
                        style: { width: "130px" },
                        render: (row) => (
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fs-6">
                                {row.grand_total_patients?.toLocaleString() || 0}
                            </span>
                        ),
                    },
                    {
                        key: "total_new_patients",
                        label: "New Patients",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                                <i className="bx bx-user-plus me-1"></i>
                                {row.total_new_patients?.toLocaleString() || 0}
                            </span>
                        ),
                    },
                    {
                        key: "total_follow_up_patients",
                        label: "Follow-up",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                <i className="bx bx-user-check me-1"></i>
                                {row.total_follow_up_patients?.toLocaleString() || 0}
                            </span>
                        ),
                    },
                    {
                        key: "processed_date",
                        label: "Status",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => {
                            const isProcessed = !!row.processed_date;
                            return (
                                <span className={`badge bg-${isProcessed ? 'success' : 'warning'} bg-opacity-10 text-${isProcessed ? 'success' : 'warning'} border border-${isProcessed ? 'success' : 'warning'} border-opacity-25`}>
                                    {isProcessed ? "✓ Processed" : "⏳ Pending"}
                                </span>
                            );
                        },
                    },
                    {
                        key: "is_active",
                        label: "Active",
                        className: "text-center",
                        style: { width: "80px" },
                        render: (row) => {
                            const isActive = row.is_active;
                            return (
                                <span className={`badge bg-${isActive ? 'success' : 'secondary'}`}>
                                    {isActive ? "Yes" : "No"}
                                </span>
                            );
                        },
                    },
                    {
                        key: "actions",
                        label: "Actions",
                        style: { width: "180px" },
                        className: "text-center",
                        render: (row) => (
                            <div className="btn-group">
                                {!row.processed_date && hasAccess(user, [["change_attendance"]]) && (
                                    <button
                                        aria-label="Process"
                                        type="button"
                                        className="btn btn-sm btn-outline-success border-0"
                                        onClick={() => handleProcess(row)}
                                        title="Process Report"
                                    >
                                        <i className="bx bx-play-circle"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_attendance"]]) && (
                                    <button
                                        aria-label="Delete"
                                        type="button"
                                        className="btn btn-sm btn-outline-danger border-0"
                                        onClick={() => handleDelete(row)}
                                        title="Delete Attendance"
                                    >
                                        <i className="bx bx-trash"></i>
                                    </button>
                                )}
                            </div>
                        ),
                    },
                ]}
                buttons={
                    hasAccess(user, [["add_attendance"]]) ? [
                        {
                            label: "Add Attendance",
                            render: () => (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#attendanceModal"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Attendance
                                </button>
                            ),
                        },
                    ] : []
                }
                onSelect={(row) => {
                    setSelectedObj(row);
                }}
                isRefresh={tableRefresh}
                filterGroups={[
                    {
                        group: "is_active",
                        label: "Status",
                        placeholder: "Filter by Status",
                        options: [
                            { value: "true", label: "Active" },
                            { value: "false", label: "Inactive" }
                        ]
                    }
                ]}
            />
            <AttendanceModal />
        </AttendanceContext.Provider>
    );
};
