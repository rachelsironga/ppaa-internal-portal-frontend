import React, { useState, useEffect, useContext } from "react";
import { AssetContext } from "../../../../utils/context";
import { createInstallation, updateInstallation, getAvailableAssets, getUsers, getTechnicians } from "./Queries";
import showToast from "../../../../helpers/ToastHelper";
import Select from "react-select";

export const InstallationModal = ({ softwareUid = "", softwareName = "", selectedInstallation, onSuccess }) => {
    const { tableRefresh, setTableRefresh } = useContext(AssetContext);
    const [formData, setFormData] = useState({
        software: softwareUid || (selectedInstallation?.software || ""),
        asset: "",
        installation_date: new Date().toISOString().split('T')[0],
        installed_by: "",
        installation_path: "",
        version_installed: "",
        license_key_used: "",
        status: "active",
        assigned_to: "",
        installation_notes: "",
        configuration_notes: "",
        is_compliant: true,
    });

    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingTechnicians, setLoadingTechnicians] = useState(false);

    useEffect(() => {
        fetchAssets();
        fetchUsers();
        fetchTechnicians();
    }, []);

    useEffect(() => {
        console.log('useEffect triggered - selectedInstallation:', selectedInstallation);
        if (selectedInstallation) {
            console.log('Setting form data from selected installation');
            setFormData({
                software: selectedInstallation.software || softwareUid || "",
                asset: selectedInstallation.asset || "",
                installation_date: selectedInstallation.installation_date || new Date().toISOString().split('T')[0],
                installed_by: selectedInstallation.installed_by || null,
                installation_path: selectedInstallation.installation_path || "",
                version_installed: selectedInstallation.version_installed || "",
                license_key_used: selectedInstallation.license_key_used || "",
                status: selectedInstallation.status || "active",
                assigned_to: selectedInstallation.assigned_to || null,
                installation_notes: selectedInstallation.installation_notes || "",
                configuration_notes: selectedInstallation.configuration_notes || "",
                is_compliant: selectedInstallation.is_compliant !== undefined ? selectedInstallation.is_compliant : true,
            });
        } else {
            console.log('Resetting form (no selected installation)');
            resetForm();
        }
    }, [selectedInstallation, softwareUid]);

    const fetchAssets = async () => {
        setLoadingAssets(true);
        try {
            const result = await getAvailableAssets(softwareUid);
            if (result.status === 200 || result.status === 8000) {
                setAssets(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching assets:", error);
        } finally {
            setLoadingAssets(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            console.log('Fetching custodians/users...');
            const result = await getUsers({});
            console.log('Users/Custodians result:', result);
            if (result.status === 200 || result.status === 8000) {
                const userData = result.data || [];
                // Convert object to array if needed
                const usersArray = Array.isArray(userData) ? userData : Object.values(userData);
                console.log('Users/Custodians data:', usersArray);
                setUsers(usersArray);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchTechnicians = async () => {
        setLoadingTechnicians(true);
        try {
            console.log('Fetching technicians...');
            const result = await getTechnicians({});
            console.log('Technicians result:', result);
            if (result.status === 200 || result.status === 8000) {
                const techData = result.data || [];
                // Convert object to array if needed
                const techniciansArray = Array.isArray(techData) ? techData : Object.values(techData);
                console.log('Technicians data:', techniciansArray);
                setTechnicians(techniciansArray);
            }
        } catch (error) {
            console.error("Error fetching technicians:", error);
            // Fallback to regular users if technicians endpoint fails
            setTechnicians([]);
        } finally {
            setLoadingTechnicians(false);
        }
    };

    const resetForm = () => {
        console.log('Form reset called');
        setFormData({
            software: softwareUid || "",
            asset: "",
            installation_date: new Date().toISOString().split('T')[0],
            installed_by: null,
            installation_path: "",
            version_installed: "",
            license_key_used: "",
            status: "active",
            assigned_to: null,
            installation_notes: "",
            configuration_notes: "",
            is_compliant: true,
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        console.log(`Input changed - ${name}:`, type === "checkbox" ? checked : value);
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSelectChange = (name, selectedOption) => {
        console.log(`Select changed - ${name}:`, selectedOption);
        const newValue = selectedOption ? selectedOption.value : null;
        console.log(`Setting ${name} to:`, newValue);
        setFormData((prevData) => ({
            ...prevData,
            [name]: newValue,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const isUpdate = Boolean(selectedInstallation?.uid);

            // Prepare data to send to API
            const submitData = {
                software: formData.software,
                asset: formData.asset,
                installation_date: formData.installation_date,
                installed_by: formData.installed_by || null,
                installation_path: formData.installation_path,
                version_installed: formData.version_installed,
                license_key_used: formData.license_key_used,
                status: formData.status,
                assigned_to: formData.assigned_to || null,
                installation_notes: formData.installation_notes,
                configuration_notes: formData.configuration_notes,
                is_compliant: formData.is_compliant,
            };

            console.log('Submitting installation data:', submitData);

            const result = isUpdate
                ? await updateInstallation(selectedInstallation.uid, submitData)
                : await createInstallation(submitData);

            if (result.status === 200 || result.status === 8000) {
                showToast(
                    `Installation ${isUpdate ? "Updated" : "Created"} Successfully`,
                    "success",
                    "Success"
                );
                setTableRefresh(tableRefresh + 1);
                if (onSuccess) onSuccess();
                resetForm();
                document.getElementById("closeInstallationModal").click();
            } else {
                showToast(result.message || "Operation Failed", "warning", "Failed");
            }
        } catch (error) {
            console.error("Error saving installation:", error);
            showToast("Unable to Save Installation", "error", "Error");
        } finally {
            setLoading(false);
        }
    };

    const assetOptions = Array.isArray(assets)
        ? assets.map((asset) => ({
            value: asset.uid || asset.id,
            label: `${asset.asset_tag} - ${asset.name || asset.model || ""}`,
        }))
        : [];

    const userOptions = Array.isArray(users)
        ? users.map((user) => {
            console.log('Mapping user:', user);
            return {
                value: user.guid || user.user || user.id || user.uid,
                label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Unknown User',
            };
        })
        : [];

    const technicianOptions = Array.isArray(technicians) && technicians.length > 0
        ? technicians.map((tech) => {
            console.log('Mapping technician:', tech);
            return {
                value: tech.guid || tech.user || tech.id || tech.uid,
                label: `${tech.first_name || ''} ${tech.last_name || ''}`.trim() || tech.username || 'Unknown Technician',
            };
        })
        : userOptions; // Fallback to all users if no technicians

    // Debug logging
    console.log('User options for Assigned To:', userOptions);
    console.log('Technician options for Installed By:', technicianOptions);
    console.log('Current formData:', formData);

    return (
        <div
            className="modal fade"
            id="installationModal"
            tabIndex="-1"
            aria-labelledby="installationModalLabel"
            aria-hidden="true"
        >
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="installationModalLabel">
                            {selectedInstallation ? "Edit" : "New"} Installation {softwareName && `- ${softwareName}`}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            data-bs-dismiss="modal"
                            aria-label="Close"
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit} autoComplete="off">
                        <div className="modal-body">
                            <div className="row">
                                {/* Asset Selection */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        Asset <span className="text-danger">*</span>
                                    </label>
                                    <Select
                                        options={assetOptions}
                                        value={assetOptions.find((opt) => opt.value === formData.asset)}
                                        onChange={(opt) => handleSelectChange("asset", opt)}
                                        placeholder="Select Asset..."
                                        isLoading={loadingAssets}
                                        isClearable
                                        isDisabled={!!selectedInstallation}
                                        required
                                    />
                                    <small className="text-muted">
                                        The computer/device where this software will be installed
                                    </small>
                                </div>

                                {/* Installation Date */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        Installation Date <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="installation_date"
                                        className="form-control"
                                        value={formData.installation_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                {/* Version Installed */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Version Installed</label>
                                    <input
                                        type="text"
                                        name="version_installed"
                                        className="form-control"
                                        value={formData.version_installed}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 2.3.1"
                                    />
                                </div>

                                {/* Installation Path */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Installation Path</label>
                                    <input
                                        type="text"
                                        name="installation_path"
                                        className="form-control"
                                        value={formData.installation_path}
                                        onChange={handleInputChange}
                                        placeholder="C:\Program Files\Software"
                                        autoComplete="off"
                                    />
                                </div>

                                {/* Installed By */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        <i className="bx bx-wrench me-1 text-info"></i>
                                        Installed By (Technician)
                                    </label>
                                    <Select
                                        options={technicianOptions}
                                        value={technicianOptions.find((opt) => opt.value === formData.installed_by)}
                                        onChange={(opt) => handleSelectChange("installed_by", opt)}
                                        placeholder="Select technician who installed..."
                                        isLoading={loadingTechnicians || loadingUsers}
                                        isClearable
                                    />
                                    <small className="text-muted">
                                        <i className="bx bx-info-circle me-1"></i>
                                        The IT technician who performed the installation
                                    </small>
                                </div>

                                {/* Assigned To */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        <i className="bx bx-user me-1 text-success"></i>
                                        Assigned To (End User)
                                    </label>
                                    <Select
                                        options={userOptions}
                                        value={userOptions.find((opt) => opt.value === formData.assigned_to)}
                                        onChange={(opt) => handleSelectChange("assigned_to", opt)}
                                        placeholder="Select end user..."
                                        isLoading={loadingUsers}
                                        isClearable
                                    />
                                    <small className="text-muted">
                                        <i className="bx bx-info-circle me-1"></i>
                                        The user who will be using this software
                                    </small>
                                </div>

                                {/* License Key */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">License Key Used</label>
                                    <input
                                        type="text"
                                        name="license_key_used"
                                        className="form-control"
                                        value={formData.license_key_used}
                                        onChange={handleInputChange}
                                        placeholder="Optional license key"
                                    />
                                </div>

                                {/* Status */}
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        Status <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        name="status"
                                        className="form-select"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                        <option value="failed">Failed</option>
                                        <option value="uninstalled">Uninstalled</option>
                                    </select>
                                </div>

                                {/* Compliance Checkbox */}
                                <div className="col-md-12 mb-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            name="is_compliant"
                                            className="form-check-input"
                                            id="is_compliant"
                                            checked={formData.is_compliant}
                                            onChange={handleInputChange}
                                        />
                                        <label className="form-check-label" htmlFor="is_compliant">
                                            Mark as Compliant
                                        </label>
                                    </div>
                                    <small className="text-muted">
                                        Check if this installation is licensed and compliant
                                    </small>
                                </div>

                                {/* Installation Notes */}
                                <div className="col-md-12 mb-3">
                                    <label className="form-label">Installation Notes</label>
                                    <textarea
                                        name="installation_notes"
                                        className="form-control"
                                        rows="2"
                                        value={formData.installation_notes}
                                        onChange={handleInputChange}
                                        placeholder="Any notes about the installation..."
                                        autoComplete="off"
                                    ></textarea>
                                </div>

                                {/* Configuration Notes */}
                                <div className="col-md-12 mb-3">
                                    <label className="form-label">Configuration Notes</label>
                                    <textarea
                                        name="configuration_notes"
                                        className="form-control"
                                        rows="2"
                                        value={formData.configuration_notes}
                                        onChange={handleInputChange}
                                        placeholder="Configuration details, settings, etc..."
                                        autoComplete="off"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                data-bs-dismiss="modal"
                                id="closeInstallationModal"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Saving...
                                    </>
                                ) : selectedInstallation ? (
                                    "Update Installation"
                                ) : (
                                    "Create Installation"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
