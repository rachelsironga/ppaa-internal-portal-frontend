import api from "../../../../api";

const API_URL = `/api/internal-portal/positional-levels`;

export const getPositionalLevels = async ({ uid = "", search = "", pagination = {}, is_active = null }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);
    if (is_active !== null) params.append("is_active", is_active);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching positional levels:", error);
    throw error;
  }
};

export const createUpdatePositionalLevel = async (formData) => {
  try {
    // Backend uses POST for both create and update (checks for uid in body)
    const response = await api.post(API_URL, formData);
    return response.data;
  } catch (error) {
    console.error("Error saving positional level:", error);
    throw error;
  }
};

export const deletePositionalLevel = async (uid) => {
  try {
    const response = await api.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting positional level:", error);
    throw error;
  }
};

