import React from 'react';

export const DoughnutChart = ({ data = [] }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-pie-chart-alt text-muted display-4"></i>
                <p className="text-muted mt-2">No data available</p>
            </div>
        );
    }

    return (
        <div className="doughnut-chart">
            {data.map((item, index) => (
                <div key={index} className="chart-item mb-2">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <div 
                                className="color-indicator me-2"
                                style={{
                                    backgroundColor: item.color || getStatusColor(item.status || item.label),
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%'
                                }}
                            ></div>
                            <span className="text-sm">{item.status || item.label}</span>
                        </div>
                        <div className="text-end">
                            <span className="fw-bold">{item.count || item.value}</span>
                            <br />
                            <small className="text-muted">{item.percentage}%</small>
                        </div>
                    </div>
                    <div className="progress mt-1" style={{ height: '6px' }}>
                        <div 
                            className="progress-bar" 
                            style={{ 
                                width: `${item.percentage}%`,
                                backgroundColor: item.color || getStatusColor(item.status || item.label)
                            }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const getStatusColor = (status) => {
    const colors = {
        'Operational': '#28a745',
        'In Repair': '#ffc107',
        'Retired': '#6c757d',
        'Lost': '#dc3545',
        'Disposed': '#343a40',
        'Active': '#28a745',
        'Inactive': '#6c757d',
        'Pending': '#ffc107',
        'Completed': '#28a745',
        'Failed': '#dc3545'
    };
    return colors[status] || '#6c757d';
};
