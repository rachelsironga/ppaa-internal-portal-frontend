import api from "../../../../api";

const API_BASE = "/api/performance-dashboard";

/**
 * Fetch performance audit logs for approval history.
 * GET ?entity_type=&entity_id=&page=&page_size=&paginated=true
 */
export const getApprovalHistory = async ({
  entity_type = "",
  entity_id = "",
  pagination = {},
} = {}) => {
  const params = new URLSearchParams();
  if (entity_type) params.append("entity_type", entity_type);
  if (entity_id) params.append("entity_id", entity_id);
  if (pagination.page) params.append("page", pagination.page);
  if (pagination.page_size) params.append("page_size", pagination.page_size || 20);
  params.append("paginated", "true");
  const url = `${API_BASE}/audit-logs?${params.toString()}`;
  const response = await api.get(url);
  return response.data;
};
