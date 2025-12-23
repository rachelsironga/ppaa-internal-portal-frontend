import api from "../../../../api";

const API_BASE = `/api`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

// ============ REFERRALS ============

export const getReferrals = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/external-referral`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching referrals:", error);
        throw error;
    }
};

export const getReferralDetail = async (uid) => {
    try {
        const response = await api.get(`${API_BASE}/referrals/${uid}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching referral detail:", error);
        throw error;
    }
};

export const createReferral = async (referralData) => {
    try {
        const response = await api.post(`${API_BASE}/referrals/create`, referralData, config);
        return response.data;
    } catch (error) {
        console.error("Error creating referral:", error);
        throw error;
    }
};

export const updateReferral = async (uid, referralData) => {
    try {
        const response = await api.put(`${API_BASE}/referrals/${uid}/update`, referralData, config);
        return response.data;
    } catch (error) {
        console.error("Error updating referral:", error);
        throw error;
    }
};

export const deleteReferral = async (uid) => {
    try {
        const response = await api.delete(`${API_BASE}/referrals/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting referral:", error);
        throw error;
    }
};

export const searchReferrals = async (searchTerm, params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/referrals`, {
            params: { search: searchTerm, ...params }
        });
        return response.data;
    } catch (error) {
        console.error("Error searching referrals:", error);
        throw error;
    }
};

// ============ FACILITIES ============

export const getFacilities = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/facilities`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching facilities:", error);
        throw error;
    }
};

// ============ DIAGNOSES ============

export const getDiagnoses = async (params = {}) => {
    try {
        const response = await api.get(`${API_BASE}/diagnoses`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching diagnoses:", error);
        throw error;
    }
};

// ============ PATIENT SEARCH (WIZARA) ============

export const searchPatientByIdentifier = async (identifierType, identifierValue) => {
    try {
        const response = await api.get(`${API_BASE}/wizara/search`, {
            params: {
                identifier_type: identifierType,
                identifier_value: identifierValue,
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error searching patient:", error);
        throw error;
    }
};

export const importPatientReferral = async (patientData) => {
    try {
        const response = await api.post(`${API_BASE}/wizara/import`, patientData, config);
        return response.data;
    } catch (error) {
        console.error("Error importing patient referral:", error);
        throw error;
    }
};
