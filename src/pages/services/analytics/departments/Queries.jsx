import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const DEPARTMENTS_API_URL = `${API_BASE_URL}/api/departments`;

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
            `${DEPARTMENTS_API_URL}${uid === "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`}`,
            uid === "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching departments:", error);
        throw error;
    }
};

export const createUpdateDepartment = async (departmentData) => {
    try {
        const response = await api.post(DEPARTMENTS_API_URL, departmentData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${departmentData.uid ? 'updating' : 'creating'} department:`, error);
        throw error;
    }
};

export const deleteDepartment = async (uid) => {
    try {
        const response = await api.delete(`${DEPARTMENTS_API_URL}/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting department:", error);
        throw error;
    }
};

