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

// get the Supplier
export const getSupplier = async ({
    uid = "",
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/asset-suppliers/${uid}`,
            uid == "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching supplier:", error);
        throw error;
    }
};


// Create or Update Supplier

export const createUpdateSupplier = async (assetData) => {
    try {
        const isUpdate = Boolean(assetData.uid);

        const url = isUpdate 
            ? `${API_BASE_URL}/api/asset-suppliers`
            : `${API_BASE_URL}/api/asset-suppliers`;

        const response = await api['post'](url, assetData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${assetData.uid ? 'updating' : 'creating'} supplier:`, error);
        throw error;
    }
};

// Delete Supplier
export const deleteSupplier = async (uid) => {
    try {
        const response = await api.delete(`${API_URL}/asset-suppliers/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting supplier:", error);
        throw error;
    }
};

// Bulk Delete Suppliers
export const bulkDeleteSupplier = async (assetUids) => {
    try {
        const response = await api.post(`${API_URL}/asset-suppliers/bulk-delete`, { asset_uids: assetUids }, config);
        return response.data;
    } catch (error) {
        console.error("Error in bulk deleting suppliers:", error);
        throw error;
    }
};

// Bulk Import Supplier
export const uploadSupplier = async (formData) => {
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
        console.error(`Error while importing suppliers:`, error);
        throw error;
    }
};
