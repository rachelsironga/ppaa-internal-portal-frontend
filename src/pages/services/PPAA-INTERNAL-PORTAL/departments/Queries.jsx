import api from "../../../../api";

const API_URL = `/api/internal-portal/departments`;

export const getDepartments = async ({ uid = "", search = "", pagination = {} }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};

export const createUpdateDepartment = async (formData) => {
  try {
    // Backend DepartmentView uses POST for both create and update (checks uid in body)
    const response = await api.post(API_URL, formData);
    return response.data;
  } catch (error) {
    console.error("Error saving department:", error);
    throw error;
  }
};

export const deleteDepartment = async (uid) => {
  try {
    const response = await api.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting department:", error);
    throw error;
  }
};

