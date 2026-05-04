import React from 'react';

export const StatCard = ({ title, value, icon, color, subtitle, percentage }) => (
    <div 
        className={`card widget-flat bg-${color} text-white h-100`}
        style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '';
        }}
    >
        <div className="card-body">
            <div className="float-end">
                <div className={`avatar-sm rounded-circle bg-white bg-opacity-25 p-2`}>
                    <i className={`bx ${icon} fs-4`}></i>
                </div>
            </div>
            <h5 className="fw-normal mt-0 text-white-50">{title}</h5>
            <h3 className="my-2 text-white">{value?.toLocaleString() || 0}</h3>
            {percentage !== undefined && (
                <span className="badge bg-white bg-opacity-25">{percentage}%</span>
            )}
            {subtitle && <p className="mb-0 text-white-50 small">{subtitle}</p>}
        </div>
    </div>
);

export const DoughnutChart = ({ data, labelKey = 'name', valueKey = 'value' }) => {
    const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
    const colors = ['#00853f', '#71dd37', '#ffab00', '#03c3ec', '#ff3e1d', '#8592a3'];

    return (
        <div className="doughnut-chart">
            {data.map((item, index) => {
                const percentage = total > 0 ? ((item[valueKey] / total) * 100).toFixed(1) : 0;
                return (
                    <div key={index} className="chart-item mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="d-flex align-items-center">
                                <div
                                    className="rounded-circle me-2"
                                    style={{
                                        backgroundColor: colors[index % colors.length],
                                        width: '12px',
                                        height: '12px'
                                    }}
                                ></div>
                                <span>{item[labelKey]}</span>
                            </div>
                            <div className="text-end">
                                <span className="fw-bold">{item[valueKey]?.toLocaleString()}</span>
                                <small className="text-muted ms-2">({percentage}%)</small>
                            </div>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${percentage}%`,
                                    backgroundColor: colors[index % colors.length]
                                }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const BarChart = ({ data, labelKey = 'name', valueKey = 'value', horizontal = false }) => {
    const maxValue = Math.max(...data.map(item => item[valueKey] || 0));

    if (horizontal) {
        return (
            <div className="bar-chart-horizontal">
                {data.slice(0, 10).map((item, index) => (
                    <div 
                        key={index} 
                        className="mb-3"
                        style={{
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02) translateX(5px)';
                            e.currentTarget.style.backgroundColor = 'rgba(105, 108, 255, 0.08)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1) translateX(0)';
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.boxShadow = '';
                        }}
                    >
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-truncate" style={{ maxWidth: '60%' }}>{item[labelKey]}</span>
                            <span className="fw-bold">{item[valueKey]?.toLocaleString()}</span>
                        </div>
                        <div className="progress" style={{ height: '20px' }}>
                            <div
                                className="progress-bar bg-primary"
                                style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
                            >
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bar-chart d-flex align-items-end justify-content-around" style={{ height: '200px' }}>
            {data.slice(0, 8).map((item, index) => (
                <div key={index} className="text-center" style={{ flex: 1 }}>
                    <div
                        className="bg-primary mx-1 rounded-top"
                        style={{
                            height: `${(item[valueKey] / maxValue) * 180}px`,
                            minHeight: '10px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer'
                        }}
                        title={`${item[labelKey]}: ${item[valueKey]}`}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scaleY(1.1) scaleX(1.15)';
                            e.currentTarget.style.filter = 'brightness(1.2)';
                            e.currentTarget.style.boxShadow = '0 -4px 12px rgba(105, 108, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scaleY(1) scaleX(1)';
                            e.currentTarget.style.filter = 'brightness(1)';
                            e.currentTarget.style.boxShadow = '';
                        }}
                    ></div>
                    <small className="text-muted d-block text-truncate" style={{ fontSize: '10px' }}>
                        {item[labelKey]}
                    </small>
                </div>
            ))}
        </div>
    );
};

export const TrendChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-line-chart text-muted display-4"></i>
                <p className="text-muted mt-2">No trend data available</p>
            </div>
        );
    }

    const maxTotal = Math.max(...data.map(d => d.grand_total_patients || 0));

    return (
        <div className="trend-chart">
            <div className="d-flex align-items-end" style={{ height: '200px', gap: '4px' }}>
                {data.map((item, index) => (
                    <div key={index} className="flex-fill text-center">
                        <div
                            className="bg-primary rounded-top mx-auto"
                            style={{
                                height: `${maxTotal > 0 ? (item.grand_total_patients / maxTotal) * 180 : 0}px`,
                                minHeight: item.grand_total_patients > 0 ? '10px' : '2px',
                                maxWidth: '30px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer'
                            }}
                            title={`${item.period}: ${item.grand_total_patients} patients`}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scaleY(1.15) scaleX(1.3)';
                                e.currentTarget.style.filter = 'brightness(1.2)';
                                e.currentTarget.style.boxShadow = '0 -4px 12px rgba(105, 108, 255, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scaleY(1) scaleX(1)';
                                e.currentTarget.style.filter = 'brightness(1)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        ></div>
                    </div>
                ))}
            </div>
            <div className="d-flex justify-content-between mt-2">
                <small className="text-muted">{data[0]?.period}</small>
                <small className="text-muted">{data[data.length - 1]?.period}</small>
            </div>
        </div>
    );
};

export const RecentAttendanceTable = ({ records }) => {
    if (!records || records.length === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-calendar-x text-muted display-4"></i>
                <p className="text-muted mt-2">No attendance records found</p>
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm table-hover">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th className="text-center">Total</th>
                        <th className="text-center">New</th>
                        <th className="text-center">Follow-up</th>
                        <th className="text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record, index) => (
                        <tr key={index}>
                            <td>
                                <strong>
                                    {new Date(record.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </strong>
                            </td>
                            <td className="text-center fw-bold">{record.grand_total_patients}</td>
                            <td className="text-center text-info">{record.total_new_patients}</td>
                            <td className="text-center text-success">{record.total_follow_up_patients}</td>
                            <td className="text-center">
                                {record.processed_date ? (
                                    <span className="badge bg-success">Processed</span>
                                ) : (
                                    <span className="badge bg-warning">Pending</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const BlockClinicCard = ({ blocks }) => {
    if (!blocks || blocks.length === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-building text-muted display-4"></i>
                <p className="text-muted mt-2">No block data available</p>
            </div>
        );
    }

    return (
        <div className="block-clinic-list">
            {blocks.slice(0, 6).map((block, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                    <div>
                        <span className="fw-medium">{block.block_name}</span>
                        <br />
                        <small className="text-muted">
                            <i className="bx bx-map-pin"></i> {block.location}
                        </small>
                    </div>
                    <div className="text-end">
                        <span className="badge bg-primary">{block.clinic_count} clinics</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PaymentDistributionChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-credit-card text-muted display-4"></i>
                <p className="text-muted mt-2">No payment data available</p>
            </div>
        );
    }

    const colors = ['#00853f', '#71dd37', '#ffab00', '#03c3ec', '#ff3e1d', '#8592a3', '#233446'];

    return (
        <div className="payment-distribution">
            {data.slice(0, 7).map((item, index) => (
                <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center">
                            <div
                                className="rounded me-2"
                                style={{
                                    backgroundColor: colors[index % colors.length],
                                    width: '12px',
                                    height: '12px'
                                }}
                            ></div>
                            <span>{item.payment_name}</span>
                        </div>
                        <div>
                            <span className="fw-bold">{item.total_patients?.toLocaleString()}</span>
                            <small className="text-muted ms-1">({item.percentage}%)</small>
                        </div>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                        <div
                            className="progress-bar"
                            style={{
                                width: `${item.percentage}%`,
                                backgroundColor: colors[index % colors.length]
                            }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const PieChart = ({ data, labelKey = 'name', valueKey = 'value' }) => {
    const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
    const colors = ['#00853f', '#71dd37', '#ffab00', '#03c3ec', '#ff3e1d', '#8592a3', '#233446'];

    if (total === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-pie-chart-alt text-muted display-4"></i>
                <p className="text-muted mt-2">No data available</p>
            </div>
        );
    }

    let cumulativePercent = 0;
    const segments = data.map((item, index) => {
        const percent = (item[valueKey] / total) * 100;
        const startPercent = cumulativePercent;
        cumulativePercent += percent;
        return { ...item, percent, startPercent, color: colors[index % colors.length] };
    });

    const generateConicGradient = () => {
        let gradient = '';
        segments.forEach((seg, index) => {
            if (index > 0) gradient += ', ';
            gradient += `${seg.color} ${seg.startPercent}% ${seg.startPercent + seg.percent}%`;
        });
        return `conic-gradient(${gradient})`;
    };

    const [hoveredSegment, setHoveredSegment] = React.useState(null);

    const getSegmentPath = (startAngle, endAngle, radius = 90) => {
        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);
        const x1 = 90 + radius * Math.cos(startRad);
        const y1 = 90 + radius * Math.sin(startRad);
        const x2 = 90 + radius * Math.cos(endRad);
        const y2 = 90 + radius * Math.sin(endRad);
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        return `M 90 90 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    return (
        <div className="pie-chart-container">
            <div className="d-flex justify-content-center mb-3 position-relative">
                <svg width="180" height="180" style={{ overflow: 'visible' }}>
                    {segments.map((seg, index) => {
                        const startAngle = seg.startPercent * 3.6;
                        const endAngle = (seg.startPercent + seg.percent) * 3.6;
                        const isHovered = hoveredSegment === index;
                        return (
                            <path
                                key={index}
                                d={getSegmentPath(startAngle, endAngle, isHovered ? 95 : 90)}
                                fill={seg.color}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    filter: isHovered ? 'brightness(1.1)' : 'none'
                                }}
                                onMouseEnter={() => setHoveredSegment(index)}
                                onMouseLeave={() => setHoveredSegment(null)}
                            />
                        );
                    })}
                </svg>
                {hoveredSegment !== null && (
                    <div 
                        className="position-absolute bg-dark text-white px-2 py-1 rounded shadow"
                        style={{ 
                            top: '50%', 
                            left: '50%', 
                            transform: 'translate(-50%, -50%)',
                            fontSize: '12px',
                            pointerEvents: 'none',
                            zIndex: 10,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <strong>{segments[hoveredSegment][labelKey]}</strong>
                        <br />
                        {segments[hoveredSegment].percent.toFixed(1)}%
                    </div>
                )}
            </div>
            <div className="pie-chart-legend">
                {segments.map((item, index) => (
                    <div 
                        key={index} 
                        className="d-flex justify-content-between align-items-center mb-2"
                        style={{ 
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: hoveredSegment === index ? '#f0f0f0' : 'transparent',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={() => setHoveredSegment(index)}
                        onMouseLeave={() => setHoveredSegment(null)}
                    >
                        <div className="d-flex align-items-center">
                            <div
                                className="rounded-circle me-2"
                                style={{
                                    backgroundColor: item.color,
                                    width: '12px',
                                    height: '12px'
                                }}
                            ></div>
                            <span className="small">{item[labelKey]}</span>
                        </div>
                        <div className="text-end">
                            <span className="fw-bold small">{item[valueKey]?.toLocaleString()}</span>
                            <small className="text-muted ms-1">({item.percent.toFixed(1)}%)</small>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GrowthBarChart = ({ data, labelKey = 'name', currentKey = 'current', previousKey = 'previous' }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-bar-chart text-muted display-4"></i>
                <p className="text-muted mt-2">No data available</p>
            </div>
        );
    }

    const maxValue = Math.max(
        ...data.map(item => Math.max(item[currentKey] || 0, item[previousKey] || 0))
    );

    return (
        <div className="growth-bar-chart">
            <div className="d-flex justify-content-end mb-2">
                <span className="badge bg-primary me-2">Current Month</span>
                <span className="badge bg-secondary">Previous Month</span>
            </div>
            {data.slice(0, 10).map((item, index) => {
                const change = (item[currentKey] || 0) - (item[previousKey] || 0);
                const isGrowth = change > 0;
                const isDecline = change < 0;
                return (
                    <div key={index} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="text-truncate small" style={{ maxWidth: '50%' }}>{item[labelKey]}</span>
                            <span className={`badge ${isGrowth ? 'bg-success' : isDecline ? 'bg-danger' : 'bg-secondary'}`}>
                                {isGrowth ? '+' : ''}{change}
                            </span>
                        </div>
                        <div className="d-flex gap-1">
                            <div className="flex-fill">
                                <div className="progress" style={{ height: '12px' }}>
                                    <div
                                        className="progress-bar bg-primary"
                                        style={{ width: `${maxValue > 0 ? ((item[currentKey] || 0) / maxValue) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex-fill">
                                <div className="progress" style={{ height: '12px' }}>
                                    <div
                                        className="progress-bar bg-secondary"
                                        style={{ width: `${maxValue > 0 ? ((item[previousKey] || 0) / maxValue) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const HistogramChart = ({ data, labelKey = 'name', valueKey = 'value', color = 'primary', showValues = true }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-bar-chart text-muted display-4"></i>
                <p className="text-muted mt-2">No data available</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item[valueKey] || 0));
    const colors = ['#00853f', '#71dd37', '#ffab00', '#03c3ec', '#ff3e1d', '#8592a3', '#233446', '#9055fd', '#28c76f', '#ea5455'];

    return (
        <div className="histogram-chart">
            <div className="d-flex align-items-end justify-content-between" style={{ height: '220px', gap: '8px' }}>
                {data.slice(0, 10).map((item, index) => {
                    const heightPercent = maxValue > 0 ? ((item[valueKey] || 0) / maxValue) * 100 : 0;
                    const barColor = colors[index % colors.length];
                    return (
                        <div 
                            key={index} 
                            className="d-flex flex-column align-items-center" 
                            style={{ flex: 1, maxWidth: '80px' }}
                        >
                            {showValues && (
                                <span className="small fw-bold mb-1" style={{ fontSize: '11px' }}>
                                    {(item[valueKey] || 0).toLocaleString()}
                                </span>
                            )}
                            <div
                                className="rounded-top w-100"
                                style={{
                                    height: `${Math.max(heightPercent * 1.8, 5)}px`,
                                    backgroundColor: barColor,
                                    minHeight: '5px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer'
                                }}
                                title={`${item[labelKey]}: ${(item[valueKey] || 0).toLocaleString()}`}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scaleY(1.15) scaleX(1.1)';
                                    e.currentTarget.style.filter = 'brightness(1.2)';
                                    e.currentTarget.style.boxShadow = `0 -4px 12px ${barColor}66`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scaleY(1) scaleX(1)';
                                    e.currentTarget.style.filter = 'brightness(1)';
                                    e.currentTarget.style.boxShadow = '';
                                }}
                            ></div>
                            </div>
                    );
                })}
            </div>
            <div className="d-flex justify-content-between mt-2" style={{ gap: '8px' }}>
                {data.slice(0, 10).map((item, index) => (
                    <div 
                        key={index} 
                        className="text-center" 
                        style={{ flex: 1, maxWidth: '80px' }}
                    >
                        <small 
                            className="text-muted d-block text-truncate" 
                            style={{ fontSize: '10px' }}
                            title={item[labelKey]}
                        >
                            {item[labelKey]}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GrowthHistogramChart = ({ data, labelKey = 'name', currentKey = 'current', previousKey = 'previous' }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-4">
                <i className="bx bx-bar-chart text-muted display-4"></i>
                <p className="text-muted mt-2">No data available</p>
            </div>
        );
    }

    const maxValue = Math.max(
        ...data.map(item => Math.max(item[currentKey] || 0, item[previousKey] || 0))
    );

    return (
        <div className="growth-histogram-chart">
            <div className="d-flex justify-content-end mb-3">
                <span className="badge bg-primary me-2">Current Month</span>
                <span className="badge bg-secondary">Previous Month</span>
            </div>
            <div className="d-flex align-items-end justify-content-between" style={{ height: '200px', gap: '12px' }}>
                {data.slice(0, 10).map((item, index) => {
                    const currHeight = maxValue > 0 ? ((item[currentKey] || 0) / maxValue) * 100 : 0;
                    const prevHeight = maxValue > 0 ? ((item[previousKey] || 0) / maxValue) * 100 : 0;
                    const change = (item[currentKey] || 0) - (item[previousKey] || 0);
                    const isGrowth = change > 0;
                    const isDecline = change < 0;
                    
                    return (
                        <div 
                            key={index} 
                            className="d-flex flex-column align-items-center" 
                            style={{ flex: 1, maxWidth: '70px' }}
                        >
                            <span className={`badge mb-1 ${isGrowth ? 'bg-success' : isDecline ? 'bg-danger' : 'bg-secondary'}`} style={{ fontSize: '9px' }}>
                                {isGrowth ? '+' : ''}{change}
                            </span>
                            <div className="d-flex align-items-end gap-1 w-100">
                                <div
                                    className="rounded-top"
                                    style={{
                                        flex: 1,
                                        height: `${Math.max(currHeight * 1.6, 4)}px`,
                                        backgroundColor: '#00853f',
                                        minHeight: '4px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer'
                                    }}
                                    title={`Current: ${(item[currentKey] || 0).toLocaleString()}`}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scaleY(1.15) scaleX(1.2)';
                                        e.currentTarget.style.filter = 'brightness(1.2)';
                                        e.currentTarget.style.boxShadow = '0 -4px 12px rgba(105, 108, 255, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scaleY(1) scaleX(1)';
                                        e.currentTarget.style.filter = 'brightness(1)';
                                        e.currentTarget.style.boxShadow = '';
                                    }}
                                ></div>
                                <div
                                    className="rounded-top"
                                    style={{
                                        flex: 1,
                                        height: `${Math.max(prevHeight * 1.6, 4)}px`,
                                        backgroundColor: '#8592a3',
                                        minHeight: '4px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer'
                                    }}
                                    title={`Previous: ${(item[previousKey] || 0).toLocaleString()}`}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scaleY(1.15) scaleX(1.2)';
                                        e.currentTarget.style.filter = 'brightness(1.2)';
                                        e.currentTarget.style.boxShadow = '0 -4px 12px rgba(133, 146, 163, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scaleY(1) scaleX(1)';
                                        e.currentTarget.style.filter = 'brightness(1)';
                                        e.currentTarget.style.boxShadow = '';
                                    }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="d-flex justify-content-between mt-2" style={{ gap: '12px' }}>
                {data.slice(0, 10).map((item, index) => (
                    <div 
                        key={index} 
                        className="text-center" 
                        style={{ flex: 1, maxWidth: '70px' }}
                    >
                        <small 
                            className="text-muted d-block text-truncate" 
                            style={{ fontSize: '9px' }}
                            title={item[labelKey]}
                        >
                            {item[labelKey]}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    );
};
