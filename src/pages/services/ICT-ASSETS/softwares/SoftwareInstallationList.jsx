import React, { useState, useEffect, useRef } from "react";
import "animate.css";
import { AssetContext } from "../../../../utils/context";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import PaginatedTable from "../../../../components/ui-templates/PaginatedTable";
import { formatDate } from "../../../../helpers/DateFormater";
import Swal from "sweetalert2";
import { InstallationModal } from "./InstallationModal";
import { deleteInstallation, verifyInstallation, uninstallSoftware } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import { hasAccess } from "../../../../hooks/AccessHandler";
import { useSelector } from "react-redux";

export const SowareInstallationListPage = () => {
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const [selectedInstallations, setSelectedInstallations] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [verifyingUid, setVerifyingUid] = useState(null);
    const [uninstallingUid, setUninstallingUid] = useState(null);
    const tableRef = useRef(null);
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    useEffect(() => {
        setShowBulkActions(selectedInstallations.length > 0);
    }, [selectedInstallations]);

    const handleDelete = async (installation) => {
        if (!installation) {
            Swal.fire("Error!", "Unable to select this installation.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete installation on ${installation.asset_details?.asset_tag || 'this asset'}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteInstallation(installation.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "The installation has been deleted successfully.",
                        "success"
                    );
                    setTableRefresh((prev) => prev + 1);
                } else {
                    Swal.fire("Error!", result.message || "Failed to delete installation", "error");
                }
            }
        } catch (error) {
            console.error("Error deleting installation:", error);
            Swal.fire(
                "Error!",
                "Unable to delete installation. Please try again or contact support.",
                "error"
            );
        }
    };

    const handleVerify = async (installation) => {
        if (!installation) {
            Swal.fire("Error!", "Unable to select this installation.", "error");
            return;
        }

        try {
            const { value: formValues } = await Swal.fire({
                title: "Verify Installation",
                html: `
                    <div class="text-start">
                        <p>Verify installation on: <strong>${installation.asset_details?.asset_tag || 'Asset'}</strong></p>
                        <label class="form-label">Verification Notes:</label>
                        <textarea id="verification-notes" class="form-control" rows="3" placeholder="Enter verification notes..."></textarea>
                        <div class="form-check mt-3">
                            <input class="form-check-input" type="checkbox" id="is-verified" checked>
                            <label class="form-check-label" for="is-verified">
                                Mark as Verified
                            </label>
                        </div>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: "Verify",
                confirmButtonColor: "#28a745",
                preConfirm: () => {
                    return {
                        notes: document.getElementById('verification-notes').value,
                        is_verified: document.getElementById('is-verified').checked
                    }
                }
            });

            if (formValues) {
                setVerifyingUid(installation.uid);
                const result = await verifyInstallation(installation.uid, {
                    verification_notes: formValues.notes,
                    is_verified: formValues.is_verified,
                    verified_at: new Date().toISOString()
                });

                if (result.status === 200 || result.status === 8000) {
                    showToast("Installation Verified Successfully", "success", "Success");
                    setTableRefresh((prev) => prev + 1);
                } else {
                    showToast(result.message || "Verification Failed", "warning", "Failed");
                }
                setVerifyingUid(null);
            }
        } catch (error) {
            console.error("Error verifying installation:", error);
            showToast("Unable to Verify Installation", "error", "Error");
            setVerifyingUid(null);
        }
    };

    const handleUninstall = async (installation) => {
        if (!installation) {
            Swal.fire("Error!", "Unable to select this installation.", "error");
            return;
        }

        try {
            const { value: formValues } = await Swal.fire({
                title: "Uninstall Software",
                html: `
                    <div class="text-start">
                        <p>Uninstall from: <strong>${installation.asset_details?.asset_tag || 'Asset'}</strong></p>
                        <label class="form-label">Uninstallation Date:</label>
                        <input type="date" id="uninstall-date" class="form-control mb-3" value="${new Date().toISOString().split('T')[0]}">
                        <label class="form-label">Uninstalled By:</label>
                        <input type="text" id="uninstalled-by" class="form-control mb-3" placeholder="Your name">
                        <label class="form-label">Reason for Uninstallation:</label>
                        <textarea id="uninstall-reason" class="form-control" rows="3" placeholder="Enter reason..."></textarea>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: "Uninstall",
                confirmButtonColor: "#dc3545",
                preConfirm: () => {
                    return {
                        uninstallation_date: document.getElementById('uninstall-date').value,
                        uninstalled_by: document.getElementById('uninstalled-by').value,
                        uninstallation_reason: document.getElementById('uninstall-reason').value
                    }
                }
            });

            if (formValues) {
                setUninstallingUid(installation.uid);
                const result = await uninstallSoftware(installation.uid, formValues);

                if (result.status === 200 || result.status === 8000) {
                    showToast("Software Uninstalled Successfully", "success", "Success");
                    setTableRefresh((prev) => prev + 1);
                } else {
                    showToast(result.message || "Uninstallation Failed", "warning", "Failed");
                }
                setUninstallingUid(null);
            }
        } catch (error) {
            console.error("Error uninstalling software:", error);
            showToast("Unable to Uninstall Software", "error", "Error");
            setUninstallingUid(null);
        }
    };

    return (
        <AssetContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Software Installations", "List"]} />
            <PaginatedTable
                fetchPath="/asset-software-installations"
                title="Software Installation Records"
                onDataFetched={(data) => setTableData(data)}
                columns={[
                    {
                        key: "software",
                        label: "Software Details",
                        className: "fw-bold",
                        style: { width: "220px" },
                        render: (row) => (
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <i className="bx bxs-download text-primary me-2 fs-4"></i>
                                </div>
                                <div className="flex-grow-1">
                                    <span
                                        className="text-primary cursor-pointer fw-semibold"
                                        onClick={() =>
                                            hasAccess(user, [["view_asset", "add_asset", "change_asset"]])
                                                ? navigate(`/ict-assets/asset-software-installations/${row.uid}`)
                                                : null
                                        }
                                    >
                                        {row.software_name || row.software_details?.name || "Software"}
                                    </span>
                                    {row.version_installed && (
                                        <small className="d-block text-muted fs-12">
                                            Version: {row.version_installed}
                                        </small>
                                    )}
                                    {(row.publisher || row.software_details?.publisher) && (
                                        <small className="d-block text-muted fs-12">
                                            🏢 {row.publisher || row.software_details?.publisher}
                                        </small>
                                    )}
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: "asset",
                        label: "Installed On",
                        className: "text-left",
                        style: { width: "200px" },
                        render: (row) => (
                            <div>
                                {(row.asset_tag || row.asset_details?.asset_tag) ? (
                                    <>
                                        <div className="fw-medium text-dark">
                                            <i className="bx bx-desktop me-1"></i>
                                            {row.asset_tag || row.asset_details?.asset_tag}
                                        </div>
                                        <small className="text-muted d-block fs-12">
                                            {row.asset_name || row.asset_details?.name || row.asset_details?.model || "-"}
                                        </small>
                                    </>
                                ) : (
                                    <div className="text-muted">-</div>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "installation_date",
                        label: "Installation Date",
                        className: "text-center",
                        style: { width: "150px" },
                        render: (row) => (
                            <div>
                                {row.installation_date ? (
                                    <div className="fw-medium text-primary">
                                        {formatDate(row.installation_date, "DD/MM/YYYY")}
                                    </div>
                                ) : (
                                    <div className="text-muted fs-12">No date</div>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "assigned_to",
                        label: "Assigned To",
                        style: { width: "180px" },
                        render: (row) => (
                            <div>
                                {row.assigned_to_name ? (
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <span className="text-dark fs-13">
                                                {row.assigned_to_name}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-muted">Unassigned</span>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "status",
                        label: "Status",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => {
                            let statusClass = "secondary";
                            let statusText = row.status || "Unknown";

                            if (row.status === "active") {
                                statusClass = "success";
                                statusText = "Active";
                            } else if (row.status === "inactive") {
                                statusClass = "warning";
                                statusText = "Inactive";
                            } else if (row.status === "uninstalled") {
                                statusClass = "danger";
                                statusText = "Uninstalled";
                            } else if (row.status === "pending") {
                                statusClass = "info";
                                statusText = "Pending";
                            } else if (row.status === "failed") {
                                statusClass = "danger";
                                statusText = "Failed";
                            }

                            return (
                                <span className={`badge bg-${statusClass} bg-opacity-10 text-${statusClass} border border-${statusClass} border-opacity-25`}>
                                    {statusText}
                                </span>
                            );
                        },
                    },
                    {
                        key: "verification",
                        label: "Verification",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            row.is_verified ? (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                    ✓ Verified
                                </span>
                            ) : (
                                <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25">
                                    Unverified
                                </span>
                            )
                        ),
                    },
                    {
                        key: "compliance",
                        label: "Compliance",
                        className: "text-center",
                        style: { width: "120px" },
                        render: (row) => (
                            row.is_compliant ? (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                    ✓ Compliant
                                </span>
                            ) : (
                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">
                                    ✗ Non-Compliant
                                </span>
                            )
                        ),
                    },
                    {
                        key: "actions",
                        label: "Actions",
                        style: { width: "180px" },
                        className: "text-center",
                        render: (row) => (
                            <div className="btn-group">
                                <button
                                    aria-label="View"
                                    type="button"
                                    className="btn btn-sm btn-outline-info border-0"
                                    onClick={() => navigate(`/ict-assets/asset-software-installations/${row.uid}`)}
                                    title="View Installation Details"
                                >
                                    <i className="bx bx-show"></i>
                                </button>
                                {hasAccess(user, [["change_asset"]]) && row.status !== "uninstalled" && (
                                    <>
                                        <button
                                            aria-label="Verify"
                                            type="button"
                                            className="btn btn-sm btn-outline-success border-0"
                                            onClick={() => handleVerify(row)}
                                            title="Verify Installation"
                                            disabled={verifyingUid === row.uid}
                                        >
                                            {verifyingUid === row.uid ? (
                                                <span className="spinner-border spinner-border-sm"></span>
                                            ) : (
                                                <i className="bx bx-check-circle"></i>
                                            )}
                                        </button>
                                        <button
                                            aria-label="Edit"
                                            type="button"
                                            className="btn btn-sm btn-outline-primary border-0"
                                            onClick={() => {
                                                setSelectedObj(row);
                                            }}
                                            data-bs-toggle="modal"
                                            data-bs-target="#installationModal"
                                            title="Edit Installation"
                                        >
                                            <i className="bx bx-edit"></i>
                                        </button>
                                        <button
                                            aria-label="Uninstall"
                                            type="button"
                                            className="btn btn-sm btn-outline-warning border-0"
                                            onClick={() => handleUninstall(row)}
                                            title="Uninstall Software"
                                            disabled={uninstallingUid === row.uid}
                                        >
                                            {uninstallingUid === row.uid ? (
                                                <span className="spinner-border spinner-border-sm"></span>
                                            ) : (
                                                <i className="bx bx-minus-circle"></i>
                                            )}
                                        </button>
                                    </>
                                )}
                                {hasAccess(user, [["delete_asset"]]) && (
                                    <button
                                        aria-label="Delete"
                                        type="button"
                                        className="btn btn-sm btn-outline-danger border-0"
                                        onClick={() => handleDelete(row)}
                                        title="Delete Installation"
                                    >
                                        <i className="bx bx-trash"></i>
                                    </button>
                                )}
                            </div>
                        ),
                    },
                ]}
                buttons={[
                    {
                        label: "Add Installation",
                        render: () => (
                            hasAccess(user, [["add_asset"]]) && (
                                <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedObj(null)}
                                    data-bs-toggle="modal"
                                    data-bs-target="#installationModal"
                                    title="Add new installation"
                                >
                                    <i className="bx bx-plus me-1"></i> Add Installation
                                </button>
                            )
                        ),
                    },
                ]}
                onSelect={(row) => {
                    setSelectedObj(row);
                }}
                isRefresh={tableRefresh}
                filterGroups={[
                    {
                        group: "status",
                        label: "Status",
                        placeholder: "Filter by Status",
                        options: [
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Inactive" },
                            { value: "pending", label: "Pending" },
                            { value: "failed", label: "Failed" },
                            { value: "uninstalled", label: "Uninstalled" }
                        ]
                    },
                    {
                        group: "is_verified",
                        label: "Verification",
                        placeholder: "Filter by Verification",
                        options: [
                            { value: "true", label: "Verified" },
                            { value: "false", label: "Unverified" }
                        ]
                    },
                    {
                        group: "is_compliant",
                        label: "Compliance",
                        placeholder: "Filter by Compliance",
                        options: [
                            { value: "true", label: "Compliant" },
                            { value: "false", label: "Non-Compliant" }
                        ]
                    }
                ]}
            />
            <InstallationModal
                selectedInstallation={selectedObj}
                onSuccess={() => setTableRefresh((prev) => prev + 1)}
            />
        </AssetContext.Provider>
    );
};
