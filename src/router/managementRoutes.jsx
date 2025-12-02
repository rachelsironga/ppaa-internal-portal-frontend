import { Route } from "react-router-dom";

import { AccountPage } from "../pages/account/AccountPage";
import { Connections } from "../pages/account/ConnectionsPage";
import { NotificationPage } from "../pages/account/NotificationPage";
import ChangePassword from "../pages/account/ChangePassword";

import { DirectoryPage } from "../pages/services/MANAGMENTS/directory/View";
import { DirectoryOpenPage } from "../pages/services/MANAGMENTS/directory/Open";
import { UserListPage } from "../pages/services/MANAGMENTS/users/View";
import { UserOpenPage } from "../pages/services/MANAGMENTS/users/Open";
import { DateRangePage } from "../pages/services/MANAGMENTS/date_range/View";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";
import { DepartmentPage } from "../pages/services/MANAGMENTS/department/View";
import { RolesManagementPage } from "../pages/services/MANAGMENTS/roles_management/View.jsx";
import { OpenRolesManagementPage } from "../pages/services/MANAGMENTS/roles_management/Open.jsx";

// ICT ASSETS MANAGEMENT

export const managementRoutes = (
  <>
    <Route path="/mnh-connect/account/settings" element={<AccountPage />} />
    <Route
      path="/mnh-connect/account/notifications"
      element={<NotificationPage />}
    />
    <Route path="/mnh-connect/account/connections" element={<Connections />} />
    <Route path="/mnh-connect/account/password" element={<ChangePassword />} />

    <Route
      path="/mnh-connect/settings/directories"
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
      path="/mnh-connect/settings/directories/open/:uid"
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
      path="/mnh-connect/settings/departments"
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
      path="/mnh-connect/settings/date-ranges"
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

    <Route
      path="/mnh-connect/users"
      element={
        <ProtectedRoute
          requiredPermissions={["view_user", "add_user", "delete_user"]}
        >
          <UserListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mnh-connect/users/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["view_user", "add_user", "delete_user"]}
        >
          <UserOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/mnh-connect/roles-managements"
      element={
        <ProtectedRoute requiredPermissions={[]} requiredRoles={["admin"]}>
          <RolesManagementPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/mnh-connect/roles-managements/open/:uid"
      element={
        <ProtectedRoute requiredPermissions={[]} requiredRoles={["admin"]}>
          <OpenRolesManagementPage />
        </ProtectedRoute>
      }
    />
  </>
);
