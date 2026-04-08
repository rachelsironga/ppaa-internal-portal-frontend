import { Route } from "react-router-dom";

import { AccountPage } from "../pages/account/AccountPage";
import { Connections } from "../pages/account/ConnectionsPage";
import { NotificationPage } from "../pages/account/NotificationPage";
import ChangePassword from "../pages/account/ChangePassword";

import { DepartmentPage } from "../pages/services/PPAA-INTERNAL-PORTAL/departments/View";
import { DepartmentOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/departments/Open";
import { UserListPage } from "../pages/services/MANAGMENTS/users/View";
import { UserOpenPage } from "../pages/services/MANAGMENTS/users/Open";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";
import { RolesManagementPage } from "../pages/services/MANAGMENTS/roles_management/View.jsx";
import { OpenRolesManagementPage } from "../pages/services/MANAGMENTS/roles_management/Open.jsx";

export const managementRoutes = (
  <>
    <Route path="/ppaa-internal-portal/account/settings" element={<AccountPage />} />
    <Route
      path="/ppaa-internal-portal/account/notifications"
      element={<NotificationPage />}
    />
    <Route path="/ppaa-internal-portal/account/connections" element={<Connections />} />
    <Route path="/ppaa-internal-portal/account/password" element={<ChangePassword />} />

    <Route
      path="/ppaa-internal-portal/departments"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_department",
            "can_add_department",
            "can_edit_department",
          ]}
        >
          <DepartmentPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/departments/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_department",
            "can_add_department",
            "can_edit_department",
          ]}
        >
          <DepartmentOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/users"
      element={
        <ProtectedRoute
          requiredPermissions={["view_user", "add_user", "delete_user"]}
        >
          <UserListPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/users/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["view_user", "add_user", "delete_user"]}
        >
          <UserOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/roles-managements"
      element={
        <ProtectedRoute requiredPermissions={[]} requiredRoles={["admin"]}>
          <RolesManagementPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/roles-managements/open/:uid"
      element={
        <ProtectedRoute requiredPermissions={[]} requiredRoles={["admin"]}>
          <OpenRolesManagementPage />
        </ProtectedRoute>
      }
    />
  </>
);
