import api from "../../../../api";
import { invalidateInternalPortalDashboardCaches } from "../../../../helpers/internalPortalDashboardCache";

const API_URL = `/api/internal-portal/events`;

/** datetime-local values → UTC ISO for Django (USE_TZ). */
function toApiDateTime(value) {
  if (value == null || value === "") return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
}

export const getEvents = async ({ uid = "", search = "", start_date = "", end_date = "", pagination = {} }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (start_date) params.append("start_date", start_date);
    if (end_date) params.append("end_date", end_date);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

export const createUpdateEvent = async (formData) => {
  try {
    const url = formData.uid ? `${API_URL}/${formData.uid}` : API_URL;
    const method = formData.uid ? "put" : "post";
    const payload = {
      ...formData,
      start_date: toApiDateTime(formData.start_date),
      end_date: toApiDateTime(formData.end_date),
    };
    const response = await api[method](url, payload);
    const result = response.data;
    if (result?.status === 200 || result?.status === 8000) {
      invalidateInternalPortalDashboardCaches();
    }
    return result;
  } catch (error) {
    console.error("Error saving event:", error);
    throw error;
  }
};

export const deleteEvent = async (uid) => {
  try {
    const response = await api.delete(`${API_URL}/${uid}`);
    const result = response.data;
    if (result?.status === 200 || result?.status === 8000) {
      invalidateInternalPortalDashboardCaches();
    }
    return result;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};


