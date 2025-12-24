import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import React from "react";
import "animate.css";
import { Formik, Form, Field } from "formik";
import { reportService } from "./ReportQueries.jsx";
import { fetchData } from "../../../../utils/GlobalQueries.jsx";
import BreadCumb from "../../../../layouts/BreadCumb";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

const REPORT_TYPES = [
    { value: 'summary', label: 'Summary Report' },
    { value: 'by_status', label: 'By Status' },
    { value: 'by_condition', label: 'By Condition' },
    { value: 'by_category', label: 'By Category' },
    { value: 'by_location', label: 'By Location' },
    { value: 'by_type', label: 'By Asset Type' },
    { value: 'depreciation', label: 'Depreciation Report' },
    { value: 'warranty', label: 'Warranty Report' },
    { value: 'acquisition', label: 'Acquisition Report' },
    { value: 'inventory', label: 'Inventory Report' }
];

const STATUS_OPTIONS = [
    { value: 'operational', label: 'Operational' },
    { value: 'in_repair', label: 'In Repair' },
    { value: 'retired', label: 'Retired' },
    { value: 'lost', label: 'Lost' },
    { value: 'disposed', label: 'Disposed' }
];

export const AssetReportsPage = () => {
    const user = useSelector((state) => state.userReducer?.data);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [currentFilters, setCurrentFilters] = useState({});

    const initialValues = {
        reportType: 'summary',
        startDate: '',
        endDate: '',
        category: '',
        status: '',
        location: ''
    };

    // Fetch report data
    const fetchReportData = useCallback(async (values) => {
        try {
            setLoading(true);
            setError(null);
            setCurrentFilters(values);

            const params = {
                type: values.reportType,
                ...(values.startDate && { start_date: values.startDate }),
                ...(values.endDate && { end_date: values.endDate }),
                ...(values.category && { category: values.category }),
                ...(values.status && { status: values.status }),
                ...(values.location && { location: values.location })
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
                    fetchReportData(values);
                }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle generate report
    const handleGenerateReport = (values) => {
        fetchReportData(values);
    };

    // Handle reset filters
    const handleResetFilters = (resetForm) => {
        resetForm();
        setReportData(null);
        setCurrentFilters({});
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

            XLSX.writeFile(wb, `Asset_Report_${currentFilters.reportType || 'summary'}_${new Date().toISOString().split('T')[0]}.xlsx`);

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
            link.download = `Asset_Report_${currentFilters.reportType || 'summary'}_${new Date().toISOString().split('T')[0]}.csv`;
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
        const reportTypeObj = REPORT_TYPES.find(r => r.value === currentFilters.reportType);
        return reportTypeObj?.label || 'Asset Report';
    };

    // Helper to extract numeric value from response (handles both plain numbers and {source, parsedValue} objects)
    const getNumericValue = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'object' && value.parsedValue !== undefined) return value.parsedValue;
        if (typeof value === 'object' && value.source !== undefined) return parseFloat(value.source) || 0;
        return parseFloat(value) || 0;
    };

    // Render summary cards
    const renderSummaryCards = () => {
        if (!reportData) return null;

        const summary = reportData?.summary || reportData;

        return (
            <div className="row">
                {/* Total Assets */}
                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-primary rounded p-2">
                                        <i className="bx bx-box text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Total Assets</span>
                                    <h3 className="card-title mb-0">{summary?.total_assets || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Computers */}
                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-success rounded p-2">
                                        <i className="bx bx-desktop text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Computers</span>
                                    <h3 className="card-title mb-0">{summary?.computers || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Network Devices */}
                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-info rounded p-2">
                                        <i className="bx bx-network-chart text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Network Devices</span>
                                    <h3 className="card-title mb-0">{summary?.network_devices || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Peripherals */}
                <div className="col-sm-6 col-lg-3 mb-4">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-warning rounded p-2">
                                        <i className="bx bx-printer text-white"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="fw-medium d-block mb-1">Peripherals</span>
                                    <h3 className="card-title mb-0">{summary?.peripherals || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render condition distribution for an asset type
    const renderConditionBadges = (conditions) => {
        if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
            return <span className="text-muted">No data</span>;
        }

        const conditionColors = {
            'new': 'bg-success',
            'excellent': 'bg-primary',
            'good': 'bg-info',
            'fair': 'bg-warning',
            'poor': 'bg-danger',
        };

        return (
            <div className="d-flex flex-wrap gap-1">
                {conditions.map((item, idx) => (
                    <span
                        key={idx}
                        className={`badge ${conditionColors[item.condition] || 'bg-secondary'}`}
                    >
                        {item.condition || 'Unknown'}: {item.count}
                    </span>
                ))}
            </div>
        );
    };

    // Render asset type condition cards
    const renderAssetTypeConditions = () => {
        if (!reportData?.asset_type_conditions) return null;

        const { computers, network_devices, peripherals } = reportData.asset_type_conditions;

        return (
            <div className="row mb-4">
                {/* Computers Conditions */}
                <div className="col-md-4 mb-3">
                    <div className="card h-100">
                        <div className="card-header d-flex align-items-center">
                            <i className="bx bx-desktop me-2 text-success"></i>
                            <h6 className="mb-0">Computers by Condition</h6>
                        </div>
                        <div className="card-body">
                            {renderConditionBadges(computers)}
                        </div>
                    </div>
                </div>
                {/* Network Devices Conditions */}
                <div className="col-md-4 mb-3">
                    <div className="card h-100">
                        <div className="card-header d-flex align-items-center">
                            <i className="bx bx-network-chart me-2 text-info"></i>
                            <h6 className="mb-0">Network Devices by Condition</h6>
                        </div>
                        <div className="card-body">
                            {renderConditionBadges(network_devices)}
                        </div>
                    </div>
                </div>
                {/* Peripherals Conditions */}
                <div className="col-md-4 mb-3">
                    <div className="card h-100">
                        <div className="card-header d-flex align-items-center">
                            <i className="bx bx-printer me-2 text-warning"></i>
                            <h6 className="mb-0">Peripherals by Condition</h6>
                        </div>
                        <div className="card-body">
                            {renderConditionBadges(peripherals)}
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
        switch (currentFilters.reportType) {
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
        // Handle object values with parsedValue (from API response)
        if (typeof value === 'object' && (value.parsedValue !== undefined || value.source !== undefined)) {
            const numValue = getNumericValue(value);
            if (column.includes('value') || column.includes('cost') || column.includes('price')) {
                return `TSH ${numValue.toLocaleString()}`;
            }
            return numValue.toLocaleString();
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
                {currentFilters.reportType === 'summary' && renderSummaryCards()}
                {currentFilters.reportType === 'summary' && renderAssetTypeConditions()}
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
                    <Formik
                        initialValues={initialValues}
                        onSubmit={handleGenerateReport}
                        enableReinitialize
                    >
                        {({ values, resetForm }) => (
                            <Form>
                                <div className="row g-3">
                                    {/* Report Type */}
                                    <FormikSelect
                                        name="reportType"
                                        label="Report Type"
                                        staticOptions={REPORT_TYPES}
                                        mapOption={(item) => ({ value: item.value, label: item.label })}
                                        placeholder="Select Report Type"
                                        containerClass="col-md-4 mb-0"
                                    />

                                    {/* Start Date */}
                                    <div className="col-md-4">
                                        <label className="form-label">Start Date</label>
                                        <Field
                                            type="date"
                                            name="startDate"
                                            className="form-control"
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div className="col-md-4">
                                        <label className="form-label">End Date</label>
                                        <Field
                                            type="date"
                                            name="endDate"
                                            className="form-control"
                                        />
                                    </div>

                                    {/* Category */}
                                    <FormikSelect
                                        name="category"
                                        label="Category"
                                        url="/asset-categories"
                                        containerClass="col-md-4 mb-0"
                                        filters={{ page: 1, page_size: 50, paginated: true }}
                                        mapOption={(item) => ({ value: item.uid, label: item.name })}
                                        placeholder="All Categories"
                                    />

                                    {/* Status */}
                                    <FormikSelect
                                        name="status"
                                        label="Status"
                                        staticOptions={STATUS_OPTIONS}
                                        mapOption={(item) => ({ value: item.value, label: item.label })}
                                        placeholder="All Statuses"
                                        containerClass="col-md-4 mb-0"
                                    />

                                    {/* Location */}
                                    <FormikSelect
                                        name="location"
                                        label="Location"
                                        url="/asset-locations"
                                        containerClass="col-md-4 mb-0"
                                        filters={{ page: 1, page_size: 50, paginated: true }}
                                        mapOption={(item) => ({ value: item.uid, label: item.name })}
                                        placeholder="All Locations"
                                    />
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
                                        onClick={() => handleResetFilters(resetForm)}
                                        disabled={loading}
                                    >
                                        <i className="bx bx-reset me-1"></i>
                                        Reset Filters
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            {/* Report Content */}
            {renderReportContent()}
        </div>
    );
};

