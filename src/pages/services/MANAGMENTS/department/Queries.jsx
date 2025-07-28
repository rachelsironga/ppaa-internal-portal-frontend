import axios from "axios";
import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const API_URL = `${API_BASE_URL}/api/departments`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const setConfig = (pagination = {}) => ({
    headers: { "Content-Type": "application/json" },
    params: { ...pagination },
});

export const getDepartments = async ({
    uid = "",
    search = "",
    directory = "",
    pagination = {},
}) => {
    try {
        let url = `${API_URL}`;
        let config = {};

        if (uid !== "") {
            url += `/${uid}`;
        } else {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            if (directory) params.append("directory", directory);
            url += `?${params.toString()}`;
            config = setConfig(pagination);
        }

        const response = await api.get(url, config);
        return response.data;
    } catch (error) {
        console.error("Error fetching departments:", error);
        throw error;
    }
};

export const createUpdateDepartment = async (departmentData) => {
    try {
        const response = await api.post(API_URL, departmentData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while changing department:`, error);
        throw error;
    }
};

export const deleteDepartment = async (id) => {
    try {
        const response = await api.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting department:", error);
        throw error;
    }
};
