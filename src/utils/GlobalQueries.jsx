import axios from "axios";
import { API_BASE_URL } from "../Costants";
import api from "../api";

const API_URL = `${API_BASE_URL}/api`;

const setConfig = (filter = {}) => {
  const cleanedFilter = Object.fromEntries(
    Object.entries(filter).filter(
      ([_, value]) => value !== "" && value !== null && value !== undefined
    )
  );

  return {
    headers: { "Content-Type": "application/json" },
    params: cleanedFilter,
  };
};

export const fetchData = async ({
  url = "/",
  uid = "",
  filter = {},
  isFullPath = false,
}) => {
  if (!url) {
    throw new Error("URL is required for fetching data");
  }

  try {
    const response = await api.get(
      `${isFullPath ? API_BASE_URL : API_URL}${url}${uid ? `/${uid}` : ""}`,
      uid ? {} : setConfig(filter)
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createUpdateData = async ({
  url = "/",
  uid = "",
  formData = {},
  filter = {},
  isFullPath = false,
}) => {
  if (!url) {
    throw new Error("URL is required for fetching data");
  }
  if (!formData) {
    throw new Error("Form data is required for creating or updating");
  }
  try {
    const response = await api.post(
      `${isFullPath ? API_BASE_URL : API_URL}${url}${uid ? `/${uid}` : ""}`,
      formData,
      setConfig(filter)
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteData = async ({
  url = "/",
  uid = "",
  filter = {},
  isFullPath = false,
}) => {
  if (!url) {
    throw new Error("URL is required for Delete data");
  }

  try {
    const response = await api.delete(
      `${isFullPath ? API_BASE_URL : API_URL}${url}${uid ? `/${uid}` : ""}`,
      uid ? {} : setConfig(filter)
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
