import api from "../../../../api";

const API_URL = `/api/performance-dashboard/audit-logs`;

export const getSpismAuditLogs = async ({ uid = "", pagination = {}, filters = {} } = {}) => {
  const params = new URLSearchParams();
  if (pagination.page) params.append("page", pagination.page);
  if (pagination.page_size) params.append("page_size", pagination.page_size);
  if (filters.entity_type) params.append("entity_type", filters.entity_type);
  if (filters.entity_id) params.append("entity_id", filters.entity_id);
  if (filters.model_name) params.append("model_name", filters.model_name);
  if (filters.action) params.append("action", filters.action);

  const url = uid
    ? `${API_URL}/${uid}`
    : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

