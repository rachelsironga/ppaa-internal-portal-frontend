import axios from "axios";
import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const API_URL = `${API_BASE_URL}/api/oxygen/location`;

const config = {
  headers: {
    "Content-Type": "application/json",
  },
};

const setConfig = (pagination = {}) => ({
  headers: { "Content-Type": "application/json" },
  params: { ...pagination },
});

export const getOxygenLocations = async ({
  uid = "",
  search = "",
  with_volumes = false,
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
    console.error("Error fetching Oxygen Locations:", error);
    throw error;
  }
};

export const createUpdateOxygenLocation = async (formData) => {
  try {
    const response = await api.post(API_URL, formData, config);
    return response.data;
  } catch (error) {
    console.error(`Error while changing Oxygen Location:`, error);
    throw error;
  }
};

export const deleteOxygenLocation = async (uid) => {
  try {
    const response = await axios.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting Oxygen Location:", error);
    throw error;
  }
};

// create location volumes
export const createOxygenLocationVolume = async (formData) => {
  try {
    const response = await api.post(
      `${API_BASE_URL}/api/location-oxygen-volumes`,
      formData,
      config
    );
    return response.data;
  } catch (error) {
    console.error(`Error while changing Oxygen Location Volume:`, error);
    throw error;
  }
};

export const getOxygenLocationUsages = async (formData) => {
  try {
    const response = await api.post(
      `${API_BASE_URL}/api/locational-oxygen-usages`,
      formData,
      config
    );
    return response.data;
  } catch (error) {
    console.error(`Error while changing Oxygen Location Usage:`, error);
    throw error;
  }
};

export const createUpdateOxygenLocationUsage = async (formData) => {
  try {
    const response = await api.post(API_URL, formData, config);
    return response.data;
  } catch (error) {
    console.error(`Error while changing Oxygen Location Usage:`, error);
    throw error;
  }
};

export const deleteOxygenLocationUsage = async (uid) => {
  try {
    const response = await axios.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting Oxygen Location Usage:", error);
    throw error;
  }
};
