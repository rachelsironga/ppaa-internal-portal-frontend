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


// Create or Update  Supplier

export const createUpdateSuppliers = async (supplierData) => {
    try {
        const isUpdate = Boolean(supplierData.uid);

        const url = isUpdate
            ? `${API_BASE_URL}/api/asset-suppliers`
            : `${API_BASE_URL}/api/asset-suppliers`;

        const response = await api['post'](url, supplierData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${supplierData.uid ? 'updating' : 'creating'}  Supplier:`, error);
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

