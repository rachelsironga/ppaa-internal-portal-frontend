import api from "../../../api";
import { API_BASE_URL } from "../../../Costants";

const API_URL = `${API_BASE_URL}/api/maoni/suggestions`;
const MAONI_SETTINGS_API_URL = `${API_BASE_URL}/api/maoni/settings/`;

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

const extractSuggestionsList = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.results)) return res.data.results;
  if (Array.isArray(res?.results)) return res.results;
  return [];
};

/**
 * Fetch all Maoni suggestions across paginated API responses (page_size capped at 500 server-side).
 */
export const getAllSuggestions = async ({ onlyMine = false, pageSize = 500 } = {}) => {
  const safePageSize = Math.min(500, Math.max(1, Number(pageSize) || 500));
  let page = 1;
  let merged = [];

  while (page <= 200) {
    const res = await getSuggestions(page, safePageSize, { onlyMine });
    const rows = extractSuggestionsList(res);
    merged = merged.concat(rows);

    const pagination = res?.pagination || res?.data?.pagination || {};
    const total = Number(pagination?.total);
    if (Number.isFinite(total) && total >= 0) {
      if (merged.length >= total) break;
    } else if (rows.length < safePageSize) {
      break;
    }
    page += 1;
  }

  return {
    status: 8000,
    message: "Success",
    data: merged,
    pagination: { total: merged.length, page: 1, page_size: merged.length },
  };
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
export const replyToSuggestion = async (uid, comment, parentCommentUid = null, options = {}) => {
  try {
    const payload = {
      comment,
      parent_comment_uid: parentCommentUid,
    };
    if (options.threadScope === "STAFF") {
      payload.thread_scope = "STAFF";
    }
    const response = await api.post(`${API_URL}/${uid}/reply/`, payload);
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

/**
 * Get Maoni workflow settings (e.g., escalation days).
 */
export const getMaoniSettings = async () => {
  try {
    const response = await api.get(MAONI_SETTINGS_API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching Maoni settings:", error);
    throw error;
  }
};

/**
 * Update Maoni workflow settings (admin/reviewer roles only).
 */
export const updateMaoniSettings = async (data) => {
  try {
    const response = await api.put(MAONI_SETTINGS_API_URL, data);
    return response.data;
  } catch (error) {
    console.error("Error updating Maoni settings:", error);
    throw error;
  }
};
