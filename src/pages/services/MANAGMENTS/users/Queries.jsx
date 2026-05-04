import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const setConfig = (pagination = {}) => ({
    headers: { "Content-Type": "application/json" },
    params: { ...pagination },
});

export const getUsers = async ({ uid = "", search = "", pagination = {} }) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/user/setup${uid == "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`}`,
            uid == "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching Users:", error);
        throw error;
    }
};



export const createUpdateUser = async (userData) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/user/setup`,
            userData,
            config
        );
        return response.data;
    } catch (error) {
        console.error(`Error while changing User:`, error);
        throw error;
    }
};

export const deleteUser = async (guid) => {
    try {
        const response = await api.delete(`${API_BASE_URL}/user/setup/${guid}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

export const photoUpload = async (data) => {
    try {
        const response = await api.post(
            `${API_BASE_URL}/user/setup-photo`,
            data,
            config
        );
        return response.data;
    } catch (error) {
        console.error(`Error while Uploading Photo`, error);
        throw error;
    }
};

export const getPositions = async ({
    uid = "",
    search = "",
    user_uid = "",
    old_only = false,
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/user/positions? &user_uid=${user_uid}&old_only=${old_only}`,
            uid == "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching User Positions:", error);
        throw error;
    }
};

export const createUpdatePositions = async (positionData) => {
    try {
        const response = await api.post(`${API_BASE_URL}/user/positions`, positionData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while changing Position:`, error);
        throw error;
    }
};

export const getUserStatistics = async () => {
    try {
        // Fetch all users with a large page size to get counts
        const response = await api.get(
            `${API_BASE_URL}/user/setup`,
            {
                headers: { "Content-Type": "application/json" },
                params: { page: 1, page_size: 10000 } // Large page size to get all users
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching user statistics:", error);
        throw error;
    }
};

