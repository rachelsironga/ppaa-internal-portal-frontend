import api from "../../../api";
import { API_BASE_URL } from "../../../Costants";

const API_URL = `${API_BASE_URL}/api/reports`;
const config = { headers: { "Content-Type": "application/json" } };
const multipartConfig = { headers: { "Content-Type": "multipart/form-data" } };

// ==================== FINANCIAL YEARS ====================
export const getFinancialYears = async ({ uid, search, paginated = false } = {}) => {
  let url = `${API_URL}/financial-years`;
  const params = new URLSearchParams();
  
  if (uid) url = `${API_URL}/financial-years/${uid}`;
  if (search) params.append("search", search);
  if (paginated) params.append("paginated", "true");
  
  const queryString = params.toString();
  if (queryString && !uid) url += `?${queryString}`;
  
  const response = await api.get(url, config);
  return response.data;
};

export const createUpdateFinancialYear = async (data) => {
  const method = data.uid ? "put" : "post";
  const url = data.uid 
    ? `${API_URL}/financial-years/${data.uid}/update`
    : `${API_URL}/financial-years/create`;
  const response = await api[method](url, data, config);
  return response.data;
};

export const deleteFinancialYear = async (uid) => {
  const response = await api.delete(`${API_URL}/financial-years/${uid}/delete`, config);
  return response.data;
};

// ==================== FINANCIAL PERIODS (QUARTERS) ====================
export const getFinancialPeriods = async ({ financial_year_uid, period_type } = {}) => {
  let url = `${API_URL}/financial-periods`;
  const params = new URLSearchParams();
  
  if (financial_year_uid) params.append("financial_year_uid", financial_year_uid);
  if (period_type) params.append("period_type", period_type);
  
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;
  
  const response = await api.get(url, config);
  return response.data;
};

export const getQuartersByFinancialYear = async (financial_year_uid) => {
  const url = `${API_URL}/financial-years/${financial_year_uid}/periods`;
  const response = await api.get(url, config);
  return response.data;
};

// ==================== STAKEHOLDERS ====================
export const getStakeholders = async ({ uid, search, organization_type, paginated = false } = {}) => {
  let url = `${API_URL}/stakeholders`;
  const params = new URLSearchParams();
  
  if (uid) url = `${API_URL}/stakeholders/${uid}`;
  if (search) params.append("search", search);
  if (organization_type) params.append("organization_type", organization_type);
  if (paginated) params.append("paginated", "true");
  
  const queryString = params.toString();
  if (queryString && !uid) url += `?${queryString}`;
  
  const response = await api.get(url, config);
  return response.data;
};

export const createUpdateStakeholder = async (data) => {
  const method = data.uid ? "put" : "post";
  const url = data.uid 
    ? `${API_URL}/stakeholders/${data.uid}/update`
    : `${API_URL}/stakeholders/create`;
  const response = await api[method](url, data, config);
  return response.data;
};

export const deleteStakeholder = async (uid) => {
  const response = await api.delete(`${API_URL}/stakeholders/${uid}/delete`, config);
  return response.data;
};

// ==================== REPORT TYPES ====================
export const getReportTypes = async ({ uid, search, frequency, paginated = false } = {}) => {
  let url = `${API_URL}/report-types`;
  const params = new URLSearchParams();
  
  if (uid) url = `${API_URL}/report-types/${uid}`;
  if (search) params.append("search", search);
  if (frequency) params.append("frequency", frequency);
  if (paginated) params.append("paginated", "true");
  
  const queryString = params.toString();
  if (queryString && !uid) url += `?${queryString}`;
  
  const response = await api.get(url, config);
  return response.data;
};

export const createUpdateReportType = async (data) => {
  const method = data.uid ? "put" : "post";
  const url = data.uid 
    ? `${API_URL}/report-types/${data.uid}/update`
    : `${API_URL}/report-types/create`;
  const response = await api[method](url, data, config);
  return response.data;
};

export const deleteReportType = async (uid) => {
  const response = await api.delete(`${API_URL}/report-types/${uid}/delete`, config);
  return response.data;
};

// ==================== REPORT CATEGORIES ====================
export const getReportCategories = async ({ uid, search, paginated = false } = {}) => {
  let url = `${API_URL}/report-categories`;
  const params = new URLSearchParams();
  
  if (uid) url = `${API_URL}/report-categories/${uid}`;
  if (search) params.append("search", search);
  if (paginated) params.append("paginated", "true");
  
  const queryString = params.toString();
  if (queryString && !uid) url += `?${queryString}`;
  
  const response = await api.get(url, config);
  return response.data;
};

export const createUpdateReportCategory = async (data) => {
  const method = data.uid ? "put" : "post";
  const url = data.uid 
    ? `${API_URL}/report-categories/${data.uid}/update`
    : `${API_URL}/report-categories/create`;
  const response = await api[method](url, data, config);
  return response.data;
};

export const deleteReportCategory = async (uid) => {
  const response = await api.delete(`${API_URL}/report-categories/${uid}/delete`, config);
  return response.data;
};

// ==================== REPORTS ====================
export const getReports = async ({
  uid,
  search,
  status,
  priority,
  scope,
  deadline_state,
  financial_year_uid,
  report_type_uid,
  category_uid,
  department_uid,
  directorate_uid,
  stakeholder_uid,
  my_reports,
  deadline_from,
  deadline_to,
  ordering,
  paginated = false,
  page,
  page_size,
} = {}) => {
  let url = `${API_URL}/reports`;
  const params = new URLSearchParams();
  
  if (uid) url = `${API_URL}/reports/${uid}`;
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  if (priority) params.append("priority", priority);
  if (scope) params.append("scope", scope);
  if (deadline_state) params.append("deadline_state", deadline_state);
  if (financial_year_uid) params.append("financial_year_uid", financial_year_uid);
  if (report_type_uid) params.append("report_type_uid", report_type_uid);
  if (category_uid) params.append("category_uid", category_uid);
  if (department_uid) params.append("department_uid", department_uid);
  else if (directorate_uid) params.append("directorate_uid", directorate_uid);
  if (stakeholder_uid) params.append("stakeholder_uid", stakeholder_uid);
  if (my_reports) params.append("my_reports", my_reports);
  if (deadline_from) params.append("deadline_from", deadline_from);
  if (deadline_to) params.append("deadline_to", deadline_to);
  if (ordering) params.append("ordering", ordering);
  if (paginated) params.append("paginated", "true");
  if (page) params.append("page", page);
  if (page_size) params.append("page_size", page_size);
  
  const queryString = params.toString();
  if (queryString && !uid) url += `?${queryString}`;
  
  const response = await api.get(url, config);
  return response.data;
};

export const createReport = async (data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      if (Array.isArray(data[key])) {
        // FormData doesn't support arrays directly; append each value under same key.
        data[key].forEach((v) => {
          if (v !== null && v !== undefined && `${v}`.trim() !== "") {
            formData.append(key, v);
          }
        });
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  const response = await api.post(`${API_URL}/reports/create`, formData, multipartConfig);
  return response.data;
};

export const updateReport = async (uid, data) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      if (Array.isArray(data[key])) {
        data[key].forEach((v) => {
          if (v !== null && v !== undefined && `${v}`.trim() !== "") {
            formData.append(key, v);
          }
        });
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  const response = await api.put(`${API_URL}/reports/${uid}/update`, formData, multipartConfig);
  return response.data;
};

export const deleteReport = async (uid) => {
  const response = await api.delete(`${API_URL}/reports/${uid}/delete`, config);
  return response.data;
};

// Report Actions
export const updateReportStatus = async (uid, status, notes = "") => {
  const response = await api.post(`${API_URL}/reports/${uid}/status`, { status, notes }, config);
  return response.data;
};

export const submitReport = async (uid, data) => {
  const formData = new FormData();
  if (data.attachment) formData.append("attachment", data.attachment);
  if (data.notes) formData.append("notes", data.notes);
  if (data.financial_period_uid) {
    formData.append("financial_period_uid", data.financial_period_uid);
  }
  const response = await api.post(`${API_URL}/reports/${uid}/submit`, formData, multipartConfig);
  return response.data;
};

/** Get authenticated preview URL for viewing a report attachment in modal */
export const getReportAttachmentUrl = async (uid, financialPeriodUid = null) => {
  let url = `${API_URL}/reports/${uid}/preview`;
  if (financialPeriodUid) {
    url += `?financial_period_uid=${encodeURIComponent(financialPeriodUid)}`;
  }
  const response = await api.get(url, {
    responseType: "blob",
  });
  const blob = response.data;
  const contentType = response.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
    const text = await blob.text();
    const err = JSON.parse(text);
    throw new Error(err.message || "Preview failed");
  }

  return {
    status: 8000,
    data: {
      url: window.URL.createObjectURL(blob),
    },
  };
};

/** Download report attachment with security watermark (PDFs get watermark with download time, user, department) */
export const downloadReportAttachment = async (uid, filename = "report-document", financialPeriodUid = null) => {
  let apiUrl = `${API_URL}/reports/${uid}/download`;
  if (financialPeriodUid) {
    apiUrl += `?financial_period_uid=${encodeURIComponent(financialPeriodUid)}`;
  }
  const response = await api.get(apiUrl, {
    responseType: "blob",
  });
  const blob = response.data;
  const contentType = response.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
    const text = await blob.text();
    const err = JSON.parse(text);
    throw new Error(err.message || "Download failed");
  }
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename || "report-document";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};

export const updateReportProgress = async (uid, percentage, notes = "", financialPeriodUid = null) => {
  const body = { percentage, notes: notes || "" };
  if (financialPeriodUid) {
    body.financial_period_uid = financialPeriodUid;
  }
  const response = await api.post(`${API_URL}/reports/${uid}/progress`, body, config);
  return response.data;
};

export const reassignReport = async (uid, assigned_to_uid, notes = "") => {
  const response = await api.post(`${API_URL}/reports/${uid}/reassign`, { assigned_to_uid, notes }, config);
  return response.data;
};

// Report Comments
export const getReportComments = async (uid, paginated = false) => {
  let url = `${API_URL}/reports/${uid}/comments`;
  if (paginated) url += "?paginated=true";
  const response = await api.get(url, config);
  return response.data;
};

export const addReportComment = async (uid, message, parent_uid = null) => {
  const response = await api.post(`${API_URL}/reports/${uid}/comments`, { message, parent_uid }, config);
  return response.data;
};

export const deleteReportComment = async (reportUid, commentUid) => {
  const response = await api.delete(`${API_URL}/reports/${reportUid}/comments/${commentUid}/delete`, config);
  return response.data;
};

// Report Audit Trail
export const getReportAuditTrail = async (uid, paginated = false) => {
  let url = `${API_URL}/reports/${uid}/audit-trail`;
  if (paginated) url += "?paginated=true";
  const response = await api.get(url, config);
  return response.data;
};

// ==================== DASHBOARD ====================
export const getDashboardStats = async ({ financial_year_uid, department_uid, directorate_uid, scope, report_type_uid } = {}) => {
  let url = `${API_URL}/dashboard`;
  const params = new URLSearchParams();
  
  if (financial_year_uid) params.append("financial_year_uid", financial_year_uid);
  if (department_uid) params.append("department_uid", department_uid);
  else if (directorate_uid) params.append("directorate_uid", directorate_uid);
  if (scope) params.append("scope", scope);
  if (report_type_uid) params.append("report_type_uid", report_type_uid);
  
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;
  
  const response = await api.get(url, config);
  return response.data;
};

export const getDirectorateDashboard = async (directorate_uid, { financial_year_uid } = {}) => {
  let url = `${API_URL}/dashboard/directorate/${directorate_uid}`;
  if (financial_year_uid) url += `?financial_year_uid=${financial_year_uid}`;
  const response = await api.get(url, config);
  return response.data;
};

export const getDeadlineCalendar = async ({ start_date, end_date, department_uid, directorate_uid, financial_year_uid } = {}) => {
  let url = `${API_URL}/dashboard/calendar`;
  const params = new URLSearchParams();
  
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);
  if (department_uid) params.append("department_uid", department_uid);
  else if (directorate_uid) params.append("directorate_uid", directorate_uid);
  if (financial_year_uid) params.append("financial_year_uid", financial_year_uid);
  
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;
  
  const response = await api.get(url, config);
  return response.data;
};

// ==================== SETTINGS ====================
export const getReportSettings = async () => {
  const response = await api.get(`${API_URL}/settings`, config);
  return response.data;
};

export const updateReportSettings = async (data) => {
  const response = await api.put(`${API_URL}/settings`, data, config);
  return response.data;
};

// ==================== HELPER CONSTANTS ====================
export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "secondary" },
  { value: "pending", label: "Pending", color: "warning" },
  { value: "in_progress", label: "In Progress", color: "info" },
  { value: "submitted", label: "Submitted", color: "success" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "secondary" },
  { value: "medium", label: "Medium", color: "primary" },
  { value: "high", label: "High", color: "warning" },
  { value: "critical", label: "Critical", color: "danger" },
];

export const SCOPE_OPTIONS = [
  { value: "internal", label: "Internal", color: "info" },
  { value: "external", label: "External", color: "primary" },
];

export const DEADLINE_STATE_OPTIONS = [
  { value: "on_track", label: "On Track", color: "success", icon: "bx-check-circle" },
  { value: "due_soon", label: "Due Soon", color: "warning", icon: "bx-time" },
  { value: "due_today", label: "Due Today", color: "info", icon: "bx-calendar-event" },
  { value: "overdue", label: "Overdue", color: "danger", icon: "bx-error-circle" },
  { value: "completed", label: "Completed", color: "primary", icon: "bx-check-double" },
];

export const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "biannual", label: "Bi-Annual" },
  { value: "annual", label: "Annual" },
  { value: "adhoc", label: "Ad-hoc" },
];

export const ORGANIZATION_TYPE_OPTIONS = [
  { value: "government", label: "Government Agency" },
  { value: "regulatory", label: "Regulatory Body" },
  { value: "partner", label: "Partner Organization" },
  { value: "donor", label: "Donor/Funding Agency" },
  { value: "ngo", label: "NGO" },
  { value: "private", label: "Private Sector" },
  { value: "academic", label: "Academic Institution" },
  { value: "other", label: "Other" },
];

export const getStatusBadge = (status) => {
  const option = STATUS_OPTIONS.find(o => o.value === status);
  return option ? `badge bg-label-${option.color}` : "badge bg-label-secondary";
};

export const getPriorityBadge = (priority) => {
  const option = PRIORITY_OPTIONS.find(o => o.value === priority);
  return option ? `badge bg-label-${option.color}` : "badge bg-label-secondary";
};

export const getDeadlineStateBadge = (state) => {
  const option = DEADLINE_STATE_OPTIONS.find(o => o.value === state);
  return option ? `badge bg-${option.color}` : "badge bg-secondary";
};

// ==================== USER PROFILE INFO ====================
export const getUserProfileInfo = async () => {
  const response = await api.get(`${API_URL}/user-profile`, config);
  return response.data;
};

// ==================== DEPARTMENTS ====================
export const getDirectories = async ({ uid, search, paginated = false } = {}) => {
  let url = `${API_URL}/departments`;
  const params = new URLSearchParams();
  
  if (uid) url = `${API_URL}/departments/${uid}`;
  if (search) params.append("search", search);
  if (paginated) params.append("paginated", "true");
  
  const queryString = params.toString();
  if (queryString && !uid) url += `?${queryString}`;
  
  const response = await api.get(url, config);
  return response.data;
};

export const getDepartments = async ({ uid, search, paginated = false } = {}) => {
  let url = `${API_URL}/departments`;
  const params = new URLSearchParams();
  
  if (uid) url = `${API_URL}/departments/${uid}`;
  if (search) params.append("search", search);
  if (paginated) params.append("paginated", "true");
  
  const queryString = params.toString();
  if (queryString && !uid) url += `?${queryString}`;
  
  const response = await api.get(url, config);
  return response.data;
};
