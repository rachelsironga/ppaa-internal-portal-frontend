import React, { useState, createContext } from "react";
import "animate.css";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import Swal from "sweetalert2";
import { ClinicModal } from "./ClinicModal";
import { ClinicImportModal } from "./ClinicImportModal";
import { deleteClinic } from "./Queries";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";

export const ClinicContext = createContext();

export const ClinicListPage = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (clinic) => {
        if (!clinic) {
            Swal.fire("Error!", "Unable to select this clinic.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete clinic: ${clinic.name} (${clinic.code})`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteClinic(clinic.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The clinic has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete clinic", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting clinic:", error);
            Swal.fire(
                "Error!",
                "Unable to delete clinic. Please try again or contact support.",
                "error"
            );
        }
    };

    return (
        <ClinicContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Analytics", "Clinics"]} />
            <PaginatedTable
                fetchPath="/analytical/clinics"
                title="List of Clinics"
                columns={[
                    {
                        key: "name",
                        label: "Clinic Name",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <i className="bx bx-clinic text-success me-2 fs-5"></i>
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
                        label: "Clinic Code",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <span className="badge bg-light text-dark border">
                                {row.code || "-"}
                            </span>
                        ),
                    },
                    {
                        key: "block_name",
                        label: "Block",
                        className: "text-center",
                        style: { width: "150px" },
                        render: (row) => (
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
                                <i className="bx bx-building me-1"></i>
                                {row.block_name || "N/A"}
                            </span>
                        ),
                    },
                    {
                        key: "department_name",
                        label: "Department",
                        className: "text-center",
                        style: { width: "150px" },
                        render: (row) => (
                            <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                                {row.department_name || "N/A"}
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
                                {hasAccess(user, [["change_clinic"]]) && (
                                    <button
                                        aria-label="Edit"
                                        type="button"
                                        className="btn btn-sm btn-outline-primary border-0"
                                        onClick={() => {
                                            setSelectedObj(row);
                                        }}
                                        data-bs-toggle="modal"
                                        data-bs-target="#clinicModal"
                                        title="Edit Clinic"
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_clinic"]]) && (
                                    <button
                                        aria-label="Delete"
                                        type="button"
                                        className="btn btn-sm btn-outline-danger border-0"
                                        onClick={() => handleDelete(row)}
                                        title="Delete Clinic"
                                    >
                                        <i className="bx bx-trash"></i>
                                    </button>
                                )}
                            </div>
                        ),
                    },
                ]}
                buttons={[
                    ...(hasAccess(user, [["add_clinic"]]) ? [
                        {
                            label: "Add Clinic",
                            render: () => (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#clinicModal"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Clinic
                                </button>
                            ),
                        },
                    ] : []),
                    ...(hasAccess(user, [["import_clinics"]]) ? [
                        {
                            label: "Import Clinics",
                            render: () => (
                                <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm ms-2"
                                    data-bs-toggle="modal"
                                    data-bs-target="#clinicImportModal"
                                >
                                    <i className="bx bx-import me-1"></i> Import
                                </button>
                            ),
                        },
                    ] : []),
                ]}
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
            <ClinicModal />
            <ClinicImportModal />
        </ClinicContext.Provider>
    );
};
