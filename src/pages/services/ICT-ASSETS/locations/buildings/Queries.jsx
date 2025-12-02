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

export const getBuildings = async ({ uid = "", search = "", pagination = {} }) => {
    try {
        let url = `${API_URL}/asset-buildings`;

        if (uid) {
            url += `/${uid}`;
        } else if (search) {
            url += `?search=${search}`;
        }

        const configObj = uid === "" ? setConfig(pagination) : {};

        const response = await api.get(url, configObj);
        return response.data;
    } catch (error) {
        console.error("Error fetching buildings:", error);
        throw error;
    }
};

export const createUpdateBuilding = async (buildingData) => {
    try {
        const isUpdate = Boolean(buildingData.uid);

        const method = isUpdate ? "put" : "post";
        const url = isUpdate
            ? `${API_BASE_URL}/api/asset-buildings/${buildingData.uid}/update`
            : `${API_BASE_URL}/api/asset-buildings/create`;

        const response = await api[method](url, buildingData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${buildingData.uid ? 'updating' : 'creating'} building:`, error);
        throw error;
    }
};

export const deleteBuilding = async (uid) => {
    try {
        const response = await api.delete(`${API_URL}/asset-buildings/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting building:", error);
        throw error;
    }
};
