import { useState, useEffect } from "react";
import React from "react";
import "animate.css";
import * as XLSX from "xlsx";
import BreadCumb from "../../../../layouts/BreadCumb";
import { fetchData } from "../../../../utils/GlobalQueries";
import showToast from "../../../../helpers/ToastHelper";

const exportOptions = [
    {
        type: "assets",
        title: "Assets",
        description: "All hardware assets including computers, network devices, and peripherals",
        icon: "bx-laptop",
        color: "primary"
    },
    {
        type: "computers",
        title: "Computers",
        description: "Computer details including specifications, assignments, and status",
        icon: "bx-desktop",
        color: "info"
    },
    {
        type: "network_devices",
        title: "Network Devices",
        description: "Network device details including routers, switches, and access points",
        icon: "bx-wifi",
        color: "success"
    },
    {
        type: "peripherals",
        title: "Peripherals",
        description: "Peripheral details including printers, monitors, and accessories",
        icon: "bx-printer",
        color: "warning"
    },
    {
        type: "software",
        title: "Software",
        description: "Software licenses, subscriptions, and installations",
        icon: "bx-code-alt",
        color: "secondary"
    },
    {
        type: "maintenance",
        title: "Maintenance Records",
        description: "Maintenance history including repairs, upgrades, and service logs",
        icon: "bx-wrench",
        color: "danger"
    },
    {
        type: "locations",
        title: "Locations",
        description: "Location hierarchy including buildings, floors, and rooms",
        icon: "bx-map",
        color: "dark"
    }
];

export const ExportDataPage = () => {
    const [recordCounts, setRecordCounts] = useState({});
    const [loadingCounts, setLoadingCounts] = useState(true);
    const [exportingStates, setExportingStates] = useState({});

    useEffect(() => {
        fetchRecordCounts();
    }, []);

    const fetchRecordCounts = async () => {
        setLoadingCounts(true);
        const counts = {};

        try {
            const promises = exportOptions.map(async (option) => {
                try {
                    const response = await fetchData({
                        url: "/export-data",
                        filter: { type: option.type, count_only: true }
                    });
                    counts[option.type] = response?.count || 0;
                } catch (error) {
                    counts[option.type] = 0;
                }
            });

            await Promise.all(promises);
            setRecordCounts(counts);
        } catch (error) {
            console.error("Error fetching counts:", error);
            showToast("Failed to fetch record counts", "error");
        } finally {
            setLoadingCounts(false);
        }
    };

    const handleExport = async (type, format) => {
        const exportKey = `${type}_${format}`;
        setExportingStates((prev) => ({ ...prev, [exportKey]: true }));

        try {
            const response = await fetchData({
                url: "/export-data",
                filter: { type, format }
            });

            const data = response?.data || response?.results || response || [];

            if (!Array.isArray(data) || data.length === 0) {
                showToast("No data available to export", "warning");
                return;
            }

            const option = exportOptions.find((o) => o.type === type);
            const filename = `${option?.title || type}_export_${new Date().toISOString().split("T")[0]}`;

            if (format === "json") {
                exportAsJSON(data, filename);
            } else if (format === "csv") {
                exportAsCSV(data, filename);
            } else if (format === "excel") {
                exportAsExcel(data, filename);
            }

            showToast(`${option?.title || type} exported successfully as ${format.toUpperCase()}`, "success");
        } catch (error) {
            console.error("Export error:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to export data";
            showToast(errorMessage, "error");
        } finally {
            setExportingStates((prev) => ({ ...prev, [exportKey]: false }));
        }
    };

    const exportAsJSON = (data, filename) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        downloadBlob(blob, `${filename}.json`);
    };

    const exportAsCSV = (data, filename) => {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(","),
            ...data.map((row) =>
                headers
                    .map((header) => {
                        let cell = row[header];
                        if (cell === null || cell === undefined) cell = "";
                        if (typeof cell === "object") cell = JSON.stringify(cell);
                        cell = String(cell).replace(/"/g, '""');
                        if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
                            cell = `"${cell}"`;
                        }
                        return cell;
                    })
                    .join(",")
            )
        ];

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `${filename}.csv`);
    };

    const exportAsExcel = (data, filename) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    };

    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const isExporting = (type, format) => exportingStates[`${type}_${format}`];

    return (
        <>
            <BreadCumb pageList={["ICT Assets", "Reporting", "Export Data"]} />

            <div className="container-fluid">
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <h5 className="card-title text-primary mb-1">
                                            <i className="bx bx-export me-2"></i>
                                            Export Data
                                        </h5>
                                        <p className="text-muted mb-0">
                                            Export ICT asset data in various formats for reporting and analysis
                                        </p>
                                    </div>
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={fetchRecordCounts}
                                        disabled={loadingCounts}
                                    >
                                        <i className={`bx ${loadingCounts ? "bx-loader-alt bx-spin" : "bx-refresh"} me-1`}></i>
                                        Refresh Counts
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    {exportOptions.map((option) => (
                        <div key={option.type} className="col-lg-4 col-md-6 mb-4">
                            <div className="card h-100">
                                <div className="card-body">
                                    <div className="d-flex align-items-start mb-3">
                                        <div className={`avatar bg-${option.color} rounded p-2 me-3`}>
                                            <i className={`bx ${option.icon} text-white fs-4`}></i>
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="card-title mb-1">{option.title}</h5>
                                            <p className="text-muted small mb-0">{option.description}</p>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <span className="badge bg-light text-dark">
                                            {loadingCounts ? (
                                                <span>
                                                    <i className="bx bx-loader-alt bx-spin me-1"></i>
                                                    Loading...
                                                </span>
                                            ) : (
                                                <span>
                                                    <i className="bx bx-data me-1"></i>
                                                    {recordCounts[option.type] || 0} records
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <div className="d-flex gap-2 flex-wrap">
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => handleExport(option.type, "json")}
                                            disabled={isExporting(option.type, "json") || loadingCounts}
                                        >
                                            {isExporting(option.type, "json") ? (
                                                <i className="bx bx-loader-alt bx-spin me-1"></i>
                                            ) : (
                                                <i className="bx bx-code-curly me-1"></i>
                                            )}
                                            JSON
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-success"
                                            onClick={() => handleExport(option.type, "csv")}
                                            disabled={isExporting(option.type, "csv") || loadingCounts}
                                        >
                                            {isExporting(option.type, "csv") ? (
                                                <i className="bx bx-loader-alt bx-spin me-1"></i>
                                            ) : (
                                                <i className="bx bx-file me-1"></i>
                                            )}
                                            CSV
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-info"
                                            onClick={() => handleExport(option.type, "excel")}
                                            disabled={isExporting(option.type, "excel") || loadingCounts}
                                        >
                                            {isExporting(option.type, "excel") ? (
                                                <i className="bx bx-loader-alt bx-spin me-1"></i>
                                            ) : (
                                                <i className="bx bx-spreadsheet me-1"></i>
                                            )}
                                            Excel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row mt-2">
                    <div className="col-12">
                        <div className="card bg-light">
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <i className="bx bx-info-circle text-info fs-4 me-2"></i>
                                    <div>
                                        <h6 className="mb-1">Export Information</h6>
                                        <p className="text-muted small mb-0">
                                            <strong>JSON:</strong> Best for developers and API integrations.{" "}
                                            <strong>CSV:</strong> Compatible with most spreadsheet applications.{" "}
                                            <strong>Excel:</strong> Native Microsoft Excel format with formatting support.
                                        </p>
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
