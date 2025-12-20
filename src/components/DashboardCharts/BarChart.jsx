import React from 'react';

export const BarChart = ({ data = [], barColor = 'bg-primary' }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-bar-chart-alt text-muted display-4"></i>
                <p className="text-muted mt-2">No data available</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item.count || item.value || 0));
    
    return (
        <div className="bar-chart">
            {data.map((item, index) => (
                <div key={index} className="bar-item mb-3">
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-sm">{item.category || item.label}</span>
                        <span className="fw-bold">{item.count || item.value}</span>
                    </div>
                    <div className="progress" style={{ height: '20px' }}>
                        <div 
                            className={`progress-bar ${item.barColor || barColor}`}
                            style={{ 
                                width: `${((item.count || item.value) / maxValue) * 100}%`,
                                backgroundColor: item.color
                            }}
                        >
                            {item.count || item.value}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
