import axios from "axios";
import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const API_URL = `${API_BASE_URL}/api/oxygen/locational-oxygen-usages`;
const VERIFY_API_URL = `${API_BASE_URL}/api/oxygen/locatinal-oxygen-usage-verify`;
const REPORT_API_URL = `${API_BASE_URL}/api/oxygen/oxygen-usage-report`;

const config = {
  headers: {
    "Content-Type": "application/json",
  },
};

const setConfig = (pagination = {}) => ({
  headers: { "Content-Type": "application/json" },
  params: { ...pagination },
});

export const getOxygenUsages = async ({
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
    console.error("Error fetching Oxygen recievings:", error);
    throw error;
  }
};

export const createUpdateoxygenUsage = async (formData) => {
  try {
    const response = await api.post(API_URL, formData, config);
    return response.data;
  } catch (error) {
    console.error(`Error while changing Oxygen Usage:`, error);
    throw error;
  }
};

export const deleteOxygenUsage = async (uid) => {
  try {
    const response = await axios.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting Oxygen Usage:", error);
    throw error;
  }
};

// create location volumes
export const createOxygenUsageVolume = async (formData) => {
  try {
    const response = await api.post(
      `${API_BASE_URL}/api/location-oxygen-volumes`,
      formData,
      config
    );
    return response.data;
  } catch (error) {
    console.error(`Error while changing Oxygen Usage Volume:`, error);
    throw error;
  }
};

// verify oxygen volumes
export const VerifyOxygenUsage = async (uid, formData) => {
  try {
    const response = await api.post(
      `${VERIFY_API_URL}/${uid}`,
      formData,
      config
    );
    return response.data;
  } catch (error) {
    console.error(`Error while Verifing Oxygen Usage:`, error);
    throw error;
  }
};

export const getUsageReport = async ({ filters = {} }) => {
  try {
    const response = await api.get(
      `${REPORT_API_URL}${
        filters ? `/${filters.date_from}/${filters.date_to}` : ``
      }`,
      setConfig()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching Oxygen Usage Report:", error);
    throw error;
  }
};
