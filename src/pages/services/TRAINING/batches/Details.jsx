import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { useNavigate, useParams } from "react-router-dom";
import { getTrainingBatchDetail, deleteTrainingBatch } from "./Queries";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { TrainingBatchModal } from "./Modal";

export const BatchTrainingsDetailsPage = () => {
    const [batchData, setBatchData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [refreshKey, setRefreshKey] = useState(0);

    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);
    const { uid } = useParams();

    const handleFetchBatch = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getTrainingBatchDetail(uid);
            if (result.status === 200 || result.status === 8000 || result.data) {
                setBatchData(result.data || result);
            } else {
                setError(true);
                showToast("Training batch not found", "warning", "Not Found");
            }
        } catch (err) {
            console.error("Error fetching batch:", err);
            setError(true);
            showToast("Unable to fetch training batch details", "warning", "Error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!batchData) {
            Swal.fire("Error!", "Unable to select this training batch.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete training batch ${batchData.batch_number}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteTrainingBatch(batchData.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "Training batch has been deleted.",
                        "success"
                    );
                    navigate("/training/batch-trainings");
                } else {
                    Swal.fire("Error!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting batch:", error);
            Swal.fire(
                "Unsuccessful",
                "Unable to delete training batch. Please try again or contact support.",
                "error"
            );
        }
    };

    useEffect(() => {
        handleFetchBatch();
    }, [uid, refreshKey]);

    const getStatusBadge = (status) => {
        const badges = {
            planned: "bg-warning text-dark",
            ongoing: "bg-info",
            completed: "bg-success",
            cancelled: "bg-danger",
        };
        return badges[status] || "bg-secondary";
    };

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Training", "Batch Trainings", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading Training Batch Details...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    if (error || !batchData) {
        return (
            <>
                <BreadCumb pageList={["Training", "Batch Trainings", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <div className="alert alert-danger" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get Training Batch Details. Please Contact System Administrator
                                </p>
                                <button
                                    className="btn btn-primary btn-sm mt-3"
                                    onClick={() => navigate("/training/batch-trainings")}
                                >
                                    <i className="bx bx-arrow-back me-1"></i> Back to Batch Trainings List
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
            <BreadCumb pageList={["Training", "Batch Trainings", batchData?.batch_number || "View"]} />

            {/* Batch Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                    <div className="avatar avatar-xl me-3">
                                        <span className="avatar-initial rounded bg-label-primary">
                                            <i className="bx bx-group bx-lg"></i>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fw-bold">
                                        {batchData.batch_number}
                                        <span className={`badge ${getStatusBadge(batchData.status)} ms-2 fw-normal`}>
                                            {batchData.status_display || batchData.status}
                                        </span>
                                    </h4>
                                    <p className="mb-2 text-muted">
                                        MOU: {batchData.mou_number || batchData.mou?.mou_number}
                                        {batchData.institution_name && ` • ${batchData.institution_name}`}
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        <span className="badge bg-light text-dark">
                                            <i className="bx bx-user me-1"></i>{batchData.number_of_students} Students
                                        </span>
                                        <span className="badge bg-light text-dark">
                                            <i className="bx bx-calendar me-1"></i>
                                            {formatDate(batchData.training_start_date, "DD/MM/YY")} - {formatDate(batchData.training_end_date, "DD/MM/YY")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            <button
                                className="btn btn-primary me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#trainingBatchModal"
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
                                    <h5 className="mb-3 fw-semibold">Batch Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Batch Number:</td>
                                                <td><strong>{batchData.batch_number}</strong></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Status:</td>
                                                <td>
                                                    <span className={`badge ${getStatusBadge(batchData.status)}`}>
                                                        {batchData.status_display || batchData.status}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">MOU:</td>
                                                <td>{batchData.mou_number || batchData.mou?.mou_number || "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Institution:</td>
                                                <td>{batchData.institution_name || batchData.mou?.institution?.name || "-"}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">Training Dates & Numbers</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Start Date:</td>
                                                <td>{formatDate(batchData.training_start_date, "DD/MM/YYYY")}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">End Date:</td>
                                                <td>{formatDate(batchData.training_end_date, "DD/MM/YYYY")}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Number of Students:</td>
                                                <td><strong>{batchData.number_of_students}</strong></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Duration:</td>
                                                <td>{batchData.duration_display || "-"}</td>
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
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">Financial Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Invoiced Amount:</td>
                                                <td><strong>{batchData.invoiced_amount}</strong></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Currency:</td>
                                                <td>{batchData.currency?.code || "-"}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">Departments</h5>
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            {batchData.department_names && batchData.department_names.length > 0 ? (
                                                <ul className="mb-0">
                                                    {batchData.department_names.map((dept, idx) => (
                                                        <li key={idx}>{dept}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-muted mb-0">No departments assigned</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {batchData.notes && (
                                <div className="mt-4">
                                    <h5 className="mb-3 fw-semibold">Notes</h5>
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <p className="mb-0">{batchData.notes}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {batchData.application_letter && (
                                <div className="mt-3">
                                    <h5 className="mb-3 fw-semibold">Application Letter</h5>
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <a
                                                href={batchData.application_letter}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-primary"
                                            >
                                                <i className="bx bx-download me-1"></i>Download Document
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === "history" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="row">
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">Timeline</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Created:</td>
                                                <td>{batchData.created_at ? formatDate(batchData.created_at, "DD/MM/YYYY HH:mm") : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Last Updated:</td>
                                                <td>{batchData.updated_at ? formatDate(batchData.updated_at, "DD/MM/YYYY HH:mm") : "-"}</td>
                                            </tr>
                                            {batchData.status === "cancelled" && batchData.cancelled_at && (
                                                <tr>
                                                    <td className="fw-medium">Cancelled:</td>
                                                    <td>{formatDate(batchData.cancelled_at, "DD/MM/YYYY HH:mm")}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {batchData.status === "cancelled" && batchData.cancellation_reason && (
                                    <div className="col-md-6">
                                        <h5 className="mb-3 fw-semibold">Cancellation Reason</h5>
                                        <div className="card bg-danger bg-opacity-10 border-danger">
                                            <div className="card-body">
                                                <p className="mb-0">{batchData.cancellation_reason}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <TrainingBatchModal
                batch={batchData}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </>
    );
};
