import api from "../../../api";

const API_BASE = "/api/performance-dashboard";

// Financial Years (Setup & Configuration)
export const getFinancialYears = async (uid = "") => {
  const url = uid ? `${API_BASE}/financial-years/${uid}` : `${API_BASE}/financial-years`;
  const response = await api.get(url);
  return response.data;
};

export const createUpdateFinancialYear = async (formData) => {
  const url = formData.uid
    ? `${API_BASE}/financial-years/${formData.uid}`
    : `${API_BASE}/financial-years`;
  const method = formData.uid ? "put" : "post";
  const response = await api[method](url, formData);
  return response.data;
};

export const deleteFinancialYear = async (uid) => {
  const response = await api.delete(`${API_BASE}/financial-years/${uid}`);
  return response.data;
};

export const getObjectives = async ({
  uid = "",
  search = "",
  financial_year = "",
  status = "",
  pagination = {},
}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (financial_year) params.append("financial_year", financial_year);
  if (status) params.append("status", status);
  if (pagination.page) params.append("page", pagination.page);
  if (pagination.page_size) params.append("page_size", pagination.page_size);
  const url = uid
    ? `${API_BASE}/objectives/${uid}`
    : `${API_BASE}/objectives${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

export const createUpdateObjective = async (formData) => {
  const url = formData.uid
    ? `${API_BASE}/objectives/${formData.uid}`
    : `${API_BASE}/objectives`;
  const method = formData.uid ? "put" : "post";
  const response = await api[method](url, formData);
  return response.data;
};

export const deleteObjective = async (uid) => {
  const response = await api.delete(`${API_BASE}/objectives/${uid}`);
  return response.data;
};

export const getTargets = async ({
  uid = "",
  objective = "",
  search = "",
  financial_year = "",
  pagination = {},
}) => {
  const params = new URLSearchParams();
  if (objective) params.append("objective", objective);
  if (search) params.append("search", search);
  if (financial_year) params.append("financial_year", financial_year);
  if (pagination.page) params.append("page", pagination.page);
  if (pagination.page_size) params.append("page_size", pagination.page_size);
  const url = uid
    ? `${API_BASE}/targets/${uid}`
    : `${API_BASE}/targets${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

export const createUpdateTarget = async (formData) => {
  const url = formData.uid
    ? `${API_BASE}/targets/${formData.uid}`
    : `${API_BASE}/targets`;
  const method = formData.uid ? "put" : "post";
  const response = await api[method](url, formData);
  return response.data;
};

export const deleteTarget = async (uid) => {
  const response = await api.delete(`${API_BASE}/targets/${uid}`);
  return response.data;
};

// SPISM: assign responsible officer to a target
export const assignTargetOfficer = async (uid, responsible_officer_id) => {
  const response = await api.post(`${API_BASE}/targets/${uid}/assign-officer`, {
    responsible_officer_id,
  });
  return response.data;
};

export const getSpismPerformanceOfficers = async ({ search = "" } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  const url = `${API_BASE}/performance-officers${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

export const getActivities = async ({
  uid = "",
  target = "",
  search = "",
  pagination = {},
}) => {
  const params = new URLSearchParams();
  if (target) params.append("target", target);
  if (search) params.append("search", search);
  if (pagination.page) params.append("page", pagination.page);
  if (pagination.page_size) params.append("page_size", pagination.page_size);
  const url = uid
    ? `${API_BASE}/activities/${uid}`
    : `${API_BASE}/activities${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

export const createUpdateActivity = async (formData) => {
  const url = formData.uid
    ? `${API_BASE}/activities/${formData.uid}`
    : `${API_BASE}/activities`;
  const method = formData.uid ? "put" : "post";
  const response = await api[method](url, formData);
  return response.data;
};

export const deleteActivity = async (uid) => {
  const response = await api.delete(`${API_BASE}/activities/${uid}`);
  return response.data;
};

export const getDashboardSummary = async (financial_year = "") => {
  const params = financial_year ? `?financial_year=${financial_year}` : "";
  const response = await api.get(`${API_BASE}/summary${params}`);
  return response.data;
};

export const getPerformanceAnalytics = async (financial_year = "") => {
  const params = financial_year ? `?financial_year=${encodeURIComponent(financial_year)}` : "";
  const response = await api.get(`${API_BASE}/analytics${params}`);
  return response.data;
};

// Quarterly data
export const getQuarterlyData = async ({ activity = "", financial_year = "", pagination = {} }) => {
  const params = new URLSearchParams();
  if (activity) params.append("activity", activity);
  if (financial_year) params.append("financial_year", financial_year);
  if (pagination.page) params.append("page", pagination.page);
  if (pagination.page_size) params.append("page_size", pagination.page_size);
  const url = `${API_BASE}/quarterly-data${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

export const createUpdateQuarterlyData = async (formData) => {
  const url = formData.uid
    ? `${API_BASE}/quarterly-data/${formData.uid}`
    : `${API_BASE}/quarterly-data`;
  const method = formData.uid ? "put" : "post";
  const response = await api[method](url, formData);
  return response.data;
};

// KPI actuals
export const getKpiActuals = async ({ target = "", financial_year = "", pagination = {} }) => {
  const params = new URLSearchParams();
  if (target) params.append("target", target);
  if (financial_year) params.append("financial_year", financial_year);
  if (pagination.page) params.append("page", pagination.page);
  if (pagination.page_size) params.append("page_size", pagination.page_size);
  const url = `${API_BASE}/kpi-actuals${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

export const createUpdateKpiActual = async (formData) => {
  const url = formData.uid
    ? `${API_BASE}/kpi-actuals/${formData.uid}`
    : `${API_BASE}/kpi-actuals`;
  const method = formData.uid ? "put" : "post";
  const response = await api[method](url, formData);
  return response.data;
};

// Activity documents
export const getActivityDocuments = async (activity_uid) => {
  const url = `${API_BASE}/activity-documents?activity=${activity_uid}`;
  const response = await api.get(url);
  return response.data;
};

export const uploadActivityDocument = async (payload) => {
  const response = await api.post(`${API_BASE}/activity-documents`, payload);
  return response.data;
};

export const updateActivityDocument = async (uid, payload) => {
  const response = await api.put(`${API_BASE}/activity-documents/${uid}`, payload);
  return response.data;
};

export const deleteActivityDocument = async (uid) => {
  const response = await api.delete(`${API_BASE}/activity-documents/${uid}`);
  return response.data;
};

// Approval (action: 'approve' | 'return', comment required for return)
export const objectiveApproval = async (uid, { action, comment = "" }) => {
  const response = await api.post(`${API_BASE}/objectives/${uid}/approval`, { action, comment });
  return response.data;
};

// Structured hierarchical submission: submit objective + all its targets as one package
export const submitObjectivePackage = async (uid) => {
  const response = await api.post(`${API_BASE}/objectives/${uid}/submit-package`);
  return response.data;
};

export const targetApproval = async (uid, { action, comment = "" }) => {
  const response = await api.post(`${API_BASE}/targets/${uid}/approval`, { action, comment });
  return response.data;
};

export const activityApproval = async (uid, { action, comment = "" }) => {
  const response = await api.post(`${API_BASE}/activities/${uid}/approval`, { action, comment });
  return response.data;
};

export const activityImplementationApproval = async (uid, { action, comment = "", quarter = null }) => {
  const body = { action, comment: comment || "" };
  if (quarter != null && quarter !== "" && quarter !== "all") {
    body.quarter = Number(quarter);
  }
  const response = await api.post(`${API_BASE}/activities/${uid}/implementation-approval`, body);
  return response.data;
};

// Implementation: list approved activities for submission + submit implementation
export const getImplementationActivities = async (paramsOrYear = "") => {
  const p =
    typeof paramsOrYear === "string"
      ? { financial_year: paramsOrYear }
      : paramsOrYear || {};
  const qs = new URLSearchParams();
  if (p.financial_year) qs.append("financial_year", p.financial_year);
  if (p.search) qs.append("search", p.search);
  if (p.quarter != null && p.quarter !== "") qs.append("quarter", String(p.quarter));
  if (p.queue) qs.append("queue", p.queue);
  if (p.submitted_only) qs.append("submitted_only", "true");
  if (p.implementation_approval_filter) {
    qs.append("implementation_approval_filter", p.implementation_approval_filter);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const response = await api.get(`${API_BASE}/implementation-activities${suffix}`);
  return response.data;
};

export const getImplementationTargets = async (financial_year = "") => {
  const params = financial_year ? `?financial_year=${encodeURIComponent(financial_year)}` : "";
  const response = await api.get(`${API_BASE}/implementation-targets${params}`);
  return response.data;
};

export const submitActivityImplementation = async (activity_uid, quarter = null) => {
  const body = quarter != null ? { quarter } : {};
  const response = await api.post(`${API_BASE}/activities/${activity_uid}/submit-implementation`, body);
  return response.data;
};

// SPISM: Pending approvals
export const getPendingApprovals = async ({ entity_type = "", status = "PENDING", financial_year = "" } = {}) => {
  const params = new URLSearchParams();
  if (entity_type) params.append("entity_type", entity_type);
  if (status) params.append("status", status);
  if (financial_year) params.append("financial_year", financial_year);
  const url = `${API_BASE}/pending-approvals${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

// SPISM: Audit logs
export const getPerformanceAuditLogs = async ({ entity_type = "", entity_id = "", pagination = {} } = {}) => {
  const params = new URLSearchParams();
  if (entity_type) params.append("entity_type", entity_type);
  if (entity_id) params.append("entity_id", entity_id);
  if (pagination.page) params.append("page", pagination.page);
  if (pagination.page_size) params.append("page_size", pagination.page_size);
  const url = `${API_BASE}/audit-logs${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await api.get(url);
  return response.data;
};

// SPISM: Post conversation comment
export const postConversationComment = async ({ entity_type, entity_id, comment }) => {
  const response = await api.post(`${API_BASE}/audit-logs`, {
    entity_type,
    entity_id,
    comment: (comment || "").trim(),
  });
  return response.data;
};

// SPISM: Reports (quarterly | annual | kpi | objective)
export const getSPISMReport = async (report_type = "quarterly", financial_year) => {
  if (!financial_year) return null;
  const params = new URLSearchParams({ report_type, financial_year });
  const response = await api.get(`${API_BASE}/reports?${params.toString()}`);
  return response.data;
};

// SPISM: Config (system name, roles)
export const getSPISMConfig = async () => {
  const response = await api.get(`${API_BASE}/config`);
  return response.data;
};
