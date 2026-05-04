import api from "../../../../api";

const API_URL = `/api/internal-portal/audit-logs`;

export const getAuditLogs = async ({ uid = "", search = "", pagination = {}, filters = {} }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);
    if (filters.model_name) params.append("model_name", filters.model_name);
    if (filters.action) params.append("action", filters.action);
    if (filters.user) params.append("user", filters.user);
    if (filters.department) params.append("department", filters.department);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};

