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

export const fetchData = async ({ url = "/", uid = "", filter = {} }) => {
  if (!url) {
    throw new Error("URL is required for fetching data");
  }

  try {
    const response = await api.get(
      `${API_URL}${url}${uid ? `/${uid}` : ""}`,
      uid ? {} : setConfig(filter)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching Data:", error);
    throw error;
  }
};
