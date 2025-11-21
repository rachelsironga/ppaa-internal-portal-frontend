import axios from "axios";
import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const API_URL = `${API_BASE_URL}/api/oxygen/oxygen-receivings`;
const VERIFY_API_URL = `${API_BASE_URL}/api/oxygen/oxygen-receiving-verify`;

const config = {
  headers: {
    "Content-Type": "application/json",
  },
};

const setConfig = (pagination = {}) => ({
  headers: { "Content-Type": "application/json" },
  params: { ...pagination },
});

export const getOxygenRecievings = async ({
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

export const createUpdateoxygenRecieving = async (formData) => {
  try {
    const response = await api.post(API_URL, formData, config);
    return response.data;
  } catch (error) {
    console.error(`Error while changing Oxygen Recieving:`, error);
    throw error;
  }
};

export const deleteOxygenRecieving = async (uid) => {
  try {
    const response = await axios.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting Oxygen Recieving:", error);
    throw error;
  }
};

// create location volumes
export const createOxygenRecievingVolume = async (formData) => {
  try {
    const response = await api.post(
      `${API_BASE_URL}/api/location-oxygen-volumes`,
      formData,
      config
    );
    return response.data;
  } catch (error) {
    console.error(`Error while changing Oxygen Recieving Volume:`, error);
    throw error;
  }
};

// create location volumes
export const VerifyOxygenRecieving = async (uid, formData) => {
  try {
    const response = await api.post(
      `${VERIFY_API_URL}/${uid}`,
      formData,
      config
    );
    return response.data;
  } catch (error) {
    console.error(`Error while Verifing Oxygen Recieving:`, error);
    throw error;
  }
};
