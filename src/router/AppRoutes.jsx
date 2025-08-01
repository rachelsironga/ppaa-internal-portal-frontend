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


function RegisterAndLogout() {
  localStorage.clear;
  return <RegisterPage />;
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
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
              "view_department",
              "add_department",
              "delete_department",
              "change_department",
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
              "change_approvalmodule",
              "view_approvalmodule",
              "delete_approvalmodule",
            ]}
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
              "change_approvalmodule",
              "view_approvalmodule",
              "delete_approvalmodule",
            ]}
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
              "view_daterange",
              "delete_daterange",
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
              "change_approvalrequest",
              "add_approvalrequest",
              "view_approvalrequest",
            ]}
          >
            <ApprovalRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests/open/:uid"
        element={
          <ProtectedRoute requiredPermissions={["view_approvalrequest"]}>
            <ApprovalRequestOpenPage />
          </ProtectedRoute>
        }
      />

      {/* Roles Managements */}
      <Route
         path="/roles-managements"
         element={
            <ProtectedRoute
                requiredPermissions={[]}
                requiredRoles={['admin']}
            >
                <RolesManagementPage />
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
