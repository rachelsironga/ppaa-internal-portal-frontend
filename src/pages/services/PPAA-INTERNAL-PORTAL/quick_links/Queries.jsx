import api from "../../../../api";

const API_URL = `/api/internal-portal/quick-links`;

export const getQuickLinksList = async ({ uid = "", search = "", pagination = {} }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching quick links:", error);
    throw error;
  }
};

export const createUpdateQuickLink = async (formData) => {
  try {
    const url = formData.uid ? `${API_URL}/${formData.uid}` : API_URL;
    const method = formData.uid ? "put" : "post";
    const response = await api[method](url, formData);
    return response.data;
  } catch (error) {
    console.error("Error saving quick link:", error);
    throw error;
  }
};

export const deleteQuickLink = async (uid) => {
  try {
    const response = await api.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting quick link:", error);
    throw error;
  }
};

export const recordQuickLinkClick = async (uid) => {
  try {
    const response = await api.post(`${API_URL}/${uid}/click`);
    return response.data;
  } catch (error) {
    console.error("Error recording quick link click:", error);
    // Don't block user navigation if click tracking fails
    return null;
  }
};
