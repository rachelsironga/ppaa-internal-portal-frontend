import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import showToast from "../../../../helpers/ToastHelper";
import ReactLoading from "react-loading";
import "animate.css";
import { useNavigate } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../helpers/DateFormater";
import { getStudents, deleteStudent, searchStudents } from "./Queries";
import { StudentModal } from "./Modal";
import { ImportStudentModal } from "./ImportModal";

export const StudentsListPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        page_size: 10
    });
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const navigate = useNavigate();
    const user = useSelector((state) => state.userReducer?.data);

    // Fetch students list
    const fetchStudents = async (page = 1, search = "") => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                page_size: pagination.page_size
            };
            if (search) params.search = search;

            const response = await getStudents(params);
            
            if (response.data || response.results) {
                setStudents(response.data || response.results);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            } else {
                setStudents([]);
            }
        } catch (err) {
            console.error("Error fetching students:", err);
            setError("Failed to load students");
            showToast("Unable to fetch students", "error", "Failed");
        } finally {
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = async (value) => {
        setSearchTerm(value);
        if (value.trim()) {
            setSearching(true);
            try {
                const response = await searchStudents(value, { page_size: 50 });
                setStudents(response.data || response.results || response);
                setSearching(false);
            } catch (err) {
                console.error("Search error:", err);
                setSearching(false);
                showToast("Search failed", "error", "Failed");
            }
        } else {
            fetchStudents(1);
        }
    };

    // Handle delete
    const handleDelete = async (student) => {
        const confirmation = await Swal.fire({
            title: "Delete Student?",
            text: `Are you sure you want to delete ${student.first_name} ${student.last_name}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            cancelButtonColor: "#aaa",
            confirmButtonText: "Yes, delete it!",
        });

        if (confirmation.isConfirmed) {
            try {
                await deleteStudent(student.uid);
                showToast("Student deleted successfully", "success", "Complete");
                fetchStudents(1);
            } catch (err) {
                console.error("Error deleting student:", err);
                showToast("Failed to delete student", "error", "Failed");
            }
        }
    };

    // Load students on mount and when refreshKey changes
    useEffect(() => {
        fetchStudents(1);
    }, [refreshKey]);

    if (loading && students.length === 0) {
        return (
            <>
                <BreadCumb pageList={["Training", "Students"]} />
                <div className="card">
                    <div className="card-body">
                        <center>
                            <ReactLoading type={"cylon"} color={"#696cff"} height={"30px"} width={"50px"} />
                            <h6 className="text-muted mt-2">Loading Students...</h6>
                        </center>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <BreadCumb pageList={["Training", "Students"]} />

            {/* Header Card */}
            <div className="card mb-4 shadow-sm animate__animated animate__fadeInDown animate__faster">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1 fw-bold">
                                <i className="bx bx-user-circle me-2"></i>Students Management
                            </h4>
                            <p className="text-muted mb-0">Manage and monitor training students</p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-outline-info"
                                data-bs-toggle="modal"
                                data-bs-target="#importStudentModal"
                            >
                                <i className="bx bx-upload me-2"></i>Import
                            </button>
                            <button
                                className="btn btn-primary"
                                data-bs-toggle="modal"
                                data-bs-target="#studentModal"
                                onClick={() => setSelectedStudent(null)}
                            >
                                <i className="bx bx-plus me-2"></i>Add New Student
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter Card */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row align-items-end">
                        <div className="col-md-8">
                            <label className="form-label fw-semibold">Search Students</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name, ID, email, phone..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                        <div className="col-md-4">
                            <button
                                className="btn btn-outline-primary w-100"
                                onClick={() => {
                                    setSearchTerm("");
                                    fetchStudents(1);
                                }}
                            >
                                <i className="bx bx-refresh me-2"></i>Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="card">
                <div className="card-header border-bottom">
                    <h5 className="card-title mb-0">
                        <i className="bx bx-list-ul me-2"></i>
                        Students List
                        <span className="badge bg-primary ms-2">{students.length}</span>
                    </h5>
                </div>

                <div className="card-body">
                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            <i className="bx bx-error-circle me-2"></i>{error}
                            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                        </div>
                    )}

                    {searching ? (
                        <div className="text-center py-4">
                            <ReactLoading type={"spin"} color={"#696cff"} height={30} width={30} />
                            <p className="text-muted mt-2">Searching...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="alert alert-info text-center py-4">
                            <i className="bx bx-info-circle me-2" style={{ fontSize: "1.5rem" }}></i>
                            <h6 className="mt-2">No students found</h6>
                            {searchTerm && <p className="text-muted mb-0">Try adjusting your search terms</p>}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Full Name</th>
                                        <th>Student ID</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.uid}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {student.profile_picture ? (
                                                        <img
                                                            src={student.profile_picture}
                                                            alt={student.first_name}
                                                            className="rounded-circle me-2"
                                                            width="32"
                                                            height="32"
                                                        />
                                                    ) : (
                                                        <div className="avatar avatar-sm me-2">
                                                            <span className="avatar-initial rounded-circle bg-label-primary">
                                                                {student.first_name?.[0]?.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h6 className="mb-0">
                                                            {student.full_name || `${student.first_name} ${student.last_name}`}
                                                        </h6>
                                                        <small className="text-muted">{student.sex === 'M' ? 'Male' : student.sex === 'F' ? 'Female' : '-'}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <code className="bg-light px-2 py-1 rounded">{student.student_id}</code>
                                            </td>
                                            <td>
                                                <a href={`mailto:${student.email}`} className="text-truncate">
                                                    {student.email}
                                                </a>
                                            </td>
                                            <td>{student.primary_phone || "-"}</td>
                                            <td>
                                                {student.type === 'LC' ? (
                                                    <span className="badge bg-success">Local</span>
                                                ) : (
                                                    <span className="badge bg-info">Foreign</span>
                                                )}
                                            </td>
                                            <td>
                                                {student.are_you_currently_studying ? (
                                                    <span className="badge bg-success">
                                                        <i className="bx bx-check me-1"></i>Active
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary">Inactive</span>
                                                )}
                                            </td>
                                            <td>
                                                <small>{formatDate(student.created_at, "DD/MM/YYYY")}</small>
                                            </td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary border-0"
                                                        title="View"
                                                        onClick={() => navigate(`/training/students/${student.uid}`)}
                                                    >
                                                        <i className="bx bx-eye"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-info border-0"
                                                        title="Edit"
                                                        onClick={() => {
                                                            setSelectedStudent(student);
                                                            const modal = document.getElementById("studentModal");
                                                            if (modal) {
                                                                new (window.bootstrap || {}).Modal(modal).show();
                                                            }
                                                        }}
                                                    >
                                                        <i className="bx bx-edit"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger border-0"
                                                        title="Delete"
                                                        onClick={() => handleDelete(student)}
                                                    >
                                                        <i className="bx bx-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.total_pages > 1 && (
                        <nav aria-label="Page navigation" className="mt-4">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => fetchStudents(1, searchTerm)}
                                        disabled={pagination.current_page === 1}
                                    >
                                        Previous
                                    </button>
                                </li>

                                {Array.from({ length: Math.min(pagination.total_pages, 5) }, (_, i) => i + 1).map((page) => (
                                    <li key={page} className={`page-item ${pagination.current_page === page ? 'active' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => fetchStudents(page, searchTerm)}
                                        >
                                            {page}
                                        </button>
                                    </li>
                                ))}

                                <li className={`page-item ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => fetchStudents(pagination.current_page + 1, searchTerm)}
                                        disabled={pagination.current_page === pagination.total_pages}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </div>
            </div>

            {/* Modals */}
            <StudentModal 
                student={selectedStudent}
                onSuccess={() => {
                    setRefreshKey(prev => prev + 1);
                    setSelectedStudent(null);
                }}
                onClose={() => setSelectedStudent(null)}
            />
            <ImportStudentModal onSuccess={() => setRefreshKey(prev => prev + 1)} />
        </>
    );
};
