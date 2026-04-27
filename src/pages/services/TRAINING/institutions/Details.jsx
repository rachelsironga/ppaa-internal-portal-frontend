import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { useNavigate, useParams } from "react-router-dom";
import { getInstitutionDetail, deleteInstitution } from "./Queries";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { InstitutionModal } from "./Modal";

export const InstitutionDetailsPage = () => {
    const [institutionData, setInstitutionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [refreshKey, setRefreshKey] = useState(0);

    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);
    const { uid } = useParams();

    const handleFetchInstitution = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getInstitutionDetail(uid);
            if (result.status === 200 || result.status === 8000 || result.data) {
                setInstitutionData(result.data || result);
            } else {
                setError(true);
                showToast("warning", "Institution Not Found");
            }
        } catch (err) {
            console.error("Error fetching institution:", err);
            setError(true);
            showToast("warning", "Unable to Fetch Institution Details");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!institutionData) {
            Swal.fire("Error!", "Unable to Select this Institution.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete ${institutionData.name}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteInstitution(institutionData.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "Institution has been deleted.",
                        "success"
                    );
                    navigate("/training/institutions");
                } else {
                    Swal.fire("Error!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting institution:", error);
            Swal.fire(
                "Unsuccessful",
                "Unable to Delete Institution. Please Try Again or Contact Support",
                "error"
            );
        }
    };

    useEffect(() => {
        handleFetchInstitution();
    }, [uid, refreshKey]);

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Training", "Institutions", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#00853f"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading Institution Details...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    if (error || !institutionData) {
        return (
            <>
                <BreadCumb pageList={["Training", "Institutions", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <div className="alert alert-danger" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get Institution Details. Please Contact System Administrator
                                </p>
                                <button
                                    className="btn btn-primary btn-sm mt-3"
                                    onClick={() => navigate("/training/institutions")}
                                >
                                    <i className="bx bx-arrow-back me-1"></i> Back to Institutions List
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
            <BreadCumb pageList={["Training", "Institutions", institutionData?.name || "View"]} />

            {/* Institution Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                    <div className="avatar avatar-xl me-3">
                                        <span className="avatar-initial rounded bg-label-primary">
                                            <i className="bx bx-building bx-lg"></i>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fw-bold">
                                        {institutionData.name}
                                        <small className="text-muted ms-2 fw-normal">
                                            ({institutionData.institution_code})
                                        </small>
                                    </h4>
                                    <p className="mb-2 text-muted">
                                        {institutionData.institution_type}
                                        {institutionData.country && ` • ${institutionData.country.name}`}
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        <span className="badge bg-info">{institutionData.institution_type}</span>
                                        {institutionData.contact_person && (
                                            <span className="badge bg-light text-dark">{institutionData.contact_person}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            <button
                                className="btn btn-primary me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#institutionModal"
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
                                    <h5 className="mb-3 fw-semibold">Institution Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Name:</td>
                                                <td><strong>{institutionData.name}</strong></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Code:</td>
                                                <td><code className="bg-light px-2 py-1 rounded">{institutionData.institution_code}</code></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Type:</td>
                                                <td>{institutionData.institution_type || "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Country:</td>
                                                <td>{institutionData.country?.name || "-"}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">Contact Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Contact Person:</td>
                                                <td>{institutionData.contact_person || "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Email:</td>
                                                <td>
                                                    {institutionData.contact_email ? (
                                                        <a href={`mailto:${institutionData.contact_email}`}>
                                                            {institutionData.contact_email}
                                                        </a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Phone:</td>
                                                <td>
                                                    {institutionData.contact_phone ? (
                                                        <a href={`tel:${institutionData.contact_phone}`}>
                                                            {institutionData.contact_phone}
                                                        </a>
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
                                    <h5 className="mb-3 fw-semibold">Address</h5>
                                    <div className="card bg-light mb-3">
                                        <div className="card-body">
                                            {institutionData.address ? (
                                                <p className="mb-0">{institutionData.address}</p>
                                            ) : (
                                                <p className="text-muted mb-0">No address provided</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <h5 className="mb-3 fw-semibold">Website</h5>
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    {institutionData.website ? (
                                                        <a href={institutionData.website} target="_blank" rel="noopener noreferrer">
                                                            {institutionData.website}
                                                        </a>
                                                    ) : (
                                                        <p className="text-muted mb-0">No website provided</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <h5 className="mb-3 fw-semibold">Established Date</h5>
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    {institutionData.established_date ? (
                                                        <p className="mb-0">{formatDate(institutionData.established_date, "DD/MM/YYYY")}</p>
                                                    ) : (
                                                        <p className="text-muted mb-0">No date provided</p>
                                                    )}
                                                </div>
                                            </div>
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
                                                <td>{institutionData.created_at ? formatDate(institutionData.created_at, "DD/MM/YYYY HH:mm") : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Last Updated:</td>
                                                <td>{institutionData.updated_at ? formatDate(institutionData.updated_at, "DD/MM/YYYY HH:mm") : "-"}</td>
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
            <InstitutionModal
                institution={institutionData}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </>
    );
};
