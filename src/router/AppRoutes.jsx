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

// ICT ASSETS MANAGEMENT
import { AssetDashboardPage } from "../pages/services/ICT-ASSETS/dashboard/AssetDashboardPage.jsx"
import { AssetListPage } from "../pages/services/ICT-ASSETS/assets_list/View.jsx";
import { AssetViewPage } from "../pages/services/ICT-ASSETS/assets_list/Open.jsx"
import { ComputerListPage } from "../pages/services/ICT-ASSETS/computers/View.jsx";
import { ComputerViewPage } from "../pages/services/ICT-ASSETS/computers/Open.jsx";
import { NetworkingDeviceListPage } from "../pages/services/ICT-ASSETS/networking/View.jsx";
import { NetworkingDeviceViewPage } from "../pages/services/ICT-ASSETS/networking/Open.jsx";
import { PeripheralDeviceListPage } from "../pages/services/ICT-ASSETS/peripherals/View.jsx";
import { PeripheralDeviceViewPage } from "../pages/services/ICT-ASSETS/peripherals/Open.jsx";
import { SoftwareAssetListPage } from "../pages/services/ICT-ASSETS/softwares/View.jsx";
import { SoftwareAssetViewPage } from "../pages/services/ICT-ASSETS/softwares/Open.jsx";
import { SowareInstallationListPage } from "../pages/services/ICT-ASSETS/softwares/SoftwareInstallationList.jsx";
import { SoftwareInstallationViewPage } from "../pages/services/ICT-ASSETS/softwares/SoftwareInstallationView.jsx";




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
      <Route path="/auth/register" element={<RegisterAndLogout />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/e-approval" element={<DashboardPage />} />
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

      {/* ===================================================== */}
      {/* ICT ASSETS ROUTES */}
      {/* ===================================================== */}

      {/* ICT Assets Dashboard */}
      <Route
        path="/ict-assets/dashboard"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={[
              "ICT_Superuser",
              "admin",
              "ICT_Manager",
              "ICT_Technician",
              "ICT_Auditor",
              "Department_User",
              "ReadOnly_User",
            ]}
          >
            <AssetDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ict-assets/assets"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={[
              "ICT_Superuser",
              "admin",
              "ICT_Manager",
              "ICT_Technician",
              "ICT_Auditor",
              "Department_User",
              "ReadOnly_User",
            ]}
          >
            <AssetListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ict-assets/assets/:uid"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <AssetViewPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ict-assets/computers/:uid"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <ComputerViewPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ict-assets/computers"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <ComputerListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ict-assets/network-devices/:uid"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <NetworkingDeviceViewPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ict-assets/network-devices"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <NetworkingDeviceListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ict-assets/peripheral-devices/:uid"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <PeripheralDeviceViewPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ict-assets/peripheral-devices"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <PeripheralDeviceListPage />
          </ProtectedRoute>
        }
      />

       <Route
        path="/ict-assets/asset-software/:uid"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <SoftwareAssetViewPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ict-assets/asset-software"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <SoftwareAssetListPage />
          </ProtectedRoute>
        }
      />

       <Route
        path="/ict-assets/asset-software-installations"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <SowareInstallationListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ict-assets/asset-software-installations/:uid"
        element={
          <ProtectedRoute
            requiredPermissions={["view_dashboard"]}
            requiredRoles={["admin", "ReadOnly_User"]}
          >
             <SoftwareInstallationViewPage />
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
