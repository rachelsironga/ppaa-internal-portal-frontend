import axios from "axios";
import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

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

export const getComputerAssets = async ({ uid = "", search = "", pagination = {} }) => {
    try {
        let url = `${API_URL}/asset-computers`;

        if (uid) {
            url += `/${uid}`;
        } else if (search) {
            url += `?search=${search}`;
        }

        const config = uid === "" ? setConfig(pagination) : {};

        const response = await api.get(url, config);
        return response.data;
    } catch (error) {
        console.error("Error fetching assets:", error);
        throw error;
    }
};


export const createUpdateAsset = async (assetData) => {
    try {
        const isUpdate = Boolean(assetData.uid);

        const method = isUpdate ? "put" : "post";
        const url = isUpdate
            ? `${API_BASE_URL}/api/asset-computers/${assetData.uid}/update`
            : `${API_BASE_URL}/api/asset-computers/create`;

        const response = await api[method](url, assetData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${assetData.uid ? 'updating' : 'creating'} asset:`, error);
        throw error;
    }
};


export const deleteAsset = async (uid) => {
    try {
        const response = await api.delete(`${API_URL}/asset-computers/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting asset:", error);
        throw error;
    }
};

export const bulkDeleteAssets = async (assetUids) => {
    try {
        const response = await api.post(`${API_URL}/bulk-delete`, { asset_uids: assetUids }, config);
        return response.data;
    } catch (error) {
        console.error("Error in bulk deleting assets:", error);
        throw error;
    }
};

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

export const exportAssets = async (filters = {}) => {
    try {
        const response = await api.post(
            `${API_URL}/export`,
            filters,
            {
                ...config,
                responseType: 'blob'
            }
        );
        return response;
    } catch (error) {
        console.error("Error exporting assets:", error);
        throw error;
    }
};

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
            `${API_BASE_URL}/api/users${search !== "" ? `?search=${search}` : ""}`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const getCustodians = async ({
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
        console.error("Error fetching custodians:", error);
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

export const bulkUpdateAssets = async (assetData) => {
    try {
        const response = await api.post(`${API_URL}/bulk-update`, assetData, config);
        return response.data;
    } catch (error) {
        console.error("Error in bulk updating assets:", error);
        throw error;
    }
};

export const bulkAssignAssets = async (assetUids, custodianGuid, locationUid = null) => {
    try {
        const response = await api.post(
            `${API_URL}/bulk-assign`,
            {
                asset_uids: assetUids,
                custodian_guid: custodianGuid,
                location_uid: locationUid,
            },
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error in bulk assigning assets:", error);
        throw error;
    }
};

export const getAssetHistory = async (uid) => {
    try {
        const response = await api.get(`${API_BASE_URL}/api/assets-activities/${uid}/history`);
        return response.data;
    } catch (error) {
        console.error("Error fetching asset history:", error);
        throw error;
    }
};

export const updateAssetStatus = async (uid, statusData) => {
    try {
        const response = await api.patch(`${API_URL}/${uid}/update`, statusData, config);
        return response.data;
    } catch (error) {
        console.error("Error updating asset status:", error);
        throw error;
    }
};

export const assignAsset = async (assignmentData) => {
    try {
        const response = await api.post(`${API_URL}/assign`, assignmentData, config);
        return response.data;
    } catch (error) {
        console.error("Error assigning asset:", error);
        throw error;
    }
};

export const unassignAsset = async (uid) => {
    try {
        const response = await api.post(`${API_URL}/${uid}/unassign`, {}, config);
        return response.data;
    } catch (error) {
        console.error("Error unassigning asset:", error);
        throw error;
    }
};

export const transferAsset = async (uid, transferData) => {
    try {
        const response = await api.post(
            `${API_URL}/${uid}/transfer`,
            transferData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error transferring asset:", error);
        throw error;
    }
};

export const getMaintenanceRecords = async (assetUid = "", pagination = {}) => {
    try {
        const params = { ...pagination };
        if (assetUid) params.asset = assetUid;
        
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

export const updateMaintenanceRecord = async (uid, recordData) => {
    try {
        const response = await api.put(
            `${API_BASE_URL}/api/asset-maintenance-records/${uid}/update`,
            recordData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error updating maintenance record:", error);
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

export const getSupportTickets = async (assetUid = "", pagination = {}) => {
    try {
        const params = { ...pagination };
        if (assetUid) params.asset = assetUid;
        
        const response = await api.get(
            `${API_BASE_URL}/api/asset-support-tickets`,
            { params }
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

export const deleteSupportTicket = async (uid) => {
    try {
        const response = await api.delete(
            `${API_BASE_URL}/api/asset-support-tickets/${uid}/delete`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting support ticket:", error);
        throw error;
    }
};

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

export const generateAssetReport = async (reportType, filters = {}) => {
    try {
        const response = await api.post(
            `${API_URL}/reports/${reportType}`,
            filters,
            {
                ...config,
                responseType: 'blob'
            }
        );
        return response;
    } catch (error) {
        console.error("Error generating asset report:", error);
        throw error;
    }
};

export const getAssetStatistics = async (filters = {}) => {
    try {
        const response = await api.get(
            `${API_URL}assets/statistics`,
            { params: filters }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching asset statistics:", error);
        throw error;
    }
};

export const verifyAsset = async (uid, verificationData) => {
    try {
        const response = await api.post(
            `${API_URL}/${uid}/verify`,
            verificationData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error verifying asset:", error);
        throw error;
    }
};

export const auditAsset = async (uid, auditData) => {
    try {
        const response = await api.post(
            `${API_URL}/${uid}/audit`,
            auditData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error auditing asset:", error);
        throw error;
    }
};
