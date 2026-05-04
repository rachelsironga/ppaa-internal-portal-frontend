import api from "../../../../api";

const API_URL = `/api/internal-portal/document-categories`;

export const getDocumentCategoriesList = async ({ uid = "", search = "", pagination = {} }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching document categories:", error);
    throw error;
  }
};

export const createUpdateDocumentCategory = async (formData) => {
  try {
    const url = formData.uid ? `${API_URL}/${formData.uid}` : API_URL;
    const method = formData.uid ? "put" : "post";
    const response = await api[method](url, formData);
    return response.data;
  } catch (error) {
    console.error("Error saving document category:", error);
    throw error;
  }
};

export const deleteDocumentCategory = async (uid) => {
  try {
    const response = await api.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting document category:", error);
    throw error;
  }
};
