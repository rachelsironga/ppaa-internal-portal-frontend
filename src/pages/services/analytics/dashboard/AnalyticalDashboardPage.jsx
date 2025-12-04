import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import BreadCumb from "../../../../layouts/BreadCumb";
import { analyticsService } from "./Queries";
import {
    StatCard,
    TrendChart,
    PaymentDistributionChart,
    BlockClinicCard,
    RecentAttendanceTable,
    PieChart
} from "../components/DashboardCharts";
import PatientTrendsDashboardShimmer from "../../../../components/loaders/PatientTrendsDashboardShimmer";
import ScrollReveal, { StaggerContainer, StaggerItem } from "../../../../components/animations/ScrollReveal";

export const AnalyticalDashboardPage = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const getDefaultDates = () => {
        const today = new Date();
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return {
            from: monthAgo.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0]
        };
    };

    const [dateFrom, setDateFrom] = useState(() => getDefaultDates().from);
    const [dateTo, setDateTo] = useState(() => getDefaultDates().to);
    const [period, setPeriod] = useState("monthly");
    const [dateError, setDateError] = useState("");
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [activePreset, setActivePreset] = useState("month");

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const filters = {
                date_from: dateFrom,
                date_to: dateTo,
                period: period
            };

            const [data, attendance] = await Promise.all([
                analyticsService.getAllDashboardData(filters),
                analyticsService.getRecentAttendance(10)
            ]);

            console.log('Dashboard Data:', data);
            console.log('Attendance Data:', attendance);

            setDashboardData(data);
            
            const attendanceRecords = attendance?.data?.results || attendance?.data || attendance?.results || attendance || [];
            setRecentAttendance(Array.isArray(attendanceRecords) ? attendanceRecords : []);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, period]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const validateDates = (from, to) => {
        if (new Date(from) > new Date(to)) {
            setDateError("Start date cannot be after end date");
            return false;
        }
        const daysDiff = Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) {
            setDateError("Date range cannot exceed 1 year");
            return false;
        }
        setDateError("");
        return true;
    };

    const handleDateFromChange = (value) => {
        setDateFrom(value);
        validateDates(value, dateTo);
    };

    const handleDateToChange = (value) => {
        setDateTo(value);
        validateDates(dateFrom, value);
    };

    const handleApplyFilters = (e) => {
        if (e) e.preventDefault();
        if (validateDates(dateFrom, dateTo)) {
            fetchDashboardData();
        }
    };

    const applyPreset = (preset) => {
        setActivePreset(preset);
        
        if (preset === 'custom') {
            setShowCustomDate(true);
            return;
        }
        
        setShowCustomDate(false);
        const today = new Date();
        let from = new Date();
        
        switch (preset) {
            case 'today':
                from = today;
                break;
            case 'week':
                from.setDate(today.getDate() - 7);
                break;
            case 'month':
                from.setMonth(today.getMonth() - 1);
                break;
            case 'quarter':
                from.setMonth(today.getMonth() - 3);
                break;
            case 'year':
                from.setFullYear(today.getFullYear() - 1);
                break;
            default:
                from.setMonth(today.getMonth() - 1);
        }
        
        setDateFrom(from.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        setDateError("");
    };

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Analytics", "Dashboard"]} />
                <PatientTrendsDashboardShimmer />
            </>
        );
    }

    const rawData = dashboardData || {};
    
    const overview = rawData.overview || rawData.data?.overview || {};
    const monthly_summary = rawData.monthly_summary || rawData.data?.monthly_summary || {};
    const yearly_summary = rawData.yearly_summary || rawData.data?.yearly_summary || {};
    const patient_trends = rawData.patient_trends || rawData.data?.patient_trends || [];
    const payment_distribution = rawData.payment_distribution || rawData.data?.payment_distribution || [];
    const block_clinic_distribution = rawData.block_clinic_distribution || rawData.data?.block_clinic_distribution || [];

    const totalPatients = monthly_summary.grand_total_patients || 0;
    const newPatients = monthly_summary.total_new_patients || 0;
    const followUpPatients = monthly_summary.total_follow_up_patients || 0;

    const newPatientPercentage = totalPatients > 0
        ? ((newPatients / totalPatients) * 100).toFixed(1)
        : 0;

    const followUpPercentage = totalPatients > 0
        ? ((followUpPatients / totalPatients) * 100).toFixed(1)
        : 0;

    const avgDailyPatients = monthly_summary.attendance_count > 0
        ? Math.round(totalPatients / monthly_summary.attendance_count)
        : 0;

    return (
        <>
            <BreadCumb pageList={["Analytics", "Dashboard"]} />
            
            <div className="container-fluid py-3">
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <div className="d-flex align-items-center">
                            <i className="bx bx-error-circle me-2 fs-4"></i>
                            <div>
                                <strong>Error:</strong> {error}
                            </div>
                        </div>
                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                )}

                <ScrollReveal animation="fadeIn" duration={0.5}>
                    <div className="row mb-4">
                        <div className="col">
                            <h4 className="fw-bold mb-1">
                                <i className="bx bx-bar-chart-alt-2 me-2"></i>
                                Attendance Analytics Dashboard
                            </h4>
                            <p className="text-muted mb-0">Comprehensive overview of patient attendance and clinic performance</p>
                        </div>
                        <div className="col-auto">
                            <Link to="/analytics/patient-trends" className="btn btn-primary btn-sm me-2">
                                <i className="bx bx-line-chart me-1"></i> Patient Trends
                            </Link>
                            <Link to="/analytics/attendances" className="btn btn-outline-primary btn-sm">
                                <i className="bx bx-calendar-event me-1"></i> Attendances
                            </Link>
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal animation="fadeInDown" duration={0.5}>
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                                <span className="text-muted small me-2">Date Range:</span>
                                {[
                                    { key: 'today', label: 'Today' },
                                    { key: 'week', label: 'Last 7 Days' },
                                    { key: 'month', label: 'Last Month' },
                                    { key: 'quarter', label: 'Last 3 Months' },
                                    { key: 'year', label: 'Last Year' },
                                    { key: 'custom', label: 'Custom Date' }
                                ].map(({ key, label }) => (
                                    <button 
                                        key={key}
                                        type="button" 
                                        className={`btn btn-sm ${activePreset === key ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => applyPreset(key)}
                                    >
                                        {key === 'custom' && <i className="bx bx-calendar me-1"></i>}
                                        {label}
                                    </button>
                                ))}
                                
                                <div className="vr mx-2"></div>
                                
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: 'auto' }}
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                                
                                <button 
                                    type="button" 
                                    className="btn btn-primary btn-sm"
                                    onClick={handleApplyFilters}
                                    disabled={!!dateError}
                                >
                                    <i className="bx bx-filter-alt me-1"></i> Apply
                                </button>
                            </div>
                            
                            {showCustomDate && (
                                <div className="row g-3 align-items-end pt-2 border-top">
                                    <div className="col-md-4">
                                        <label className="form-label small mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            className={`form-control form-control-sm ${dateError ? 'is-invalid' : ''}`}
                                            value={dateFrom}
                                            max={dateTo}
                                            onChange={(e) => handleDateFromChange(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small mb-1">End Date</label>
                                        <input
                                            type="date"
                                            className={`form-control form-control-sm ${dateError ? 'is-invalid' : ''}`}
                                            value={dateTo}
                                            min={dateFrom}
                                            max={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => handleDateToChange(e.target.value)}
                                        />
                                        {dateError && (
                                            <div className="invalid-feedback">{dateError}</div>
                                        )}
                                    </div>
                                    <div className="col-md-4">
                                        <span className="text-muted small">
                                            <i className="bx bx-info-circle me-1"></i>
                                            {Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)) + 1} days selected
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollReveal>

                <StaggerContainer className="row mb-4" staggerDelay={0.1}>
                    <StaggerItem animation="fadeInUp" className="col-sm-6 col-lg-3 mb-3">
                        <StatCard
                            title="Total Patients"
                            value={totalPatients}
                            icon="bx-user"
                            color="primary"
                            subtitle={monthly_summary.period || `${dateFrom} to ${dateTo}`}
                        />
                    </StaggerItem>
                    <StaggerItem animation="fadeInUp" className="col-sm-6 col-lg-3 mb-3">
                        <StatCard
                            title="New Patients"
                            value={newPatients}
                            icon="bx-user-plus"
                            color="info"
                            subtitle={`${newPatientPercentage}% of total`}
                        />
                    </StaggerItem>
                    <StaggerItem animation="fadeInUp" className="col-sm-6 col-lg-3 mb-3">
                        <StatCard
                            title="Follow-up Patients"
                            value={followUpPatients}
                            icon="bx-user-check"
                            color="success"
                            subtitle={`${followUpPercentage}% of total`}
                        />
                    </StaggerItem>
                    <StaggerItem animation="fadeInUp" className="col-sm-6 col-lg-3 mb-3">
                        <StatCard
                            title="Avg Daily Patients"
                            value={avgDailyPatients}
                            icon="bx-trending-up"
                            color="warning"
                            subtitle={`${monthly_summary.attendance_count || 0} records`}
                        />
                    </StaggerItem>
                </StaggerContainer>

                <StaggerContainer className="row mb-4" staggerDelay={0.1}>
                    <StaggerItem animation="fadeInUp" className="col-md-4 mb-3">
                        <div 
                            className="card h-100"
                            style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.03) translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <div className="card-body text-center">
                                <div className="avatar avatar-lg bg-primary bg-opacity-10 rounded-circle mx-auto mb-3 p-3">
                                    <i className="bx bx-building text-primary fs-3"></i>
                                </div>
                                <h3 className="mb-1">{overview.total_blocks || 0}</h3>
                                <p className="text-muted mb-0">Total Blocks</p>
                            </div>
                        </div>
                    </StaggerItem>
                    <StaggerItem animation="fadeInUp" className="col-md-4 mb-3">
                        <div 
                            className="card h-100"
                            style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.03) translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <div className="card-body text-center">
                                <div className="avatar avatar-lg bg-success bg-opacity-10 rounded-circle mx-auto mb-3 p-3">
                                    <i className="bx bx-clinic text-success fs-3"></i>
                                </div>
                                <h3 className="mb-1">{overview.total_clinics || 0}</h3>
                                <p className="text-muted mb-0">Total Clinics</p>
                            </div>
                        </div>
                    </StaggerItem>
                    <StaggerItem animation="fadeInUp" className="col-md-4 mb-3">
                        <div 
                            className="card h-100"
                            style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.03) translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <div className="card-body text-center">
                                <div className="avatar avatar-lg bg-warning bg-opacity-10 rounded-circle mx-auto mb-3 p-3">
                                    <i className="bx bx-credit-card text-warning fs-3"></i>
                                </div>
                                <h3 className="mb-1">{overview.total_payment_modes || 0}</h3>
                                <p className="text-muted mb-0">Payment Modes</p>
                            </div>
                        </div>
                    </StaggerItem>
                </StaggerContainer>

                <div className="row mb-4">
                    <ScrollReveal animation="fadeInLeft" className="col-lg-6 mb-4">
                        <div className="card h-100">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    <i className="bx bx-line-chart me-2"></i>Patient Volume Trend
                                </h5>
                            </div>
                            <div className="card-body">
                                <TrendChart data={patient_trends} />
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal animation="fadeInRight" className="col-lg-6 mb-4">
                        <div className="card h-100">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    <i className="bx bx-pie-chart-alt me-2"></i>Payment Mode Distribution
                                </h5>
                            </div>
                            <div className="card-body">
                                {payment_distribution.length > 0 ? (
                                    <PieChart 
                                        data={payment_distribution.map(p => ({ 
                                            name: p.payment_name || p.name, 
                                            value: p.total_patients || p.value || 0 
                                        }))} 
                                    />
                                ) : (
                                    <PaymentDistributionChart data={payment_distribution} />
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                <div className="row mb-4">
                    <ScrollReveal animation="fadeInLeft" className="col-lg-6 mb-4">
                        <div className="card h-100">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    <i className="bx bx-building me-2"></i>Block-Clinic Distribution
                                </h5>
                                <Link to="/analytics/blocks" className="btn btn-sm btn-outline-primary">
                                    View All
                                </Link>
                            </div>
                            <div className="card-body">
                                <BlockClinicCard blocks={block_clinic_distribution} />
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal animation="fadeInRight" className="col-lg-6 mb-4">
                        <div className="card h-100">
                            <div className="card-header">
                                <h5 className="card-title mb-0">
                                    <i className="bx bx-calendar me-2"></i>Yearly Summary ({yearly_summary.year || new Date().getFullYear()})
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row text-center">
                                    {[
                                        { value: yearly_summary.grand_total_patients, label: 'Total Patients', color: 'primary' },
                                        { value: yearly_summary.total_new_patients, label: 'New Patients', color: 'info' },
                                        { value: yearly_summary.total_follow_up_patients, label: 'Follow-ups', color: 'success' }
                                    ].map((item, index) => (
                                        <div key={index} className="col-4 mb-3">
                                            <div 
                                                className="border rounded p-3"
                                                style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1.05)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                    e.currentTarget.style.boxShadow = '';
                                                }}
                                            >
                                                <h4 className={`text-${item.color} mb-1`}>{(item.value || 0).toLocaleString()}</h4>
                                                <small className="text-muted">{item.label}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 p-3 bg-light rounded">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted">Total Records</span>
                                        <span className="fw-bold">{yearly_summary.attendance_count || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                <ScrollReveal animation="fadeInUp">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">
                                <i className="bx bx-history me-2"></i>Recent Attendance Records
                            </h5>
                            <Link to="/analytics/attendances" className="btn btn-sm btn-outline-primary">
                                View All
                            </Link>
                        </div>
                        <div className="card-body">
                            {recentAttendance.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover">
                                        <thead className="table-primary">
                                            <tr>
                                                <th>Date</th>
                                                <th className="text-center">Total</th>
                                                <th className="text-center">New</th>
                                                <th className="text-center">Follow-up</th>
                                                <th className="text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentAttendance.map((record, index) => (
                                                <tr 
                                                    key={index}
                                                    style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.01)';
                                                        e.currentTarget.style.backgroundColor = 'rgba(105, 108, 255, 0.08)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        e.currentTarget.style.backgroundColor = '';
                                                    }}
                                                >
                                                    <td>
                                                        <strong>
                                                            {new Date(record.date).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </strong>
                                                    </td>
                                                    <td className="text-center fw-bold">{record.grand_total_patients || 0}</td>
                                                    <td className="text-center">
                                                        <span className="badge bg-info">{record.total_new_patients || 0}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-success">{record.total_follow_up_patients || 0}</span>
                                                    </td>
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
                            ) : (
                                <div className="text-center py-4">
                                    <i className="bx bx-calendar-x text-muted display-4"></i>
                                    <p className="text-muted mt-2">No attendance records found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </>
    );
};
