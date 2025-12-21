import api from "../../../../api";

const API_BASE = `/api/training`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

// ============ TRAINING SETTINGS ============

export const getTrainingSettings = async () => {
    try {
        const response = await api.get(`${API_BASE}/settings`);
        return response.data;
    } catch (error) {
        console.error("Error fetching training settings:", error);
        throw error;
    }
};

export const updateTrainingSettings = async (settingsData) => {
    try {
        const response = await api.post(`${API_BASE}/settings/update`, settingsData, config);
        return response.data;
    } catch (error) {
        console.error("Error updating training settings:", error);
        throw error;
    }
};

export const setSpecialDepartmentConfig = async (configData) => {
    try {
        const response = await api.post(
            `${API_BASE}/settings/special-departments`,
            configData,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error setting special department config:", error);
        throw error;
    }
};

export const getSpecialDepartmentConfig = async (departmentUid) => {
    try {
        const response = await api.get(
            `${API_BASE}/settings/special-departments/${departmentUid}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching special department config:", error);
        throw error;
    }
};

export const removeSpecialDepartmentConfig = async (departmentUid) => {
    try {
        const response = await api.delete(
            `${API_BASE}/settings/special-departments/${departmentUid}`
        );
        return response.data;
    } catch (error) {
        console.error("Error removing special department config:", error);
        throw error;
    }
};
