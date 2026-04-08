import api from "../../../api";
import { API_BASE_URL } from "../../../Costants";

const API_URL = `${API_BASE_URL}/api/maoni/suggestions`;

/**
 * Get all suggestions (users see their own, HR sees all)
 */
export const getSuggestions = async (page = 1, pageSize = 10) => {
  try {
    const response = await api.get(`${API_URL}/?page=${page}&page_size=${pageSize}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    throw error;
  }
};

/**
 * Get a single suggestion by UID
 */
export const getSuggestion = async (uid) => {
  try {
    const response = await api.get(`${API_URL}/${uid}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching suggestion:", error);
    throw error;
  }
};

/**
 * Create a new suggestion
 */
export const createSuggestion = async (data) => {
  try {
    const response = await api.post(`${API_URL}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating suggestion:", error);
    throw error;
  }
};

/**
 * Update an existing suggestion
 */
export const updateSuggestion = async (uid, data) => {
  try {
    const response = await api.put(`${API_URL}/${uid}/`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating suggestion:", error);
    throw error;
  }
};

/**
 * Reply to a suggestion or another reply
 */
export const replyToSuggestion = async (uid, comment, parentCommentUid = null) => {
  try {
    const response = await api.post(`${API_URL}/${uid}/reply/`, {
      comment,
      parent_comment_uid: parentCommentUid,
    });
    return response.data;
  } catch (error) {
    console.error("Error replying to suggestion:", error);
    throw error;
  }
};

/**
 * Get suggestion data for printing (HR only)
 */
export const getSuggestionForPrint = async (uid) => {
  try {
    const response = await api.get(`${API_URL}/${uid}/print/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching suggestion for print:", error);
    throw error;
  }
};

/**
 * Get all categories (area of concern)
 */
export const getCategories = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/api/maoni/categories/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

/**
 * Get all departments from ppaa_auth
 */
export const getDepartments = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/api/departments`);
    console.log("Departments API response:", response);
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    console.error("Error response:", error.response?.data);
    // Return empty array instead of throwing to prevent form from breaking
    // The form will show "No departments available" message
    return {
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Failed to fetch departments",
      data: []
    };
  }
};
