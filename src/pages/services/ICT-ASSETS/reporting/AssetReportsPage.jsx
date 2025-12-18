import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import React from "react";
import "animate.css";
import { reportService } from "./ReportQueries.jsx";
import { fetchData } from "../../../../utils/GlobalQueries.jsx";
import BreadCumb from "../../../../layouts/BreadCumb";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

const REPORT_TYPES = [
    { value: 'summary', label: 'Summary Report' },
    { value: 'by_status', label: 'By Status' },
    { value: 'by_category', label: 'By Category' },
    { value: 'by_location', label: 'By Location' },
    { value: 'by_type', label: 'By Asset Type' },
    { value: 'depreciation', label: 'Depreciation Report' },
    { value: 'warranty', label: 'Warranty Report' },
    { value: 'acquisition', label: 'Acquisition Report' },
    { value: 'inventory', label: 'Inventory Report' }
];

export const AssetReportsPage = () => {
    const user = useSelector((state) => state.userReducer?.data);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    // Filter states
    const [reportType, setReportType] = useState('summary');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');

    // Dropdown options
    const [categories, setCategories] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [locations, setLocations] = useState([]);

    // Fetch dropdown options on mount
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [categoriesData, locationsData] = await Promise.all([
                    reportService.getCategories().catch(() => ({ results: [] })),
                    reportService.getLocations().catch(() => ({ results: [] }))
                ]);

                const catArray = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results || []);
                const locArray = Array.isArray(locationsData) ? locationsData : (locationsData?.results || []);
                setCategories(catArray);
                setLocations(locArray);
                setStatuses([
                    { value: 'Operational', label: 'Operational' },
                    { value: 'In Repair', label: 'In Repair' },
                    { value: 'Retired', label: 'Retired' },
                    { value: 'Lost', label: 'Lost' },
                    { value: 'Disposed', label: 'Disposed' }
                ]);
            } catch (err) {
                console.error('Failed to load dropdown options:', err);
            }
        };
        fetchDropdownData();
    }, []);

    // Fetch report data
    const fetchReportData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                type: reportType,
                ...(startDate && { start_date: startDate }),
                ...(endDate && { end_date: endDate }),
                ...(selectedCategory && { category: selectedCategory }),
                ...(selectedStatus && { status: selectedStatus }),
                ...(selectedLocation && { location: selectedLocation })
            };

            const data = await fetchData({
                url: '/asset-reports',
                filter: params
            });
            setReportData(data);
        } catch (err) {
            console.error('Report fetch error:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load report data';
            setError(errorMessage);

            Swal.fire({
                icon: 'error',
                title: 'Report Error',
                text: 'Failed to load report data. Please try again.',
                confirmButtonText: 'Retry',
                showCancelButton: true,
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    fetchReportData();
                }
            });
        } finally {
            setLoading(false);
        }
    }, [reportType, startDate, endDate, selectedCategory, selectedStatus, selectedLocation]);

    // Handle generate report
    const handleGenerateReport = (e) => {
        e.preventDefault();
        fetchReportData();
    };

    // Handle reset filters
    const handleResetFilters = () => {
        setReportType('summary');
        setStartDate('');
        setEndDate('');
        setSelectedCategory('');
        setSelectedStatus('');
        setSelectedLocation('');
        setReportData(null);
    };

    // Export to Excel
    const handleExportExcel = () => {
        if (!reportData) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'Please generate a report first before exporting.'
            });
            return;
        }

        setExporting(true);
        try {
            const exportData = prepareExportData(reportData);
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Asset Report");

            const colWidths = Object.keys(exportData[0] || {}).map(() => ({ wch: 20 }));
            ws['!cols'] = colWidths;

            XLSX.writeFile(wb, `Asset_Report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);

            Swal.fire({
                icon: 'success',
                title: 'Export Successful',
                text: 'Report exported to Excel successfully!',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Export error:', err);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'Failed to export report. Please try again.'
            });
        } finally {
            setExporting(false);
        }
    };

    // Export to CSV
    const handleExportCSV = () => {
        if (!reportData) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'Please generate a report first before exporting.'
            });
            return;
        }

        setExporting(true);
        try {
            const exportData = prepareExportData(reportData);
            const ws = XLSX.utils.json_to_sheet(exportData);
            const csv = XLSX.utils.sheet_to_csv(ws);

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Asset_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            Swal.fire({
                icon: 'success',
                title: 'Export Successful',
                text: 'Report exported to CSV successfully!',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Export error:', err);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'Failed to export report. Please try again.'
            });
        } finally {
            setExporting(false);
        }
    };

    // Prepare data for export
    const prepareExportData = (data) => {
        if (Array.isArray(data)) {
            return data;
        }
        if (data?.results && Array.isArray(data.results)) {
            return data.results;
        }
        if (data?.data && Array.isArray(data.data)) {
            return data.data;
        }
        if (data?.items && Array.isArray(data.items)) {
            return data.items;
        }
        // For summary type reports, convert to array
        if (typeof data === 'object') {
            return [data];
        }
        return [];
    };

    // Get report title
    const getReportTitle = () => {
        const reportTypeObj = REPORT_TYPES.find(r => r.value === reportType);
        return reportTypeObj?.label || 'Asset Report';
    };

    // Render summary cards
    const renderSummaryCards = () => {
        if (!reportData) return null;

        const summary = reportData?.summary || reportData;

        return (
            <div className="row">
                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-primary rounded p-2">
                                        <i className="bx bx-laptop text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Total Assets</span>
                                    <h3 className="card-title mb-0">{summary?.total_assets || summary?.total || 0}</h3>
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
                                    <span className="fw-medium d-block mb-1">Operational</span>
                                    <h3 className="card-title mb-0">{summary?.operational || summary?.operational_assets || 0}</h3>
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
                                        <i className="bx bx-money text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Total Value</span>
                                    <h3 className="card-title mb-0">
                                        TSH {parseFloat(summary?.total_value || summary?.total_asset_value || 0).toLocaleString()}
                                    </h3>
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
                                        <i className="bx bx-wrench text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">In Repair</span>
                                    <h3 className="card-title mb-0">{summary?.in_repair || summary?.assets_in_repair || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Get table data based on report type
    const getTableData = () => {
        if (!reportData) return [];
        
        // Check common data fields first
        if (reportData?.data && Array.isArray(reportData.data)) return reportData.data;
        if (reportData?.results && Array.isArray(reportData.results)) return reportData.results;
        if (reportData?.items && Array.isArray(reportData.items)) return reportData.items;
        if (Array.isArray(reportData)) return reportData;
        
        // Report-type specific data extraction
        switch (reportType) {
            case 'summary':
                return reportData?.status_breakdown || reportData?.category_breakdown || [];
            case 'warranty':
                return reportData?.expiring_soon || [];
            case 'acquisition':
                return reportData?.monthly_data || [];
            default:
                return [];
        }
    };

    // Render data table
    const renderDataTable = () => {
        if (!reportData) return null;

        const tableData = getTableData();

        if (!tableData.length) {
            return (
                <div className="text-center py-4">
                    <i className="bx bx-folder-open text-muted display-4"></i>
                    <p className="text-muted mt-2">No data available for this report</p>
                </div>
            );
        }

        const columns = Object.keys(tableData[0] || {}).filter(
            key => !['uid', 'id', 'created_at', 'updated_at', 'deleted_at'].includes(key)
        );

        return (
            <div className="table-responsive">
                <table className="table table-hover table-striped">
                    <thead className="table-light">
                        <tr>
                            <th>#</th>
                            {columns.map((col, idx) => (
                                <th key={idx} className="text-capitalize">
                                    {col.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                <td>{rowIdx + 1}</td>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx}>
                                        {formatCellValue(row[col], col)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Format cell value
    const formatCellValue = (value, column) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (column.includes('date') && value) {
            return new Date(value).toLocaleDateString();
        }
        if ((column.includes('value') || column.includes('cost') || column.includes('price')) && !isNaN(value)) {
            return `TSH ${parseFloat(value).toLocaleString()}`;
        }
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    // Render report content based on type
    const renderReportContent = () => {
        if (loading) {
            return (
                <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Generating report...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="alert alert-danger" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="bx bx-error-circle me-2"></i>
                        <div>
                            <h6 className="alert-heading mb-1">Failed to generate report</h6>
                            <p className="mb-0">{error}</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (!reportData) {
            return (
                <div className="text-center py-5">
                    <i className="bx bx-file-find text-muted display-1"></i>
                    <h5 className="mt-3 text-muted">No Report Generated</h5>
                    <p className="text-muted">Select your filters and click "Generate Report" to view data</p>
                </div>
            );
        }

        return (
            <>
                {reportType === 'summary' && renderSummaryCards()}
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">{getReportTitle()} Data</h5>
                        <span className="badge bg-primary">
                            {getTableData().length} records
                        </span>
                    </div>
                    <div className="card-body">
                        {renderDataTable()}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="container-fluid">
            <BreadCumb pageList={['ICT Assets', 'Reports']}>
                <div className="btn-group">
                    <button
                        className="btn btn-success dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        disabled={!reportData || exporting}
                    >
                        {exporting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-1"></span>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <i className="bx bx-export me-1"></i>
                                Export
                            </>
                        )}
                    </button>
                    <ul className="dropdown-menu">
                        <li>
                            <button className="dropdown-item" onClick={handleExportExcel}>
                                <i className="bx bx-file me-2"></i>
                                Export to Excel
                            </button>
                        </li>
                        <li>
                            <button className="dropdown-item" onClick={handleExportCSV}>
                                <i className="bx bx-table me-2"></i>
                                Export to CSV
                            </button>
                        </li>
                    </ul>
                </div>
            </BreadCumb>

            {/* Filters Card */}
            <div className="card mb-4">
                <div className="card-header">
                    <h5 className="card-title mb-0">
                        <i className="bx bx-filter-alt me-2"></i>
                        Report Filters
                    </h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleGenerateReport}>
                        <div className="row g-3">
                            {/* Report Type */}
                            <div className="col-md-4">
                                <label className="form-label">Report Type</label>
                                <select
                                    className="form-select"
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                >
                                    {REPORT_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Date */}
                            <div className="col-md-4">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            {/* End Date */}
                            <div className="col-md-4">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>

                            {/* Category */}
                            <div className="col-md-4">
                                <label className="form-label">Category</label>
                                <select
                                    className="form-select"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat.uid || cat.id} value={cat.uid || cat.id}>
                                            {cat.name || cat.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status */}
                            <div className="col-md-4">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    {statuses.map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Location */}
                            <div className="col-md-4">
                                <label className="form-label">Location</label>
                                <select
                                    className="form-select"
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                >
                                    <option value="">All Locations</option>
                                    {locations.map((loc) => (
                                        <option key={loc.uid || loc.id} value={loc.uid || loc.id}>
                                            {loc.name || loc.location_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 d-flex gap-2">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <i className="bx bx-bar-chart-alt me-1"></i>
                                        Generate Report
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={handleResetFilters}
                                disabled={loading}
                            >
                                <i className="bx bx-reset me-1"></i>
                                Reset Filters
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Report Content */}
            {renderReportContent()}
        </div>
    );
};

