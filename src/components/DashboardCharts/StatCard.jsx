import React from 'react';

export const StatCard = ({ 
    title, 
    value, 
    icon, 
    color = 'primary', 
    subtitle, 
    percentage,
    trend = 'up' 
}) => {
    return (
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
                        <h3 className="card-title mb-0">{value}</h3>
                        {percentage !== undefined && (
                            <small className={`text-${trend === 'up' ? 'success' : 'danger'} fw-medium`}>
                                <i className={`bx bx-trending-${trend}`}></i> {percentage}%
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
};
