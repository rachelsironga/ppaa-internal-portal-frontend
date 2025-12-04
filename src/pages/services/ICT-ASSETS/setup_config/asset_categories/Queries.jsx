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

// Get Asset categories  (with optional search, pagination, and single asset by UID)
export const getAssetCategory = async ({ uid = "", search = "", pagination = {} }) => {
    try {
        let url = `${API_URL}/asset-asset-categories`;

        if (uid) {
            url += `/${uid}`;
        } else if (search) {
            url += `?search=${search}`;
        }

        const config = uid === "" ? setConfig(pagination) : {};

        const response = await api.get(url, config);
        return response.data;
    } catch (error) {
        console.error("Error fetching asset categories:", error);
        throw error;
    }
};

// Create or Update Asser Category
export const createUpdateAsset = async (assetData) => {
    try {
        const isUpdate = Boolean(assetData.uid);

        const url = isUpdate 
            ? `${API_BASE_URL}/api/asset-categories`
            : `${API_BASE_URL}/api/asset-categories`;

        const response = await api['post'](url, assetData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${assetData.uid ? 'updating' : 'creating'} asset category:`, error);
        throw error;
    }
};

// Delete Software Category
export const deleteAsset = async (uid) => {
    try {
        const response = await api.delete(`${API_URL}/asset-categories/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting asset category:", error);
        throw error;
    }
};

// Bulk Delete Asset Categories 
export const bulkDeleteAssets = async (assetUids) => {
    try {
        const response = await api.post(`${API_URL}/asset-categories/bulk-delete`, { asset_uids: assetUids }, config);
        return response.data;
    } catch (error) {
        console.error("Error in bulk deleting asset categories:", error);
        throw error;
    }
};

// Bulk Import Assets Categories
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

