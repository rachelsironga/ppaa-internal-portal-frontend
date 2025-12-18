import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import "animate.css";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import BreadCumb from "../../../../layouts/BreadCumb";
import { fetchData } from "../../../../utils/GlobalQueries";

export const MaintenanceReportsPage = () => {
    const user = useSelector((state) => state.userReducer?.data);

    const [reportData, setReportData] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        report_type: "summary",
        start_date: "",
        end_date: "",
        status: "",
        technician: "",
    });

    const reportTypes = [
        { value: "summary", label: "Summary Report" },
        { value: "by_status", label: "By Status" },
        { value: "by_type", label: "By Maintenance Type" },
        { value: "by_technician", label: "By Technician" },
        { value: "by_asset", label: "By Asset" },
        { value: "cost_analysis", label: "Cost Analysis" },
        { value: "performance", label: "Performance Metrics" },
    ];

    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "scheduled", label: "Scheduled" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

    useEffect(() => {
        const loadTechnicians = async () => {
            try {
                const data = await fetchData({ url: "/assets-technicians" });
                setTechnicians(Array.isArray(data) ? data : (data?.results || []));
            } catch (err) {
                console.error("Failed to load technicians:", err);
            }
        };
        loadTechnicians();
    }, []);

    const fetchReport = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const filterParams = {};
            if (filters.report_type) filterParams.type = filters.report_type;
            if (filters.start_date) filterParams.start_date = filters.start_date;
            if (filters.end_date) filterParams.end_date = filters.end_date;
            if (filters.status) filterParams.status = filters.status;
            if (filters.technician) filterParams.technician = filters.technician;

            const data = await fetchData({
                url: "/maintenance-reports",
                filter: filterParams,
            });

            setReportData(data);
        } catch (err) {
            console.error("Report fetch error:", err);
            const errorMessage =
                err?.response?.data?.message || err?.message || "Failed to load report data";
            setError(errorMessage);

            Swal.fire({
                icon: "error",
                title: "Report Error",
                text: "Failed to load report data. Please try again.",
                confirmButtonText: "Retry",
                showCancelButton: true,
                cancelButtonText: "Cancel",
            }).then((result) => {
                if (result.isConfirmed) {
                    fetchReport();
                }
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReport();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        fetchReport();
    };

    const handleResetFilters = () => {
        setFilters({
            report_type: "summary",
            start_date: "",
            end_date: "",
            status: "",
            technician: "",
        });
    };

    const exportToExcel = () => {
        if (!reportData) {
            Swal.fire("Warning", "No data to export", "warning");
            return;
        }

        let exportData = [];
        const reportType = filters.report_type;

        if (reportType === "summary" && reportData.summary) {
            exportData = [
                { Metric: "Total Maintenance Tasks", Value: reportData.summary.total_tasks || 0 },
                { Metric: "Completed Tasks", Value: reportData.summary.completed || 0 },
                { Metric: "In Progress", Value: reportData.summary.in_progress || 0 },
                { Metric: "Scheduled", Value: reportData.summary.scheduled || 0 },
                { Metric: "Cancelled", Value: reportData.summary.cancelled || 0 },
                { Metric: "Total Cost", Value: reportData.summary.total_cost || 0 },
                { Metric: "Average Cost", Value: reportData.summary.average_cost || 0 },
            ];
        } else if (reportData.data && Array.isArray(reportData.data)) {
            exportData = reportData.data;
        } else if (reportData.results && Array.isArray(reportData.results)) {
            exportData = reportData.results;
        } else {
            exportData = [reportData];
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Maintenance Report");

        const fileName = `maintenance_report_${reportType}_${new Date().toISOString().split("T")[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        Swal.fire("Success", "Report exported successfully!", "success");
    };

    const exportToCSV = () => {
        if (!reportData) {
            Swal.fire("Warning", "No data to export", "warning");
            return;
        }

        let exportData = [];
        const reportType = filters.report_type;

        if (reportType === "summary" && reportData.summary) {
            exportData = [
                { Metric: "Total Maintenance Tasks", Value: reportData.summary.total_tasks || 0 },
                { Metric: "Completed Tasks", Value: reportData.summary.completed || 0 },
                { Metric: "In Progress", Value: reportData.summary.in_progress || 0 },
                { Metric: "Scheduled", Value: reportData.summary.scheduled || 0 },
                { Metric: "Cancelled", Value: reportData.summary.cancelled || 0 },
                { Metric: "Total Cost", Value: reportData.summary.total_cost || 0 },
                { Metric: "Average Cost", Value: reportData.summary.average_cost || 0 },
            ];
        } else if (reportData.data && Array.isArray(reportData.data)) {
            exportData = reportData.data;
        } else if (reportData.results && Array.isArray(reportData.results)) {
            exportData = reportData.results;
        } else {
            exportData = [reportData];
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `maintenance_report_${reportType}_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire("Success", "Report exported to CSV successfully!", "success");
    };

    const renderSummaryCards = () => {
        const summary = reportData?.summary || {};

        return (
            <div className="row mb-4">
                <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="card h-100 border-start border-primary border-4">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-primary rounded p-2">
                                        <i className="bx bx-wrench text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Total Tasks</span>
                                    <h3 className="card-title mb-0">{summary.total_tasks || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="card h-100 border-start border-success border-4">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-success rounded p-2">
                                        <i className="bx bx-check-circle text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Completed</span>
                                    <h3 className="card-title text-success mb-0">
                                        {summary.completed || 0}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="card h-100 border-start border-warning border-4">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-warning rounded p-2">
                                        <i className="bx bx-time-five text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">In Progress</span>
                                    <h3 className="card-title text-warning mb-0">
                                        {summary.in_progress || 0}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="card h-100 border-start border-info border-4">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-info rounded p-2">
                                        <i className="bx bx-calendar text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Scheduled</span>
                                    <h3 className="card-title text-info mb-0">
                                        {summary.scheduled || 0}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCostAnalysisChart = () => {
        const costData = reportData?.cost_analysis || reportData?.data || [];

        if (!costData.length) {
            return (
                <div className="text-center py-4">
                    <i className="bx bx-chart text-muted display-4"></i>
                    <p className="text-muted mt-2">No cost data available</p>
                </div>
            );
        }

        const maxCost = Math.max(...costData.map((item) => item.total_cost || item.cost || 0));

        return (
            <div className="cost-chart">
                {costData.slice(0, 10).map((item, index) => {
                    const cost = item.total_cost || item.cost || 0;
                    const label = item.month || item.category || item.technician || item.asset || `Item ${index + 1}`;

                    return (
                        <div key={index} className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="text-sm">{label}</span>
                                <span className="fw-bold">
                                    TSH {parseFloat(cost).toLocaleString()}
                                </span>
                            </div>
                            <div className="progress" style={{ height: "20px" }}>
                                <div
                                    className="progress-bar bg-success"
                                    style={{ width: `${(cost / maxCost) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderPerformanceMetrics = () => {
        const performance = reportData?.performance || reportData?.data || {};

        return (
            <div className="row">
                <div className="col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h6 className="card-title mb-0">Completion Rate</h6>
                        </div>
                        <div className="card-body">
                            <div className="text-center">
                                <div className="display-4 text-success fw-bold">
                                    {performance.completion_rate || 0}%
                                </div>
                                <p className="text-muted mb-0">Tasks Completed on Time</p>
                            </div>
                            <div className="progress mt-3" style={{ height: "10px" }}>
                                <div
                                    className="progress-bar bg-success"
                                    style={{ width: `${performance.completion_rate || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h6 className="card-title mb-0">Average Resolution Time</h6>
                        </div>
                        <div className="card-body">
                            <div className="text-center">
                                <div className="display-4 text-primary fw-bold">
                                    {performance.avg_resolution_time || 0}
                                </div>
                                <p className="text-muted mb-0">Days Average</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-4">
                    <div className="card h-100">
                        <div className="card-body text-center">
                            <i className="bx bx-trending-up text-success display-5"></i>
                            <h5 className="mt-2">{performance.tasks_this_month || 0}</h5>
                            <small className="text-muted">Tasks This Month</small>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-4">
                    <div className="card h-100">
                        <div className="card-body text-center">
                            <i className="bx bx-dollar-circle text-warning display-5"></i>
                            <h5 className="mt-2">
                                TSH {parseFloat(performance.total_cost_this_month || 0).toLocaleString()}
                            </h5>
                            <small className="text-muted">Cost This Month</small>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-4">
                    <div className="card h-100">
                        <div className="card-body text-center">
                            <i className="bx bx-error-circle text-danger display-5"></i>
                            <h5 className="mt-2">{performance.overdue_tasks || 0}</h5>
                            <small className="text-muted">Overdue Tasks</small>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDataTable = () => {
        const data = reportData?.data || reportData?.results || [];

        if (!data.length) {
            return (
                <div className="text-center py-4">
                    <i className="bx bx-table text-muted display-4"></i>
                    <p className="text-muted mt-2">No data available</p>
                </div>
            );
        }

        const columns = Object.keys(data[0]).filter(
            (key) => !["id", "uid", "created_at", "updated_at"].includes(key)
        );

        return (
            <div className="table-responsive">
                <table className="table table-hover table-striped">
                    <thead className="table-light">
                        <tr>
                            <th>#</th>
                            {columns.map((col) => (
                                <th key={col}>{col.replace(/_/g, " ").toUpperCase()}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                {columns.map((col) => (
                                    <td key={col}>
                                        {typeof row[col] === "number" && col.includes("cost")
                                            ? `TSH ${parseFloat(row[col]).toLocaleString()}`
                                            : row[col] ?? "-"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderReportContent = () => {
        if (!reportData) {
            return (
                <div className="text-center py-5">
                    <i className="bx bx-file-find text-muted display-4"></i>
                    <p className="text-muted mt-2">Apply filters and generate a report</p>
                </div>
            );
        }

        switch (filters.report_type) {
            case "summary":
                return (
                    <>
                        {renderSummaryCards()}
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Summary Details</h5>
                            </div>
                            <div className="card-body">{renderDataTable()}</div>
                        </div>
                    </>
                );

            case "cost_analysis":
                return (
                    <>
                        {renderSummaryCards()}
                        <div className="row">
                            <div className="col-lg-6 mb-4">
                                <div className="card h-100">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Cost Breakdown</h5>
                                    </div>
                                    <div className="card-body">{renderCostAnalysisChart()}</div>
                                </div>
                            </div>
                            <div className="col-lg-6 mb-4">
                                <div className="card h-100">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">Cost Summary</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3 p-3 bg-light rounded">
                                            <div className="d-flex justify-content-between">
                                                <span>Total Maintenance Cost</span>
                                                <span className="fw-bold text-success">
                                                    TSH{" "}
                                                    {parseFloat(
                                                        reportData?.summary?.total_cost || 0
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mb-3 p-3 bg-light rounded">
                                            <div className="d-flex justify-content-between">
                                                <span>Average Cost per Task</span>
                                                <span className="fw-bold text-primary">
                                                    TSH{" "}
                                                    {parseFloat(
                                                        reportData?.summary?.average_cost || 0
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mb-3 p-3 bg-light rounded">
                                            <div className="d-flex justify-content-between">
                                                <span>Highest Single Cost</span>
                                                <span className="fw-bold text-warning">
                                                    TSH{" "}
                                                    {parseFloat(
                                                        reportData?.summary?.max_cost || 0
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Detailed Cost Data</h5>
                            </div>
                            <div className="card-body">{renderDataTable()}</div>
                        </div>
                    </>
                );

            case "performance":
                return (
                    <>
                        {renderSummaryCards()}
                        {renderPerformanceMetrics()}
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Performance Details</h5>
                            </div>
                            <div className="card-body">{renderDataTable()}</div>
                        </div>
                    </>
                );

            case "by_status":
            case "by_type":
            case "by_technician":
            case "by_asset":
            default:
                return (
                    <>
                        {renderSummaryCards()}
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    {reportTypes.find((r) => r.value === filters.report_type)?.label ||
                                        "Report Data"}
                                </h5>
                                <span className="badge bg-primary">
                                    {(reportData?.data || reportData?.results || []).length} Records
                                </span>
                            </div>
                            <div className="card-body">{renderDataTable()}</div>
                        </div>
                    </>
                );
        }
    };

    if (loading) {
        return (
            <>
                <BreadCumb pageList={["ICT Assets", "Reporting", "Maintenance Reports"]} />
                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ height: "400px" }}
                >
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading report data...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <BreadCumb pageList={["ICT Assets", "Reporting", "Maintenance Reports"]} />
                <div className="alert alert-danger mx-3 mt-3" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="bx bx-error-circle me-2"></i>
                        <div>
                            <h6 className="alert-heading mb-1">Failed to load report</h6>
                            <p className="mb-0">{error}</p>
                        </div>
                    </div>
                    <button
                        className="btn btn-sm btn-outline-danger mt-2"
                        onClick={() => fetchReport()}
                    >
                        <i className="bx bx-refresh me-1"></i>
                        Retry
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <BreadCumb pageList={["ICT Assets", "Reporting", "Maintenance Reports"]}>
                <div className="btn-group">
                    <button
                        type="button"
                        className="btn btn-success dropdown-toggle"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                    >
                        <i className="bx bx-download me-1"></i> Export
                    </button>
                    <ul className="dropdown-menu">
                        <li>
                            <button className="dropdown-item" onClick={exportToExcel}>
                                <i className="bx bx-file me-2"></i> Export to Excel
                            </button>
                        </li>
                        <li>
                            <button className="dropdown-item" onClick={exportToCSV}>
                                <i className="bx bx-spreadsheet me-2"></i> Export to CSV
                            </button>
                        </li>
                    </ul>
                </div>
            </BreadCumb>

            <div className="container-fluid">
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="card-title mb-0">
                            <i className="bx bx-filter-alt me-2"></i>Report Filters
                        </h5>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-4 col-lg-2">
                                <label className="form-label">Report Type</label>
                                <select
                                    className="form-select"
                                    name="report_type"
                                    value={filters.report_type}
                                    onChange={handleFilterChange}
                                >
                                    {reportTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4 col-lg-2">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="start_date"
                                    value={filters.start_date}
                                    onChange={handleFilterChange}
                                />
                            </div>

                            <div className="col-md-4 col-lg-2">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="end_date"
                                    value={filters.end_date}
                                    onChange={handleFilterChange}
                                />
                            </div>

                            <div className="col-md-4 col-lg-2">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    {statusOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4 col-lg-2">
                                <label className="form-label">Technician</label>
                                <select
                                    className="form-select"
                                    name="technician"
                                    value={filters.technician}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Technicians</option>
                                    {technicians.map((tech) => (
                                        <option key={tech.uid || tech.id} value={tech.uid || tech.id}>
                                            {tech.full_name || tech.name || `${tech.first_name} ${tech.last_name}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4 col-lg-2 d-flex align-items-end gap-2">
                                <button
                                    className="btn btn-primary flex-grow-1"
                                    onClick={handleApplyFilters}
                                >
                                    <i className="bx bx-search me-1"></i> Generate
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={handleResetFilters}
                                    title="Reset Filters"
                                >
                                    <i className="bx bx-reset"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {renderReportContent()}
            </div>
        </>
    );
};
