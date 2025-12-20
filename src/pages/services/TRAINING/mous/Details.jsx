import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { useNavigate, useParams } from "react-router-dom";
import { getMOUDetail, deleteMOU } from "./Queries";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { MOUModal } from "./Modal";

export const MOUDetailsPage = () => {
    const [mouData, setMOUData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [refreshKey, setRefreshKey] = useState(0);

    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);
    const { uid } = useParams();

    const handleFetchMOU = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getMOUDetail(uid);
            if (result.status === 200 || result.status === 8000 || result.data) {
                setMOUData(result.data || result);
            } else {
                setError(true);
                showToast("MOU Not Found", "warning");
            }
        } catch (err) {
            console.error("Error fetching MOU:", err);
            setError(true);
            showToast("Unable to Fetch MOU Details", "warning");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!mouData) {
            Swal.fire("Error!", "Unable to select this MOU.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete MOU ${mouData.mou_number}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteMOU(mouData.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "MOU has been deleted.",
                        "success"
                    );
                    navigate("/training/mous");
                } else {
                    Swal.fire("Error!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting MOU:", error);
            Swal.fire(
                "Unsuccessful",
                "Unable to Delete MOU. Please Try Again or Contact Support",
                "error"
            );
        }
    };

    const getStatusBadge = () => {
        if (!mouData) return null;
        
        const today = new Date();
        const endDate = new Date(mouData.end_date);
        const daysRemaining = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));

        let statusClass = "bg-success";
        let statusLabel = "Active";

        if (daysRemaining < 0) {
            statusClass = "bg-danger";
            statusLabel = "Expired";
        } else if (daysRemaining <= 30) {
            statusClass = "bg-warning";
            statusLabel = "Expiring Soon";
        }

        return <span className={`badge ${statusClass}`}>{statusLabel}</span>;
    };

    useEffect(() => {
        handleFetchMOU();
    }, [uid, refreshKey]);

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Training", "MOU Management", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading MOU Details...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    if (error || !mouData) {
        return (
            <>
                <BreadCumb pageList={["Training", "MOU Management", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <div className="alert alert-danger" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get MOU Details. Please Contact System Administrator
                                </p>
                                <button
                                    className="btn btn-primary btn-sm mt-3"
                                    onClick={() => navigate("/training/mous")}
                                >
                                    <i className="bx bx-arrow-back me-1"></i> Back to MOUs List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <BreadCumb pageList={["Training", "MOU Management", "View"]} />

            {/* MOU Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                    <div className="avatar avatar-xl me-3">
                                        <span className="avatar-initial rounded bg-label-primary">
                                            <i className="bx bx-file-doc bx-lg"></i>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fw-bold">
                                        {mouData.mou_number}
                                        <small className="text-muted ms-2 fw-normal">
                                            ({mouData.institution?.name})
                                        </small>
                                    </h4>
                                    <p className="mb-2 text-muted">
                                        {formatDate(mouData.start_date, "DD/MM/YYYY")} to {formatDate(mouData.end_date, "DD/MM/YYYY")}
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {getStatusBadge()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            <button
                                className="btn btn-primary me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#mouModal"
                                onClick={() => { }}
                            >
                                <i className="bx bx-edit me-1"></i>Edit
                            </button>
                            <button
                                className="btn btn-outline-danger"
                                onClick={handleDelete}
                            >
                                <i className="bx bx-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="card">
                <div className="card-header">
                    <ul className="nav nav-pills" role="tablist">
                        <li className="nav-item">
                            <a
                                className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                                onClick={() => setActiveTab("overview")}
                                role="tab"
                                style={{ cursor: "pointer" }}
                            >
                                <i className="bx bx-info-circle me-2"></i>Overview
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link ${activeTab === "details" ? "active" : ""}`}
                                onClick={() => setActiveTab("details")}
                                role="tab"
                                style={{ cursor: "pointer" }}
                            >
                                <i className="bx bx-clipboard me-2"></i>Details
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link ${activeTab === "document" ? "active" : ""}`}
                                onClick={() => setActiveTab("document")}
                                role="tab"
                                style={{ cursor: "pointer" }}
                            >
                                <i className="bx bx-file me-2"></i>Document
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link ${activeTab === "history" ? "active" : ""}`}
                                onClick={() => setActiveTab("history")}
                                role="tab"
                                style={{ cursor: "pointer" }}
                            >
                                <i className="bx bx-history me-2"></i>History
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="card-body">
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="row">
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">MOU Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>MOU Number:</td>
                                                <td><code className="bg-light px-2 py-1 rounded">{mouData.mou_number}</code></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Institution:</td>
                                                <td><strong>{mouData.institution?.name}</strong></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Start Date:</td>
                                                <td>{formatDate(mouData.start_date, "DD/MM/YYYY")}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">End Date:</td>
                                                <td>{formatDate(mouData.end_date, "DD/MM/YYYY")}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Status:</td>
                                                <td>{getStatusBadge()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">Signed Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Signed By:</td>
                                                <td>{mouData.signed_by}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Signed Date:</td>
                                                <td>{formatDate(mouData.signed_date, "DD/MM/YYYY")}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Created:</td>
                                                <td>{formatDate(mouData.created_at, "DD/MM/YYYY HH:mm")}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Last Updated:</td>
                                                <td>{formatDate(mouData.updated_at, "DD/MM/YYYY HH:mm")}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Details Tab */}
                    {activeTab === "details" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="row">
                                <div className="col-md-12">
                                    <h5 className="mb-3 fw-semibold">Purpose</h5>
                                    <div className="card bg-light mb-4">
                                        <div className="card-body">
                                            <p className="mb-0">{mouData.purpose || "-"}</p>
                                        </div>
                                    </div>

                                    <h5 className="mb-3 fw-semibold">Terms and Conditions</h5>
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <p className="mb-0">{mouData.terms_and_conditions || "-"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Document Tab */}
                    {activeTab === "document" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="row">
                                <div className="col-md-12">
                                    <h5 className="mb-3 fw-semibold">MOU Document</h5>
                                    {mouData.document ? (
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center">
                                                    <i className="bx bx-file bx-lg me-3"></i>
                                                    <div className="flex-grow-1">
                                                        <p className="mb-0 fw-medium">Document Available</p>
                                                        <small className="text-muted">Click the button to view or download</small>
                                                    </div>
                                                    <a 
                                                        href={mouData.document} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        <i className="bx bx-download me-1"></i>View/Download
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="alert alert-info" role="alert">
                                            <p className="mb-0">No document attached to this MOU.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === "history" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="row">
                                <div className="col-md-12">
                                    <h5 className="mb-3 fw-semibold">Timeline</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Created:</td>
                                                <td>{formatDate(mouData.created_at, "DD/MM/YYYY HH:mm")}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Last Updated:</td>
                                                <td>{formatDate(mouData.updated_at, "DD/MM/YYYY HH:mm")}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <MOUModal
                mou={mouData}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </>
    );
};
