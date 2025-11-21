// Queries.js
import axios from "axios";
import { API_BASE_URL } from "../../../../../Costants";
import api from "../../../../../api";

const API_URL = `${API_BASE_URL}/api`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const setConfig = (pagination = {}) => ({
    headers: { "Content-Type": "application/json" },
    params: { ...pagination },
});

// Get Software Assets (with optional search, pagination, and single asset by UID)
export const getSoftwareAssets = async ({ uid = "", search = "", pagination = {} }) => {
    try {
        let url = `${API_URL}/asset-software`;

        if (uid) {
            url += `/${uid}`;
        } else if (search) {
            url += `?search=${search}`;
        }

        const config = uid === "" ? setConfig(pagination) : {};

        const response = await api.get(url, config);
        return response.data;
    } catch (error) {
        console.error("Error fetching software assets:", error);
        throw error;
    }
};

// Create or Update Software Category
export const createUpdateAsset = async (assetData) => {
    try {
        const isUpdate = Boolean(assetData.uid);

        const method = isUpdate ? "put" : "post";
        const url = isUpdate
            ? `${API_BASE_URL}/api/asset-software-categories/${assetData.uid}/update`
            : `${API_BASE_URL}/api/asset-software-categories/create`;

        const response = await api[method](url, assetData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${assetData.uid ? 'updating' : 'creating'} software category:`, error);
        throw error;
    }
};

// Delete Software Category
export const deleteAsset = async (uid) => {
    try {
        const response = await api.delete(`${API_URL}/asset-software-categories/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting software category:", error);
        throw error;
    }
};

// Bulk Delete Software Assets
export const bulkDeleteAssets = async (assetUids) => {
    try {
        const response = await api.post(`${API_URL}/asset-software/bulk-delete`, { asset_uids: assetUids }, config);
        return response.data;
    } catch (error) {
        console.error("Error in bulk deleting software assets:", error);
        throw error;
    }
};

// Bulk Import Assets
export const uploadAssets = async (formData) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/api/import-assets`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(`Error while importing assets:`, error);
        throw error;
    }
};

// Get Related Data for Dropdowns
export const getAssetTypes = async ({
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/asset-types${search !== "" ? `?search=${search}` : ""}`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching asset types:", error);
        throw error;
    }
};

export const getManufacturers = async ({
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/asset-manufacturers${search !== "" ? `?search=${search}` : ""}`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching manufacturers:", error);
        throw error;
    }
};

export const getSuppliers = async ({
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/asset-suppliers${search !== "" ? `?search=${search}` : ""}`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        throw error;
    }
};

export const getLocations = async ({
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/asset-locations${search !== "" ? `?search=${search}` : ""}`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching locations:", error);
        throw error;
    }
};

export const getUsers = async ({
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/assets-custodians${search !== "" ? `?search=${search}` : ""}`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const getTechnicians = async ({
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/assets-technicians${search !== "" ? `?search=${search}` : ""}`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching technicians:", error);
        throw error;
    }
};

// Asset-specific operations
export const bulkUpdateAssets = async (assetData) => {
    try {
        const response = await api.post(`${API_URL}/bulk-update`, assetData, config);
        return response.data;
    } catch (error) {
        console.error("Error in bulk updating assets:", error);
        throw error;
    }
};

export const getAssetHistory = async (uid) => {
    try {
        const response = await api.get(`${API_BASE_URL}api/assets-activities/${uid}/history`);
        return response.data;
    } catch (error) {
        console.error("Error fetching asset history:", error);
        throw error;
    }
};

// Asset Status Operations
export const updateAssetStatus = async (uid, statusData) => {
    try {
        const response = await api.patch(`${API_URL}/${uid}/update`, statusData, config);
        return response.data;
    } catch (error) {
        console.error("Error updating asset status:", error);
        throw error;
    }
};

// Asset Assignment Operations
export const assignAsset = async (assignmentData) => {
    try {
        const response = await api.post(`${API_URL}/update`, assignmentData, config);
        return response.data;
    } catch (error) {
        console.error("Error assigning asset:", error);
        throw error;
    }
};

export const unassignAsset = async (uid) => {
    try {
        const response = await api.post(`${API_URL}/${uid}/unassign/`, {}, config);
        return response.data;
    } catch (error) {
        console.error("Error unassigning asset:", error);
        throw error;
    }
};

// Maintenance Records
export const getMaintenanceRecords = async (assetUid = "", pagination = {}) => {
    
    try {
        const params = { ...pagination };
        // if (assetUid) params.asset = assetUid;
        
        const response = await api.get(
            `${API_BASE_URL}/api/asset-maintenance-records`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching maintenance records:", error);
        throw error;
    }
};

export const createMaintenanceRecord = async (recordData) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/api/asset-maintenance-records/create`,
            recordData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error creating maintenance record:", error);
        throw error;
    }
};

export const deleteMaintenanceRecord = async (uid) => {
    try {
        const response = await api.delete(
            `${API_BASE_URL}/api/asset-maintenance-records/${uid}/delete`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting maintenance record:", error);
        throw error;
    }
};

// Support Tickets
export const getSupportTickets = async (assetUid = "", pagination = {}) => {
    try {
        const params = { ...pagination };
        if (assetUid) params.asset = assetUid;
        
        const response = await api.get(
            `${API_BASE_URL}/api/asset-support-tickets/${assetUid}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching support tickets:", error);
        throw error;
    }
};



export const createSupportTicket = async (ticketData) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/api/asset-support-tickets/create`,
            ticketData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error creating support ticket:", error);
        throw error;
    }
};

export const updateSupportTicket = async (uid, ticketData) => {
    try {
        const response = await api.put(
            `${API_BASE_URL}/api/asset-support-tickets/${uid}/update`,
            ticketData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error updating support ticket:", error);
        throw error;
    }
};

// Asset History
export const getCustodianHistory = async (assetUid = "", pagination = {}) => {
    try {
        const params = { ...pagination };
        if (assetUid) params.asset = assetUid;
        
        const response = await api.get(
            `${API_BASE_URL}/api/assets-custodian-history`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching custodian history:", error);
        throw error;
    }
};

export const getLocationHistory = async (assetUid = "", pagination = {}) => {
    try {
        const params = { ...pagination };
        if (assetUid) params.asset = assetUid;
        
        const response = await api.get(
            `${API_BASE_URL}/api/assets-location-history`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching location history:", error);
        throw error;
    }
};

// Assignment
export const getAssetAssignments = async (assetUid = "", pagination = {}) => {
    try {
        const params = { ...pagination };
        if (assetUid) params.asset = assetUid;
        
        const response = await api.get(
            `${API_BASE_URL}/api/asset-assignments`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching asset assignments:", error);
        throw error;
    }
};

// Software Installations
export const getSoftwareInstallations = async (softwareUid = "", pagination = {}) => {
    try {
        const params = { ...pagination };
        if (softwareUid) params.software_uid = softwareUid;
        
        const response = await api.get(
            `${API_BASE_URL}/api/asset-software-installations`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching software installations:", error);
        throw error;
    }
};

export const createInstallation = async (installationData) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/api/asset-software-installations/create`,
            installationData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error creating installation:", error);
        throw error;
    }
};

export const updateInstallation = async (uid, installationData) => {
    try {
        const response = await api.put(
            `${API_BASE_URL}/api/asset-software-installations/${uid}/update`,
            installationData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error updating installation:", error);
        throw error;
    }
};

export const deleteInstallation = async (uid) => {
    try {
        const response = await api.delete(
            `${API_BASE_URL}/api/asset-software-installations/${uid}/delete`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting installation:", error);
        throw error;
    }
};

export const verifyInstallation = async (uid, verificationData) => {
    try {
        const response = await api.patch(
            `${API_BASE_URL}/api/asset-software-installations/${uid}/verify`,
            verificationData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error verifying installation:", error);
        throw error;
    }
};

export const uninstallSoftware = async (uid, uninstallData) => {
    try {
        const response = await api.patch(
            `${API_BASE_URL}/api/asset-software-installations/${uid}/uninstall`,
            uninstallData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error uninstalling software:", error);
        throw error;
    }
};

// Get available assets for installation (assets that don't have this software installed)
export const getAvailableAssets = async (softwareUid = "", search = "", pagination = {}) => {
    try {
        const params = { ...pagination };
        if (search) params.search = search;
        if (softwareUid) params.exclude_software = softwareUid;
        
        const response = await api.get(
            `${API_BASE_URL}/api/assets`,
            { params }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching available assets:", error);
        throw error;
    }
};