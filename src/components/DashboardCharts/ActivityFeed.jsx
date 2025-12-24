import React from 'react';

export const ActivityFeed = ({ activities = [] }) => {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-history text-muted display-4"></i>
                <p className="text-muted mt-2">No recent activities</p>
            </div>
        );
    }

    return (
        <div className="activity-feed">
            {activities.slice(0, 8).map((activity, index) => (
                <div key={index} className="activity-item d-flex align-items-start mb-3 pb-3 border-bottom">
                    <div className={`activity-badge me-3 flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center ${
                        getActivityTypeClass(activity.activity_type || activity.type)
                    }`} style={{ width: '40px', height: '40px', color: 'white' }}>
                        <i className={getActivityIcon(activity.activity_type || activity.type)}></i>
                    </div>
                    <div className="activity-content flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 className="mb-1">{activity.description || activity.title}</h6>
                                <p className="mb-1 text-muted small">
                                    {activity.asset_tag && `Asset: ${activity.asset_tag}`}
                                    {activity.asset_tag && activity.user && ' • '}
                                    {activity.user && `By: ${activity.user}`}
                                    {activity.details && ` - ${activity.details}`}
                                </p>
                            </div>
                            <small className="text-muted text-nowrap ms-2">
                                {formatDate(activity.timestamp || activity.date)}
                            </small>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const getActivityTypeClass = (type) => {
    const classes = {
        'Maintenance': 'bg-warning',
        'Assignment': 'bg-info',
        'Purchase': 'bg-success',
        'Disposal': 'bg-danger',
        'Created': 'bg-success',
        'Updated': 'bg-info',
        'Deleted': 'bg-danger',
        'Approved': 'bg-success',
        'Rejected': 'bg-danger',
        'Submitted': 'bg-primary'
    };
    return classes[type] || 'bg-secondary';
};

const getActivityIcon = (type) => {
    const icons = {
        'Maintenance': 'bx bx-wrench',
        'Assignment': 'bx bx-user-check',
        'Purchase': 'bx bx-purchase-tag',
        'Disposal': 'bx bx-trash',
        'Created': 'bx bx-plus-circle',
        'Updated': 'bx bx-edit',
        'Deleted': 'bx bx-trash',
        'Approved': 'bx bx-check-circle',
        'Rejected': 'bx bx-x-circle',
        'Submitted': 'bx bx-send'
    };
    return icons[type] || 'bx bx-info-circle';
};

const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
