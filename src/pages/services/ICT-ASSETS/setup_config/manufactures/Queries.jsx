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

// get the Manufacture
export const getManufacture = async ({
    uid = "",
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/asset-manufacturers/${uid}`,
            uid == "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching asset type:", error);
        throw error;
    }
};


// Create or Update  Manufacture

export const createUpdateManufacture = async (assetData) => {
    try {
        const isUpdate = Boolean(assetData.uid);

        const url = isUpdate 
            ? `${API_BASE_URL}/api/asset-manufacturers`
            : `${API_BASE_URL}/api/asset-manufacturers`;

        const response = await api['post'](url, assetData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${assetData.uid ? 'updating' : 'creating'} asset type:`, error);
        throw error;
    }
};

// Delete Mafacture
export const deleteManufacture = async (uid) => {
    try {
        const response = await api.delete(`${API_URL}/asset-manufacturers/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting asset type:", error);
        throw error;
    }
};

// Bulk Delete Manufactured  
export const bulkDeleteManufacture = async (assetUids) => {
    try {
        const response = await api.post(`${API_URL}/asset-manufacturers/bulk-delete`, { asset_uids: assetUids }, config);
        return response.data;
    } catch (error) {
        console.error("Error in bulk deleting asset categories:", error);
        throw error;
    }
};

// Bulk Import Manufacture
export const uploadManufacture = async (formData) => {
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
