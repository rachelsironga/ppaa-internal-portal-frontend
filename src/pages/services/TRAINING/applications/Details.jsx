import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { useNavigate, useParams } from "react-router-dom";
import { getApplicationDetail, deleteApplication, updateApplication } from "./Queries";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { ApplicationModal } from "./Modal";

export const ApplicationDetailsPage = () => {
    const [applicationData, setApplicationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [refreshKey, setRefreshKey] = useState(0);

    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);
    const { uid } = useParams();

    const handleFetchApplication = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getApplicationDetail(uid);
            if (result.status === 200 || result.status === 8000 || result.data) {
                setApplicationData(result.data || result);
            } else {
                setError(true);
                showToast("warning", "Application Not Found");
            }
        } catch (err) {
            console.error("Error fetching application:", err);
            setError(true);
            showToast("warning", "Unable to Fetch Application Details");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!applicationData) {
            Swal.fire("Error!", "Unable to Select this Application.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete this application`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteApplication(applicationData.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "Application has been deleted.",
                        "success"
                    );
                    navigate("/training/applications");
                } else {
                    Swal.fire("Error!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting application:", error);
            Swal.fire(
                "Unsuccessful",
                "Unable to Delete Application. Please Try Again or Contact Support",
                "error"
            );
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            'pending': { class: 'warning', label: 'Pending' },
            'submitted': { class: 'info', label: 'Submitted' },
            'approved': { class: 'success', label: 'Approved' },
            'rejected': { class: 'danger', label: 'Rejected' },
        };
        const badge = config[status] || { class: 'secondary', label: status || 'N/A' };
        return <span className={`badge bg-${badge.class}`}><i className="bx bx-check me-1"></i>{badge.label}</span>;
    };

    useEffect(() => {
        handleFetchApplication();
    }, [uid, refreshKey]);

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Training", "Applications", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#00853f"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading Application Details...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    if (error || !applicationData) {
        return (
            <>
                <BreadCumb pageList={["Training", "Applications", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <div className="alert alert-danger" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get Application Details. Please Contact System Administrator
                                </p>
                                <button
                                    className="btn btn-primary btn-sm mt-3"
                                    onClick={() => navigate("/training/applications")}
                                >
                                    <i className="bx bx-arrow-back me-1"></i> Back to Applications List
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
            <BreadCumb pageList={["Training", "Applications", applicationData?.reference_number || "View"]} />

            {/* Application Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                    <div className="avatar avatar-xl me-3">
                                        <span className="avatar-initial rounded bg-label-primary">
                                            <i className="bx bx-file-blank bx-lg"></i>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fw-bold">
                                        Application: {applicationData.type}
                                        <small className="text-muted ms-2 fw-normal">({applicationData.reference_number})</small>
                                    </h4>
                                    <p className="mb-2 text-muted">
                                        Student: {applicationData.student?.first_name} {applicationData.student?.last_name}
                                        {applicationData.student?.email && (
                                            <>
                                                <br />
                                                <a href={`mailto:${applicationData.student.email}`}>{applicationData.student.email}</a>
                                            </>
                                        )}
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {getStatusBadge(applicationData.status)}
                                        <span className="badge bg-light text-dark">{applicationData.type}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            <button
                                className="btn btn-primary me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#applicationModal"
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
                                    <h5 className="mb-3 fw-semibold">Application Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Reference Number:</td>
                                                <td><code className="bg-light px-2 py-1 rounded">{applicationData.reference_number}</code></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Type:</td>
                                                <td>{applicationData.type || "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Status:</td>
                                                <td>{getStatusBadge(applicationData.status)}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Submission Date:</td>
                                                <td>{applicationData.submission_date ? formatDate(applicationData.submission_date, "DD/MM/YYYY") : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Departments:</td>
                                                <td>
                                                    {applicationData.department_details?.length > 0 ? (
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {applicationData.department_details.map((dept, idx) => (
                                                                <span key={dept.uid || idx} className="badge bg-light text-dark border">
                                                                    {dept.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Category:</td>
                                                <td>{applicationData.category_display || applicationData.category || "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Campus:</td>
                                                <td>{applicationData.campus_display || applicationData.campus || "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Duration:</td>
                                                <td>{applicationData.duration ? `${applicationData.duration} weeks` : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Period:</td>
                                                <td>
                                                    {applicationData.from_date && applicationData.to_date
                                                        ? `${formatDate(applicationData.from_date, "DD/MM/YYYY")} - ${formatDate(applicationData.to_date, "DD/MM/YYYY")}`
                                                        : "-"}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">Student Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Student Name:</td>
                                                <td>{applicationData.student?.first_name} {applicationData.student?.last_name}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Student ID:</td>
                                                <td><code className="bg-light px-2 py-1 rounded">{applicationData.student?.student_id}</code></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Email:</td>
                                                <td>
                                                    {applicationData.student?.email ? (
                                                        <a href={`mailto:${applicationData.student.email}`}>{applicationData.student.email}</a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Phone:</td>
                                                <td>
                                                    {applicationData.student?.primary_phone ? (
                                                        <a href={`tel:${applicationData.student.primary_phone}`}>{applicationData.student.primary_phone}</a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
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
                                    <h5 className="mb-3 fw-semibold">Notes</h5>
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            {applicationData.notes ? (
                                                <p className="mb-0">{applicationData.notes}</p>
                                            ) : (
                                                <p className="text-muted mb-0">No notes added</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                                                <td>{applicationData.created_at ? formatDate(applicationData.created_at, "DD/MM/YYYY HH:mm") : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Last Updated:</td>
                                                <td>{applicationData.updated_at ? formatDate(applicationData.updated_at, "DD/MM/YYYY HH:mm") : "-"}</td>
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
            <ApplicationModal
                application={applicationData}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </>
    );
};
