import api from "../../../../api";

const API_URL = `/api/internal-portal/todos`;

export const getTodosList = async ({ uid = "", search = "", pagination = {}, filters = {} }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.department) params.append("department", filters.department);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching todos:", error);
    throw error;
  }
};

export const createUpdateTodo = async (formData) => {
  try {
    const url = formData.uid ? `${API_URL}/${formData.uid}` : API_URL;
    const method = formData.uid ? "put" : "post";
    const response = await api[method](url, formData);
    return response.data;
  } catch (error) {
    console.error("Error saving todo:", error);
    throw error;
  }
};

export const deleteTodo = async (uid) => {
  try {
    const response = await api.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting todo:", error);
    throw error;
  }
};

