import axios from "axios";
import api from "../../../../api";

const API_BASE = `/api/training`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const multipartConfig = {
    headers: {
        "Content-Type": "multipart/form-data",
    },
};

// ============ TRAINING BATCHES ============

export const getTrainingBatches = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/training-batches`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching training batches:", error);
        throw error;
    }
};

export const getTrainingBatchDetail = async (uid) => {
    try {
        const response = await api.get(`${API_BASE}/training-batches/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching training batch detail:", error);
        throw error;
    }
};

export const createTrainingBatch = async (batchData) => {
    try {
        const response = await api.post(`${API_BASE}/training-batches/create`, batchData, multipartConfig);
        return response.data;
    } catch (error) {
        console.error("Error creating training batch:", error);
        throw error;
    }
};

export const updateTrainingBatch = async (uid, batchData) => {
    try {
        const response = await api.put(`${API_BASE}/training-batches/${uid}/update`, batchData, multipartConfig);
        return response.data;
    } catch (error) {
        console.error("Error updating training batch:", error);
        throw error;
    }
};

export const deleteTrainingBatch = async (uid) => {
    try {
        const response = await api.delete(`${API_BASE}/training-batches/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting training batch:", error);
        throw error;
    }
};

export const searchTrainingBatches = async (searchTerm, params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/training-batches`, {
            params: { search: searchTerm, ...params }
        });
        return response.data;
    } catch (error) {
        console.error("Error searching training batches:", error);
        throw error;
    }
};

// ============ MOUS ============

export const getMOUs = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/mous`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching MOUs:", error);
        throw error;
    }
};

// ============ CURRENCIES ============

export const getCurrencies = async (params = {}) => {
    try {
        const response = await api.get(`/api/auth/currencies`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching currencies:", error);
        throw error;
    }
};

// ============ DEPARTMENTS ============

export const getDepartments = async (params = {}) => {
    try {
        const response = await api.get(`/api/auth/departments`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching departments:", error);
        throw error;
    }
};
