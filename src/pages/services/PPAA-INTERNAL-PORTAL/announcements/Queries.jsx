import api from "../../../../api";

const API_URL = `/api/internal-portal/announcements`;

export const getAnnouncements = async ({ uid = "", search = "", pagination = {} }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching announcements:", error);
    throw error;
  }
};

export const createUpdateAnnouncement = async (formData) => {
  try {
    if (formData.uid) {
      // Update existing announcement
      const response = await api.put(`${API_URL}/${formData.uid}`, formData);
      return response.data;
    } else {
      // Create new announcement
      const response = await api.post(API_URL, formData);
      return response.data;
    }
  } catch (error) {
    console.error("Error saving announcement:", error);
    throw error;
  }
};

export const deleteAnnouncement = async (uid) => {
  try {
    const response = await api.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting announcement:", error);
    throw error;
  }
};

