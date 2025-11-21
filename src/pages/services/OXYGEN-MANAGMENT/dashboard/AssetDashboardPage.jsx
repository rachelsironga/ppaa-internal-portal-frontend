import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import React from "react";
import "animate.css";
import { dashboardService } from "./DashboardQueries.jsx";
import Swal from "sweetalert2";

// Chart components
import { 
  DoughnutChart, 
  BarChart, 
  ActivityFeed,
  ProgressChart,
  WarrantyTimeline 
} from "../components/DashboardCharts";

export const AssetDashboardPage = () => {
    const user = useSelector((state) => state.userReducer?.data);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const data = await dashboardService.getAllDashboardData();
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
                        fetchDashboardData(); // Retry
                    }
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Loading state
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

    // Error state
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
        summary, 
        status_distribution = [], 
        category_distribution = [],
        maintenance_metrics = {},
        warranty_alerts = {},
        asset_type_breakdown = {},
        recent_activities = [] 
    } = dashboardData || {};

    // Calculate additional metrics
    const operationalRate = summary?.total_assets ? 
        ((summary.operational_assets / summary.total_assets) * 100).toFixed(1) : 0;

    return (
        <div className="container-fluid">
            {/* Welcome Card - Full width on tablet */}
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
                                        Please note that every action you perform in <span className="fw-medium">ICT Assets</span> is crucial to the success of the organization.
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        <a 
                                            href="#my-assets"
                                            className="btn btn-sm btn-outline-primary"
                                        >
                                            <i className="bx bx-laptop me-1"></i>
                                            View My Assets
                                        </a>
                                        <a 
                                            href="/ict-assets"
                                            className="btn btn-sm btn-primary"
                                        >
                                            <i className="bx bx-cog me-1"></i>
                                            Manage Assets
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
                                        alt="ICT Assets Dashboard"
                                        data-app-dark-img="illustrations/man-with-laptop-dark.png"
                                        data-app-light-img="illustrations/man-with-laptop-light.png"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics Cards - Optimized for tablet */}
            <div className="row">
                {/* Total Assets */}
                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-primary rounded p-2">
                                        <i className="bx bx-laptop text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Total Assets</span>
                                    <h3 className="card-title mb-0">{summary?.total_assets || 0}</h3>
                                    <small className="text-success">
                                        <i className="bx bx-trending-up me-1"></i>
                                        {operationalRate}% Operational
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operational Assets */}
                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-success rounded p-2">
                                        <i className="bx bx-check-circle text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Operational</span>
                                    <h3 className="card-title mb-0">{summary?.operational_assets || 0}</h3>
                                    <small className="text-muted">Ready to use</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* In Repair */}
                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-warning rounded p-2">
                                        <i className="bx bx-wrench text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">In Repair</span>
                                    <h3 className="card-title text-warning mb-0">{summary?.assets_in_repair || 0}</h3>
                                    <small className="text-warning">Needs attention</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Summary Card */}
                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="text-center mb-3">
                                <span className="fw-medium d-block mb-2">Other Statuses</span>
                            </div>
                            <div className="row g-2 text-center">
                                <div className="col-4">
                                    <div className="border rounded p-2">
                                        <small className="fw-medium d-block mb-1">Retired</small>
                                        <h6 className="text-secondary mb-0">{summary?.retired_assets || 0}</h6>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="border rounded p-2">
                                        <small className="fw-medium d-block mb-1">Lost</small>
                                        <h6 className="text-danger mb-0">{summary?.lost_assets || 0}</h6>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="border rounded p-2">
                                        <small className="fw-medium d-block mb-1">Disposed</small>
                                        <h6 className="text-dark mb-0">{summary?.disposed_assets || 0}</h6>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row - Charts & Metrics */}
            <div className="row">
                {/* Asset Status Distribution */}
                <div className="col-lg-4 col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Asset Status</h5>
                            <span className="badge bg-primary">{summary?.total_assets || 0}</span>
                        </div>
                        <div className="card-body">
                            {status_distribution.length > 0 ? (
                                <DoughnutChart data={status_distribution} />
                            ) : (
                                <div className="text-center py-4">
                                    <i className="bx bx-pie-chart-alt text-muted display-4"></i>
                                    <p className="text-muted mt-2">No status data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Asset Types Overview */}
                <div className="col-lg-4 col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Asset Types</h5>
                        </div>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                                <span className="fw-medium">
                                    <i className="bx bx-laptop text-primary me-2"></i>
                                    Computers
                                </span>
                                <div className="text-end">
                                    <span className="badge bg-primary">{summary?.total_computers || 0}</span>
                                    <br />
                                    <small className="text-muted">
                                        {asset_type_breakdown?.hardware_types ? 
                                            Math.round((summary?.total_computers / asset_type_breakdown.hardware_types.total_hardware) * 100) : 0
                                        }% of hardware
                                    </small>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                                <span className="fw-medium">
                                    <i className="bx bx-wifi text-info me-2"></i>
                                    Network Devices
                                </span>
                                <div className="text-end">
                                    <span className="badge bg-info">{summary?.total_network_devices || 0}</span>
                                    <br />
                                    <small className="text-muted">
                                        {asset_type_breakdown?.hardware_types ? 
                                            Math.round((summary?.total_network_devices / asset_type_breakdown.hardware_types.total_hardware) * 100) : 0
                                        }% of hardware
                                    </small>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                                <span className="fw-medium">
                                    <i className="bx bx-printer text-success me-2"></i>
                                    Peripherals
                                </span>
                                <div className="text-end">
                                    <span className="badge bg-success">{summary?.total_peripherals || 0}</span>
                                    <br />
                                    <small className="text-muted">
                                        {asset_type_breakdown?.hardware_types ? 
                                            Math.round((summary?.total_peripherals / asset_type_breakdown.hardware_types.total_hardware) * 100) : 0
                                        }% of hardware
                                    </small>
                                </div>
                            </div>
                            
                            {/* Total Value */}
                            <div className="mt-3 p-3 bg-primary text-white rounded">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-medium">Total Asset Value</span>
                                    <span className="fw-bold">
                                        TSH{summary?.total_asset_value ? 
                                            parseFloat(summary.total_asset_value).toLocaleString() : '0'
                                        }
                                    </span>
                                </div>
                                <small>Average: TSH{summary?.average_asset_cost ? parseFloat(summary.average_asset_cost).toFixed(2) : '0'}</small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alerts & Maintenance */}
                <div className="col-lg-4 col-md-12 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Alerts & Maintenance</h5>
                        </div>
                        <div className="card-body">
                            {/* Maintenance Alerts */}
                            <div className="alert alert-warning d-flex align-items-center mb-3">
                                <i className="bx bx-time-five me-2 fs-5"></i>
                                <div className="flex-grow-1">
                                    <span className="fw-medium">Pending Maintenance</span>
                                    <br />
                                    <span className="fs-6">{summary?.pending_maintenance || 0} tasks</span>
                                    {maintenance_metrics.critical_maintenance > 0 && (
                                    <>
                                    <br />
                                        <small className="text-danger">
                                            <i className="bx bx-error"></i> {maintenance_metrics.critical_maintenance} overdue
                                        </small>
                                    </>
                                    )}
                                </div>
                            </div>
                            
                            {/* Warranty Alerts */}
                            <div className="alert alert-danger d-flex align-items-center mb-3">
                                <i className="bx bx-calendar-exclamation me-2 fs-5"></i>
                                <div className="flex-grow-1">
                                    <span className="fw-medium">Expiring Warranties</span>
                                    <br />
                                    <span className="fs-6">{summary?.expiring_warranties || 0} assets</span>
                                    {warranty_alerts.alerts_summary?.expired > 0 && (
                                        <>
                                        <br />
                                        <small>
                                            <i className="bx bx-error"></i> {warranty_alerts.alerts_summary.expired} expired
                                        </small>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Open Tickets */}
                            <div className="alert alert-info d-flex align-items-center">
                                <i className="bx bx-support me-2 fs-5"></i>
                                <div className="flex-grow-1">
                                    <span className="fw-medium">Open Support Tickets</span>
                                    <br />
                                    <span className="fs-6">{summary?.open_tickets || 0} active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Third Row - Detailed Analytics */}
            <div className="row">
                {/* Asset Types Breakdown */}
                <div className="col-lg-6 col-md-12 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Asset Types Breakdown</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                                        <span className="fw-medium">
                                            <i className="bx bx-laptop text-primary me-2"></i>
                                            Computers
                                        </span>
                                        <div className="text-end">
                                            <span className="badge bg-primary">{summary?.total_computers || 0}</span>
                                            <br />
                                            <small className="text-muted">
                                                {asset_type_breakdown?.hardware_types?.computers || 0} total
                                            </small>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                                        <span className="fw-medium">
                                            <i className="bx bx-wifi text-info me-2"></i>
                                            Network Devices
                                        </span>
                                        <div className="text-end">
                                            <span className="badge bg-info">{summary?.total_network_devices || 0}</span>
                                            <br />
                                            <small className="text-muted">
                                                {asset_type_breakdown?.hardware_types?.network_devices || 0} total
                                            </small>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                                        <span className="fw-medium">
                                            <i className="bx bx-printer text-success me-2"></i>
                                            Peripherals
                                        </span>
                                        <div className="text-end">
                                            <span className="badge bg-success">{summary?.total_peripherals || 0}</span>
                                            <br />
                                            <small className="text-muted">
                                                {asset_type_breakdown?.hardware_types?.peripherals || 0} total
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="bg-light rounded p-3 h-100 d-flex flex-column justify-content-center">
                                        <h6 className="text-center mb-3">Performance Summary</h6>
                                        <div className="text-center">
                                            <div className="display-6 text-primary mb-2">
                                                {operationalRate}%
                                            </div>
                                            <small className="text-muted">Overall Operational Rate</small>
                                        </div>
                                        {maintenance_metrics?.average_completion_time > 0 && (
                                            <div className="mt-3 text-center">
                                                <small className="text-muted">
                                                    Avg. Maintenance: {maintenance_metrics.average_completion_time} days
                                                </small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Maintenance Performance */}
                <div className="col-lg-6 col-md-12 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Maintenance Performance</h5>
                        </div>
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col-4 mb-3">
                                    <div className="border rounded p-2">
                                        <div className="text-success display-6 fw-bold">
                                            {maintenance_metrics?.completed_this_month || 0}
                                        </div>
                                        <small className="text-muted">Completed</small>
                                    </div>
                                </div>
                                <div className="col-4 mb-3">
                                    <div className="border rounded p-2">
                                        <div className="text-primary display-6 fw-bold">
                                            {maintenance_metrics?.scheduled_next_month || 0}
                                        </div>
                                        <small className="text-muted">Scheduled</small>
                                    </div>
                                </div>
                                <div className="col-4 mb-3">
                                    <div className="border rounded p-2">
                                        <div className="text-info display-6 fw-bold">
                                            {maintenance_metrics?.average_completion_time || 0}
                                        </div>
                                        <small className="text-muted">Avg. Days</small>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted">Maintenance Cost (YTD)</span>
                                    <span className="fw-bold text-success">
                                        TSH{maintenance_metrics?.maintenance_cost_ytd ? 
                                            parseFloat(maintenance_metrics.maintenance_cost_ytd).toLocaleString() : '0'
                                        }
                                    </span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                        className="progress-bar bg-success" 
                                        style={{ 
                                            width: `${Math.min((maintenance_metrics?.maintenance_cost_ytd / (summary?.total_asset_value || 1)) * 100, 100)}%` 
                                        }}
                                    ></div>
                                </div>
                                <small className="text-muted">
                                    {((maintenance_metrics?.maintenance_cost_ytd / (summary?.total_asset_value || 1)) * 100).toFixed(1)}% of total asset value
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fourth Row - Charts */}
            <div className="row">
                {/* Category Distribution */}
                <div className="col-lg-6 col-md-12 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Category Distribution</h5>
                        </div>
                        <div className="card-body">
                            {category_distribution.length > 0 ? (
                                <BarChart data={category_distribution} />
                            ) : (
                                <div className="text-center py-4">
                                    <i className="bx bx-bar-chart-alt text-muted display-4"></i>
                                    <p className="text-muted mt-2">No category data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Asset Type Analytics */}
                <div className="col-lg-6 col-md-12 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Asset Type Analytics</h5>
                        </div>
                        <div className="card-body">
                            {asset_type_breakdown.asset_types?.length > 0 ? (
                                <div className="asset-type-analytics">
                                    {asset_type_breakdown.asset_types.slice(0, 5).map((type, index) => (
                                        <div key={index} className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="fw-medium">{type.asset_type}</span>
                                                <span className="badge bg-primary">{type.count}</span>
                                            </div>
                                            <div className="progress" style={{ height: '8px' }}>
                                                <div 
                                                    className="progress-bar bg-success" 
                                                    style={{ 
                                                        width: `${type.operational_percentage}%` 
                                                    }}
                                                    title={`${type.operational_percentage}% Operational`}
                                                ></div>
                                            </div>
                                            <div className="d-flex justify-content-between mt-1">
                                                <small className="text-success">
                                                    {type.operational_count} operational
                                                </small>
                                                <small className="text-warning">
                                                    {type.in_repair_count} in repair
                                                </small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <i className="bx bx-stats text-muted display-4"></i>
                                    <p className="text-muted mt-2">No asset type data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities - Full width */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">Recent Activities</h5>
                            <a href="/ict-assets/activities" className="btn btn-sm btn-outline-primary">
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

// Metric Card Component
const MetricCard = ({ title, value, icon, color, percentage, subtitle }) => (
    <div className="card h-100">
        <div className="card-body">
            <div className="d-flex align-items-center">
                <div className="avatar flex-shrink-0">
                    <div className={`bg-${color} rounded p-2`}>
                        <i className={`bx ${icon} text-white`}></i>
                    </div>
                </div>
                <div className="ms-3">
                    <span className="fw-medium d-block mb-1">{title}</span>
                    <h3 className={`card-title mb-0 ${color ? `text-${color}` : ''}`}>{value}</h3>
                    {percentage !== undefined && (
                        <small className="text-success fw-medium">
                            <i className="bx bx-up-arrow-alt"></i> {percentage}%
                        </small>
                    )}
                    {subtitle && (
                        <small className="text-muted d-block">{subtitle}</small>
                    )}
                </div>
            </div>
        </div>
    </div>
);