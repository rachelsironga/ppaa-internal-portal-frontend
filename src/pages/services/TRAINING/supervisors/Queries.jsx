import axios from "axios";
import api from "../../../../api";

const API_BASE = `/api/training`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

// ============ SUPERVISORS ============

export const getSupervisors = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/supervisors`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching supervisors:", error);
        throw error;
    }
};

export const getSupervisorDetail = async (uid) => {
    try {
        const response = await api.get(`${API_BASE}/supervisors/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching supervisor detail:", error);
        throw error;
    }
};

export const createSupervisor = async (supervisorData) => {
    try {
        const response = await api.post(`${API_BASE}/supervisors/create`, supervisorData, config);
        return response.data;
    } catch (error) {
        console.error("Error creating supervisor:", error);
        throw error;
    }
};

export const updateSupervisor = async (uid, supervisorData) => {
    try {
        const response = await api.put(`${API_BASE}/supervisors/${uid}/update`, supervisorData, config);
        return response.data;
    } catch (error) {
        console.error("Error updating supervisor:", error);
        throw error;
    }
};

export const deleteSupervisor = async (uid) => {
    try {
        const response = await api.delete(`${API_BASE}/supervisors/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting supervisor:", error);
        throw error;
    }
};

// ============ DEPARTMENTS ============

export const getDepartments = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/department-allocations`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching departments:", error);
        throw error;
    }
};
