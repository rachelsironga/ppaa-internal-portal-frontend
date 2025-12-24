import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import React from "react";
import "animate.css";
import Swal from "sweetalert2";
import { 
    DoughnutChart, 
    BarChart, 
    ActivityFeed,
    ProgressChart,
    StatCard
} from "../../../../components/DashboardCharts";

// Mock dashboard service - replace with actual API calls
const trainingDashboardService = {
    getAllDashboardData: async () => {
        // Simulated data - replace with actual API calls
        return {
            summary: {
                total_students: 245,
                active_students: 180,
                completed_students: 65,
                pending_applications: 12,
                approved_applications: 89,
                rejected_applications: 8,
                total_institutions: 15,
                total_batches: 8,
                active_batches: 3
            },
            student_status: [
                { status: 'Active', count: 180, percentage: 73 },
                { status: 'Completed', count: 65, percentage: 27 }
            ],
            application_status: [
                { status: 'Approved', count: 89, percentage: 84, color: '#28a745' },
                { status: 'Pending', count: 12, percentage: 11, color: '#ffc107' },
                { status: 'Rejected', count: 8, percentage: 5, color: '#dc3545' }
            ],
            batch_distribution: [
                { category: 'Medical', count: 3 },
                { category: 'Nursing', count: 2 },
                { category: 'Technical', count: 2 },
                { category: 'Administrative', count: 1 }
            ],
            progress_metrics: {
                completed: 45,
                scheduled: 30,
                backlog: 8
            },
            recent_activities: [
                {
                    type: 'Created',
                    title: 'New Student Created',
                    description: 'Student John Doe registered',
                    user: 'Admin User',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    details: 'Medical Department'
                },
                {
                    type: 'Approved',
                    title: 'Application Approved',
                    description: 'Training application approved',
                    user: 'Training Head',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                    details: '5 students approved'
                },
                {
                    type: 'Submitted',
                    title: 'Batch Created',
                    description: 'Medical Training Batch 2025',
                    user: 'Coordinator',
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    details: 'Starting Jan 2025'
                },
                {
                    type: 'Updated',
                    title: 'Student Updated',
                    description: 'Student information modified',
                    user: 'Department Admin',
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    details: 'Academic records updated'
                }
            ]
        };
    }
};

export const TrainingDashboardPage = () => {
    const user = useSelector((state) => state.userReducer?.data);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await trainingDashboardService.getAllDashboardData();
                setDashboardData(data);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                setError(err.message || 'Failed to load dashboard data');
                Swal.fire({
                    icon: 'error',
                    title: 'Dashboard Error',
                    text: 'Failed to load dashboard data. Please try again.',
                    confirmButtonText: 'Retry',
                    showCancelButton: true,
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        fetchDashboardData();
                    }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger mx-3 mt-3" role="alert">
                <div className="d-flex align-items-center">
                    <i className="bx bx-error-circle me-2"></i>
                    <div>
                        <h6 className="alert-heading mb-1">Failed to load dashboard</h6>
                        <p className="mb-0">{error}</p>
                    </div>
                </div>
                <button 
                    className="btn btn-sm btn-outline-danger mt-2"
                    onClick={() => window.location.reload()}
                >
                    <i className="bx bx-refresh me-1"></i>
                    Reload Page
                </button>
            </div>
        );
    }

    const { 
        summary = {}, 
        student_status = [], 
        application_status = [],
        batch_distribution = [],
        progress_metrics = {},
        recent_activities = [] 
    } = dashboardData || {};

    const approvalRate = summary?.approved_applications && summary?.total_applications ?
        ((summary.approved_applications / (summary.approved_applications + summary.pending_applications + summary.rejected_applications)) * 100).toFixed(1) : 0;

    const completionRate = summary?.completed_students && summary?.total_students ?
        ((summary.completed_students / summary.total_students) * 100).toFixed(1) : 0;

    return (
        <div className="container-fluid">
            {/* Welcome Card */}
            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card">
                        <div className="d-flex align-items-end row">
                            <div className="col-md-8">
                                <div className="card-body">
                                    <h5 className="card-title text-primary">
                                        Welcome, {user?.first_name} {user?.last_name}!
                                    </h5>
                                    <p className="mb-4">
                                        Please note that every action you perform in <span className="fw-medium">Training Management</span> is crucial to the success of the organization.
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        <a 
                                            href="/training/students"
                                            className="btn btn-sm btn-primary"
                                        >
                                            <i className="bx bx-user-check me-1"></i>
                                            Manage Students
                                        </a>
                                        <a 
                                            href="/training/applications"
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            <i className="bx bx-file me-1"></i>
                                            View Applications
                                        </a>
                                        <button 
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => window.location.reload()}
                                        >
                                            <i className="bx bx-refresh me-1"></i>
                                            Refresh Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4 text-center text-md-left d-none d-md-block">
                                <div className="card-body pb-0 px-0 px-md-4">
                                    <img 
                                        src="/assets/img/illustrations/man-with-laptop-light.png"
                                        height="140"
                                        alt="Training Dashboard"
                                        data-app-dark-img="illustrations/man-with-laptop-dark.png"
                                        data-app-light-img="illustrations/man-with-laptop-light.png"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics - Row 1 */}
            <div className="row">
                <div className="col-sm-6 col-lg-3 mb-4">
                    <StatCard
                        title="Total Students"
                        value={summary?.total_students || 0}
                        icon="bx-user-plus"
                        color="primary"
                        subtitle="Registered students"
                    />
                </div>

                <div className="col-sm-6 col-lg-3 mb-4">
                    <StatCard
                        title="Active Students"
                        value={summary?.active_students || 0}
                        icon="bx-check-circle"
                        color="success"
                        percentage={completionRate}
                        subtitle="Currently enrolled"
                    />
                </div>

                <div className="col-sm-6 col-lg-3 mb-4">
                    <StatCard
                        title="Applications"
                        value={(summary?.approved_applications || 0) + (summary?.pending_applications || 0) + (summary?.rejected_applications || 0)}
                        icon="bx-file-blank"
                        color="info"
                        subtitle="Total submitted"
                    />
                </div>

                <div className="col-sm-6 col-lg-3 mb-4">
                    <StatCard
                        title="Active Batches"
                        value={summary?.active_batches || 0}
                        icon="bx-book"
                        color="warning"
                        subtitle="Running programs"
                    />
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="row">
                {/* Student Status */}
                <div className="col-lg-4 col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Student Status</h5>
                            <span className="badge bg-primary">{summary?.total_students || 0}</span>
                        </div>
                        <div className="card-body">
                            {student_status.length > 0 ? (
                                <DoughnutChart data={student_status} />
                            ) : (
                                <div className="text-center py-4">
                                    <i className="bx bx-pie-chart-alt text-muted display-4"></i>
                                    <p className="text-muted mt-2">No data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Application Status */}
                <div className="col-lg-4 col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Application Status</h5>
                            <span className="badge bg-info">
                                {(summary?.approved_applications || 0) + (summary?.pending_applications || 0) + (summary?.rejected_applications || 0)}
                            </span>
                        </div>
                        <div className="card-body">
                            {application_status.length > 0 ? (
                                <DoughnutChart data={application_status} />
                            ) : (
                                <div className="text-center py-4">
                                    <i className="bx bx-pie-chart-alt text-muted display-4"></i>
                                    <p className="text-muted mt-2">No data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Training Progress */}
                <div className="col-lg-4 col-md-12 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Training Progress</h5>
                        </div>
                        <div className="card-body">
                            <ProgressChart items={[
                                { label: 'Completed', value: progress_metrics?.completed || 0, color: 'bg-success' },
                                { label: 'Scheduled', value: progress_metrics?.scheduled || 0, color: 'bg-warning' },
                                { label: 'Backlog', value: progress_metrics?.backlog || 0, color: 'bg-danger' }
                            ]} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="row">
                {/* Batch Distribution */}
                <div className="col-lg-6 col-md-12 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Batch Distribution by Department</h5>
                        </div>
                        <div className="card-body">
                            {batch_distribution.length > 0 ? (
                                <BarChart data={batch_distribution} barColor="bg-primary" />
                            ) : (
                                <div className="text-center py-4">
                                    <i className="bx bx-bar-chart-alt text-muted display-4"></i>
                                    <p className="text-muted mt-2">No data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Key Metrics Summary */}
                <div className="col-lg-6 col-md-12 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Training Summary</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-6 mb-3">
                                    <div className="border rounded p-3">
                                        <div className="text-center">
                                            <div className="display-6 text-success fw-bold mb-1">
                                                {approvalRate}%
                                            </div>
                                            <small className="text-muted">Approval Rate</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 mb-3">
                                    <div className="border rounded p-3">
                                        <div className="text-center">
                                            <div className="display-6 text-primary fw-bold mb-1">
                                                {completionRate}%
                                            </div>
                                            <small className="text-muted">Completion Rate</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row g-2 mt-2">
                                <div className="col-6">
                                    <div className="alert alert-success d-flex align-items-center mb-2">
                                        <i className="bx bx-check-circle me-2"></i>
                                        <div>
                                            <small className="fw-medium">Approved</small>
                                            <br />
                                            <strong>{summary?.approved_applications || 0}</strong>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="alert alert-warning d-flex align-items-center mb-2">
                                        <i className="bx bx-time-five me-2"></i>
                                        <div>
                                            <small className="fw-medium">Pending</small>
                                            <br />
                                            <strong>{summary?.pending_applications || 0}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="alert alert-info d-flex align-items-center">
                                <i className="bx bx-building me-2"></i>
                                <div>
                                    <small className="fw-medium">Training Institutions</small>
                                    <br />
                                    <strong>{summary?.total_institutions || 0} institutions</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Recent Activities</h5>
                            <a href="/training/students" className="btn btn-sm btn-outline-primary">
                                View All
                            </a>
                        </div>
                        <div className="card-body">
                            <ActivityFeed activities={recent_activities} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
