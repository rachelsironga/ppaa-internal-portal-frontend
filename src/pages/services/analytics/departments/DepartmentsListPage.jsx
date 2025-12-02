import React, { useState, createContext } from "react";
import "animate.css";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import Swal from "sweetalert2";
import { DepartmentModal } from "./DepartmentModal";
import { deleteDepartment } from "./Queries";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";

export const DepartmentContext = createContext();

export const DepartmentsListPage = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (department) => {
        if (!department) {
            Swal.fire("Error!", "Unable to select this department.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete department: ${department.name} (${department.code})`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteDepartment(department.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The department has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete department", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting department:", error);
            Swal.fire(
                "Error!",
                "Unable to delete department. Please try again or contact support.",
                "error"
            );
        }
    };

    return (
        <DepartmentContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Analytics", "Departments"]} />
            <PaginatedTable
                fetchPath="/departments"
                title="List of Departments"
                columns={[
                    {
                        key: "name",
                        label: "Department Name",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <i className="bx bx-buildings text-primary me-2 fs-5"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <span className="text-dark fw-semibold">
                                        {row.name || "-"}
                                    </span>
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: "code",
                        label: "Department Code",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <span className="badge bg-light text-dark border">
                                {row.code || "-"}
                            </span>
                        ),
                    },
                    {
                        key: "directory",
                        label: "Directory",
                        className: "text-center",
                        style: { width: "150px" },
                        render: (row) => (
                            <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                                <i className="bx bx-folder me-1"></i>
                                {row.directory?.name || "N/A"}
                            </span>
                        ),
                    },
                    {
                        key: "is_active",
                        label: "Status",
                        className: "text-center",
                        style: { width: "100px" },
                        render: (row) => {
                            const isActive = row.is_active;
                            return (
                                <span className={`badge bg-${isActive ? 'success' : 'secondary'} bg-opacity-10 text-${isActive ? 'success' : 'secondary'} border border-${isActive ? 'success' : 'secondary'} border-opacity-25`}>
                                    {isActive ? "✓ Active" : "Inactive"}
                                </span>
                            );
                        },
                    },
                    {
                        key: "actions",
                        label: "Actions",
                        style: { width: "120px" },
                        className: "text-center",
                        render: (row) => (
                            <div className="btn-group">
                                {hasAccess(user, [["can_add_department"]]) && (
                                    <button
                                        aria-label="Edit"
                                        type="button"
                                        className="btn btn-sm btn-outline-primary border-0"
                                        onClick={() => {
                                            setSelectedObj(row);
                                        }}
                                        data-bs-toggle="modal"
                                        data-bs-target="#departmentModal"
                                        title="Edit Department"
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["can_delete_department"]]) && (
                                    <button
                                        aria-label="Delete"
                                        type="button"
                                        className="btn btn-sm btn-outline-danger border-0"
                                        onClick={() => handleDelete(row)}
                                        title="Delete Department"
                                    >
                                        <i className="bx bx-trash"></i>
                                    </button>
                                )}
                            </div>
                        ),
                    },
                ]}
                buttons={
                    hasAccess(user, [["can_add_department"]]) ? [
                        {
                            label: "Add Department",
                            render: () => (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#departmentModal"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Department
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
            <DepartmentModal />
        </DepartmentContext.Provider>
    );
};
