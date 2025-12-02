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

export const getFloors = async ({ uid = "", building = "", search = "", pagination = {} }) => {
    try {
        let url = `${API_URL}/asset-floors`;

        if (uid) {
            url += `/${uid}`;
        } else {
            const params = [];
            if (building) params.push(`building=${building}`);
            if (search) params.push(`search=${search}`);
            if (params.length > 0) url += `?${params.join('&')}`;
        }

        const configObj = uid === "" ? setConfig(pagination) : {};

        const response = await api.get(url, configObj);
        return response.data;
    } catch (error) {
        console.error("Error fetching floors:", error);
        throw error;
    }
};

export const createUpdateFloor = async (floorData) => {
    try {
        const isUpdate = Boolean(floorData.uid);

        const method = isUpdate ? "put" : "post";
        const url = isUpdate
            ? `${API_BASE_URL}/api/asset-floors/${floorData.uid}/update`
            : `${API_BASE_URL}/api/asset-floors/create`;

        const response = await api[method](url, floorData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${floorData.uid ? 'updating' : 'creating'} floor:`, error);
        throw error;
    }
};

export const deleteFloor = async (uid) => {
    try {
        const response = await api.delete(`${API_URL}/asset-floors/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting floor:", error);
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
