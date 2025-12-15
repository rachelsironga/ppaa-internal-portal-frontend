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

// get the asset type
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


// Create or Update Asset Type

export const createUpdateDisposalRecords = async (assetData) => {
    try {
        const isUpdate = Boolean(assetData.uid);

        const url = isUpdate 
            ? `${API_BASE_URL}/api/asset-disposal-records`
            : `${API_BASE_URL}/api/asset-disposal-records`;

        const response = await api['post'](url, assetData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${assetData.uid ? 'updating' : 'creating'} asset disposal records:`, error);
        throw error;
    }
};

// Delete Asset Toe
export const deleteDisposalRecord = async (uid) => {
    try {
        const response = await api.delete(`${API_URL}/asset-disposal-records/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting disposal record:", error);
        throw error;
    }
};



