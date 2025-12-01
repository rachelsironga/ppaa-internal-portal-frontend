import { Route } from "react-router-dom";
import { ApprovalActionPage } from "../pages/services/E-APPROVAL/approval_action/View";
import { ApprovalModulePage } from "../pages/services/E-APPROVAL/approval_module/View";
import { ApprovalModuleOpenPage } from "../pages/services/E-APPROVAL/approval_module/Open";
import { ApprovalRequestPage } from "../pages/services/E-APPROVAL/approval_request/View";
import { ApprovalRequestOpenPage } from "../pages/services/E-APPROVAL/approval_request/Open";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";
import { PositionalLevelPage } from "../pages/services/E-APPROVAL/positional_level/View";
import { RequestHandlingPage } from "../pages/services/E-APPROVAL/request_handling/View.jsx";
import { RequestHandlingOpenPage } from "../pages/services/E-APPROVAL/request_handling/Open.jsx";
import { StaffDashboard } from "../pages/services/E-APPROVAL/Dashboards/StaffDashboard.jsx";

export const eApprovalRoutes = (
  <>
    <Route path="/mnh-connect" element={<StaffDashboard />} />

    <Route
      path="/mnh-connect/settings/approval-actions"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "change_approvalaction",
            "view_approvalaction",
            "delete_approvalaction",
          ]}
        >
          <ApprovalActionPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mnh-connect/settings/approval-modules"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_approval_modules",
            "can_add_approval_module",
            "can_edit_approval_module",
            "can_delete_approval_module",
          ]}
          requiredRoles={["admin"]}
        >
          <ApprovalModulePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mnh-connect/settings/approval-modules/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_approval_modules",
            "can_add_approval_module",
            "can_edit_approval_module",
            "can_delete_approval_module",
          ]}
          requiredRoles={["admin"]}
        >
          <ApprovalModuleOpenPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mnh-connect/settings/positional-levels"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "change_positionallevel",
            "view_positionallevel",
            "delete_positionallevel",
          ]}
        >
          <PositionalLevelPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/mnh-connect/requests"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_approval_request",
            "can_create_approval_request",
            "can_update_approval_request_status",
          ]}
          requiredRoles={["admin", "staff"]}
        >
          <ApprovalRequestPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mnh-connect/requests/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_approval_request",
            "can_create_approval_request",
            "can_update_approval_request_status",
          ]}
        >
          <ApprovalRequestOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/mnh-connect/requests-handling"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_request_handling",
            "can_perform_request_handling",
          ]}
          requiredRoles={["Request_Handler"]}
        >
          <RequestHandlingPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mnh-connect/requests-handling/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_request_handling",
            "can_perform_request_handling",
          ]}
          requiredRoles={["Request_Handler"]}
        >
          <RequestHandlingOpenPage />
        </ProtectedRoute>
      }
    />
  </>
);
