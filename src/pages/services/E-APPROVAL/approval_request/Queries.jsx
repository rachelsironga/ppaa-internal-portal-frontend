import axios from "axios";
import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const API_URL = `${API_BASE_URL}/api/approval-request`;

const config = {
  headers: {
    "Content-Type": "application/json",
  },
};

const setConfig = (pagination = {}) => ({
  headers: { "Content-Type": "application/json" },
  params: { ...pagination },
});

export const getApprovalRequests = async ({
  uid = "",
  search = "",
  pagination = {},
}) => {
  try {
    const response = await api.get(
      `${API_URL}${
        uid == "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`
      }`,
      setConfig(pagination)
    );
    return response.data;
  } catch (error) {}
};


export const createUpdateApprovalRequest = async (formData) => {
  try {
    const response = await api.post(API_URL, formData, config);
    return response.data;
  } catch (error) {
    console.error(`Error while changing Approval Request: `, error);
    throw error;
  }
};

export const deleteApprovalRequest = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting Approval Request:", error);
    throw error;
  }
};

export const approveRejectRequest = async (formData) => {
  try {
    const response = await api.post(
      `${API_BASE_URL}/api/approve-reject-request`,
      formData,
      config
    );
    return response.data;
  } catch (error) {
    console.error(`Error while changing Approval Request: `, error);
    throw error;
  }
};

export const getJeevaRolePerm = async ({ pagination = {} }) => {
  try {
    const response = await api.get(
      `${API_BASE_URL}/api/jeeva-role-perm-list`,
      setConfig(pagination)
    );
    return response.data;
  } catch (error) {
    console.error("No Jeeva Module And permission found:", error);
    throw error;
  }
};

export const getJeevaRolePermByCode = async (codename) => {
  try {
    const response = await api.get(
      `${API_BASE_URL}/api/jeeva-role-perm-by-code/${codename}`,
      setConfig()
    );
    return response.data;
  } catch (error) {
    console.error("No Jeeva Module And permission found:", error);
    throw error;
  }
};

export const getRequestApprovalSteps = async ({
  request_uid = "",
  pagination = {},
}) => {
  try {
    const response = await api.get(
      `${API_BASE_URL}/api/approval-request-step/${request_uid}`,

      setConfig(pagination)
    );
    return response.data;
  } catch (error) {
    console.error("No Jeeva Module And permission found:", error);
    throw error;
  }
};

export const getApprovalRequestActing = async ({ filter = {} }) => {
  try {
    const response = await api.get(
      `${API_BASE_URL}/api/get-acting-user`,
      setConfig(filter)
    );
    return response.data;
  } catch (error) {}
};