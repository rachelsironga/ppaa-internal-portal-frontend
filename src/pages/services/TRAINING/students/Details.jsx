import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { useNavigate, useParams } from "react-router-dom";
import { getStudentDetail, deleteStudent, updateStudent } from "./Queries";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { StudentModal } from "./Modal";

export const StudentDetailsPage = () => {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [refreshKey, setRefreshKey] = useState(0);

    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);
    const { uid } = useParams();

    const handleFetchStudent = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getStudentDetail(uid);
            if (result.status === 200 || result.status === 8000 || result.data) {
                setStudentData(result.data || result);
            } else {
                setError(true);
                showToast("warning", "Student Not Found");
            }
        } catch (err) {
            console.error("Error fetching student:", err);
            setError(true);
            showToast("warning", "Unable to Fetch Student Details");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!studentData) {
            Swal.fire("Error!", "Unable to Select this Student.", "error");
            return;
        }

        try {
            const confirmation = await Swal.fire({
                title: "Are you sure?",
                text: `You're about to delete ${studentData.first_name} ${studentData.last_name}`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonColor: "#aaa",
                confirmButtonText: "Yes, delete it!",
            });

            if (confirmation.isConfirmed) {
                const result = await deleteStudent(studentData.uid);
                if (result.status === 200 || result.status === 8000) {
                    Swal.fire(
                        "Deleted!",
                        "Student has been deleted.",
                        "success"
                    );
                    navigate("/training/students");
                } else {
                    Swal.fire("Error!", `${result.message}`, "error");
                }
            }
        } catch (error) {
            console.error("Error deleting student:", error);
            Swal.fire(
                "Unsuccessful",
                "Unable to Delete Student. Please Try Again or Contact Support",
                "error"
            );
        }
    };

    const getStatusBadge = (status) => {
        if (status) {
            return (
                <span className="badge bg-success">
                    <i className="bx bx-check me-1"></i>Active
                </span>
            );
        }
        return <span className="badge bg-secondary">Inactive</span>;
    };

    const getGenderBadge = (gender) => {
        const config = {
            M: { class: "info", label: "Male" },
            F: { class: "danger", label: "Female" },
            O: { class: "warning", label: "Other" },
        };
        const badge = config[gender] || { class: "secondary", label: gender || "N/A" };
        return <span className={`badge bg-${badge.class}`}>{badge.label}</span>;
    };

    const getTypeBadge = (type) => {
        const config = {
            LC: { class: "success", label: "Local" },
            FC: { class: "info", label: "Foreign" },
        };
        const badge = config[type] || { class: "secondary", label: type || "N/A" };
        return <span className={`badge bg-${badge.class}`}>{badge.label}</span>;
    };

    useEffect(() => {
        handleFetchStudent();
    }, [uid, refreshKey]);

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Training", "Students", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#00853f"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading Student Details...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    if (error || !studentData) {
        return (
            <>
                <BreadCumb pageList={["Training", "Students", "View"]} />
                <div className="card">
                    <div className="card-body">
                        <div className="alert alert-danger" role="alert">
                            <div className="alert-body text-center">
                                <p className="mb-0">
                                    Sorry! Unable to get Student Details. Please Contact System Administrator
                                </p>
                                <button
                                    className="btn btn-primary btn-sm mt-3"
                                    onClick={() => navigate("/training/students")}
                                >
                                    <i className="bx bx-arrow-back me-1"></i> Back to Students List
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
            <BreadCumb pageList={["Training", "Students", studentData?.student_id || "View"]} />

            {/* Student Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <div className="d-flex align-items-start">
                                <div className="flex-shrink-0">
                                    <div className="avatar avatar-xl me-3">
                                        {studentData?.profile_picture ? (
                                            <img
                                                src={studentData.profile_picture}
                                                alt="Student"
                                                className="rounded"
                                            />
                                        ) : (
                                            <span className="avatar-initial rounded bg-label-primary">
                                                <i className="bx bx-user bx-lg"></i>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-grow-1">
                                    <h4 className="mb-1 fw-bold">
                                        {studentData.first_name} {studentData.last_name}
                                        <small className="text-muted ms-2 fw-normal">({studentData.student_id})</small>
                                    </h4>
                                    <p className="mb-2 text-muted">
                                        {studentData.email && (
                                            <>
                                                <a href={`mailto:${studentData.email}`}>{studentData.email}</a>
                                                {studentData.primary_phone && " • "}
                                            </>
                                        )}
                                        {studentData.primary_phone && (
                                            <a href={`tel:${studentData.primary_phone}`}>{studentData.primary_phone}</a>
                                        )}
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {getStatusBadge(studentData.are_you_currently_studying)}
                                        {studentData.sex && getGenderBadge(studentData.sex)}
                                        {studentData.type && getTypeBadge(studentData.type)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            <button
                                className="btn btn-primary me-2"
                                data-bs-toggle="modal"
                                data-bs-target="#studentModal"
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
                                className={`nav-link ${activeTab === "contact" ? "active" : ""}`}
                                onClick={() => setActiveTab("contact")}
                                role="tab"
                                style={{ cursor: "pointer" }}
                            >
                                <i className="bx bx-phone me-2"></i>Contact Information
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link ${activeTab === "academic" ? "active" : ""}`}
                                onClick={() => setActiveTab("academic")}
                                role="tab"
                                style={{ cursor: "pointer" }}
                            >
                                <i className="bx bx-book me-2"></i>Academic
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link ${activeTab === "applications" ? "active" : ""}`}
                                onClick={() => setActiveTab("applications")}
                                role="tab"
                                style={{ cursor: "pointer" }}
                            >
                                <i className="bx bx-file me-2"></i>Applications
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link ${activeTab === "payments" ? "active" : ""}`}
                                onClick={() => setActiveTab("payments")}
                                role="tab"
                                style={{ cursor: "pointer" }}
                            >
                                <i className="bx bx-credit-card me-2"></i>Payments
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
                                    <h5 className="mb-3 fw-semibold">Personal Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>First Name:</td>
                                                <td>{studentData.first_name || "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Last Name:</td>
                                                <td>{studentData.last_name || "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Student ID:</td>
                                                <td><code className="bg-light px-2 py-1 rounded">{studentData.student_id}</code></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Gender:</td>
                                                <td>{getGenderBadge(studentData.sex)}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Date of Birth:</td>
                                                <td>{studentData.date_of_birth ? formatDate(studentData.date_of_birth, "DD/MM/YYYY") : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Nationality:</td>
                                                <td>
                                                    {studentData.nationality ? (
                                                        typeof studentData.nationality === 'object' ? studentData.nationality.name : studentData.nationality
                                                    ) : "-"}
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
                                                <td className="fw-medium" style={{ width: "40%" }}>Student Type:</td>
                                                <td>{getTypeBadge(studentData.type)}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Status:</td>
                                                <td>{getStatusBadge(studentData.are_you_currently_studying)}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Passport Number:</td>
                                                <td><code className="bg-light px-2 py-1 rounded">{studentData.passport_number || "-"}</code></td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Registration Date:</td>
                                                <td>{studentData.created_at ? formatDate(studentData.created_at, "DD/MM/YYYY") : "-"}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Last Updated:</td>
                                                <td>{studentData.updated_at ? formatDate(studentData.updated_at, "DD/MM/YYYY") : "-"}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contact Information Tab */}
                    {activeTab === "contact" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="row">
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">Contact Details</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Email:</td>
                                                <td>
                                                    {studentData.email ? (
                                                        <a href={`mailto:${studentData.email}`}>{studentData.email}</a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Primary Phone:</td>
                                                <td>
                                                    {studentData.primary_phone ? (
                                                        <a href={`tel:${studentData.primary_phone}`}>{studentData.primary_phone}</a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">Secondary Phone:</td>
                                                <td>
                                                    {studentData.secondary_phone ? (
                                                        <a href={`tel:${studentData.secondary_phone}`}>{studentData.secondary_phone}</a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">Address Information</h5>
                                    <table className="table table-borderless">
                                        <tbody>
                                            <tr>
                                                <td className="fw-medium" style={{ width: "40%" }}>Country:</td>
                                                <td>
                                                    {studentData.country ? (
                                                        typeof studentData.country === 'object' ? studentData.country.name : studentData.country
                                                    ) : "-"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">State/Region:</td>
                                                <td>
                                                    {studentData.state ? (
                                                        typeof studentData.state === 'object' ? studentData.state.name : studentData.state
                                                    ) : "-"}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-medium">City:</td>
                                                <td>
                                                    {studentData.city ? (
                                                        typeof studentData.city === 'object' ? studentData.city.name : studentData.city
                                                    ) : "-"}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Academic Tab */}
                    {activeTab === "academic" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="row">
                                <div className="col-md-6">
                                    <h5 className="mb-3 fw-semibold">Academic Information</h5>
                                    <table className="table table-borderless">
                                         <tbody>
                                             <tr>
                                                 <td className="fw-medium" style={{ width: "40%" }}>Institution:</td>
                                                 <td>
                                                     {studentData.institution_name ? (
                                                         typeof studentData.institution_name === 'object' ? studentData.institution_name.name : studentData.institution_name
                                                     ) : "-"}
                                                 </td>
                                             </tr>
                                             <tr>
                                                 <td className="fw-medium">Department:</td>
                                                 <td>
                                                     {studentData.department ? (
                                                         typeof studentData.department === 'object' ? studentData.department.name : studentData.department
                                                     ) : "-"}
                                                 </td>
                                             </tr>
                                             <tr>
                                                 <td className="fw-medium">Program:</td>
                                                 <td>
                                                     {studentData.program ? (
                                                         typeof studentData.program === 'object' ? studentData.program.name : studentData.program
                                                     ) : "-"}
                                                 </td>
                                             </tr>
                                             <tr>
                                                 <td className="fw-medium">Year of Study:</td>
                                                 <td>{studentData.year_of_study || "-"}</td>
                                             </tr>
                                         </tbody>
                                     </table>
                                 </div>
                                 <div className="col-md-6">
                                     <h5 className="mb-3 fw-semibold">Additional Details</h5>
                                     <table className="table table-borderless">
                                         <tbody>
                                             <tr>
                                                 <td className="fw-medium" style={{ width: "40%" }}>Supervisor:</td>
                                                 <td>{studentData.supervisor_name || "-"}</td>
                                             </tr>
                                             <tr>
                                                 <td className="fw-medium">Supervisor Email:</td>
                                                 <td>
                                                     {studentData.supervisor_email ? (
                                                         <a href={`mailto:${studentData.supervisor_email}`}>{studentData.supervisor_email}</a>
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

                    {/* Applications Tab */}
                    {activeTab === "applications" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="alert alert-info" role="alert">
                                <i className="bx bx-info-circle me-2"></i>
                                Applications information will be displayed here.
                            </div>
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === "payments" && (
                        <div className="animate__animated animate__fadeIn animate__faster">
                            <div className="alert alert-info" role="alert">
                                <i className="bx bx-info-circle me-2"></i>
                                Payment information will be displayed here.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <StudentModal
                student={studentData}
                onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
        </>
    );
};
