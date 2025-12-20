import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { useNavigate, useParams } from "react-router-dom";
import { getAllocationDetail, deleteAllocation } from "./Queries";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { AllocationModal } from "./Modal";

export const AllocationDetailsPage = () => {
    const [allocationData, setAllocationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [refreshKey, setRefreshKey] = useState(0);

    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);
    const { uid } = useParams();

    const handleFetchAllocation = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAllocationDetail(uid);
            if (result.status === 200 || result.status === 8000 || result.data) {
                setAllocationData(result.data || result);
            } else {
                setError(true);
                showToast("warning", "Allocation Not Found");
            }
        } catch (err) {
            console.error("Error fetching allocation:", err);
            setError(true);
            showToast("warning", "Unable to Fetch Allocation Details");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!allocationData) {
            Swal.fire("Error!", "Unable to Select this Allocation.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete this allocation`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteAllocation(allocationData.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "Allocation has been deleted.",
                        "success"
                    );
                    navigate("/training/allocation");
                } else {
                    Swal.fire("Error!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting allocation:", error);
            Swal.fire(
                "Unsuccessful",
                "Unable to Delete Allocation. Please Try Again or Contact Support",
                "error"
            );
        }
    };

    useEffect(() => {
        handleFetchAllocation();
    }, [uid, refreshKey]);

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Training", "Department Allocations", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading Allocation Details...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    if (error || !allocationData) {
        return (
            <>
                <BreadCumb pageList={["Training", "Department Allocations", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <div className="alert alert-danger" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get Allocation Details. Please Contact System Administrator
                                </p>
                                <button
                                    className="btn btn-primary btn-sm mt-3"
                                    onClick={() => navigate("/training/allocation")}
                                >
                                    <i className="bx bx-arrow-back me-1"></i> Back to Allocations List
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
            <BreadCumb pageList={["Training", "Department Allocations", "View"]} />

            {/* Allocation Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                    <div className="avatar avatar-xl me-3">
                                        <span className="avatar-initial rounded bg-label-primary">
                                            <i className="bx bx-sitemap bx-lg"></i>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fw-bold">
                                        Department Allocation
                                        <small className="text-muted ms-2 fw-normal">
                                            ({allocationData.department?.name})
                                        </small>
                                    </h4>
                                    <p className="mb-2 text-muted">
                                        Student: {allocationData.application?.student?.first_name} {allocationData.application?.student?.last_name}
                                        <br />
                                        Application: {allocationData.application?.reference_number}
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        <span className="badge bg-info">{allocationData.department?.name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            <button
                                className="btn btn-primary me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#allocationModal"
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
                                    <h5 className="mb-3 fw-semibold">Allocation Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Department:</td>
                                                <td><strong>{allocationData.department?.name}</strong></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Start Date:</td>
                                                <td>{allocationData.start_date ? formatDate(allocationData.start_date, "DD/MM/YYYY") : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">End Date:</td>
                                                <td>{allocationData.end_date ? formatDate(allocationData.end_date, "DD/MM/YYYY") : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Supervisor:</td>
                                                <td>{allocationData.supervisor?.user?.full_name || "-"}</td>
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
                                                <td>{allocationData.application?.student?.first_name} {allocationData.application?.student?.last_name}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Student ID:</td>
                                                <td><code className="bg-light px-2 py-1 rounded">{allocationData.application?.student?.student_id}</code></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Application:</td>
                                                <td><code className="bg-light px-2 py-1 rounded">{allocationData.application?.reference_number}</code></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Email:</td>
                                                <td>
                                                    {allocationData.application?.student?.email ? (
                                                        <a href={`mailto:${allocationData.application.student.email}`}>
                                                            {allocationData.application.student.email}
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
                                    <h5 className="mb-3 fw-semibold">Description</h5>
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            {allocationData.description ? (
                                                <p className="mb-0">{allocationData.description}</p>
                                            ) : (
                                                <p className="text-muted mb-0">No description added</p>
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
                                                <td>{allocationData.created_at ? formatDate(allocationData.created_at, "DD/MM/YYYY HH:mm") : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Last Updated:</td>
                                                <td>{allocationData.updated_at ? formatDate(allocationData.updated_at, "DD/MM/YYYY HH:mm") : "-"}</td>
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
            <AllocationModal
                allocation={allocationData}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </>
    );
};
