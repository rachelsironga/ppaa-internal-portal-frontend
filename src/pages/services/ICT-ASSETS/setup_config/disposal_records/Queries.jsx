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

// Get disposal records (with optional search, pagination, and single disposal record by UID)
export const getDisposalRecord = async ({
    uid = "",
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/asset-disposal-records${uid == "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`
            }`,
            uid == "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching disposal record:", error);
        throw error;
    }
};

// Get assets (for dropdown/select)
export const getAsset = async ({
    uid = "",
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/assets${uid == "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`
            }`,
            uid == "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching asset:", error);
        throw error;
    }
};

// Create or Update Disposal Record
export const createUpdateDisposalRecords = async (disposalRecord) => {
    try {
        // Use POST for both create and update - backend handles it based on uid presence
        const url = `${API_BASE_URL}/api/asset-disposal-records`;

        const response = await api.post(url, disposalRecord, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${disposalRecord.uid ? 'updating' : 'creating'} disposal record:`, error);
        throw error;
    }
};

// Delete Disposal Record
export const deleteDisposalRecord = async (uid) => {
    try {
        const response = await api.delete(`${API_URL}/asset-disposal-records/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting disposal record:", error);
        throw error;
    }
};

// Get Maintenance Records for Asset
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

// Approve Disposal Record
export const approveDisposalRecord = async (uid, approvalData = {}) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/api/asset-disposal-records/${uid}/approve`,
            approvalData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error approving disposal record:", error);
        throw error;
    }
};

// Reject Disposal Record
export const rejectDisposalRecord = async (uid, rejectionData = {}) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/api/asset-disposal-records/${uid}/reject`,
            rejectionData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error rejecting disposal record:", error);
        throw error;
    }
};

// Get Disposal Audit Trail
export const getDisposalAuditTrail = async (uid, pagination = {}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/asset-disposal-records/${uid}/audit-trail`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching disposal audit trail:", error);
        throw error;
    }
};

// Create Disposal Audit Trail Entry
export const createDisposalAuditTrail = async (uid, auditData) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/api/asset-disposal-records/${uid}/audit-trail`,
            auditData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error creating disposal audit trail:", error);
        throw error;
    }
};

// Get Disposal Conversations
export const getDisposalConversations = async (uid, pagination = {}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/asset-disposal-records/${uid}/conversations`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching disposal conversations:", error);
        throw error;
    }
};

// Create Disposal Conversation
export const createDisposalConversation = async (uid, conversationData) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/api/asset-disposal-records/${uid}/conversations`,
            conversationData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error creating disposal conversation:", error);
        throw error;
    }
};

// Resubmit Disposal Record (after rejection)
export const resubmitDisposalRecord = async (uid, resubmitData) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/api/asset-disposal-records/${uid}/resubmit`,
            resubmitData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error resubmitting disposal record:", error);
        throw error;
    }
};

// Cancel Disposal Record (accept rejection and keep asset)
export const cancelDisposalRecord = async (uid, cancelData = {}) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/api/asset-disposal-records/${uid}/cancel`,
            cancelData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error cancelling disposal record:", error);
        throw error;
    }
};



