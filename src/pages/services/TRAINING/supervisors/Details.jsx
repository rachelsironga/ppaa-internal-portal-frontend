import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { useNavigate, useParams } from "react-router-dom";
import { getSupervisorDetail, deleteSupervisor } from "./Queries";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { SupervisorModal } from "./Modal";

export const SupervisorDetailsPage = () => {
    const [supervisorData, setSupervisorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [refreshKey, setRefreshKey] = useState(0);

    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);
    const { uid } = useParams();

    const handleFetchSupervisor = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getSupervisorDetail(uid);
            if (result.status === 200 || result.status === 8000 || result.data) {
                setSupervisorData(result.data || result);
            } else {
                setError(true);
                showToast("Supervisor Not Found", "warning");
            }
        } catch (err) {
            console.error("Error fetching supervisor:", err);
            setError(true);
            showToast("Unable to Fetch Supervisor Details", "warning");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!supervisorData) {
            Swal.fire("Error!", "Unable to Select this Supervisor.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete this supervisor`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteSupervisor(supervisorData.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "Supervisor has been deleted.",
                        "success"
                    );
                    navigate("/training/supervisors/");
                } else {
                    Swal.fire("Error!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting supervisor:", error);
            Swal.fire(
                "Unsuccessful",
                "Unable to Delete Supervisor. Please Try Again or Contact Support",
                "error"
            );
        }
    };

    useEffect(() => {
        handleFetchSupervisor();
    }, [uid, refreshKey]);

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Training", "Supervisors", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading Supervisor Details...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    if (error || !supervisorData) {
        return (
            <>
                <BreadCumb pageList={["Training", "Supervisors", "View"]} />
                <div className="card">
                    <div className="card-body text-center">
                        <h5 className="text-danger">Unable to Load Supervisor</h5>
                        <button
                            className="btn btn-primary mt-3"
                            onClick={() => navigate("/training/supervisors/")}
                        >
                            Back to Supervisors
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <BreadCumb pageList={["Training", "Supervisors", "View"]} />

            {/* Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold">
                                <i className="bx bx-user-check me-2"></i>Supervisor Details
                            </h4>
                            <p className="text-muted mb-0">View and manage supervisor information</p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => navigate("/training/supervisors/")}
                            >
                                <i className="bx bx-arrow-back me-1"></i> Back
                            </button>
                            <button
                                className="btn btn-primary"
                                data-bs-toggle="modal"
                                data-bs-target="#supervisorModal"
                            >
                                <i className="bx bx-edit me-1"></i> Edit
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDelete}
                            >
                                <i className="bx bx-trash me-1"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="card animate__animated animate__fadeInUp animate__faster">
                <div className="card-body">
                    {/* Tabs */}
                    <ul className="nav nav-tabs mb-3" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                                onClick={() => setActiveTab("overview")}
                                type="button"
                                role="tab"
                            >
                                <i className="bx bx-info-circle me-2"></i> Overview
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === "audit" ? "active" : ""}`}
                                onClick={() => setActiveTab("audit")}
                                type="button"
                                role="tab"
                            >
                                <i className="bx bx-history me-2"></i> Audit Trail
                            </button>
                        </li>
                    </ul>

                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div className="tab-pane active">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="fw-bold text-muted small">User GUID</label>
                                    <p className="text-monospace">{supervisorData.user_guid}</p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="fw-bold text-muted small">Department UID</label>
                                    <p className="text-monospace">{supervisorData.department_uid}</p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="fw-bold text-muted small">Status</label>
                                    <p>
                                        <span
                                            className={`badge ${
                                                supervisorData.is_active
                                                    ? "bg-success"
                                                    : "bg-secondary"
                                            }`}
                                        >
                                            {supervisorData.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="fw-bold text-muted small">Created Date</label>
                                    <p>{formatDate(supervisorData.created_at)}</p>
                                </div>
                                <div className="col-12 mb-3">
                                    <label className="fw-bold text-muted small">Description</label>
                                    <p>{supervisorData.description || "-"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Audit Trail Tab */}
                    {activeTab === "audit" && (
                        <div className="tab-pane active">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="fw-bold text-muted small">Created By</label>
                                    <p>
                                        {supervisorData.created_by_details
                                            ? `${supervisorData.created_by_details.first_name} ${supervisorData.created_by_details.last_name}`
                                            : "System"}
                                    </p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="fw-bold text-muted small">Created At</label>
                                    <p>{formatDate(supervisorData.created_at)}</p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="fw-bold text-muted small">Last Updated By</label>
                                    <p>
                                        {supervisorData.updated_by_details
                                            ? `${supervisorData.updated_by_details.first_name} ${supervisorData.updated_by_details.last_name}`
                                            : "System"}
                                    </p>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="fw-bold text-muted small">Last Updated At</label>
                                    <p>{formatDate(supervisorData.updated_at)}</p>
                                </div>
                                {supervisorData.is_deleted && (
                                    <>
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold text-muted small">Deleted By</label>
                                            <p>
                                                {supervisorData.deleted_by_details
                                                    ? `${supervisorData.deleted_by_details.first_name} ${supervisorData.deleted_by_details.last_name}`
                                                    : "System"}
                                            </p>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold text-muted small">Deleted At</label>
                                            <p>{formatDate(supervisorData.deleted_at)}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <SupervisorModal
                supervisor={supervisorData}
                onSuccess={() => setRefreshKey((prev) => prev + 1)}
            />
        </>
    );
};
