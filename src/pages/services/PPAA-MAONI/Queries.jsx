import api from "../../../api";
import { API_BASE_URL } from "../../../Costants";

const API_URL = `${API_BASE_URL}/api/maoni/suggestions`;

/**
 * List Maoni suggestions.
 * Non-reviewers always receive their own rows only.
 * Reviewers/admins receive all rows unless `onlyMine: true` (personal /ppaa-maoni page).
 */
export const getSuggestions = async (page = 1, pageSize = 10, { onlyMine = false } = {}) => {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (onlyMine) params.set("only_mine", "true");
    const response = await api.get(`${API_URL}/?${params.toString()}`);
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
 * Get suggestion data for printing (Maoni leads / admins only)
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
 * Normalize Maoni list payloads ({ status, data: [...] }) or a bare array.
 */
const normalizeMaoniCategoriesResponse = (body) => {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (typeof body === "object") {
    if (Array.isArray(body.data)) return body.data;
    if (body.data != null && typeof body.data === "object" && Array.isArray(body.data.results)) {
      return body.data.results;
    }
  }
  return [];
};

/**
 * Get all categories (area of concern). Does not throw: returns { status, message, data } so UIs can always render.
 */
export const getCategories = async () => {
  try {
    const response = await api.get(`${API_BASE_URL}/api/maoni/categories/`);
    const body = response?.data;
    const list = normalizeMaoniCategoriesResponse(body);
    const st = Array.isArray(body) ? 8000 : body?.status;
    const ok = st === 8000 || st === 200;
    return {
      status: ok ? 8000 : st ?? 8001,
      message: Array.isArray(body) ? "Success" : body?.message ?? "Success",
      data: list,
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    const msg =
      error.response?.data?.message ||
      (error.response?.status === 404
        ? "Maoni categories API not found. Add microservices.maoni to INSTALLED_APPS and run migrations."
        : error.message || "Failed to fetch categories");
    return {
      status: error.response?.data?.status ?? error.response?.status ?? 500,
      message: msg,
      data: [],
    };
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
