import { Route, Routes } from "react-router-dom";

import LoginPage from "../pages/authentication/LoginPage";
import RegisterPage from "../pages/authentication/RegisterPage";
import { ForgotPasswordPage } from "../pages/authentication/ForgotPasswordPage";
import { AccountPage } from "../pages/account/AccountPage";
import { Connections } from "../pages/account/ConnectionsPage";
import { NotificationPage } from "../pages/account/NotificationPage";
import { ErrorPage } from "../pages/misc/ErrorPage";

import { DashboardPage } from "../pages/DashboardPage";

import ChangePassword from "../pages/account/ChangePassword";
import { ApprovalActionPage } from "../pages/services/E-APPROVAL/approval_action/View";
import { ApprovalModulePage } from "../pages/services/E-APPROVAL/approval_module/View";
import { ApprovalModuleOpenPage } from "../pages/services/E-APPROVAL/approval_module/Open";
import { ApprovalRequestPage } from "../pages/services/E-APPROVAL/approval_request/View";
import { DirectoryPage } from "../pages/services/MANAGMENTS/directory/View";
import { DirectoryOpenPage } from "../pages/services/MANAGMENTS/directory/Open";
import { UserListPage } from "../pages/services/MANAGMENTS/users/View";
import { UserOpenPage } from "../pages/services/MANAGMENTS/users/Open";
import { DateRangePage } from "../pages/services/MANAGMENTS/date_range/View";
import { ApprovalRequestOpenPage } from "../pages/services/E-APPROVAL/approval_request/Open";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";
import { Services } from "../pages/Services";
import { DepartmentPage } from "../pages/services/MANAGMENTS/department/View";
import { PositionalLevelPage } from "../pages/services/E-APPROVAL/positional_level/View";
import {RolesManagementPage} from "../pages/services/MANAGMENTS/roles_management/View.jsx";
import { OpenRolesManagementPage } from "../pages/services/MANAGMENTS/roles_management/Open.jsx";
import NewUserPage from "../pages/authentication/NewUserPage.jsx";
import { RequestHandlingPage } from "../pages/services/E-APPROVAL/request_handling/View.jsx";
import { RequestHandlingOpenPage } from "../pages/services/E-APPROVAL/request_handling/Open.jsx";
import ResetPasswordPage from "../pages/authentication/ResetPasswordPage.jsx";

function RegisterAndLogout() {
  localStorage.clear;
  return <RegisterPage />;
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route
        path="/auth/new-user-0InEm7BVGIrZafX2riM8DQFgQG2L06ImZlP3oJF"
        element={<NewUserPage />}
      />
      <Route
        path="/auth/user-password-UF56HJUIrZafX2riMPDQFgQG2L06IOKHJDD"
        element={<ResetPasswordPage />}
      />
      <Route path="/auth/register" element={<RegisterAndLogout />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/" element={<Services />} />

      <Route path="*" element={<ErrorPage />} />

      <Route path="/account/settings" element={<AccountPage />} />
      <Route path="/account/notifications" element={<NotificationPage />} />
      <Route path="/account/connections" element={<Connections />} />
      <Route path="/account/password" element={<ChangePassword />} />

      {/* Settings */}
      <Route
        path="/settings/directories"
        element={
          <ProtectedRoute
            requiredPermissions={[
              "view_directory",
              "add_directory",
              "change_directory",
            ]}
          >
            <DirectoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/directories/open/:uid"
        element={
          <ProtectedRoute
            requiredPermissions={[
              "view_directory",
              "add_directory",
              "change_directory",
            ]}
          >
            <DirectoryOpenPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/departments"
        element={
          <ProtectedRoute
            requiredPermissions={[
              "can_add_department",
              "can_view_department",
              "can_delete_department",
            ]}
          >
            <DepartmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/positional-levels"
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
        path="/settings/approval-actions"
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
        path="/settings/approval-modules"
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
        path="/settings/approval-modules/open/:uid"
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
        path="/settings/date-ranges"
        element={
          <ProtectedRoute
            requiredPermissions={[
              "change_daterange",
              "can_view_date_range",
              "can_edit_date_range",
              "can_delete_date_range",
            ]}
          >
            <DateRangePage />
          </ProtectedRoute>
        }
      />

      {/* Users */}
      <Route
        path="/users"
        element={
          <ProtectedRoute
            requiredPermissions={["view_user", "add_user", "delete_user"]}
          >
            <UserListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/open/:uid"
        element={
          <ProtectedRoute
            requiredPermissions={["view_user", "add_user", "delete_user"]}
          >
            <UserOpenPage />
          </ProtectedRoute>
        }
      />

      {/* Requests */}
      <Route
        path="/requests"
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
        path="/requests/open/:uid"
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
      {/* Requests Handling*/}

      <Route
        path="/requests-handling"
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
        path="/requests-handling/open/:uid"
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

      {/* Roles Managements */}
      <Route
        path="/roles-managements"
        element={
          <ProtectedRoute requiredPermissions={[]} requiredRoles={["admin"]}>
            <RolesManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/roles-managements/open/:uid"
        element={
          <ProtectedRoute requiredPermissions={[]} requiredRoles={["admin"]}>
            <OpenRolesManagementPage />
          </ProtectedRoute>
        }
      />
      {/*<Route*/}
      {/*    path="/requests/open/:uid"*/}
      {/*    element={*/}
      {/*        <ProtectedRoute requiredPermissions={["view_approvalrequest"]}>*/}
      {/*            <ApprovalRequestOpenPage />*/}
      {/*        </ProtectedRoute>*/}
      {/*    }*/}
      {/*/>*/}
    </Routes>
  );
};
export default AppRoutes;
