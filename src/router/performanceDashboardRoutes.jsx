import { Route } from "react-router-dom";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";
import { PerformanceDashboardPage } from "../pages/services/PERFORMANCE-DASHBOARD/PerformanceDashboardPage";
import { ObjectivePage } from "../pages/services/PERFORMANCE-DASHBOARD/objectives/View";
import { ObjectiveOpenPage } from "../pages/services/PERFORMANCE-DASHBOARD/objectives/Open";
import { TargetPage } from "../pages/services/PERFORMANCE-DASHBOARD/targets/View";
import { TargetOpenPage } from "../pages/services/PERFORMANCE-DASHBOARD/targets/Open";
import { ActivityPage } from "../pages/services/PERFORMANCE-DASHBOARD/activities/View";
import { ActivityOpenPage } from "../pages/services/PERFORMANCE-DASHBOARD/activities/Open";
import { ImplementationPage } from "../pages/services/PERFORMANCE-DASHBOARD/implementation/ImplementationPage";
import { ApprovalPage } from "../pages/services/PERFORMANCE-DASHBOARD/approval/ApprovalPage";
import { ReturnedPage } from "../pages/services/PERFORMANCE-DASHBOARD/returned/ReturnedPage";
import { ReportsPage } from "../pages/services/PERFORMANCE-DASHBOARD/reports/ReportsPage";
import { AnalyticsPage } from "../pages/services/PERFORMANCE-DASHBOARD/analytics/AnalyticsPage";
import { ESDashboardPage } from "../pages/services/PERFORMANCE-DASHBOARD/analytics/ESDashboardPage";
import { ViewerDashboardPage } from "../pages/services/PERFORMANCE-DASHBOARD/analytics/ViewerDashboardPage";
import { AuditLogsPage } from "../pages/services/PERFORMANCE-DASHBOARD/audit-logs/AuditLogsPage";
import { PerformanceAuditLogOpenPage } from "../pages/services/PERFORMANCE-DASHBOARD/audit-logs/Open";
import { NotificationsPage } from "../pages/services/PERFORMANCE-DASHBOARD/notifications/NotificationsPage";
import { AccountPage } from "../pages/account/AccountPage";
import { KpiActualsPage } from "../pages/services/PERFORMANCE-DASHBOARD/kpi/KpiActualsPage";
import { FinancialYearsPage } from "../pages/services/PERFORMANCE-DASHBOARD/setup/FinancialYearsPage";
import { FinancialYearOpenPage } from "../pages/services/PERFORMANCE-DASHBOARD/setup/Open";

/** Hide setup / notifications admin UI for planning-officer groups (JWT may lag behind DB). */
const SPISM_PLANNING_OFFICER_EXCLUDE_ROLES = [
  "spism_planning_officer",
  "spims_planning_officer",
  "spism_planning_office",
  "spims_planning_office",
];

/** Financial years + alerts UI: not for planning officers, department heads, or ES approvers. */
const SPISM_SETUP_ADMIN_EXCLUDE_ROLES = [
  ...SPISM_PLANNING_OFFICER_EXCLUDE_ROLES,
  "spism_dept_head",
  "spism_contributor",
  "spism_approver",
];

/** Audit trail UI: not for ES approvers (SPISM Admin still sees it). */
const SPISM_AUDIT_UI_EXCLUDE_ROLES = ["spism_approver"];

export const performanceDashboardRoutes = (
  <>
    <Route
      path="/performance-dashboard"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_dashboard"]}>
          <PerformanceDashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/es-dashboard"
      element={
        <ProtectedRoute
          requiredPermissions={["can_view_spism_analytics", "can_view_spism_approval"]}
        >
          <ESDashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/viewer-dashboard"
      element={
        <ProtectedRoute
          requiredPermissions={["can_view_spism_reports"]}
          excludeRoles={[
            "spism_approver",
            "spims_approver",
            "spism_planning_officer",
            "spims_planning_officer",
            "spism_planning_office",
            "spims_planning_office",
            "spism_dept_head",
            "spism_contributor",
            "spims_dept_head",
          ]}
        >
          <ViewerDashboardPage />
        </ProtectedRoute>
      }
    />
    <Route path="/performance-dashboard/profile" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
    <Route
      path="/performance-dashboard/objectives"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_objective"]}>
          <ObjectivePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/objectives/open/:uid"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_objective"]}>
          <ObjectiveOpenPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/targets"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_target"]}>
          <TargetPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/targets/open/:uid"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_target"]}>
          <TargetOpenPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/activities"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_activity"]}>
          <ActivityPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/activities/open/:uid"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_activity"]}>
          <ActivityOpenPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/kpi-actuals"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_kpi_actual"]}>
          <KpiActualsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/setup/financial-years"
      element={
        <ProtectedRoute
          requiredPermissions={["can_view_spism_setup"]}
          excludeRoles={SPISM_SETUP_ADMIN_EXCLUDE_ROLES}
        >
          <FinancialYearsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/setup/financial-years/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["can_view_spism_setup"]}
          excludeRoles={SPISM_SETUP_ADMIN_EXCLUDE_ROLES}
        >
          <FinancialYearOpenPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/implementation"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_implementation"]}>
          <ImplementationPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/approval"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_approval"]}>
          <ApprovalPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/returned"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_approval"]}>
          <ReturnedPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/approval/objectives/:uid"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_approval"]}>
          <ObjectiveOpenPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/approval/targets/:uid"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_approval"]}>
          <TargetOpenPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/approval/activities/:uid"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_approval"]}>
          <ActivityOpenPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/reports"
      element={
        <ProtectedRoute requiredPermissions={["can_view_spism_reports"]}>
          <ReportsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/analytics"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_spism_analytics",
            "can_view_spism_dashboard",
            "can_view_spism_reports",
          ]}
        >
          <AnalyticsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/audit-logs"
      element={
        <ProtectedRoute
          requiredPermissions={["can_view_spism_audit_log"]}
          excludeRoles={SPISM_AUDIT_UI_EXCLUDE_ROLES}
        >
          <AuditLogsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/audit-logs/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["can_view_spism_audit_log"]}
          excludeRoles={SPISM_AUDIT_UI_EXCLUDE_ROLES}
        >
          <PerformanceAuditLogOpenPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/performance-dashboard/notifications"
      element={
        <ProtectedRoute
          requiredPermissions={["can_view_spism_setup"]}
          excludeRoles={SPISM_SETUP_ADMIN_EXCLUDE_ROLES}
        >
          <NotificationsPage />
        </ProtectedRoute>
      }
    />
  </>
);
