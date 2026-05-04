import api from "../../../../api";
import { clientForPortalFileDownload } from "../../../../portalPublicApi";

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

/** Download via public-capable client (guests OK; valid JWT still sent for staff-only attachments). */
export const downloadPortalAnnouncement = async (uid, fallbackFilename = "attachment") => {
  const response = await clientForPortalFileDownload().get(`${API_URL}/${uid}/download`, {
    responseType: "blob",
  });
  let filename = fallbackFilename;
  const cd = response.headers["content-disposition"] || response.headers["Content-Disposition"];
  if (cd) {
    const utf8 = /filename\*=UTF-8''([^;\s]+)/i.exec(cd);
    const plain = /filename="([^"]+)"/i.exec(cd);
    if (utf8?.[1]) {
      try {
        filename = decodeURIComponent(utf8[1].trim());
      } catch {
        filename = utf8[1].trim();
      }
    } else if (plain?.[1]) {
      filename = plain[1];
    }
  }
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

