import React, { useState, useEffect, useCallback } from "react";
import BreadCumb from "../../../../layouts/BreadCumb";
import {
    StatCard,
    TrendChart,
    PaymentDistributionChart,
    BarChart,
    DoughnutChart,
    PieChart,
    HistogramChart,
    GrowthHistogramChart
} from "../components/DashboardCharts";
import {
    getPatientTrends,
    getPaymentDistribution,
    getClinicVolumes,
    getClinicGrowthTrends,
    getDepartmentClinicComparison
} from "./Queries";
import PatientTrendsDashboardShimmer from "../../../../components/loaders/PatientTrendsDashboardShimmer";
import ScrollReveal, { StaggerContainer, StaggerItem } from "../../../../components/animations/ScrollReveal";

export const PatientTrendsPage = () => {
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
    const [period, setPeriod] = useState("daily");
    const [dateError, setDateError] = useState("");
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [activePreset, setActivePreset] = useState("month");
    
    const [trendData, setTrendData] = useState([]);
    const [paymentData, setPaymentData] = useState([]);
    const [clinicVolumes, setClinicVolumes] = useState([]);
    const [clinicGrowthData, setClinicGrowthData] = useState([]);
    const [departmentComparison, setDepartmentComparison] = useState([]);
    const [showAllClinics, setShowAllClinics] = useState(false);
    const [showAllGrowth, setShowAllGrowth] = useState(false);
    const [showAllDepartments, setShowAllDepartments] = useState(false);
    const [patientTypeChartType, setPatientTypeChartType] = useState('pie');
    const [paymentChartType, setPaymentChartType] = useState('doughnut');

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const currentMonth = new Date(dateTo).toISOString().slice(0, 7);
            const prevDate = new Date(dateTo);
            prevDate.setMonth(prevDate.getMonth() - 1);
            const previousMonth = prevDate.toISOString().slice(0, 7);

            const [trendsRes, paymentRes, clinicRes] = await Promise.all([
                getPatientTrends({ period, date_from: dateFrom, date_to: dateTo }),
                getPaymentDistribution({ date_from: dateFrom, date_to: dateTo }),
                getClinicVolumes({ date_from: dateFrom, date_to: dateTo })
            ]);

            if (trendsRes.status === 200 || trendsRes.status === 8000) {
                setTrendData(trendsRes.data || []);
            }
            if (paymentRes.status === 200 || paymentRes.status === 8000) {
                setPaymentData(paymentRes.data || []);
            }
            if (clinicRes.status === 200 || clinicRes.status === 8000) {
                setClinicVolumes(clinicRes.data || []);
            }

            try {
                const growthRes = await getClinicGrowthTrends({ current_month: currentMonth, previous_month: previousMonth });
                if (growthRes.status === 200 || growthRes.status === 8000) {
                    setClinicGrowthData(growthRes.data || []);
                }
            } catch (e) {
                console.warn("Clinic growth trends not available:", e);
            }

            try {
                const deptRes = await getDepartmentClinicComparison({ date_from: dateFrom, date_to: dateTo });
                if (deptRes.status === 200 || deptRes.status === 8000) {
                    setDepartmentComparison(deptRes.data || []);
                }
            } catch (e) {
                console.warn("Department comparison not available:", e);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        e.preventDefault();
        if (validateDates(dateFrom, dateTo)) {
            fetchData();
        }
    };

    const handleReset = () => {
        const defaults = getDefaultDates();
        setDateFrom(defaults.from);
        setDateTo(defaults.to);
        setPeriod("daily");
        setDateError("");
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

    const totalPatients = trendData.reduce((sum, item) => sum + (item.grand_total_patients || 0), 0);
    const newPatients = trendData.reduce((sum, item) => sum + (item.total_new_patients || 0), 0);
    const followUpPatients = trendData.reduce((sum, item) => sum + (item.total_follow_up_patients || 0), 0);
    const newPatientPercentage = totalPatients > 0 ? ((newPatients / totalPatients) * 100).toFixed(1) : 0;
    const followUpPercentage = totalPatients > 0 ? ((followUpPatients / totalPatients) * 100).toFixed(1) : 0;

    const daysInPeriod = Math.ceil(
        (new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)
    ) + 1;
    const avgDailyPatients = daysInPeriod > 0 ? Math.round(totalPatients / daysInPeriod) : 0;

    const displayedClinics = showAllClinics ? clinicVolumes : clinicVolumes.slice(0, 5);
    const displayedGrowth = showAllGrowth ? clinicGrowthData : clinicGrowthData.slice(0, 10);
    const displayedDepartments = showAllDepartments ? departmentComparison : departmentComparison.slice(0, 10);

    const patientTypeData = [
        { name: 'New Patients', value: newPatients },
        { name: 'Follow-up Patients', value: followUpPatients }
    ];

    const clinicChartData = clinicVolumes.slice(0, 10).map(clinic => ({
        name: clinic.clinic_name,
        value: clinic.total_patients || 0
    }));

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["Analytics", "Patient Trends"]} />
                <PatientTrendsDashboardShimmer />
            </>
        );
    }

    return (
        <>
            <BreadCumb pageList={["Analytics", "Patient Trends"]} />
            
            <div className="container-fluid py-3">
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                )}

                <ScrollReveal animation="fadeIn" duration={0.5}>
                    <div className="row mb-4">
                        <div className="col">
                            <h4 className="fw-bold mb-1">
                                <i className="bx bx-line-chart me-2"></i>
                                Clinic Performance Dashboard
                            </h4>
                            <p className="text-muted mb-0">Comprehensive metrics and analytics for clinic performance evaluation</p>
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
                    <StaggerItem animation="fadeInUp" className="col-md-3">
                        <StatCard
                            title="Total Patients"
                            value={totalPatients}
                            icon="bx-user"
                            color="primary"
                            subtitle={`${dateFrom} to ${dateTo}`}
                        />
                    </StaggerItem>
                    <StaggerItem animation="fadeInUp" className="col-md-3">
                        <StatCard
                            title="New Patients"
                            value={newPatients}
                            icon="bx-user-plus"
                            color="info"
                            subtitle={`${newPatientPercentage}% of total`}
                        />
                    </StaggerItem>
                    <StaggerItem animation="fadeInUp" className="col-md-3">
                        <StatCard
                            title="Follow-up Patients"
                            value={followUpPatients}
                            icon="bx-user-check"
                            color="success"
                            subtitle={`${followUpPercentage}% of total`}
                        />
                    </StaggerItem>
                    <StaggerItem animation="fadeInUp" className="col-md-3">
                        <StatCard
                            title="Avg Daily Patients"
                            value={avgDailyPatients}
                            icon="bx-calendar"
                            color="warning"
                            subtitle={`${daysInPeriod} day period`}
                        />
                    </StaggerItem>
                </StaggerContainer>

                <ScrollReveal animation="fadeInUp">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bx bx-trending-up me-2"></i>
                                Patient Volume Trends
                            </h5>
                        </div>
                        <div className="card-body">
                            <TrendChart data={trendData} />
                        </div>
                    </div>
                </ScrollReveal>

                <div className="row mb-4">
                    <ScrollReveal animation="fadeInLeft" className="col-md-6">
                        <div className="card h-100">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    <i className="bx bx-pie-chart-alt-2 me-2"></i>
                                    Patient Type Distribution
                                </h5>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        className={`btn ${patientTypeChartType === 'doughnut' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setPatientTypeChartType('doughnut')}
                                        title="Bar Chart"
                                    >
                                        <i className="bx bx-bar-chart-alt-2"></i>
                                    </button>
                                    <button
                                        className={`btn ${patientTypeChartType === 'pie' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setPatientTypeChartType('pie')}
                                        title="Pie Chart"
                                    >
                                        <i className="bx bx-pie-chart-alt-2"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {(newPatients > 0 || followUpPatients > 0) ? (
                                    patientTypeChartType === 'pie' ? (
                                        <PieChart data={patientTypeData} />
                                    ) : (
                                        <DoughnutChart data={patientTypeData} />
                                    )
                                ) : (
                                    <div className="text-center text-muted py-5">
                                        <i className="bx bx-pie-chart-alt display-4"></i>
                                        <p className="mt-2">No patient type data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                    <ScrollReveal animation="fadeInRight" className="col-md-6">
                        <div className="card h-100">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    <i className="bx bx-credit-card me-2"></i>
                                    Payment Mode Distribution
                                </h5>
                                <div className="btn-group btn-group-sm">
                                    <button
                                        className={`btn ${paymentChartType === 'doughnut' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setPaymentChartType('doughnut')}
                                        title="Bar Chart"
                                    >
                                        <i className="bx bx-bar-chart-alt-2"></i>
                                    </button>
                                    <button
                                        className={`btn ${paymentChartType === 'pie' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setPaymentChartType('pie')}
                                        title="Pie Chart"
                                    >
                                        <i className="bx bx-pie-chart-alt-2"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {paymentData.length > 0 ? (
                                    paymentChartType === 'pie' ? (
                                        <PieChart 
                                            data={paymentData.map(p => ({ name: p.payment_name, value: p.total_patients }))} 
                                        />
                                    ) : (
                                        <PaymentDistributionChart data={paymentData} />
                                    )
                                ) : (
                                    <div className="text-center text-muted py-5">
                                        <i className="bx bx-credit-card display-4"></i>
                                        <p className="mt-2">No payment data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                <ScrollReveal animation="fadeInUp">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bx bx-trophy me-2"></i>
                                Top Performing Clinics by Patient Volume
                            </h5>
                        </div>
                        <div className="card-body">
                            {clinicVolumes.length > 0 ? (
                                <>
                                    <BarChart data={clinicChartData} horizontal={true} />
                                    <div className="table-responsive mt-4">
                                        <table className="table table-sm table-hover table-striped">
                                            <thead className="table-primary">
                                                <tr>
                                                    <th>Rank</th>
                                                    <th>Clinic</th>
                                                    <th className="text-end">Total Patients</th>
                                                    <th className="text-end">New Patients</th>
                                                    <th className="text-end">Follow-ups</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayedClinics.map((clinic, index) => (
                                                    <tr 
                                                        key={clinic.clinic_uid}
                                                        style={{
                                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1.02)';
                                                            e.currentTarget.style.backgroundColor = 'rgba(105, 108, 255, 0.1)';
                                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                            e.currentTarget.style.backgroundColor = '';
                                                            e.currentTarget.style.boxShadow = '';
                                                        }}
                                                    >
                                                        <td>{index + 1}</td>
                                                        <td><strong>{clinic.clinic_name}</strong></td>
                                                        <td className="text-end">{(clinic.total_patients || 0).toLocaleString()}</td>
                                                        <td className="text-end">
                                                            <span className="badge bg-info">
                                                                {(clinic.new_patients || 0).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="text-end">
                                                            <span className="badge bg-success">
                                                                {(clinic.follow_up_patients || 0).toLocaleString()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {clinicVolumes.length > 5 && (
                                            <button
                                                className="btn btn-link text-primary p-0"
                                                onClick={() => setShowAllClinics(!showAllClinics)}
                                            >
                                                {showAllClinics ? 'Show Less' : `Show More (${clinicVolumes.length - 5} more)`}
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <i className="bx bx-bar-chart display-4"></i>
                                    <p className="mt-2">No clinic volume data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollReveal>

                {paymentData.length > 0 && (
                    <ScrollReveal animation="fadeInUp">
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="card-title mb-0">
                                    <i className="bx bx-table me-2"></i>
                                    Payment Mode Details
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover table-striped">
                                        <thead className="table-primary">
                                            <tr>
                                                <th>#</th>
                                                <th>Payment Mode</th>
                                                <th className="text-end">Total Patients</th>
                                                <th className="text-end">New Patients</th>
                                                <th className="text-end">Follow-ups</th>
                                                <th className="text-end">Percentage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentData.map((item, index) => (
                                                <tr 
                                                    key={item.payment_uid}
                                                    style={{
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.02)';
                                                        e.currentTarget.style.backgroundColor = 'rgba(105, 108, 255, 0.1)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        e.currentTarget.style.backgroundColor = '';
                                                        e.currentTarget.style.boxShadow = '';
                                                    }}
                                                >
                                                    <td>{index + 1}</td>
                                                    <td><strong>{item.payment_name}</strong> ({item.payment_code})</td>
                                                    <td className="text-end">{(item.total_patients || 0).toLocaleString()}</td>
                                                    <td className="text-end">
                                                        <span className="badge bg-info">
                                                            {(item.new_patients || 0).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <span className="badge bg-success">
                                                            {(item.follow_up_patients || 0).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="text-end">
                                                        <span className="badge bg-secondary">
                                                            {item.percentage || 0}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                <ScrollReveal animation="fadeInUp">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bx bx-trending-up me-2"></i>
                                Clinic Growth/Decline Trends
                                <small className="text-muted ms-2">(Current Month vs Previous Month)</small>
                            </h5>
                        </div>
                        <div className="card-body">
                            {clinicGrowthData.length > 0 ? (
                                <>
                                    <div className="mb-4">
                                        <h6 className="text-muted mb-3">Top 10 Clinics by Change</h6>
                                        <GrowthHistogramChart 
                                            data={clinicGrowthData.slice(0, 10).map(c => ({
                                                name: c.clinic_name,
                                                current: c.current_month_patients || 0,
                                                previous: c.previous_month_patients || 0
                                            }))}
                                            labelKey="name"
                                            currentKey="current"
                                            previousKey="previous"
                                        />
                                    </div>
                                    <hr />
                                    <div className="table-responsive">
                                        <table className="table table-sm table-hover table-striped">
                                            <thead className="table-primary">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Clinic</th>
                                                    <th className="text-end">Previous Month</th>
                                                    <th className="text-end">Current Month</th>
                                                    <th className="text-end">Change</th>
                                                    <th className="text-end">Growth %</th>
                                                    <th className="text-center">Trend</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayedGrowth.map((clinic, index) => {
                                                    const prevCount = clinic.previous_month_patients || 0;
                                                    const currCount = clinic.current_month_patients || 0;
                                                    const change = currCount - prevCount;
                                                    const growthPercent = prevCount > 0 
                                                        ? ((change / prevCount) * 100).toFixed(1) 
                                                        : (currCount > 0 ? 100 : 0);
                                                    const isGrowth = change > 0;
                                                    const isDecline = change < 0;
                                                    
                                                    return (
                                                        <tr 
                                                            key={clinic.clinic_uid || index}
                                                            style={{
                                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                cursor: 'pointer'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                                e.currentTarget.style.backgroundColor = 'rgba(105, 108, 255, 0.1)';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                                e.currentTarget.style.backgroundColor = '';
                                                                e.currentTarget.style.boxShadow = '';
                                                            }}
                                                        >
                                                            <td>{index + 1}</td>
                                                            <td><strong>{clinic.clinic_name}</strong></td>
                                                            <td className="text-end">{prevCount.toLocaleString()}</td>
                                                            <td className="text-end">{currCount.toLocaleString()}</td>
                                                            <td className="text-end">
                                                                <span className={`badge ${isGrowth ? 'bg-success' : isDecline ? 'bg-danger' : 'bg-secondary'}`}>
                                                                    {isGrowth ? '+' : ''}{change.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                <span className={`badge ${isGrowth ? 'bg-success' : isDecline ? 'bg-danger' : 'bg-secondary'}`}>
                                                                    {isGrowth ? '+' : ''}{growthPercent}%
                                                                </span>
                                                            </td>
                                                            <td className="text-center">
                                                                {isGrowth && <i className="bx bx-trending-up text-success fs-5"></i>}
                                                                {isDecline && <i className="bx bx-trending-down text-danger fs-5"></i>}
                                                                {!isGrowth && !isDecline && <i className="bx bx-minus text-secondary fs-5"></i>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {clinicGrowthData.length > 10 && (
                                            <button
                                                className="btn btn-link text-primary p-0"
                                                onClick={() => setShowAllGrowth(!showAllGrowth)}
                                            >
                                                {showAllGrowth ? 'Show Less' : `Show More (${clinicGrowthData.length - 10} more)`}
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <i className="bx bx-trending-up display-4"></i>
                                    <p className="mt-2">No growth trend data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal animation="fadeInUp">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bx bx-building-house me-2"></i>
                                Department-wise Clinic Comparisons
                            </h5>
                        </div>
                        <div className="card-body">
                            {departmentComparison.length > 0 ? (
                                <>
                                    <div className="mb-4">
                                        <h6 className="text-muted mb-3">Top 10 Departments by Patient Volume</h6>
                                        <HistogramChart 
                                            data={departmentComparison.slice(0, 10).map(d => ({
                                                name: d.department_name,
                                                value: d.total_patients || 0
                                            }))}
                                        />
                                    </div>
                                    <hr />
                                    <div className="table-responsive">
                                        <table className="table table-sm table-hover table-striped">
                                            <thead className="table-primary">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Department</th>
                                                    <th className="text-end">Total Clinics</th>
                                                    <th className="text-end">Total Patients</th>
                                                    <th className="text-end">New Patients</th>
                                                    <th className="text-end">Follow-ups</th>
                                                    <th className="text-end">Avg per Clinic</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayedDepartments.map((dept, index) => {
                                                    const avgPerClinic = dept.total_clinics > 0 
                                                        ? Math.round((dept.total_patients || 0) / dept.total_clinics) 
                                                        : 0;
                                                    
                                                    return (
                                                        <tr 
                                                            key={dept.department_uid || index}
                                                            style={{
                                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                cursor: 'pointer'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                                e.currentTarget.style.backgroundColor = 'rgba(105, 108, 255, 0.1)';
                                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                                e.currentTarget.style.backgroundColor = '';
                                                                e.currentTarget.style.boxShadow = '';
                                                            }}
                                                        >
                                                            <td>{index + 1}</td>
                                                            <td><strong>{dept.department_name}</strong></td>
                                                            <td className="text-end">
                                                                <span className="badge bg-primary">
                                                                    {(dept.total_clinics || 0).toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">{(dept.total_patients || 0).toLocaleString()}</td>
                                                            <td className="text-end">
                                                                <span className="badge bg-info">
                                                                    {(dept.new_patients || 0).toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                <span className="badge bg-success">
                                                                    {(dept.follow_up_patients || 0).toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                <span className="badge bg-warning text-dark">
                                                                    {avgPerClinic.toLocaleString()}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {departmentComparison.length > 10 && (
                                            <button
                                                className="btn btn-link text-primary p-0"
                                                onClick={() => setShowAllDepartments(!showAllDepartments)}
                                            >
                                                {showAllDepartments ? 'Show Less' : `Show More (${departmentComparison.length - 10} more)`}
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <i className="bx bx-building-house display-4"></i>
                                    <p className="mt-2">No department comparison data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </>
    );
};
