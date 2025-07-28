import axios from "axios";
import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const API_URL = `${API_BASE_URL}/api/date-range`;

const config = {
  headers: {
    "Content-Type": "application/json",
  },
};

const setConfig = (pagination = {}) => ({
  headers: { "Content-Type": "application/json" },
  params: { ...pagination },
});

export const getDateRanges = async ({
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
    console.error("Error fetching Date Ranges:", error);
    throw error;
  }
};

export const createUpdateDateRange = async (formData) => {
  try {
    const response = await api.post(API_URL, formData, config);
    return response.data;
  } catch (error) {
    console.error(`Error while changing Date Range:`, error);
    throw error;
  }
};

export const deleteDateRange = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting Date Range:", error);
    throw error;
  }
};
