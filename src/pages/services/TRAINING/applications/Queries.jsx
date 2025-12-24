import axios from "axios";
import api from "../../../../api";

const API_BASE = `/api/training`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const multipartConfig = {
    headers: {
        "Content-Type": "multipart/form-data",
    },
};

// ============ STUDENTS ============

export const getStudents = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/students`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};

export const getStudentDetail = async (uid) => {
    try {
        const response = await api.get(`${API_BASE}/students/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching student detail:", error);
        throw error;
    }
};

export const createStudent = async (studentData) => {
    try {
        const response = await api.post(`${API_BASE}/students/create`, studentData, multipartConfig);
        return response.data;
    } catch (error) {
        console.error("Error creating student:", error);
        throw error;
    }
};

export const updateStudent = async (uid, studentData) => {
    try {
        const response = await api.put(`${API_BASE}/students/${uid}/update`, studentData, multipartConfig);
        return response.data;
    } catch (error) {
        console.error("Error updating student:", error);
        throw error;
    }
};

export const deleteStudent = async (uid) => {
    try {
        const response = await api.delete(`${API_BASE}/students/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting student:", error);
        throw error;
    }
};

export const importStudents = async (formData) => {
    try {
        const response = await api.post(`${API_BASE}/students/import`, formData, multipartConfig);
        return response.data;
    } catch (error) {
        console.error("Error importing students:", error);
        throw error;
    }
};

export const searchStudents = async (searchTerm, params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/students`, {
            params: { search: searchTerm, ...params }
        });
        return response.data;
    } catch (error) {
        console.error("Error searching students:", error);
        throw error;
    }
};

// ============ AFFILIATIONS ============

export const getAffiliations = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/affiliations`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching affiliations:", error);
        throw error;
    }
};

export const createAffiliation = async (affiliationData) => {
    try {
        const response = await api.post(`${API_BASE}/affiliations/create`, affiliationData, config);
        return response.data;
    } catch (error) {
        console.error("Error creating affiliation:", error);
        throw error;
    }
};

export const updateAffiliation = async (uid, affiliationData) => {
    try {
        const response = await api.put(`${API_BASE}/affiliations/${uid}/update`, affiliationData, config);
        return response.data;
    } catch (error) {
        console.error("Error updating affiliation:", error);
        throw error;
    }
};

export const deleteAffiliation = async (uid) => {
    try {
        const response = await api.delete(`${API_BASE}/affiliations/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting affiliation:", error);
        throw error;
    }
};

// ============ APPLICATIONS ============

export const getApplications = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/applications`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching applications:", error);
        throw error;
    }
};

export const getApplicationDetail = async (uid) => {
    try {
        const response = await api.get(`${API_BASE}/applications/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching application detail:", error);
        throw error;
    }
};

export const createApplication = async (applicationData) => {
    try {
        const isFormData = applicationData instanceof FormData;
        const response = await api.post(
            `${API_BASE}/applications/create`, 
            applicationData, 
            isFormData ? multipartConfig : config
        );
        return response.data;
    } catch (error) {
        console.error("Error creating application:", error);
        throw error;
    }
};

export const updateApplication = async (uid, applicationData) => {
    try {
        const isFormData = applicationData instanceof FormData;
        const response = await api.put(
            `${API_BASE}/applications/${uid}/update`, 
            applicationData, 
            isFormData ? multipartConfig : config
        );
        return response.data;
    } catch (error) {
        console.error("Error updating application:", error);
        throw error;
    }
};

export const deleteApplication = async (uid) => {
    try {
        const response = await api.delete(`${API_BASE}/applications/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting application:", error);
        throw error;
    }
};

// ============ INSTITUTIONS ============

export const getInstitutions = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/institutions`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching institutions:", error);
        throw error;
    }
};

// ============ MOUS ============

export const getMOUs = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/mous`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching MOUs:", error);
        throw error;
    }
};

// ============ TRAINING BATCHES ============

export const getTrainingBatches = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/training-batches`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching training batches:", error);
        throw error;
    }
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

// ============ DEPARTMENT ALLOCATIONS ============

export const getDepartmentAllocations = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/department-allocations`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching department allocations:", error);
        throw error;
    }
};
