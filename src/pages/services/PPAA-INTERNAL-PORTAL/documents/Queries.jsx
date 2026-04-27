import api from "../../../../api";
import { clientForPortalFileDownload } from "../../../../portalPublicApi";

const API_URL = `/api/internal-portal/documents`;
const CATEGORIES_URL = `/api/internal-portal/document-categories`;

export const getDocuments = async ({ uid = "", search = "", category = "", pagination = {} }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    if (pagination.page) params.append("page", pagination.page);
    if (pagination.page_size) params.append("page_size", pagination.page_size);

    const url = uid ? `${API_URL}/${uid}` : `${API_URL}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
};

export const getDocumentCategories = async ({ activeOnly = false } = {}) => {
  try {
    const params = activeOnly ? "?active_only=true" : "";
    const response = await api.get(`${CATEGORIES_URL}${params}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const createUpdateDocument = async (formData) => {
  try {
    const url = formData.uid ? `${API_URL}/${formData.uid}` : API_URL;
    const method = formData.uid ? "put" : "post";
    const response = await api[method](url, formData);
    return response.data;
  } catch (error) {
    console.error("Error saving document:", error);
    throw error;
  }
};

export const deleteDocument = async (uid) => {
  try {
    const response = await api.delete(`${API_URL}/${uid}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

/**
 * Streams via Django storage. Guests may download published documents; valid JWT unlocks drafts for staff.
 */
export const downloadPortalDocument = async (uid, fallbackFilename = "document") => {
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

