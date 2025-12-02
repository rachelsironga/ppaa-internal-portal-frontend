import { API_BASE_URL } from "../../../../Costants";
import api from "../../../../api";

const ANALYTICS_URL = `${API_BASE_URL}/api/analytical`;

const config = {
    headers: {
        "Content-Type": "application/json",
    },
};

const setConfig = (params = {}) => ({
    headers: { "Content-Type": "application/json" },
    params: { ...params },
});

export const getDashboardSummary = async () => {
    try {
        const response = await api.get(`${ANALYTICS_URL}/dashboard`, config);
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        throw error;
    }
};

export const getPatientTrends = async ({ period = "monthly", date_from = "", date_to = "" } = {}) => {
    try {
        const params = { period };
        if (date_from) params.date_from = date_from;
        if (date_to) params.date_to = date_to;
        
        const response = await api.get(
            `${ANALYTICS_URL}/dashboard/patient-trends`,
            setConfig(params)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching patient trends:", error);
        throw error;
    }
};

export const getPaymentDistribution = async ({ date_from = "", date_to = "" } = {}) => {
    try {
        const params = {};
        if (date_from) params.date_from = date_from;
        if (date_to) params.date_to = date_to;
        
        const response = await api.get(
            `${ANALYTICS_URL}/dashboard/payment-distribution`,
            setConfig(params)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching payment distribution:", error);
        throw error;
    }
};

export const getBlockClinicDistribution = async () => {
    try {
        const response = await api.get(
            `${ANALYTICS_URL}/dashboard/block-clinic-distribution`,
            config
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching block clinic distribution:", error);
        throw error;
    }
};

export const getClinicVolumes = async ({ date_from = "", date_to = "", clinic = "" } = {}) => {
    try {
        const params = {};
        if (date_from) params.date_from = date_from;
        if (date_to) params.date_to = date_to;
        if (clinic) params.clinic = clinic;
        
        const response = await api.get(
            `${ANALYTICS_URL}/dashboard/clinic-volumes`,
            setConfig(params)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching clinic volumes:", error);
        throw error;
    }
};

export const getClinics = async ({ search = "", pagination = {} } = {}) => {
    try {
        const response = await api.get(
            `${ANALYTICS_URL}/clinics${search !== "" ? `?search=${search}` : ""}`,
            setConfig(pagination)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching clinics:", error);
        throw error;
    }
};

export const getClinicGrowthTrends = async ({ current_month = "", previous_month = "" } = {}) => {
    try {
        const params = {};
        if (current_month) params.current_month = current_month;
        if (previous_month) params.previous_month = previous_month;
        
        const response = await api.get(
            `${ANALYTICS_URL}/dashboard/clinic-growth-trends`,
            setConfig(params)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching clinic growth trends:", error);
        throw error;
    }
};

export const getDepartmentClinicComparison = async ({ date_from = "", date_to = "" } = {}) => {
    try {
        const params = {};
        if (date_from) params.date_from = date_from;
        if (date_to) params.date_to = date_to;
        
        const response = await api.get(
            `${ANALYTICS_URL}/dashboard/department-clinic-comparison`,
            setConfig(params)
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching department clinic comparison:", error);
        throw error;
    }
};
