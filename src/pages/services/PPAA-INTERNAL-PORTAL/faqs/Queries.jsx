import api from "../../../../api";

const API_URL = `/api/internal-portal/faqs`;

export const getFAQs = async ({ uid = "", search = "", pagination = {} }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    throw error;
  }
};

export const createUpdateFAQ = async (formData) => {
  try {
    if (formData.uid) {
      // Update existing FAQ
      const response = await api.put(`${API_URL}/${formData.uid}`, formData);
      return response.data;
    } else {
      // Create new FAQ
      const response = await api.post(API_URL, formData);
      return response.data;
    }
  } catch (error) {
    console.error("Error saving FAQ:", error);
    throw error;
  }
};

export const deleteFAQ = async (uid) => {
  try {
    const response = await api.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    throw error;
  }
};

