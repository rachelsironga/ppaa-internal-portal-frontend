import axios from "axios";
import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const API_URL = `${API_BASE_URL}/api/directory`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const setConfig = (pagination = {}) => ({
    headers: { "Content-Type": "application/json" },
    params: { ...pagination },
});

export const getDirectories = async ({
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
        console.error("Error fetching directories:", error);
        throw error;
    }
};

export const createUpdateDirectory = async (departmentData) => {
    try {
        const response = await api.post(API_URL, departmentData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while changing directory:`, error);
        throw error;
    }
};

export const deleteDirectory = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting directory:", error);
        throw error;
    }
};

export const uploadDirectory = async (formData) => {
  try {
    const response = await api.post(
      `${API_BASE_URL}/api/import-directories`,
      formData,
      config
    );
    return response.data;
  } catch (error) {
    console.error(`Error while Import directory:`, error);
    throw error;
  }
};
