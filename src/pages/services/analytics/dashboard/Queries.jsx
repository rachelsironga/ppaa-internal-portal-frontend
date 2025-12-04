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

export const analyticsService = {
    getAllDashboardData: async (filters = {}) => {
        try {
            const params = {};
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            if (filters.period) params.period = filters.period;

            const [dashboard, patientTrends, paymentDistribution, blockClinicDistribution] = await Promise.all([
                api.get(`${ANALYTICS_URL}/dashboard`, config),
                api.get(`${ANALYTICS_URL}/dashboard/patient-trends`, setConfig(params)),
                api.get(`${ANALYTICS_URL}/dashboard/payment-distribution`, setConfig(params)),
                api.get(`${ANALYTICS_URL}/dashboard/block-clinic-distribution`, config)
            ]);

            const dashboardData = dashboard?.data?.data || dashboard?.data || {};
            
            return {
                overview: dashboardData.overview || {},
                monthly_summary: dashboardData.monthly_summary || {},
                yearly_summary: dashboardData.yearly_summary || {},
                patient_trends: patientTrends?.data?.data || patientTrends?.data || [],
                payment_distribution: paymentDistribution?.data?.data || paymentDistribution?.data || [],
                block_clinic_distribution: blockClinicDistribution?.data?.data || blockClinicDistribution?.data || []
            };
        } catch (error) {
            console.error('Analytics Dashboard Error:', error);
            throw error;
        }
    },

    getDashboard: async () => {
        try {
            const response = await api.get(`${ANALYTICS_URL}/dashboard`, config);
            return response.data;
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            throw error;
        }
    },

    getPatientTrends: async (filters = {}) => {
        try {
            const params = {};
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            if (filters.period) params.period = filters.period;
            
            const response = await api.get(
                `${ANALYTICS_URL}/dashboard/patient-trends`,
                setConfig(params)
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching patient trends:", error);
            throw error;
        }
    },

    getPaymentDistribution: async (filters = {}) => {
        try {
            const params = {};
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            
            const response = await api.get(
                `${ANALYTICS_URL}/dashboard/payment-distribution`,
                setConfig(params)
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching payment distribution:", error);
            throw error;
        }
    },

    getBlockClinicDistribution: async () => {
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
    },

    getClinicVolumes: async (filters = {}) => {
        try {
            const params = {};
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            
            const response = await api.get(
                `${ANALYTICS_URL}/dashboard/clinic-volumes`,
                setConfig(params)
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching clinic volumes:", error);
            throw error;
        }
    },

    getRecentAttendance: async (limit = 10) => {
        try {
            const response = await api.get(
                `${ANALYTICS_URL}/attendances`,
                setConfig({ page_size: limit, paginated: true })
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching recent attendance:", error);
            throw error;
        }
    },

    getClinics: async () => {
        try {
            const response = await api.get(
                `${ANALYTICS_URL}/clinics`,
                setConfig({ paginated: false })
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching clinics:", error);
            throw error;
        }
    },

    getBlocks: async () => {
        try {
            const response = await api.get(
                `${ANALYTICS_URL}/blocks`,
                setConfig({ paginated: false })
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching blocks:", error);
            throw error;
        }
    },

    getPaymentModes: async () => {
        try {
            const response = await api.get(
                `${ANALYTICS_URL}/payment-modes`,
                setConfig({ paginated: false })
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching payment modes:", error);
            throw error;
        }
    }
};

export default analyticsService;
