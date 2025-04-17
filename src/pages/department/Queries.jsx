import axios from "axios";
import { API_BASE_URL } from "../../Costants";
import api from "../../api";

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
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting department:", error);
        throw error;
    }
};
