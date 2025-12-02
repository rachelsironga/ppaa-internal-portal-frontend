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

export const getLocations = async ({ uid = "", search = "", pagination = {} }) => {
    try {
        let url = `${API_URL}/asset-locations`;

        if (uid) {
            url += `/${uid}`;
        } else if (search) {
            url += `?search=${search}`;
        }

        const configObj = uid === "" ? setConfig(pagination) : {};

        const response = await api.get(url, configObj);
        return response.data;
    } catch (error) {
        console.error("Error fetching asset locations:", error);
        throw error;
    }
};

export const createUpdateLocation = async (locationData) => {
    try {
        const isUpdate = Boolean(locationData.uid);

        const method = isUpdate ? "put" : "post";
        const url = isUpdate
            ? `${API_BASE_URL}/api/asset-locations/${locationData.uid}/update`
            : `${API_BASE_URL}/api/asset-locations/create`;

        const response = await api[method](url, locationData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${locationData.uid ? 'updating' : 'creating'} asset location:`, error);
        throw error;
    }
};

export const deleteLocation = async (uid) => {
    try {
        const response = await api.delete(`${API_URL}/asset-locations/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting asset location:", error);
        throw error;
    }
};

export const getBuildings = async ({ search = "", pagination = {} }) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/asset-buildings${search !== "" ? `?search=${search}` : ""}`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching buildings:", error);
        throw error;
    }
};

export const getFloors = async ({ building = "", search = "", pagination = {} }) => {
    try {
        let url = `${API_BASE_URL}/api/asset-floors`;
        const params = [];
        if (building) params.push(`building=${building}`);
        if (search) params.push(`search=${search}`);
        if (params.length > 0) url += `?${params.join('&')}`;

        const response = await api.get(url, setConfig(pagination));
        return response.data;
    } catch (error) {
        console.error("Error fetching floors:", error);
        throw error;
    }
};
