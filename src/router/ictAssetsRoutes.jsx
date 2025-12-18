import { Route } from "react-router-dom";

import ProtectedRoute from "../components/wrapper/ProtectedRoute";

// ICT ASSETS MANAGEMENT
import { AssetDashboardPage } from "../pages/services/ICT-ASSETS/dashboard/AssetDashboardPage.jsx";
import { AssetListPage } from "../pages/services/ICT-ASSETS/assets_list/View.jsx";
import { AssetViewPage } from "../pages/services/ICT-ASSETS/assets_list/Open.jsx";
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
import { SoftwareCategoriesListPage } from "../pages/services/ICT-ASSETS/softwares/categories/SoftwareCategoriesListPage.jsx";
import { AssetCategoriesListPage } from "../pages/services/ICT-ASSETS/setup_config/asset_categories/AssetCategoriesListPage.jsx";
import { AssetTypesListPage } from "../pages/services/ICT-ASSETS/setup_config/asset_types/AssetTypesListPage.jsx";
import { ManufacturesListPage } from "../pages/services/ICT-ASSETS/setup_config/manufactures/ManufacturesListPage.jsx";
import { SuppliersListPage } from "../pages/services/ICT-ASSETS/setup_config/suppliers/SuppliersListPage.jsx";
import { DisposalRecordsListPage } from "../pages/services/ICT-ASSETS/setup_config/disposal_records/DisposalRecordListPage.tsx"
import { DisposalRecordsView } from "../pages/services/ICT-ASSETS/setup_config/disposal_records/DisposalRecordsView.jsx";
import { ViewAssetType } from "../pages/services/ICT-ASSETS/setup_config/asset_types/ViewAssetType.tsx";
import { AccountPage } from "../pages/account/AccountPage.jsx";

const requiredRoles = [
  "ICT_Superuser",
  "admin",
  "ICT_Manager",
  "ICT_Technician",
  "ICT_Auditor",
  "Department_User",
  "ReadOnly_User",
];

export const ictAssetsRoutes = (
  <>
    <Route path="/ict-assets/account/settings" element={<AccountPage />} />
    <Route
      path="/ict-assets/dashboard"
      element={
        <ProtectedRoute
          requiredPermissions={["view_dashboard"]}
          requiredRoles={requiredRoles}
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
          requiredRoles={requiredRoles}
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
    <Route
      path="/ict-assets/asset-software-categories"
      element={
        <ProtectedRoute
          requiredPermissions={["view_dashboard"]}
          requiredRoles={["admin", "ReadOnly_User"]}
        >
          <SoftwareCategoriesListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ict-assets/asset-categories"
      element={
        <ProtectedRoute
          requiredPermissions={["view_dashboard"]}
          requiredRoles={["admin", "ReadOnly_User"]}
        >
          <AssetCategoriesListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ict-assets/asset-types"
      element={
        <ProtectedRoute
          requiredPermissions={["view_dashboard"]}
          requiredRoles={["admin", "ReadOnly_User"]}
        >
          <AssetTypesListPage />
        </ProtectedRoute>
      }
    />


    <Route
      path="/ict-assets/view-asset-type/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["view_dashboard"]}
          requiredRoles={["admin", "ReadOnly_User"]}
        >
          <ViewAssetType />
        </ProtectedRoute>
      }

    />

    <Route
      path="/ict-assets/asset-manufactures"
      element={
        <ProtectedRoute
          requiredPermissions={["view_dashboard"]}
          requiredRoles={["admin", "ReadOnly_User"]}
        >
          <ManufacturesListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ict-assets/asset-suppliers"
      element={
        <ProtectedRoute
          requiredPermissions={["view_dashboard"]}
          requiredRoles={["admin", "ReadOnly_User"]}
        >
          <SuppliersListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ict-assets/asset-disposal-records"
      element={
        <ProtectedRoute
          requiredPermissions={["view_dashboard"]}
          requiredRoles={["admin", "ReadOnly_User"]}
        >
          <DisposalRecordsListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ict-assets/view-disposal-record/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["view_dashboard"]}
          requiredRoles={["admin", "ReadOnly_User"]}
        >
          <DisposalRecordsView />
        </ProtectedRoute>
      }
    />
  </>
);
