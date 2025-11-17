import React from "react";
import { formatDate } from "../../../../helpers/DateFormater";

export const NetworkOverviewTab = ({ assetData, getStatusBadge, getConditionBadge }) => {
    return (
        <div className="animate__animated animate__fadeIn animate__faster">
            {/* Device Type Badge */}
            {assetData.device_type && (
                <div className="alert alert-primary border-start border-primary border-4 mb-4">
                    <div className="d-flex align-items-center">
                        <i className="bx bx-devices fs-2 me-3 text-primary"></i>
                        <div>
                            <h6 className="mb-0 fw-bold text-dark">Network Device Type</h6>
                            <span className="badge bg-primary mt-1 px-3 py-2">{assetData.device_type}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="row">
                {/* Network Configuration Card */}
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100 border-start border-primary border-4">
                        <div className="card-body">
                            <h6 className="mb-3 text-primary fw-bold">
                                <i className="bx bx-network-chart me-2"></i>Network Configuration
                            </h6>
                            <table className="table table-sm table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="fw-medium text-muted" style={{ width: "45%" }}>IP Address:</td>
                                        <td>
                                            {assetData.ip_address ? (
                                                <code className="bg-light px-3 py-2 rounded border text-primary">
                                                    <i className="bx bx-globe me-1"></i>{assetData.ip_address}
                                                </code>
                                            ) : <span className="text-muted">Not configured</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">MAC Address:</td>
                                        <td>
                                            {assetData.mac_address ? (
                                                <code className="bg-dark text-white px-3 py-2 rounded font-monospace">
                                                    {assetData.mac_address}
                                                </code>
                                            ) : <span className="text-muted">Not available</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Subnet Mask:</td>
                                        <td>
                                            {assetData.subnet_mask ? (
                                                <code className="bg-light px-2 py-1 rounded">{assetData.subnet_mask}</code>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Gateway:</td>
                                        <td>
                                            {assetData.gateway ? (
                                                <code className="bg-light px-2 py-1 rounded">{assetData.gateway}</code>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">DNS Servers:</td>
                                        <td>
                                            {assetData.dns_servers ? (
                                                <small className="text-dark">{assetData.dns_servers}</small>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Hardware Specifications Card */}
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100 border-start border-success border-4">
                        <div className="card-body">
                            <h6 className="mb-3 text-success fw-bold">
                                <i className="bx bx-chip me-2"></i>Hardware Specifications
                            </h6>
                            <table className="table table-sm table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="fw-medium text-muted" style={{ width: "45%" }}>Number of Ports:</td>
                                        <td>
                                            {assetData.ports ? (
                                                <span className="badge bg-success px-3 py-2">
                                                    <i className="bx bx-cable-car me-1"></i>{assetData.ports} Ports
                                                </span>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Port Speed:</td>
                                        <td>
                                            {assetData.port_speed ? (
                                                <span className="badge bg-info px-2 py-1">{assetData.port_speed}</span>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Max Throughput:</td>
                                        <td>
                                            {assetData.max_throughput ? (
                                                <span className="text-dark fw-semibold">{assetData.max_throughput}</span>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">PoE Support:</td>
                                        <td>
                                            {assetData.poe_support !== undefined ? (
                                                <span className={`badge bg-${assetData.poe_support ? "success" : "secondary"}`}>
                                                    {assetData.poe_support ? "✓ Supported" : "Not Supported"}
                                                </span>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Power Consumption:</td>
                                        <td>
                                            {assetData.power_consumption || <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Advanced Features Card */}
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100 border-start border-warning border-4">
                        <div className="card-body">
                            <h6 className="mb-3 text-warning fw-bold">
                                <i className="bx bx-cog me-2"></i>Advanced Features
                            </h6>
                            <table className="table table-sm table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="fw-medium text-muted" style={{ width: "45%" }}>VLAN Support:</td>
                                        <td>
                                            {assetData.vlan_support !== undefined ? (
                                                <span className={`badge bg-${assetData.vlan_support ? "success" : "secondary"}`}>
                                                    {assetData.vlan_support ? "✓ Enabled" : "Disabled"}
                                                </span>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">QoS Support:</td>
                                        <td>
                                            {assetData.qos_support !== undefined ? (
                                                <span className={`badge bg-${assetData.qos_support ? "success" : "secondary"}`}>
                                                    {assetData.qos_support ? "✓ Enabled" : "Disabled"}
                                                </span>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Routing Protocol:</td>
                                        <td>
                                            {assetData.routing_protocol ? (
                                                <span className="badge bg-primary">{assetData.routing_protocol}</span>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Protocol Support:</td>
                                        <td>
                                            {assetData.protocol_support ? (
                                                <small className="text-dark">{assetData.protocol_support}</small>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Security Features:</td>
                                        <td>
                                            {assetData.security_features ? (
                                                <small className="text-dark">{assetData.security_features}</small>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Management & Monitoring Card */}
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100 border-start border-info border-4">
                        <div className="card-body">
                            <h6 className="mb-3 text-info fw-bold">
                                <i className="bx bx-cog me-2"></i>Management & Monitoring
                            </h6>
                            <table className="table table-sm table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="fw-medium text-muted" style={{ width: "45%" }}>Firmware Version:</td>
                                        <td>
                                            {assetData.firmware_version ? (
                                                <span className="badge bg-dark px-2 py-1">{assetData.firmware_version}</span>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Management URL:</td>
                                        <td>
                                            {assetData.management_url ? (
                                                <a 
                                                    href={assetData.management_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="btn btn-sm btn-outline-primary py-1"
                                                >
                                                    <i className="bx bx-link-external me-1"></i>Access Panel
                                                </a>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">SNMP Monitoring:</td>
                                        <td>
                                            {assetData.snmp_enabled !== undefined ? (
                                                <span className={`badge bg-${assetData.snmp_enabled ? "success" : "secondary"}`}>
                                                    {assetData.snmp_enabled ? "✓ Enabled" : "Disabled"}
                                                </span>
                                            ) : <span className="text-muted">-</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Monitoring Tool:</td>
                                        <td>{assetData.monitoring_tool || <span className="text-muted">-</span>}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Last Config Backup:</td>
                                        <td>
                                            {assetData.last_backup_date ? (
                                                <span className="text-success">
                                                    <i className="bx bx-check-circle me-1"></i>
                                                    {formatDate(assetData.last_backup_date, "DD/MM/YYYY")}
                                                </span>
                                            ) : <span className="text-danger">
                                                <i className="bx bx-x-circle me-1"></i>Never
                                            </span>}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location & Assignment */}
            <div className="row">
                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100 border-start border-secondary border-4">
                        <div className="card-body">
                            <h6 className="mb-3 text-secondary fw-bold">
                                <i className="bx bx-map me-2"></i>Location & Assignment
                            </h6>
                            <table className="table table-sm table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="fw-medium text-muted" style={{ width: "40%" }}>Location:</td>
                                        <td>
                                            {assetData.location_name ? (
                                                <span className="badge bg-label-primary">{assetData.location_name}</span>
                                            ) : <span className="text-muted">Not assigned</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Custodian:</td>
                                        <td>{assetData.custodian_name || <span className="text-muted">Unassigned</span>}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Status:</td>
                                        <td>{getStatusBadge(assetData.status)}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Condition:</td>
                                        <td>{assetData.condition ? getConditionBadge(assetData.condition) : <span className="text-muted">-</span>}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-md-6 mb-4">
                    <div className="card shadow-sm h-100 border-start border-dark border-4">
                        <div className="card-body">
                            <h6 className="mb-3 text-dark fw-bold">
                                <i className="bx bx-info-circle me-2"></i>Asset Information
                            </h6>
                            <table className="table table-sm table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="fw-medium text-muted" style={{ width: "40%" }}>Asset Tag:</td>
                                        <td><span className="badge bg-dark">{assetData.asset_tag}</span></td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Serial Number:</td>
                                        <td>{assetData.serial_number || <span className="text-muted">-</span>}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Barcode:</td>
                                        <td>{assetData.barcode || <span className="text-muted">-</span>}</td>
                                    </tr>
                                    <tr>
                                        <td className="fw-medium text-muted">Active Status:</td>
                                        <td>
                                            <span className={`badge bg-${assetData.is_active ? "success" : "danger"}`}>
                                                {assetData.is_active ? "✓ Active" : "Inactive"}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Notes */}
            {assetData.notes && (
                <div className="card shadow-sm border-start border-secondary border-4">
                    <div className="card-body">
                        <h6 className="mb-2 text-secondary fw-bold">
                            <i className="bx bx-note me-2"></i>Additional Notes
                        </h6>
                        <div className="alert alert-light border mb-0">
                            <p className="mb-0 text-dark">{assetData.notes}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
