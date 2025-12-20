import React from 'react';

export const ProgressChart = ({ items = [], title = '' }) => {
    if (!items || items.length === 0) {
        return (
            <div className="text-center py-4">
                <p className="text-muted">No progress data available</p>
            </div>
        );
    }

    // Handle both array and object format
    let processedItems = [];
    if (Array.isArray(items)) {
        processedItems = items;
    } else {
        // Convert object to array format
        processedItems = [
            { label: 'Completed', value: items.completed, color: 'bg-success' },
            { label: 'Scheduled', value: items.scheduled, color: 'bg-warning' },
            { label: 'Backlog', value: items.backlog, color: 'bg-danger' }
        ];
    }

    const total = processedItems.reduce((sum, item) => sum + (item.value || item.count || 0), 0);
    
    return (
        <div className="progress-chart">
            {title && <h6 className="mb-3">{title}</h6>}
            <div className="d-flex justify-content-between mb-2 flex-wrap">
                {processedItems.map((item, index) => (
                    <small key={index} className="text-muted">
                        <span className={`badge ${item.color || 'bg-secondary'} me-1`}></span>
                        {item.label}: {item.value || item.count}
                    </small>
                ))}
            </div>
            <div className="progress" style={{ height: '20px' }}>
                {processedItems.map((item, index) => (
                    <div 
                        key={index}
                        className={`progress-bar ${item.color || 'bg-secondary'}`}
                        style={{ width: `${total > 0 ? ((item.value || item.count) / total) * 100 : 0}%` }}
                        title={`${item.label}: ${item.value || item.count}`}
                    ></div>
                ))}
            </div>
        </div>
    );
};
