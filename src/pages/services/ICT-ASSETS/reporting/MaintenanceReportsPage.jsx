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
        const defaultFilters = {
            report_type: "summary",
            start_date: "",
            end_date: "",
            status: "",
            technician: "",
        };
        setFilters(defaultFilters);
        setReportData(null);
    };

    const exportToExcel = () => {
        if (!reportData) {
            Swal.fire("Warning", "No data to export", "warning");
            return;
        }

        const reportType = filters.report_type;
        const workbook = XLSX.utils.book_new();

        if (reportType === "summary" && reportData.summary) {
            const summary = reportData.summary;
            const summaryData = [
                { Metric: "Total Records", Value: summary.total_records || summary.total_tasks || 0 },
                { Metric: "Completed Tasks", Value: summary.completed || 0 },
                { Metric: "In Progress", Value: summary.in_progress || 0 },
                { Metric: "Scheduled", Value: summary.scheduled || 0 },
                { Metric: "Overdue", Value: summary.overdue || 0 },
                { Metric: "Total Cost (TSH)", Value: summary.total_cost?.parsedValue || summary.total_cost || 0 },
                { Metric: "Average Cost (TSH)", Value: summary.average_cost || 0 },
            ];
            const summarySheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

            if (reportData.status_breakdown?.length > 0) {
                const statusData = reportData.status_breakdown.map((item) => ({
                    Status: item.status?.replace(/_/g, " ").toUpperCase(),
                    Count: item.count,
                    "Total Cost (TSH)": item.total_cost?.parsedValue || item.total_cost || 0,
                }));
                const statusSheet = XLSX.utils.json_to_sheet(statusData);
                XLSX.utils.book_append_sheet(workbook, statusSheet, "Status Breakdown");
            }

            if (reportData.type_breakdown?.length > 0) {
                const typeData = reportData.type_breakdown.map((item) => ({
                    "Maintenance Type": item.maintenance_type,
                    Count: item.count,
                    "Total Cost (TSH)": item.total_cost?.parsedValue || item.total_cost || 0,
                }));
                const typeSheet = XLSX.utils.json_to_sheet(typeData);
                XLSX.utils.book_append_sheet(workbook, typeSheet, "Type Breakdown");
            }
        } else {
            let exportData = [];
            if (reportData.data && Array.isArray(reportData.data)) {
                exportData = reportData.data;
            } else if (reportData.results && Array.isArray(reportData.results)) {
                exportData = reportData.results;
            } else {
                exportData = [reportData];
            }
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
        }

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
            const summary = reportData.summary;
            exportData = [
                { Metric: "Total Records", Value: summary.total_records || summary.total_tasks || 0 },
                { Metric: "Completed Tasks", Value: summary.completed || 0 },
                { Metric: "In Progress", Value: summary.in_progress || 0 },
                { Metric: "Scheduled", Value: summary.scheduled || 0 },
                { Metric: "Overdue", Value: summary.overdue || 0 },
                { Metric: "Total Cost (TSH)", Value: summary.total_cost?.parsedValue || summary.total_cost || 0 },
                { Metric: "Average Cost (TSH)", Value: summary.average_cost || 0 },
            ];

            if (reportData.status_breakdown?.length > 0) {
                exportData.push({ Metric: "", Value: "" });
                exportData.push({ Metric: "--- Status Breakdown ---", Value: "" });
                reportData.status_breakdown.forEach((item) => {
                    exportData.push({
                        Metric: item.status?.replace(/_/g, " ").toUpperCase(),
                        Value: `Count: ${item.count}, Cost: ${item.total_cost?.parsedValue || item.total_cost || 0}`,
                    });
                });
            }

            if (reportData.type_breakdown?.length > 0) {
                exportData.push({ Metric: "", Value: "" });
                exportData.push({ Metric: "--- Type Breakdown ---", Value: "" });
                reportData.type_breakdown.forEach((item) => {
                    exportData.push({
                        Metric: item.maintenance_type,
                        Value: `Count: ${item.count}, Cost: ${item.total_cost?.parsedValue || item.total_cost || 0}`,
                    });
                });
            }
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

    const parseCost = (cost) => {
        if (typeof cost === "object" && cost !== null) {
            return cost.parsedValue || parseFloat(cost.source) || 0;
        }
        return parseFloat(cost) || 0;
    };

    const renderSummaryCards = () => {
        if (!reportData?.summary) return null;

        const summary = reportData.summary;
        const totalRecords = summary.total_records || summary.total_tasks || 0;
        const totalCost = parseCost(summary.total_cost);
        const averageCost = summary.average_cost || 0;

        return (
            <div className="row">
                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-primary rounded p-2">
                                        <i className="bx bx-wrench text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Total Records</span>
                                    <h3 className="card-title mb-0">{totalRecords}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-success rounded p-2">
                                        <i className="bx bx-check-circle text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Completed</span>
                                    <h3 className="card-title mb-0">{summary.completed || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-warning rounded p-2">
                                        <i className="bx bx-time-five text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">In Progress</span>
                                    <h3 className="card-title mb-0">{summary.in_progress || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-info rounded p-2">
                                        <i className="bx bx-calendar text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Scheduled</span>
                                    <h3 className="card-title mb-0">{summary.scheduled || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-danger rounded p-2">
                                        <i className="bx bx-error text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Overdue</span>
                                    <h3 className="card-title mb-0">{summary.overdue || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-secondary rounded p-2">
                                        <i className="bx bx-dollar text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Total Cost</span>
                                    <h3 className="card-title mb-0">TSH {totalCost.toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-dark rounded p-2">
                                        <i className="bx bx-calculator text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Avg Cost</span>
                                    <h3 className="card-title mb-0">TSH {parseFloat(averageCost).toLocaleString()}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCostByTypeChart = () => {
        const typeCost = reportData?.type_cost || [];

        if (!typeCost.length) {
            return (
                <div className="text-center py-4">
                    <i className="bx bx-chart text-muted display-4"></i>
                    <p className="text-muted mt-2">No cost data available</p>
                </div>
            );
        }

        const maxCost = Math.max(...typeCost.map((item) => parseCost(item.total_cost)));

        return (
            <div className="cost-chart">
                {typeCost.map((item, index) => {
                    const cost = parseCost(item.total_cost);
                    const label = item.maintenance_type || `Type ${index + 1}`;

                    return (
                        <div key={index} className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                                <span className="text-sm">{label}</span>
                                <span className="fw-bold">
                                    TSH {cost.toLocaleString()}
                                </span>
                            </div>
                            <div className="progress" style={{ height: "20px" }}>
                                <div
                                    className="progress-bar bg-success"
                                    style={{ width: `${maxCost > 0 ? (cost / maxCost) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderMonthlyCostTable = () => {
        const monthlyCost = reportData?.monthly_cost || [];

        if (!monthlyCost.length) {
            return (
                <div className="text-center py-4">
                    <i className="bx bx-calendar text-muted display-4"></i>
                    <p className="text-muted mt-2">No monthly data available</p>
                </div>
            );
        }

        return (
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead className="table-light">
                        <tr>
                            <th>Month</th>
                            <th className="text-center">Count</th>
                            <th className="text-end">Total Cost</th>
                            <th className="text-end">Avg Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthlyCost.map((item, index) => {
                            const monthDate = new Date(item.month);
                            const monthLabel = monthDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                            });
                            return (
                                <tr key={index}>
                                    <td>{monthLabel}</td>
                                    <td className="text-center">{item.count}</td>
                                    <td className="text-end">
                                        TSH {parseCost(item.total_cost).toLocaleString()}
                                    </td>
                                    <td className="text-end">
                                        TSH {parseCost(item.avg_cost).toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderPerformanceMetrics = () => {
        const metrics = reportData?.metrics || reportData?.performance || reportData?.data || {};

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
                                    {metrics.completion_rate !== undefined ? parseFloat(metrics.completion_rate).toFixed(1) : 0}%
                                </div>
                                <p className="text-muted mb-0">Tasks Completed</p>
                            </div>
                            <div className="progress mt-3" style={{ height: "10px" }}>
                                <div
                                    className="progress-bar bg-success"
                                    style={{ width: `${metrics.completion_rate || 0}%` }}
                                ></div>
                            </div>
                            <small className="text-muted d-block mt-2 text-center">
                                {metrics.total_completed || 0} of {metrics.total_records || 0} completed
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h6 className="card-title mb-0">On-Time Completion Rate</h6>
                        </div>
                        <div className="card-body">
                            <div className="text-center">
                                <div className="display-4 text-primary fw-bold">
                                    {metrics.on_time_rate !== undefined ? parseFloat(metrics.on_time_rate).toFixed(1) : 0}%
                                </div>
                                <p className="text-muted mb-0">Tasks Completed On Time</p>
                            </div>
                            <div className="progress mt-3" style={{ height: "10px" }}>
                                <div
                                    className="progress-bar bg-primary"
                                    style={{ width: `${metrics.on_time_rate || 0}%` }}
                                ></div>
                            </div>
                            <small className="text-muted d-block mt-2 text-center">
                                {metrics.on_time_count || 0} on-time, {metrics.late_count || 0} late
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <i className="bx bx-time-five text-info display-5"></i>
                                <h5 className="mt-2">{metrics.average_completion_days !== undefined ? parseFloat(metrics.average_completion_days).toFixed(2) : 0}</h5>
                                <small className="text-muted">Average Days to Complete</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <i className="bx bx-check-circle text-success display-5"></i>
                                <h5 className="mt-2">{metrics.total_completed || 0}</h5>
                                <small className="text-muted">Total Completed</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <i className="bx bx-list-check text-warning display-5"></i>
                                <h5 className="mt-2">{metrics.total_records || 0}</h5>
                                <small className="text-muted">Total Records</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="text-center">
                                <i className="bx bx-trending-up text-danger display-5"></i>
                                <h5 className="mt-2">{metrics.late_count || 0}</h5>
                                <small className="text-muted">Late Completions</small>
                            </div>
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
                        <div className="row">
                            <div className="col-lg-6 mb-4">
                                <div className="card h-100">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="bx bx-pie-chart-alt-2 me-2"></i>
                                            Status Breakdown
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {reportData?.status_breakdown?.length > 0 ? (
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Status</th>
                                                            <th className="text-center">Count</th>
                                                            <th className="text-end">Total Cost</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reportData.status_breakdown.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <span className={`badge bg-${item.status === "completed" ? "success" :
                                                                        item.status === "in_progress" ? "warning" :
                                                                            item.status === "scheduled" ? "info" :
                                                                                item.status === "cancelled" ? "secondary" : "primary"
                                                                        }`}>
                                                                        {item.status?.replace(/_/g, " ").toUpperCase()}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">{item.count}</td>
                                                                <td className="text-end">
                                                                    TSH {parseCost(item.total_cost).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-muted text-center mb-0">No status data available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6 mb-4">
                                <div className="card h-100">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="bx bx-category me-2"></i>
                                            Maintenance Type Breakdown
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        {reportData?.type_breakdown?.length > 0 ? (
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Type</th>
                                                            <th className="text-center">Count</th>
                                                            <th className="text-end">Total Cost</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reportData.type_breakdown.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>
                                                                    <span className={`badge bg-${item.maintenance_type === "Preventive" ? "primary" :
                                                                        item.maintenance_type === "Corrective" ? "danger" :
                                                                            item.maintenance_type === "Emergency" ? "warning" :
                                                                                item.maintenance_type === "Routine" ? "info" : "secondary"
                                                                        }`}>
                                                                        {item.maintenance_type}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">{item.count}</td>
                                                                <td className="text-end">
                                                                    TSH {parseCost(item.total_cost).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-muted text-center mb-0">No type data available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                );

            case "cost_analysis":
                return (
                    <>
                        <div className="row">
                            <div className="col-lg-6 mb-4">
                                <div className="card h-100">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="bx bx-pie-chart-alt-2 me-2"></i>
                                            Cost by Maintenance Type
                                        </h5>
                                    </div>
                                    <div className="card-body">{renderCostByTypeChart()}</div>
                                </div>
                            </div>
                            <div className="col-lg-6 mb-4">
                                <div className="card h-100">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="bx bx-dollar-circle me-2"></i>
                                            Cost Summary
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3 p-3 bg-light rounded">
                                            <div className="d-flex justify-content-between">
                                                <span>Total Maintenance Cost</span>
                                                <span className="fw-bold text-success">
                                                    TSH {parseCost(reportData?.total_cost).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mb-3 p-3 bg-light rounded">
                                            <div className="d-flex justify-content-between">
                                                <span>Total Maintenance Types</span>
                                                <span className="fw-bold text-primary">
                                                    {reportData?.type_cost?.length || 0}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mb-3 p-3 bg-light rounded">
                                            <div className="d-flex justify-content-between">
                                                <span>Months with Data</span>
                                                <span className="fw-bold text-info">
                                                    {reportData?.monthly_cost?.length || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">
                                    <i className="bx bx-calendar me-2"></i>
                                    Monthly Cost Breakdown
                                </h5>
                            </div>
                            <div className="card-body">{renderMonthlyCostTable()}</div>
                        </div>
                    </>
                );

            case "performance":
                return (
                    <>
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
