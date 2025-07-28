import axios from "axios";
import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const API_URL = `${API_BASE_URL}/api/approval-module`;

const API_URL_LEVEL = `${API_BASE_URL}/api/approval-module-level`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const setConfig = (pagination = {}) => ({
    headers: { "Content-Type": "application/json" },
    params: { ...pagination },
});

export const getModules = async ({
    uid = "",
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_URL}${uid == "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`
            }`,
            uid == "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Data:", error);
        throw error;
    }
};

export const createUpdateItem = async (formData) => {
    try {
        const response = await api.post(API_URL, formData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while changing Item:`, error);
        throw error;
    }
};

export const deleteItem = async (id) => {
    try {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting Item:", error);
        throw error;
    }
};


export const deleteItemLevel = async (id) => {
    try {
        const response = await api.delete(`${API_URL_LEVEL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting Module Level:", error);
        throw error;
    }
};

export const createUpdateItemLevel = async (formData) => {
    try {
        const response = await api.post(API_URL_LEVEL, formData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while changing Item:`, error);
        throw error;
    }
};

export const sortItemLevels = async (sortData) => {
    try {
        console.log("sortData", sortData);
        const response = await api.post(API_URL_LEVEL, sortData, config);
        return response.data;
    } catch (error) {
        console.error("Error sorting levels:", error);
        throw error;
    }
};
