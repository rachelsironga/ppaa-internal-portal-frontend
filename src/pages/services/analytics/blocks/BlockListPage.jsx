import React, { useState, createContext } from "react";
import "animate.css";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import Swal from "sweetalert2";
import { BlockModal } from "./BlockModal";
import { deleteBlock } from "./Queries";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";

export const BlockContext = createContext();

export const BlockListPage = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (block) => {
        if (!block) {
            Swal.fire("Error!", "Unable to select this block.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete block: ${block.name} (${block.code})`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteBlock(block.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The block has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete block", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting block:", error);
            Swal.fire(
                "Error!",
                "Unable to delete block. Please try again or contact support.",
                "error"
            );
        }
    };

    return (
        <BlockContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Analytics", "Blocks"]} />
            <PaginatedTable
                fetchPath="/analytical/blocks"
                title="List of Blocks"
                columns={[
                    {
                        key: "name",
                        label: "Block Name",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <i className="bx bx-building text-primary me-2 fs-5"></i>
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
                        label: "Block Code",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <span className="badge bg-light text-dark border">
                                {row.code || "-"}
                            </span>
                        ),
                    },
                    {
                        key: "location",
                        label: "Location",
                        className: "text-center",
                        style: { width: "140px" },
                        render: (row) => {
                            const locationConfig = {
                                Upanga: { class: "info", icon: "📍" },
                                Mloganzila: { class: "success", icon: "📍" },
                            };
                            const config = locationConfig[row.location] || { class: "secondary", icon: "📍" };
                            return (
                                <span className={`badge bg-${config.class} bg-opacity-10 text-${config.class} border border-${config.class} border-opacity-25`}>
                                    {config.icon} {row.location || "N/A"}
                                </span>
                            );
                        },
                    },
                    {
                        key: "description",
                        label: "Description",
                        style: { width: "250px" },
                        render: (row) => (
                            <span className="text-muted" title={row.description}>
                                {row.description 
                                    ? (row.description.length > 50 
                                        ? `${row.description.substring(0, 50)}...` 
                                        : row.description)
                                    : "-"
                                }
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
                                {hasAccess(user, [["change_block"]]) && (
                                    <button
                                        aria-label="Edit"
                                        type="button"
                                        className="btn btn-sm btn-outline-primary border-0"
                                        onClick={() => {
                                            setSelectedObj(row);
                                        }}
                                        data-bs-toggle="modal"
                                        data-bs-target="#blockModal"
                                        title="Edit Block"
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_block"]]) && (
                                    <button
                                        aria-label="Delete"
                                        type="button"
                                        className="btn btn-sm btn-outline-danger border-0"
                                        onClick={() => handleDelete(row)}
                                        title="Delete Block"
                                    >
                                        <i className="bx bx-trash"></i>
                                    </button>
                                )}
                            </div>
                        ),
                    },
                ]}
                buttons={
                    hasAccess(user, [["add_block"]]) ? [
                        {
                            label: "Add Block",
                            render: () => (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#blockModal"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Block
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
                        group: "location",
                        label: "Location",
                        placeholder: "Filter by Location",
                        options: [
                            { value: "Upanga", label: "Upanga" },
                            { value: "Mloganzila", label: "Mloganzila" }
                        ]
                    },
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
            <BlockModal />
        </BlockContext.Provider>
    );
};
