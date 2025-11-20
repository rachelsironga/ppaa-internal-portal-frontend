import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { AssetContext } from "../../../../utils/context";
import { useNavigate, useParams } from "react-router-dom";
import {
    getSoftwareInstallations,
    deleteInstallation,
    verifyInstallation,
    uninstallSoftware,
} from "./Queries";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { InstallationModal } from "./InstallationModal";
import { hasAccess } from "../../../../hooks/AccessHandler";

export const SoftwareInstallationViewPage = () => {
    const [installationData, setInstallationData] = useState(null);
    const [selectedObj, setSelectedObj] = useState(null);
    const [tableRefresh, setTableRefresh] = useState(0);
    const [activeTab, setActiveTab] = useState("overview");
    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    const { uid } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleFetchInstallation = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getSoftwareInstallations(uid);
            if (result.status === 200 || result.status === 8000) {
                if (Array.isArray(result.data) && result.data.length > 0) {
                    setInstallationData(result.data[0]);
                } else if (result.data && !Array.isArray(result.data)) {
                    setInstallationData(result.data);
                } else {
                    setError(true);
                    showToast("warning", "Installation Not Found");
                }
            } else {
                setError(true);
                showToast("warning", "Installation Not Found");
            }
        } catch (err) {
            console.error("Error fetching installation:", err);
            setError(true);
            showToast("warning", "Unable to Fetch Installation Details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleFetchInstallation();
    }, [uid, tableRefresh]);

    const handleDelete = async () => {
        if (!installationData) {
            Swal.fire("Error!", "Unable to Select this Installation.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete this installation record.`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteInstallation(installationData.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Process Completed!",
                        "The installation has been deleted.",
                        "success"
                    );
                    navigate("/ict-assets/asset-software-installations");
                } else {
                    console.error("Error deleting installation:", result);
                    Swal.fire("Error Occurred!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting installation:", error);
            Swal.fire("Unsuccessful", "Unable to Perform Delete. Please Try Again or Contact Support Team", "error");
        }
    };

    const handleVerify = async () => {
        if (!installationData) {
            Swal.fire("Error!", "Unable to select this installation.", "error");
            return;
        }

        try {
            const { value: formValues } = await Swal.fire({
                title: "Verify Installation",
                html: `
                    <div class="text-start">
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
                const result = await verifyInstallation(installationData.uid, {
                    verification_notes: formValues.notes,
                    is_verified: formValues.is_verified,
                    verified_at: new Date().toISOString()
                });

                if (result.status === 200 || result.status === 8000) {
                    showToast("Installation Verified Successfully", "success", "Complete");
                    setTableRefresh((prev) => prev + 1);
                } else {
                    showToast(`${result.message}`, "warning", "Verification Failed");
                }
            }
        } catch (error) {
            console.error("Error verifying installation:", error);
            showToast("Unable to Verify Installation", "error", "Failed");
        }
    };

    const handleUninstall = async () => {
        if (!installationData) {
            Swal.fire("Error!", "Unable to select this installation.", "error");
            return;
        }

        const { value: uninstallReason } = await Swal.fire({
            title: 'Uninstall Software',
            input: 'textarea',
            inputLabel: 'Uninstall Reason',
            inputPlaceholder: 'Why is this software being uninstalled?',
            showCancelButton: true,
            confirmButtonText: 'Mark as Uninstalled',
            inputValidator: (value) => {
                if (!value) {
                    return 'Please provide a reason!';
                }
            }
        });

        if (uninstallReason) {
            try {
                const result = await uninstallSoftware(installationData.uid, {
                    status: 'uninstalled',
                    uninstallation_reason: uninstallReason,
                    uninstallation_date: new Date().toISOString().split('T')[0]
                });

                if (result.status === 200 || result.status === 8000) {
                    showToast("Software Marked as Uninstalled", "success", "Complete");
                    setTableRefresh((prev) => prev + 1);
                } else {
                    showToast(`${result.message}`, "warning", "Uninstall Failed");
                }
            } catch (error) {
                console.error("Error uninstalling software:", error);
                showToast("Unable to Mark as Uninstalled", "error", "Failed");
            }
        }
    };

    const getInstallationStatusBadge = (status) => {
        const config = {
            active: { class: "success", icon: "✓", label: "Active" },
            inactive: { class: "warning", icon: "⏸", label: "Inactive" },
            pending: { class: "info", icon: "⏳", label: "Pending" },
            failed: { class: "danger", icon: "✗", label: "Failed" },
            uninstalled: { class: "secondary", icon: "📦", label: "Uninstalled" }
        };
        const badge = config[status] || { class: "secondary", icon: "?", label: status || "Unknown" };
        return (
            <span className={`badge bg-${badge.class}`}>
                {badge.icon} {badge.label}
            </span>
        );
    };

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Software Installations", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading Installation Details...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    if (error || !installationData) {
        return (
            <>
                <BreadCumb pageList={["Software Installations", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <div className="alert alert-danger" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get Installation Details. Please Contact System Administrator
                                </p>
                                <button
                                    className="btn btn-primary btn-sm mt-3"
                                    onClick={() => navigate("/ict-assets/asset-software-installations")}
                                >
                                    <i className="bx bx-arrow-back me-1"></i> Back to Installations List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <AssetContext.Provider
            value={{
                selectedObj,
                setSelectedObj,
                tableRefresh,
                setTableRefresh,
            }}
        >
            <BreadCumb pageList={["Software Installations", installationData?.software_name || installationData?.software_details?.name || "View"]} />

            {/* Installation Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                    <div className="avatar avatar-xl me-3">
                                        <span className="avatar-initial rounded bg-label-primary">
                                            <i className="bx bxs-download bx-lg"></i>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fw-bold">
                                        {installationData.software_name || installationData.software_details?.name || "Software Installation"}
                                        {installationData.version_installed && (
                                            <small className="text-muted ms-2 fw-normal">(v{installationData.version_installed})</small>
                                        )}
                                    </h4>
                                    <p className="mb-2 text-muted">
                                        <strong>Installed on:</strong> {installationData.asset_tag || installationData.asset_details?.asset_tag || "N/A"}
                                        {(installationData.asset_name || installationData.asset_details?.name) && ` • ${installationData.asset_name || installationData.asset_details?.name}`}
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {getInstallationStatusBadge(installationData.status)}
                                        {installationData.is_verified ? (
                                            <span className="badge bg-success">✓ Verified</span>
                                        ) : (
                                            <span className="badge bg-warning">Unverified</span>
                                        )}
                                        {installationData.is_compliant ? (
                                            <span className="badge bg-success">✓ Compliant</span>
                                        ) : (
                                            <span className="badge bg-danger">✗ Non-Compliant</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            <div className="btn-group">
                                {hasAccess(user, [["change_asset"]]) && installationData.status !== "uninstalled" && (
                                    <>
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={handleVerify}
                                        >
                                            <i className="bx bx-check-circle me-1"></i>
                                            Verify
                                        </button>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => {
                                                setSelectedObj(installationData);
                                            }}
                                            data-bs-toggle="modal"
                                            data-bs-target="#installationModal"
                                        >
                                            <i className="bx bx-edit me-1"></i>
                                            Edit Installation
                                        </button>
                                        <button
                                            className="btn btn-warning btn-sm"
                                            onClick={handleUninstall}
                                        >
                                            <i className="bx bx-minus-circle me-1"></i>
                                            Uninstall
                                        </button>
                                    </>
                                )}
                                {hasAccess(user, [["delete_asset"]]) && (
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={handleDelete}
                                    >
                                        <i className="bx bx-trash me-1"></i>
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInUp animate__faster">
                <div className="card-header">
                    <ul className="nav nav-tabs card-header-tabs" role="tablist">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                                onClick={() => setActiveTab("overview")}
                                type="button"
                            >
                                <i className="bx bx-info-circle me-1"></i>
                                Overview
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "technical" ? "active" : ""}`}
                                onClick={() => setActiveTab("technical")}
                                type="button"
                            >
                                <i className="bx bx-cog me-1"></i>
                                Technical Details
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === "compliance" ? "active" : ""}`}
                                onClick={() => setActiveTab("compliance")}
                                type="button"
                            >
                                <i className="bx bx-shield me-1"></i>
                                Compliance & Verification
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="card-body">
                    <div className="tab-content">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">Software Information</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Software Name:</td>
                                                    <td>{installationData.software_name || installationData.software_details?.name || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Version Installed:</td>
                                                    <td><span className="badge bg-info">{installationData.version_installed || "-"}</span></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Publisher:</td>
                                                    <td>{installationData.publisher || installationData.software_details?.publisher || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Installation Date:</td>
                                                    <td>
                                                        {installationData.installation_date
                                                            ? formatDate(installationData.installation_date, "DD/MM/YYYY")
                                                            : "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Status:</td>
                                                    <td>{getInstallationStatusBadge(installationData.status)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">Asset & Assignment Information</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Asset Tag:</td>
                                                    <td>
                                                        <span className="badge bg-dark">
                                                            {installationData.asset_tag || installationData.asset_details?.asset_tag || "-"}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Asset Name:</td>
                                                    <td>{installationData.asset_name || installationData.asset_details?.name || installationData.asset_details?.model || "-"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Assigned To:</td>
                                                    <td>
                                                        {installationData.assigned_to_name || <span className="text-muted">Unassigned</span>}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Installed By:</td>
                                                    <td>
                                                        {installationData.installed_by_name || "-"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Created At:</td>
                                                    <td>
                                                        {installationData.created_at
                                                            ? formatDate(installationData.created_at, "DD/MM/YYYY HH:mm")
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {(installationData.installation_notes || installationData.configuration_notes) && (
                                    <div className="row mt-4">
                                        <div className="col-md-12">
                                            {installationData.installation_notes && (
                                                <div className="mb-3">
                                                    <h6 className="mb-2 fw-semibold">Installation Notes</h6>
                                                    <div className="alert alert-info">
                                                        <p className="mb-0">{installationData.installation_notes}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {installationData.configuration_notes && (
                                                <div>
                                                    <h6 className="mb-2 fw-semibold">Configuration Notes</h6>
                                                    <div className="alert alert-light">
                                                        <p className="mb-0">{installationData.configuration_notes}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Technical Details Tab */}
                        {activeTab === "technical" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">Installation Configuration</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Installation Path:</td>
                                                    <td>
                                                        {installationData.installation_path ? (
                                                            <code className="small bg-light p-2 rounded d-block">
                                                                {installationData.installation_path}
                                                            </code>
                                                        ) : <span className="text-muted">-</span>}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">License Key Used:</td>
                                                    <td>
                                                        {installationData.license_key_used ? (
                                                            <code className="small bg-light p-2 rounded d-block">
                                                                {installationData.license_key_used}
                                                            </code>
                                                        ) : <span className="text-muted">-</span>}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Version Installed:</td>
                                                    <td><span className="badge bg-info">{installationData.version_installed || "-"}</span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">Additional Information</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Installation ID:</td>
                                                    <td><code className="small">{installationData.uid}</code></td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Last Updated:</td>
                                                    <td>
                                                        {installationData.updated_at
                                                            ? formatDate(installationData.updated_at, "DD/MM/YYYY HH:mm")
                                                            : "-"}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <hr />

                                {installationData.configuration_notes && (
                                    <div className="row mt-4">
                                        <div className="col-md-12">
                                            <h6 className="mb-3 fw-semibold">Configuration Details</h6>
                                            <div className="alert alert-light">
                                                <pre className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                                                    {installationData.configuration_notes}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Compliance & Verification Tab */}
                        {activeTab === "compliance" && (
                            <div className="animate__animated animate__fadeIn animate__faster">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">Compliance Status</h5>
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <td className="fw-medium" style={{ width: "40%" }}>Is Compliant:</td>
                                                    <td>
                                                        {installationData.is_compliant ? (
                                                            <span className="badge bg-success">✓ Yes - Compliant</span>
                                                        ) : (
                                                            <span className="badge bg-danger">✗ No - Non-Compliant</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="fw-medium">Is Verified:</td>
                                                    <td>
                                                        {installationData.is_verified ? (
                                                            <span className="badge bg-success">✓ Yes - Verified</span>
                                                        ) : (
                                                            <span className="badge bg-warning">Unverified</span>
                                                        )}
                                                    </td>
                                                </tr>
                                                {installationData.verified_at && (
                                                    <tr>
                                                        <td className="fw-medium">Verified At:</td>
                                                        <td className="text-success">
                                                            <i className="bx bx-check-circle me-1"></i>
                                                            {formatDate(installationData.verified_at, "DD/MM/YYYY HH:mm")}
                                                        </td>
                                                    </tr>
                                                )}
                                                {installationData.verification_notes && (
                                                    <tr>
                                                        <td className="fw-medium">Verification Notes:</td>
                                                        <td>{installationData.verification_notes}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {installationData.status === "uninstalled" && (
                                        <div className="col-md-6">
                                            <h5 className="mb-3 fw-semibold">Uninstallation Information</h5>
                                            <table className="table table-borderless">
                                                <tbody>
                                                    <tr>
                                                        <td className="fw-medium" style={{ width: "40%" }}>Uninstallation Date:</td>
                                                        <td>
                                                            {installationData.uninstallation_date
                                                                ? formatDate(installationData.uninstallation_date, "DD/MM/YYYY")
                                                                : "-"}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-medium">Uninstalled By:</td>
                                                        <td>{installationData.uninstalled_by || "-"}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="fw-medium">Reason:</td>
                                                        <td>
                                                            {installationData.uninstallation_reason ? (
                                                                <div className="alert alert-warning mb-0">
                                                                    {installationData.uninstallation_reason}
                                                                </div>
                                                            ) : "-"}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {!installationData.is_compliant && (
                                    <div className="row mt-4">
                                        <div className="col-md-12">
                                            <div className="alert alert-danger">
                                                <h6 className="alert-heading">
                                                    <i className="bx bx-error-circle me-2"></i>
                                                    Compliance Issue
                                                </h6>
                                                <p className="mb-0">
                                                    This installation has been marked as non-compliant.
                                                    Please review the installation details and take necessary action to ensure compliance with licensing and organizational policies.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <InstallationModal
                softwareUid={installationData?.software}
                softwareName={installationData?.software_name || installationData?.software_details?.name}
                selectedInstallation={selectedObj}
                onSuccess={() => {
                    setSelectedObj(null);
                    setTableRefresh((prev) => prev + 1);
                }}
            />
        </AssetContext.Provider>
    );
};
