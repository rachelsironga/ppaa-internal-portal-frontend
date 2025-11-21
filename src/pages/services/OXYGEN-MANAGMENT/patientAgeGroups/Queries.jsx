import axios from "axios";
import api from "../../../../api";
import { API_BASE_URL } from ".././../../../Costants";

const API_URL = `${API_BASE_URL}/api/oxygen/patient-age-groups`;

const config = {
  headers: {
    "Content-Type": "application/json",
  },
};

const setConfig = (pagination = {}) => ({
  headers: { "Content-Type": "application/json" },
  params: { ...pagination },
});

export const getPatientAgeGroups = async ({
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
    console.error("Error fetching Patient Age Groups:", error);
    throw error;
  }
};

export const createUpdatePatientAgeGroup = async (formData) => {
  try {
    const response = await api.post(API_URL, formData, config);
    return response.data;
  } catch (error) {
    console.error(`Error while changing Patient Age Group:`, error);
    throw error;
  }
};

export const deletePatientAgeGroup = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting Patient Age Group:", error);
    throw error;
  }
};
