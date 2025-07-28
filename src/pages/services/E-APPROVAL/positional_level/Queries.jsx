import api from "../../../../api";
import { API_BASE_URL } from "../../../../Costants";

const API_URL = `${API_BASE_URL}/api/positional-level`;

const config = {
  headers: {
    "Content-Type": "application/json",
  },
};

const setConfig = (pagination = {}) => ({
  headers: { "Content-Type": "application/json" },
  params: { ...pagination },
});

export const getPositionalLevels = async ({
  uid = "",
  search = "",
  pagination = {},
}) => {
  try {
    const response = await api.get(
      `${API_URL}${
        uid == "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`
      }`,
      uid == "" ? setConfig(pagination) : {}
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching Positional Levels:", error);
    throw error;
  }
};

export const createUpdatePositionalLevel = async (departmentData) => {
  try {
    const response = await api.post(API_URL, departmentData, config);
    return response.data;
  } catch (error) {
    console.error(`Error while changing Positional Level:`, error);
    throw error;
  }
};

export const deletePositionalLevel = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting Positional Level:", error);
    throw error;
  }
};
