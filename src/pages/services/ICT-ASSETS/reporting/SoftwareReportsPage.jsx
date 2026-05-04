import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import React from "react";
import "animate.css";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { Formik, Form } from "formik";
import { fetchData } from "../../../../utils/GlobalQueries.jsx";
import BreadCumb from "../../../../layouts/BreadCumb";
import FormikSelect from "../../../../components/ui-templates/form-components/FormikSelect";

const LICENSE_TYPES = [
    { value: "", label: "All License Types" },
    { value: "perpetual", label: "Perpetual" },
    { value: "subscription", label: "Subscription" },
    { value: "open_source", label: "Open Source" },
    { value: "trial", label: "Trial" },
    { value: "enterprise", label: "Enterprise" },
    { value: "volume", label: "Volume" },
    { value: "freeware", label: "Freeware" },
    { value: "site_license", label: "Site License" },
    { value: "oem", label: "OEM" },
    { value: "concurrent", label: "Concurrent" },
    { value: "other", label: "Other" },
];

const REPORT_TYPES = [
    { value: "summary", label: "Summary Report", icon: "bx-pie-chart-alt-2" },
    { value: "license", label: "License Report", icon: "bx-key" },
    { value: "installation", label: "Installation Report", icon: "bx-download" },
    { value: "compliance", label: "Compliance Report", icon: "bx-check-shield" },
    { value: "expiring", label: "Expiring Licenses", icon: "bx-calendar-exclamation" },
];

const SoftwareReportsPage = () => {
    const user = useSelector((state) => state.userReducer?.data);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    const [filters, setFilters] = useState({
        report_type: "summary",
        category: "",
        license_type: "",
    });

    const fetchReportData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await fetchData({
                url: "/software-reports",
                filter: {
                    type: filters.report_type,
                    category: filters.category || undefined,
                    license_type: filters.license_type || undefined,
                },
            });
            setReportData(data);
        } catch (err) {
            console.error("Report fetch error:", err);
            const errorMessage =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to load report data";
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
                    fetchReportData();
                }
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handleExport = async (format) => {
        if (!reportData) return;

        setExporting(true);
        try {
            let exportData = [];
            const reportType = filters.report_type;

            switch (reportType) {
                case "summary":
                    const summary = reportData.summary || {};
                    const parseCostForExport = (cost) => {
                        if (typeof cost === "object" && cost !== null) {
                            return cost.parsedValue || parseFloat(cost.source) || 0;
                        }
                        return parseFloat(cost) || 0;
                    };

                    exportData = [
                        {
                            Metric: "Total Software",
                            Value: summary.total_software || 0,
                        },
                        {
                            Metric: "Total Licenses",
                            Value: summary.total_licenses || 0,
                        },
                        {
                            Metric: "Used Licenses",
                            Value: summary.used_licenses || 0,
                        },
                        {
                            Metric: "Available Licenses",
                            Value: summary.available_licenses || 0,
                        },
                        {
                            Metric: "License Utilization (%)",
                            Value: parseFloat(summary.license_utilization || 0).toFixed(2),
                        },
                        {
                            Metric: "Total License Cost (TSH)",
                            Value: parseCostForExport(summary.total_cost),
                        },
                        {
                            Metric: "Expiring in 30 Days",
                            Value: summary.expiring_30_days || 0,
                        },
                    ];

                    if (reportData.license_breakdown && reportData.license_breakdown.length > 0) {
                        exportData.push({ Metric: "", Value: "" });
                        exportData.push({ Metric: "--- License Breakdown ---", Value: "" });
                        reportData.license_breakdown.forEach((item) => {
                            exportData.push({
                                Metric: item.license_type?.replace(/_/g, " ").toUpperCase(),
                                Value: `Count: ${item.count}, Total Licenses: ${item.total_licenses}, Used: ${item.used_licenses}`,
                            });
                        });
                    }

                    if (reportData.type_breakdown && reportData.type_breakdown.length > 0) {
                        exportData.push({ Metric: "", Value: "" });
                        exportData.push({ Metric: "--- Type Breakdown ---", Value: "" });
                        reportData.type_breakdown.forEach((item) => {
                            exportData.push({
                                Metric: item.software_type?.replace(/_/g, " ").toUpperCase(),
                                Value: `Count: ${item.count}, Cost: ${parseCostForExport(item.total_cost)}`,
                            });
                        });
                    }
                    break;
                case "license":
                    exportData = (reportData.data || []).map((license) => ({
                        "Software Name": license.software_name,
                        "Asset Tag": license.asset_tag,
                        "Publisher": license.publisher,
                        "Version": license.version,
                        "License Type": license.license_type,
                        "Total Licenses": license.total_licenses,
                        "Used Licenses": license.used_licenses,
                        "Available Licenses": license.available_licenses,
                        "Utilization %": license.utilization?.parsedValue || license.utilization,
                        "License Expiry": license.license_expiry || "N/A",
                        "Purchase Cost (TSH)": license.purchase_cost?.parsedValue || license.purchase_cost?.source || 0,
                    }));
                    break;
                case "installation":
                    exportData = (reportData.data || []).map((item) => ({
                        "Software Name": item.software_name,
                        "Version": item.software_version,
                        "Total Installations": item.installation_count,
                        "Active": item.active_count,
                        "Inactive": item.inactive_count,
                    }));
                    break;
                case "compliance":
                    exportData = (reportData.data || []).map((item) => ({
                        "Software Name": item.software_name,
                        "Version": item.version,
                        "License Type": item.license_type,
                        "Total Licenses": item.total_licenses,
                        "Used Licenses": item.used_licenses,
                        "Available Licenses": item.total_licenses - item.used_licenses,
                        "Utilization %": ((item.used_licenses / item.total_licenses) * 100).toFixed(2),
                        Status: item.compliance_status,
                    }));
                    break;
                case "expiring":
                    const expiringData = reportData.data || {};
                    const allExpiringItems = [
                        ...(expiringData.expired || []),
                        ...(expiringData.expiring_30_days || []),
                        ...(expiringData.expiring_90_days || []),
                    ];
                    exportData = allExpiringItems.map((item) => ({
                        "Software Name": item.software_name,
                        "Version": item.version,
                        "License Type": item.license_type,
                        "Total Licenses": item.total_licenses,
                        "Used Licenses": item.used_licenses,
                        "License Expiry": item.license_expiry || "N/A",
                        "Days Until Expiry": item.days_until_expiry || 0,
                    }));
                    break;
                default:
                    break;
            }

            if (exportData.length === 0) {
                Swal.fire({
                    icon: "warning",
                    title: "No Data",
                    text: "There is no data to export.",
                });
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                `${reportType}_report`
            );

            const fileName = `software_${reportType}_report_${new Date().toISOString().split("T")[0]}`;

            if (format === "xlsx") {
                XLSX.writeFile(workbook, `${fileName}.xlsx`);
            } else {
                XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: "csv" });
            }

            Swal.fire({
                icon: "success",
                title: "Export Successful",
                text: `Report exported as ${format.toUpperCase()}`,
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error("Export error:", err);
            Swal.fire({
                icon: "error",
                title: "Export Failed",
                text: "Failed to export report. Please try again.",
            });
        } finally {
            setExporting(false);
        }
    };

    const renderReportContent = () => {
        if (loading) {
            return (
                <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ height: "300px" }}
                >
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading report data...</p>
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
                            <h6 className="alert-heading mb-1">Failed to load report</h6>
                            <p className="mb-0">{error}</p>
                        </div>
                    </div>
                    <button
                        className="btn btn-sm btn-outline-danger mt-2"
                        onClick={fetchReportData}
                    >
                        <i className="bx bx-refresh me-1"></i>
                        Retry
                    </button>
                </div>
            );
        }

        switch (filters.report_type) {
            case "summary":
                return <SummaryReport data={reportData} />;
            case "license":
                return <LicenseReport data={reportData} />;
            case "installation":
                return <InstallationReport data={reportData} />;
            case "compliance":
                return <ComplianceReport data={reportData} />;
            case "expiring":
                return <ExpiringReport data={reportData} />;
            default:
                return <SummaryReport data={reportData} />;
        }
    };

    return (
        <div className="container-fluid">
            <BreadCumb pageList={["ICT Assets", "Software", "Reports"]}>
                <div className="dropdown">
                    <button
                        className="btn btn-primary dropdown-toggle"
                        type="button"
                        id="exportDropdown"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        disabled={exporting || loading || !reportData}
                    >
                        {exporting ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-1"
                                    role="status"
                                ></span>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <i className="bx bx-export me-1"></i>
                                Export
                            </>
                        )}
                    </button>
                    <ul className="dropdown-menu" aria-labelledby="exportDropdown">
                        <li>
                            <button
                                className="dropdown-item"
                                onClick={() => handleExport("xlsx")}
                            >
                                <i className="bx bx-file me-2"></i>
                                Export to Excel (.xlsx)
                            </button>
                        </li>
                        <li>
                            <button
                                className="dropdown-item"
                                onClick={() => handleExport("csv")}
                            >
                                <i className="bx bx-spreadsheet me-2"></i>
                                Export to CSV
                            </button>
                        </li>
                    </ul>
                </div>
            </BreadCumb>

            {/* Filters Card */}
            <Formik
                initialValues={filters}
                enableReinitialize
                onSubmit={(values) => setFilters(values)}
            >
                {({ values, setFieldValue }) => (
                    <Form>
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="card">
                                    <div className="card-header">
                                        <h5 className="card-title mb-0">
                                            <i className="bx bx-filter-alt me-2"></i>
                                            Report Filters
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label className="form-label">Report Type</label>
                                                <select
                                                    className="form-select"
                                                    name="report_type"
                                                    value={values.report_type}
                                                    onChange={(e) => {
                                                        setFieldValue("report_type", e.target.value);
                                                        setFilters((prev) => ({ ...prev, report_type: e.target.value }));
                                                    }}
                                                >
                                                    {REPORT_TYPES.map((type) => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <FormikSelect
                                                    name="category"
                                                    label="Category"
                                                    url="/asset-software-categories"
                                                    containerClass="mb-0"
                                                    filters={{ page: 1, page_size: 100, paginated: true }}
                                                    mapOption={(item) => ({ value: item.id, label: item.name })}
                                                    placeholder="All Categories"
                                                    isClearable={true}
                                                    onChange={(option) => {
                                                        setFieldValue("category", option?.value || "");
                                                        setFilters((prev) => ({ ...prev, category: option?.value || "" }));
                                                    }}
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">License Type</label>
                                                <select
                                                    className="form-select"
                                                    name="license_type"
                                                    value={values.license_type}
                                                    onChange={(e) => {
                                                        setFieldValue("license_type", e.target.value);
                                                        setFilters((prev) => ({ ...prev, license_type: e.target.value }));
                                                    }}
                                                >
                                                    {LICENSE_TYPES.map((type) => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>

            {/* Report Type Tabs */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex flex-wrap gap-2">
                        {REPORT_TYPES.map((type) => (
                            <button
                                key={type.value}
                                className={`btn ${filters.report_type === type.value
                                    ? "btn-primary"
                                    : "btn-outline-primary"
                                    }`}
                                onClick={() =>
                                    setFilters((prev) => ({ ...prev, report_type: type.value }))
                                }
                            >
                                <i className={`bx ${type.icon} me-1`}></i>
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {renderReportContent()}
        </div>
    );
};

const SummaryReport = ({ data }) => {
    const summary = data?.summary || {};
    const distribution = data?.license_breakdown || [];
    const typeBreakdown = data?.type_breakdown || [];

    const parseCost = (cost) => {
        if (typeof cost === "object" && cost !== null) {
            return cost.parsedValue || parseFloat(cost.source) || 0;
        }
        return parseFloat(cost) || 0;
    };

    return (
        <>
            {/* Summary Cards */}
            <div className="row mb-4">
                <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-primary rounded p-2">
                                        <i className="bx bx-key text-white fs-4"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="d-block mb-1 text-muted">Total Licenses</span>
                                    <h3 className="mb-0">{summary.total_licenses || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-success rounded p-2">
                                        <i className="bx bx-check-circle text-white fs-4"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="d-block mb-1 text-muted">Utilization Rate</span>
                                    <h3 className="mb-0">{summary.utilization_rate || 0}%</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-info rounded p-2">
                                        <i className="bx bx-download text-white fs-4"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="d-block mb-1 text-muted">Installations</span>
                                    <h3 className="mb-0">{summary.total_installations || 0}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-sm-6 col-lg-3 mb-3">
                    <div className="card h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="avatar flex-shrink-0">
                                    <div className="bg-warning rounded p-2">
                                        <i className="bx bx-dollar text-white fs-4"></i>
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <span className="d-block mb-1 text-muted">Total Cost</span>
                                    <h3 className="mb-0">
                                        TSH{" "}
                                        {summary.total_cost
                                            ? parseFloat(summary.total_cost).toLocaleString()
                                            : "0"}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Charts Row */}
            <div className="row">
                <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">License Distribution by Type</h5>
                        </div>
                        <div className="card-body">
                            {distribution.length > 0 ? (
                                <LicenseDistributionChart data={distribution} />
                            ) : (
                                <EmptyState message="No license distribution data available" />
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-lg-6 mb-4">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Cost by Software Type</h5>
                        </div>
                        <div className="card-body">
                            {typeBreakdown.length > 0 ? (
                                <TypeBreakdownChart data={typeBreakdown} />
                            ) : (
                                <EmptyState message="No cost data available" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Compliance Summary */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">Compliance Overview</h5>
                        </div>
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col-md-4 mb-3">
                                    <div className="border rounded p-3">
                                        <div className="display-6 text-success fw-bold">
                                            {summary.compliant_count || 0}
                                        </div>
                                        <span className="text-muted">Compliant</span>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="border rounded p-3">
                                        <div className="display-6 text-warning fw-bold">
                                            {summary.warning_count || 0}
                                        </div>
                                        <span className="text-muted">Warning</span>
                                    </div>
                                </div>
                                <div className="col-md-4 mb-3">
                                    <div className="border rounded p-3">
                                        <div className="display-6 text-danger fw-bold">
                                            {summary.non_compliant_count || 0}
                                        </div>
                                        <span className="text-muted">Non-Compliant</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const LicenseReport = ({ data }) => {
    const licenses = data?.data || [];

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">License Details</h5>
                <span className="badge bg-primary">{licenses.length} Licenses</span>
            </div>
            <div className="card-body">
                {licenses.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Software</th>
                                    <th>Asset Tag</th>
                                    <th>Publisher</th>
                                    <th>Version</th>
                                    <th>License Type</th>
                                    <th>Total</th>
                                    <th>Used</th>
                                    <th>Available</th>
                                    <th>Utilization</th>
                                    <th>Expiry</th>
                                </tr>
                            </thead>
                            <tbody>
                                {licenses.map((license, index) => {
                                    const utilization = license.utilization?.parsedValue || license.utilization || 0;
                                    return (
                                        <tr key={index}>
                                            <td className="fw-medium">{license.software_name}</td>
                                            <td>
                                                <code>{license.asset_tag || "N/A"}</code>
                                            </td>
                                            <td>{license.publisher || "N/A"}</td>
                                            <td>{license.version || "N/A"}</td>
                                            <td>
                                                <span className="badge bg-label-info">
                                                    {license.license_type?.replace(/_/g, " ")}
                                                </span>
                                            </td>
                                            <td>{license.total_licenses}</td>
                                            <td>{license.used_licenses}</td>
                                            <td>{license.available_licenses}</td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div
                                                        className="progress flex-grow-1 me-2"
                                                        style={{ height: "6px", width: "60px" }}
                                                    >
                                                        <div
                                                            className={`progress-bar ${getUtilizationColor(
                                                                utilization
                                                            )}`}
                                                            style={{
                                                                width: `${utilization}%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <small>{utilization}%</small>
                                                </div>
                                            </td>
                                            <td>{license.license_expiry || "N/A"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState message="No license data available" />
                )}
            </div>
        </div>
    );
};

const InstallationReport = ({ data }) => {
    const installations = data?.data || [];

    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">Installation Statistics</h5>
                <span className="badge bg-info">{installations.length} Software</span>
            </div>
            <div className="card-body">
                {installations.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Software</th>
                                    <th>Version</th>
                                    <th>Total Installations</th>
                                    <th>Active</th>
                                    <th>Inactive</th>
                                    <th>Active Distribution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {installations.map((item, index) => {
                                    const activePercentage = item.installation_count > 0
                                        ? (item.active_count / item.installation_count) * 100
                                        : 0;
                                    return (
                                        <tr key={index}>
                                            <td className="fw-medium">{item.software_name}</td>
                                            <td>{item.software_version || "N/A"}</td>
                                            <td>{item.installation_count}</td>
                                            <td>
                                                <span className="text-success fw-medium">
                                                    {item.active_count}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-warning fw-medium">
                                                    {item.inactive_count}
                                                </span>
                                            </td>
                                            <td>
                                                <div
                                                    className="progress"
                                                    style={{ height: "20px", width: "100px" }}
                                                >
                                                    <div
                                                        className="progress-bar bg-success"
                                                        style={{
                                                            width: `${activePercentage}%`,
                                                        }}
                                                    >
                                                        {Math.round(activePercentage)}%
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState message="No installation data available" />
                )}
            </div>
        </div>
    );
};

const ComplianceReport = ({ data }) => {
    const compliance = data?.data || [];
    const summary = data?.summary || {};

    return (
        <>
            {/* Summary Cards */}
            <div className="row mb-4">
                <div className="col-md-4 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <div className="text-success display-4 fw-bold mb-2">{summary.compliant || 0}</div>
                            <span className="text-muted">Compliant Software</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <div className="text-warning display-4 fw-bold mb-2">{summary.over_licensed || 0}</div>
                            <span className="text-muted">Over Licensed</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <div className="text-info display-4 fw-bold mb-2">{summary.compliance_rate?.parsedValue || summary.compliance_rate || 0}%</div>
                            <span className="text-muted">Compliance Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compliance Table */}
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">Compliance Status</h5>
                    <span className="badge bg-primary">{compliance.length} Items</span>
                </div>
                <div className="card-body">
                    {compliance.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Software</th>
                                        <th>Version</th>
                                        <th>License Type</th>
                                        <th>Total Licenses</th>
                                        <th>Used</th>
                                        <th>Available</th>
                                        <th>Utilization</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {compliance.map((item, index) => {
                                        const utilization = (item.used_licenses / item.total_licenses) * 100;
                                        return (
                                            <tr key={index}>
                                                <td className="fw-medium">{item.software_name}</td>
                                                <td>{item.version || "N/A"}</td>
                                                <td>
                                                    <span className="badge bg-label-info">
                                                        {item.license_type?.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td>{item.total_licenses}</td>
                                                <td>{item.used_licenses}</td>
                                                <td>{item.total_licenses - item.used_licenses}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div
                                                            className="progress flex-grow-1 me-2"
                                                            style={{ height: "6px", width: "60px" }}
                                                        >
                                                            <div
                                                                className={`progress-bar ${getUtilizationColor(
                                                                    utilization
                                                                )}`}
                                                                style={{
                                                                    width: `${utilization}%`,
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <small>{utilization.toFixed(1)}%</small>
                                                    </div>
                                                </td>
                                                <td>{getComplianceBadge(item.compliance_status)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState message="No compliance data available" />
                    )}
                </div>
            </div>
        </>
    );
};

const ExpiringReport = ({ data }) => {
    const reportData = data?.data || {};
    const summary = data?.summary || {};
    const expired = reportData.expired || [];
    const expiring30 = reportData.expiring_30_days || [];
    const expiring90 = reportData.expiring_90_days || [];
    const allExpiring = [...expired, ...expiring30, ...expiring90];

    return (
        <>
            {/* Summary Cards */}
            <div className="row mb-4">
                <div className="col-md-4 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <div className="text-danger display-4 fw-bold mb-2">{summary.expired_count || 0}</div>
                            <span className="text-muted">Expired Licenses</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <div className="text-warning display-4 fw-bold mb-2">{summary.expiring_30_days_count || 0}</div>
                            <span className="text-muted">Expiring in 30 Days</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card">
                        <div className="card-body text-center">
                            <div className="text-info display-4 fw-bold mb-2">{summary.expiring_90_days_count || 0}</div>
                            <span className="text-muted">Expiring in 90 Days</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">Expiring & Expired Licenses</h5>
                </div>
                <div className="card-body">
                    {allExpiring.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Software</th>
                                        <th>Version</th>
                                        <th>License Type</th>
                                        <th>Total Licenses</th>
                                        <th>Used</th>
                                        <th>Expiry Date</th>
                                        <th>Days Until Expiry</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allExpiring.map((item, index) => {
                                        const daysUntilExpiry = item.days_until_expiry || 0;
                                        const isExpired = daysUntilExpiry < 0;
                                        return (
                                            <tr
                                                key={index}
                                                className={isExpired ? "table-danger" : ""}
                                            >
                                                <td className="fw-medium">{item.software_name}</td>
                                                <td>{item.version || "N/A"}</td>
                                                <td>
                                                    <span className="badge bg-label-info">
                                                        {item.license_type?.replace(/_/g, " ")}
                                                    </span>
                                                </td>
                                                <td>{item.total_licenses}</td>
                                                <td>{item.used_licenses}</td>
                                                <td>{item.license_expiry || "N/A"}</td>
                                                <td>
                                                    <span
                                                        className={`fw-bold ${getExpiryTextColor(
                                                            daysUntilExpiry
                                                        )}`}
                                                    >
                                                        {isExpired
                                                            ? `${Math.abs(daysUntilExpiry)} days ago`
                                                            : `${daysUntilExpiry} days`}
                                                    </span>
                                                </td>
                                                <td>{getExpiryBadge(daysUntilExpiry)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState message="No expiring licenses found" />
                    )}
                </div>
            </div>
        </>
    );
};

const LicenseDistributionChart = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const colors = [
        "#00853f",
        "#71dd37",
        "#ffab00",
        "#03c3ec",
        "#ff3e1d",
        "#8592a3",
    ];

    return (
        <div className="license-distribution-chart">
            {data.map((item, index) => {
                const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                return (
                    <div key={index} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="d-flex align-items-center">
                                <div
                                    className="me-2"
                                    style={{
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "50%",
                                        backgroundColor: colors[index % colors.length],
                                    }}
                                ></div>
                                <span>{item.type || item.license_type}</span>
                            </div>
                            <div className="text-end">
                                <span className="fw-bold">{item.count}</span>
                                <small className="text-muted ms-1">({percentage}%)</small>
                            </div>
                        </div>
                        <div className="progress" style={{ height: "8px" }}>
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${percentage}%`,
                                    backgroundColor: colors[index % colors.length],
                                }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const TypeBreakdownChart = ({ data }) => {
    const parseCost = (cost) => {
        if (typeof cost === "object" && cost !== null) {
            return cost.parsedValue || parseFloat(cost.source) || 0;
        }
        return parseFloat(cost) || 0;
    };

    const maxCost = Math.max(...data.map((item) => parseCost(item.total_cost)), 1);

    return (
        <div className="type-breakdown-chart">
            {data.map((item, index) => {
                const cost = parseCost(item.total_cost);
                const label = item.software_type?.replace(/_/g, " ").toUpperCase() || `Type ${index + 1}`;

                return (
                    <div key={index} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                            <span className="fw-medium">{label}</span>
                            <span className="fw-bold text-success">
                                TSH {cost.toLocaleString()}
                            </span>
                        </div>
                        <div className="progress" style={{ height: "8px" }}>
                            <div
                                className="progress-bar bg-info"
                                style={{ width: `${maxCost > 0 ? (cost / maxCost) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                            <small className="text-muted">
                                {item.count || 0} software items
                            </small>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const UtilizationChart = ({ data }) => {
    return (
        <div className="utilization-chart">
            {data.map((item, index) => (
                <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                        <span className="fw-medium">{item.category}</span>
                        <span
                            className={`fw-bold ${getUtilizationTextColor(
                                item.utilization
                            )}`}
                        >
                            {item.utilization}%
                        </span>
                    </div>
                    <div className="progress" style={{ height: "10px" }}>
                        <div
                            className={`progress-bar ${getUtilizationColor(item.utilization)}`}
                            style={{ width: `${item.utilization}%` }}
                        ></div>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                        <small className="text-muted">
                            {item.used_seats || 0} of {item.total_seats || 0} seats
                        </small>
                    </div>
                </div>
            ))}
        </div>
    );
};

const EmptyState = ({ message }) => (
    <div className="text-center py-5">
        <i className="bx bx-folder-open text-muted display-1"></i>
        <p className="text-muted mt-3">{message}</p>
    </div>
);

const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return "bg-danger";
    if (percentage >= 70) return "bg-warning";
    return "bg-success";
};

const getUtilizationTextColor = (percentage) => {
    if (percentage >= 90) return "text-danger";
    if (percentage >= 70) return "text-warning";
    return "text-success";
};

const getStatusBadge = (status) => {
    const badges = {
        active: <span className="badge bg-success">Active</span>,
        expired: <span className="badge bg-danger">Expired</span>,
        expiring: <span className="badge bg-warning">Expiring Soon</span>,
        inactive: <span className="badge bg-secondary">Inactive</span>,
    };
    return badges[status?.toLowerCase()] || (
        <span className="badge bg-secondary">{status}</span>
    );
};

const getComplianceBadge = (status) => {
    const badges = {
        compliant: <span className="badge bg-success">Compliant</span>,
        warning: <span className="badge bg-warning">Warning</span>,
        "non-compliant": <span className="badge bg-danger">Non-Compliant</span>,
        non_compliant: <span className="badge bg-danger">Non-Compliant</span>,
    };
    return badges[status?.toLowerCase()] || (
        <span className="badge bg-secondary">{status}</span>
    );
};

const getRiskBadge = (level) => {
    const badges = {
        low: <span className="badge bg-success">Low</span>,
        medium: <span className="badge bg-warning">Medium</span>,
        high: <span className="badge bg-danger">High</span>,
        critical: <span className="badge bg-dark">Critical</span>,
    };
    return badges[level?.toLowerCase()] || (
        <span className="badge bg-secondary">{level}</span>
    );
};

const getExpiryTextColor = (days) => {
    if (days < 0) return "text-danger";
    if (days <= 7) return "text-danger";
    if (days <= 30) return "text-warning";
    return "text-info";
};

const getExpiryBadge = (days) => {
    if (days < 0) return <span className="badge bg-danger">Expired</span>;
    if (days <= 7)
        return <span className="badge bg-danger">Critical</span>;
    if (days <= 30)
        return <span className="badge bg-warning">Expiring Soon</span>;
    return <span className="badge bg-info">Upcoming</span>;
};

export { SoftwareReportsPage };
export default SoftwareReportsPage;
