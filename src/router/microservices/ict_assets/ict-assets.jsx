import { AssetDashboardPage } from "../../../pages/services/ICT-ASSETS/dashboard/AssetDashboardPage.jsx";
import { AssetListPage } from "../../../pages/services/ICT-ASSETS/assets_list/View.jsx";
import { AssetViewPage } from "../../../pages/services/ICT-ASSETS/assets_list/Open.jsx";
import { ComputerListPage } from "../../../pages/services/ICT-ASSETS/computers/View.jsx";
import { ComputerViewPage } from "../../../pages/services/ICT-ASSETS/computers/Open.jsx";
import { NetworkingDeviceListPage } from "../../../pages/services/ICT-ASSETS/networking/View.jsx";
import { NetworkingDeviceViewPage } from "../../../pages/services/ICT-ASSETS/networking/Open.jsx";
import { PeripheralDeviceListPage } from "../../../pages/services/ICT-ASSETS/peripherals/View.jsx";
import { PeripheralDeviceViewPage } from "../../../pages/services/ICT-ASSETS/peripherals/Open.jsx";
import { SoftwareAssetListPage } from "../../../pages/services/ICT-ASSETS/softwares/View.jsx";
import { SoftwareAssetViewPage } from "../../../pages/services/ICT-ASSETS/softwares/Open.jsx";
import { SowareInstallationListPage } from "../../../pages/services/ICT-ASSETS/softwares/SoftwareInstallationList.jsx";
import { SoftwareInstallationViewPage } from "../../../pages/services/ICT-ASSETS/softwares/SoftwareInstallationView.jsx";
import { SoftwareCategoriesListPage } from "../../../pages/services/ICT-ASSETS/softwares/categories/SoftwareCategoriesListPage.jsx";
import ProtectedRoute from "../../../components/wrapper/ProtectedRoute";

const ictAssetsPermissions = {
    dashboard: ["view_dashboard"],
    roles: [
        "ICT_Superuser",
        "admin",
        "ICT_Manager",
        "ICT_Technician",
        "ICT_Auditor",
        "Department_User",
        "ReadOnly_User",
    ],
    readOnlyRoles: ["admin", "ReadOnly_User"],
}

export const ictAssetsRoutes = [
    {
        path: "/ict-assets/dashboard",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.roles}
            >
                <AssetDashboardPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/assets",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.roles}
            >
                <AssetListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/assets/:uid",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <AssetViewPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/computers/:uid",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <ComputerViewPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/computers",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <ComputerListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/network-devices/:uid",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <NetworkingDeviceViewPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/network-devices",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <NetworkingDeviceListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/peripheral-devices/:uid",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <PeripheralDeviceViewPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/peripheral-devices",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <PeripheralDeviceListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/asset-software/:uid",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <SoftwareAssetViewPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/asset-software",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <SoftwareAssetListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/asset-software-installations",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <SowareInstallationListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/asset-software-installations/:uid",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <SoftwareInstallationViewPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ict-assets/asset-software-categories",
        element: (
            <ProtectedRoute
                requiredPermissions={ictAssetsPermissions.dashboard}
                requiredRoles={ictAssetsPermissions.readOnlyRoles}
            >
                <SoftwareCategoriesListPage />
            </ProtectedRoute>
        ),
    },
]