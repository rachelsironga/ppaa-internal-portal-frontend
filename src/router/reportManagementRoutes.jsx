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
  const landingPath = roles.includes("RMS_REPORT_MANAGER")
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
          requiredPermissions={["view_report"]}
          requiredRoles={["RMS_DEPT_REPORTER", "RMS_SYS_ADMIN"]}
        >
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/dashboard/ed"
      element={
        <ProtectedRoute
          requiredPermissions={["view_report", "view_institution_reports"]}
          requiredRoles={["RMS_REPORT_MANAGER", "RMS_SYS_ADMIN"]}
        >
          <EdDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/reports"
      element={
        <ProtectedRoute
          requiredPermissions={["view_report"]}
          requiredRoles={["RMS_REPORT_MANAGER", "RMS_SYS_ADMIN", "RMS_DEPT_REPORTER"]}
        >
          <ReportsListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/reports/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["view_report"]}
          requiredRoles={["RMS_REPORT_MANAGER", "RMS_SYS_ADMIN", "RMS_DEPT_REPORTER"]}
        >
          <ReportDetailPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/audit-trail"
      element={
        <ProtectedRoute
          requiredPermissions={["view_system_audit"]}
          requiredRoles={["RMS_SYS_ADMIN"]}
        >
          <AuditTrailPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/setup/financial-years"
      element={
        <ProtectedRoute
          requiredPermissions={["view_financialyear"]}
          requiredRoles={["RMS_SYS_ADMIN"]}
        >
          <FinancialYearListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/setup/stakeholders"
      element={
        <ProtectedRoute
          requiredPermissions={["view_stakeholder"]}
          requiredRoles={["RMS_SYS_ADMIN"]}
        >
          <StakeholderListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/setup/stakeholders/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["view_stakeholder"]}
          requiredRoles={["RMS_SYS_ADMIN"]}
        >
          <StakeholderDetailPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/setup/report-categories"
      element={
        <ProtectedRoute
          requiredPermissions={["view_reportcategory"]}
          requiredRoles={["RMS_SYS_ADMIN"]}
        >
          <ReportCategoryListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/report-management/setup/report-types"
      element={
        <ProtectedRoute
          requiredPermissions={["view_reporttype"]}
          requiredRoles={["RMS_SYS_ADMIN"]}
        >
          <ReportTypeListPage />
        </ProtectedRoute>
      }
    />
  </>
);
