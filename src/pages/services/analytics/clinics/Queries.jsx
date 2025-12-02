import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const CLINICS_API_URL = `${API_BASE_URL}/api/analytical/clinics`;
const BLOCKS_API_URL = `${API_BASE_URL}/api/analytical/blocks`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const setConfig = (pagination = {}) => ({
    headers: { "Content-Type": "application/json" },
    params: { ...pagination },
});

export const getClinics = async ({
    uid = "",
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${CLINICS_API_URL}${uid === "" ? (search !== "" ? `?search=${search}` : "") : `/${uid}`}`,
            uid === "" ? setConfig(pagination) : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching clinics:", error);
        throw error;
    }
};

export const createUpdateClinic = async (clinicData) => {
    try {
        const url = clinicData.uid 
            ? `${CLINICS_API_URL}/${clinicData.uid}/update` 
            : `${CLINICS_API_URL}/create`;
        
        const response = await api.post(url, clinicData, config);
        return response.data;
    } catch (error) {
        console.error(`Error while ${clinicData.uid ? 'updating' : 'creating'} clinic:`, error);
        throw error;
    }
};

export const deleteClinic = async (uid) => {
    try {
        const response = await api.delete(`${CLINICS_API_URL}/${uid}/delete`);
        return response.data;
    } catch (error) {
        console.error("Error deleting clinic:", error);
        throw error;
    }
};

export const getBlocks = async ({
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${BLOCKS_API_URL}${search !== "" ? `?search=${search}` : ""}`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching blocks:", error);
        throw error;
    }
};

export const getDepartments = async ({
    search = "",
    pagination = {},
}) => {
    try {
        const response = await api.get(
            `${API_BASE_URL}/api/departments${search !== "" ? `?search=${search}` : ""}`,
            setConfig({ ...pagination })
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching departments:", error);
        throw error;
    }
};

export const importClinics = async (importData) => {
    try {
        const response = await api.post(`${CLINICS_API_URL}/import`, importData, config);
        return response.data;
    } catch (error) {
        console.error("Error importing clinics:", error);
        throw error;
    }
};
