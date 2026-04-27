import api from "../../../../api";

const API_URL = `/api/internal-portal/pr-flyers`;

export const getPrFlyersList = async ({ uid = "", search = "", pagination = {}, filters = "" }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);
    if (filters) params.append("filters", filters);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching PR flyers:", error);
    throw error;
  }
};

export const createUpdatePrFlyer = async (formData) => {
  try {
    const url = formData.uid ? `${API_URL}/${formData.uid}` : API_URL;
    const method = formData.uid ? "put" : "post";
    const response = await api[method](url, formData);
    return response.data;
  } catch (error) {
    console.error("Error saving PR flyer:", error);
    throw error;
  }
};

export const deletePrFlyer = async (uid) => {
  try {
    const response = await api.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting PR flyer:", error);
    throw error;
  }
};
