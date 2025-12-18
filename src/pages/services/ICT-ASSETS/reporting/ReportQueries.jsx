import { fetchData } from "../../../../utils/GlobalQueries.jsx";

export const reportService = {
    getAssetReports: async (params = {}) => {
        return fetchData({
            url: '/asset-reports',
            filter: params
        });
    },

    getMaintenanceReports: async (params = {}) => {
        return fetchData({
            url: '/maintenance-reports',
            filter: params
        });
    },

    getSoftwareReports: async (params = {}) => {
        return fetchData({
            url: '/software-reports',
            filter: params
        });
    },

    exportData: async (params = {}) => {
        return fetchData({
            url: '/export-data',
            filter: params
        });
    },

    getCategories: async () => {
        return fetchData({
            url: '/asset-categories'
        });
    },

    getLocations: async () => {
        return fetchData({
            url: '/asset-locations'
        });
    },

    getAssetStatuses: async () => {
        return fetchData({
            url: '/asset-statuses'
        });
    },

    getTechnicians: async () => {
        return fetchData({
            url: '/assets-technicians'
        });
    },

    getSoftwareCategories: async () => {
        return fetchData({
            url: '/asset-software-categories'
        });
    }
};

export default reportService;
