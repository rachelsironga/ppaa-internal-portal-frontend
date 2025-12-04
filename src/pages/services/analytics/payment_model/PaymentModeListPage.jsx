import React, { useState, createContext } from "react";
import "animate.css";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import Swal from "sweetalert2";
import { PaymentModeModal } from "./PaymentModeModal";
import { deletePaymentMode } from "./Queries";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";

export const PaymentModeContext = createContext();

export const PaymentModeListPage = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const user = useSelector((state) => state.userReducer?.data);

    const handleDelete = async (paymentMode) => {
        if (!paymentMode) {
            Swal.fire("Error!", "Unable to select this payment mode.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete payment mode: ${paymentMode.name} (${paymentMode.code})`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deletePaymentMode(paymentMode.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The payment mode has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete payment mode", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting payment mode:", error);
            Swal.fire(
                "Error!",
                "Unable to delete payment mode. Please try again or contact support.",
                "error"
            );
        }
    };

    return (
        <PaymentModeContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Analytics", "Payment Modes"]} />
            <PaginatedTable
                fetchPath="/analytical/payment-modes"
                title="List of Payment Modes"
                columns={[
                    {
                        key: "name",
                        label: "Payment Mode",
                        className: "fw-bold",
                        style: { width: "200px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <i className="bx bx-credit-card text-warning me-2 fs-5"></i>
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
                        label: "Code",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            <span className="badge bg-light text-dark border">
                                {row.code || "-"}
                            </span>
                        ),
                    },
                    {
                        key: "description",
                        label: "Description",
                        style: { width: "300px" },
                        render: (row) => (
                            <span className="text-muted" title={row.description}>
                                {row.description 
                                    ? (row.description.length > 60 
                                        ? `${row.description.substring(0, 60)}...` 
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
                                {hasAccess(user, [["change_paymentmode"]]) && (
                                    <button
                                        aria-label="Edit"
                                        type="button"
                                        className="btn btn-sm btn-outline-primary border-0"
                                        onClick={() => {
                                            setSelectedObj(row);
                                        }}
                                        data-bs-toggle="modal"
                                        data-bs-target="#paymentModeModal"
                                        title="Edit Payment Mode"
                                    >
                                        <i className="bx bx-edit"></i>
                                    </button>
                                )}
                                {hasAccess(user, [["delete_paymentmode"]]) && (
                                    <button
                                        aria-label="Delete"
                                        type="button"
                                        className="btn btn-sm btn-outline-danger border-0"
                                        onClick={() => handleDelete(row)}
                                        title="Delete Payment Mode"
                                    >
                                        <i className="bx bx-trash"></i>
                                    </button>
                                )}
                            </div>
                        ),
                    },
                ]}
                buttons={
                    hasAccess(user, [["add_paymentmode"]]) ? [
                        {
                            label: "Add Payment Mode",
                            render: () => (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#paymentModeModal"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Payment Mode
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
            <PaymentModeModal />
        </PaymentModeContext.Provider>
    );
};
