// ict_assets/components/DashboardCharts.jsx
import React from 'react';

export const DoughnutChart = ({ data }) => {
    // Simple CSS-based doughnut chart - you can replace with Chart.js or Recharts
    return (
        <div className="doughnut-chart">
            {data.map((item, index) => (
                <div key={index} className="chart-item mb-2">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <div 
                                className="color-indicator me-2"
                                style={{
                                    backgroundColor: getStatusColor(item.status),
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%'
                                }}
                            ></div>
                            <span className="text-sm">{item.status}</span>
                        </div>
                        <div className="text-end">
                            <span className="fw-bold">{item.count}</span>
                            <br />
                            <small className="text-muted">{item.percentage}%</small>
                        </div>
                    </div>
                    <div className="progress mt-1" style={{ height: '6px' }}>
                        <div 
                            className="progress-bar" 
                            style={{ 
                                width: `${item.percentage}%`,
                                backgroundColor: getStatusColor(item.status)
                            }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const BarChart = ({ data }) => {
    // Simple bar chart implementation
    const maxValue = Math.max(...data.map(item => item.count));
    
    return (
        <div className="bar-chart">
            {data.map((item, index) => (
                <div key={index} className="bar-item mb-3">
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-sm">{item.category}</span>
                        <span className="fw-bold">{item.count}</span>
                    </div>
                    <div className="progress" style={{ height: '20px' }}>
                        <div 
                            className="progress-bar bg-primary" 
                            style={{ 
                                width: `${(item.count / maxValue) * 100}%` 
                            }}
                        >
                            {item.count}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const ActivityFeed = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-muted">No recent activities</p>
            </div>
        );
    }

    return (
        <div className="activity-feed">
            {activities.slice(0, 8).map((activity, index) => (
                <div key={index} className="activity-item d-flex align-items-start mb-3">
                    <div className={`activity-badge me-3 flex-shrink-0 ${
                        getActivityTypeClass(activity.activity_type)
                    }`}>
                        <i className={getActivityIcon(activity.activity_type)}></i>
                    </div>
                    <div className="activity-content flex-grow-1">
                        <div className="d-flex justify-content-between">
                            <h6 className="mb-1">{activity.description}</h6>
                            <small className="text-muted">
                                {new Date(activity.timestamp).toLocaleDateString()}
                            </small>
                        </div>
                        <p className="mb-1 text-muted">
                            Asset: <strong>{activity.asset_tag}</strong> • 
                            By: <strong>{activity.user}</strong>
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// New Progress Chart Component
export const ProgressChart = ({ completed, scheduled, backlog }) => {
    const total = completed + scheduled + backlog;
    
    return (
        <div className="progress-chart">
            <div className="d-flex justify-content-between mb-1">
                <small>Completed: {completed}</small>
                <small>Scheduled: {scheduled}</small>
                <small>Backlog: {backlog}</small>
            </div>
            <div className="progress" style={{ height: '20px' }}>
                <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${(completed / total) * 100}%` }}
                    title={`Completed: ${completed}`}
                ></div>
                <div 
                    className="progress-bar bg-warning" 
                    style={{ width: `${(scheduled / total) * 100}%` }}
                    title={`Scheduled: ${scheduled}`}
                ></div>
                <div 
                    className="progress-bar bg-danger" 
                    style={{ width: `${(backlog / total) * 100}%` }}
                    title={`Backlog: ${backlog}`}
                ></div>
            </div>
        </div>
    );
};

// New Warranty Timeline Component
export const WarrantyTimeline = ({ alerts }) => {
    if (!alerts.alerts_summary) {
        return (
            <div className="text-center py-3">
                <p className="text-muted">No warranty data available</p>
            </div>
        );
    }

    const { alerts_summary } = alerts;
    const totalWithWarranty = alerts.total_assets_with_warranty || 0;

    return (
        <div className="warranty-timeline">
            {/* Expired */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                    <div className="bg-danger rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                    <small>Expired</small>
                </div>
                <div className="text-end">
                    <span className="fw-bold text-danger">{alerts_summary.expired}</span>
                    <br />
                    <small className="text-muted">
                        {totalWithWarranty ? Math.round((alerts_summary.expired / totalWithWarranty) * 100) : 0}%
                    </small>
                </div>
            </div>

            {/* Expiring in 7 days */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                    <div className="bg-warning rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                    <small>Expiring in 7 days</small>
                </div>
                <div className="text-end">
                    <span className="fw-bold text-warning">{alerts_summary.expiring_7_days}</span>
                </div>
            </div>

            {/* Expiring in 30 days */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                    <div className="bg-info rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                    <small>Expiring in 30 days</small>
                </div>
                <div className="text-end">
                    <span className="fw-bold text-info">{alerts_summary.expiring_30_days}</span>
                </div>
            </div>

            {/* Expiring in 90 days */}
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                    <div className="bg-primary rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                    <small>Expiring in 90 days</small>
                </div>
                <div className="text-end">
                    <span className="fw-bold text-primary">{alerts_summary.expiring_90_days}</span>
                </div>
            </div>

            {/* No Warranty */}
            <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <div className="bg-secondary rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                    <small>No Warranty</small>
                </div>
                <div className="text-end">
                    <span className="fw-bold text-secondary">{alerts_summary.no_warranty}</span>
                </div>
            </div>

            {/* Summary */}
            <div className="mt-3 p-2 bg-light rounded">
                <div className="text-center">
                    <small className="text-muted">
                        {totalWithWarranty} assets with active warranties
                    </small>
                </div>
            </div>
        </div>
    );
};

// Helper functions
const getStatusColor = (status) => {
    const colors = {
        'Operational': '#28a745',
        'In Repair': '#ffc107',
        'Retired': '#6c757d',
        'Lost': '#dc3545',
        'Disposed': '#343a40'
    };
    return colors[status] || '#6c757d';
};

const getActivityTypeClass = (type) => {
    const classes = {
        'Maintenance': 'bg-warning',
        'Assignment': 'bg-info',
        'Purchase': 'bg-success',
        'Disposal': 'bg-danger'
    };
    return classes[type] || 'bg-secondary';
};

const getActivityIcon = (type) => {
    const icons = {
        'Maintenance': 'bx bx-wrench',
        'Assignment': 'bx bx-user-check',
        'Purchase': 'bx bx-purchase-tag',
        'Disposal': 'bx bx-trash'
    };
    return icons[type] || 'bx bx-info-circle';
};