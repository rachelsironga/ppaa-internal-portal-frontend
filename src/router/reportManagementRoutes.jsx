import { Navigate, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";
import Dashboard from "../pages/services/REPORT-MANAGEMENT/dashboard/Dashboard";
import EdDashboard from "../pages/services/REPORT-MANAGEMENT/dashboard/EdDashboard";
import ReportsListPage from "../pages/services/REPORT-MANAGEMENT/reports/ReportsListPage";
import ReportDetailPage from "../pages/services/REPORT-MANAGEMENT/reports/ReportDetailPage";
import AuditTrailPage from "../pages/services/REPORT-MANAGEMENT/audit/AuditTrailPage";
import FinancialYearListPage from "../pages/services/REPORT-MANAGEMENT/setup/financial_years/FinancialYearListPage";
import StakeholderListPage from "../pages/services/REPORT-MANAGEMENT/setup/stakeholders/StakeholderListPage";
import StakeholderDetailPage from "../pages/services/REPORT-MANAGEMENT/setup/stakeholders/StakeholderDetailPage";
import ReportCategoryListPage from "../pages/services/REPORT-MANAGEMENT/setup/report_categories/ReportCategoryListPage";
import ReportTypeListPage from "../pages/services/REPORT-MANAGEMENT/setup/report_types/ReportTypeListPage";

const ReportsManagementEntryRedirect = () => {
  const roles = useSelector((state) => state.userReducer?.data?.groups || []);
  const normalized = roles.map((r) => String(r).toLowerCase());
  const institutionDash =
    normalized.includes("rms_report_manager") ||
    normalized.includes("rms_sys_admin") ||
    normalized.includes("admin");
  const landingPath = institutionDash
    ? "/report-management/dashboard/ed"
    : "/report-management/dashboard";

  return <Navigate to={landingPath} replace />;
};

export const reportManagementRoutes = (
  <>
    <Route
      path="/report-management"
      element={<ReportsManagementEntryRedirect />}
    />
    <Route
      path="/report-management/dashboard"
      element={
        <ProtectedRoute
          requiredPermissions={["view_rmsreport"]}
          requiredRoles={["RMS_DEPT_REPORTER", "RMS_SYS_ADMIN", "admin"]}
        >
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/dashboard/ed"
      element={
        <ProtectedRoute
          requiredPermissions={["view_rmsreport"]}
          requiredRoles={["RMS_REPORT_MANAGER", "RMS_SYS_ADMIN", "admin"]}
        >
          <EdDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/reports"
      element={
        <ProtectedRoute
          requiredPermissions={["view_rmsreport"]}
          requiredRoles={["RMS_REPORT_MANAGER", "RMS_SYS_ADMIN", "RMS_DEPT_REPORTER", "admin"]}
        >
          <ReportsListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/reports/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["view_rmsreport"]}
          requiredRoles={["RMS_REPORT_MANAGER", "RMS_SYS_ADMIN", "RMS_DEPT_REPORTER", "admin"]}
        >
          <ReportDetailPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/audit-trail"
      element={
        <ProtectedRoute
          requiredPermissions={["view_rmsreport"]}
          requiredRoles={["RMS_SYS_ADMIN", "admin"]}
        >
          <AuditTrailPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/setup/financial-years"
      element={
        <ProtectedRoute
          requiredPermissions={["view_rmsreport"]}
          requiredRoles={["RMS_SYS_ADMIN", "admin"]}
        >
          <FinancialYearListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/setup/stakeholders"
      element={
        <ProtectedRoute
          requiredPermissions={["view_rmsstakeholder"]}
          requiredRoles={["RMS_SYS_ADMIN", "admin"]}
        >
          <StakeholderListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/setup/stakeholders/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["view_rmsstakeholder"]}
          requiredRoles={["RMS_SYS_ADMIN", "admin"]}
        >
          <StakeholderDetailPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/setup/report-categories"
      element={
        <ProtectedRoute
          requiredPermissions={["view_rmsreportcategory"]}
          requiredRoles={["RMS_SYS_ADMIN", "admin"]}
        >
          <ReportCategoryListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/setup/report-types"
      element={
        <ProtectedRoute
          requiredPermissions={["view_rmsreporttype"]}
          requiredRoles={["RMS_SYS_ADMIN", "admin"]}
        >
          <ReportTypeListPage />
        </ProtectedRoute>
      }
    />
  </>
);
