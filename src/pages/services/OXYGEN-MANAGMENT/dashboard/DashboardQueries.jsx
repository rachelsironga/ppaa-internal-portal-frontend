// ict_assets/services/dashboardService.js
import { fetchData } from "../../../../utils/GlobalQueries.jsx";

export const dashboardService = {
  getAllDashboardData: async () => {
    try {
      // Get main dashboard (contains summary, status_distribution, category_distribution, recent_activities)
      const dashboard = await fetchData({
        url: '/asset-dashboard',
      });

      // Get additional data in parallel
      const [
        maintenanceMetrics,
        assetTypeBreakdown,
        warrantyAlerts
      ] = await Promise.all([
        fetchData({ url: '/asset-dashboard/maintenance-metrics', }),
        fetchData({ url: '/asset-dashboard/asset-type-breakdown', }),
        fetchData({ url: '/asset-dashboard/warranty-alerts', })
      ]);

      return {
        ...dashboard,
        maintenance_metrics: maintenanceMetrics,
        asset_type_breakdown: assetTypeBreakdown,
        warranty_alerts: warrantyAlerts
      };
    } catch (error) {
      console.error('All Dashboard Data Error:', error);
      throw error;
    }
  },

  getDashboardSummary: async () => {
    return fetchData({ url: '/asset-dashboard', });
  },

  getMaintenanceMetrics: async () => {
    return fetchData({ url: '/asset-dashboard/maintenance-metrics', });
  },

  getAssetTypeBreakdown: async () => {
    return fetchData({ url: '/asset-dashboard/asset-type-breakdown', });
  },

  getWarrantyAlerts: async () => {
    return fetchData({ url: '/asset-dashboard/warranty-alerts', });
  }
};

export default dashboardService;