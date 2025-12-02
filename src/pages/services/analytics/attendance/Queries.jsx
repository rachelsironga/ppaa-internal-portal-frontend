import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const ATTENDANCES_API_URL = `${API_BASE_URL}/api/analytical/attendances`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const setConfig = (pagination = {}) => ({
    headers: { "Content-Type": "application/json" },
    params: { ...pagination },
});

export const getAttendances = async ({
    uid = "",
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${ATTENDANCES_API_URL}${uid === "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`}`,
            uid === "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching attendances:", error);
        throw error;
    }
};

export const createUpdateAttendance = async (attendanceData) => {
    try {
        const url = attendanceData.uid 
            ? `${ATTENDANCES_API_URL}/${attendanceData.uid}/update` 
            : `${ATTENDANCES_API_URL}/create`;
        
        const response = await api.post(url, attendanceData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${attendanceData.uid ? 'updating' : 'creating'} attendance:`, error);
        throw error;
    }
};

export const uploadAttendance = async (formData) => {
    try {
        const response = await api.post(
            `${ATTENDANCES_API_URL}/upload`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error uploading attendance:", error);
        throw error;
    }
};

export const processAttendance = async (uid) => {
    try {
        const response = await api.post(`${ATTENDANCES_API_URL}/${uid}/process`, {}, config);
        return response.data;
    } catch (error) {
        console.error("Error processing attendance:", error);
        throw error;
    }
};

export const deleteAttendance = async (uid) => {
    try {
        const response = await api.delete(`${ATTENDANCES_API_URL}/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting attendance:", error);
        throw error;
    }
};

export const getAttendanceSummary = async (filters = {}) => {
    try {
        const response = await api.get(`${ATTENDANCES_API_URL}/summary`, setConfig(filters));
        return response.data;
    } catch (error) {
        console.error("Error fetching attendance summary:", error);
        throw error;
    }
};
