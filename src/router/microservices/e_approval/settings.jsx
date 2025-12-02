import { DirectoryPage } from "../../../pages/services/MANAGMENTS/directory/View";
import { DirectoryOpenPage } from "../../../pages/services/MANAGMENTS/directory/Open";
import { DepartmentPage } from "../../../pages/services/MANAGMENTS/department/View";
import { PositionalLevelPage } from "../../../pages/services/E-APPROVAL/positional_level/View";
import { ApprovalActionPage } from "../../../pages/services/E-APPROVAL/approval_action/View";
import { ApprovalModulePage } from "../../../pages/services/E-APPROVAL/approval_module/View";
import { ApprovalModuleOpenPage } from "../../../pages/services/E-APPROVAL/approval_module/Open";
import { DateRangePage } from "../../../pages/services/MANAGMENTS/date_range/View";
import ProtectedRoute from "../../../components/wrapper/ProtectedRoute";

export const settingsRoutes = [
    {
        path: "/settings/directories",
        element: (
            <ProtectedRoute
                requiredPermissions={["view_directory", "add_directory", "change_directory"]}
            >
                <DirectoryPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/settings/directories/open/:uid",
        element: (
            <ProtectedRoute
                requiredPermissions={["view_directory", "add_directory", "change_directory"]}
            >
                <DirectoryOpenPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/settings/departments",
        element: (
            <ProtectedRoute
                requiredPermissions={["can_add_department", "can_view_department", "can_delete_department"]}
            >
                <DepartmentPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/settings/positional-levels",
        element: (
            <ProtectedRoute
                requiredPermissions={["change_positionallevel", "view_positionallevel", "delete_positionallevel"]}
            >
                <PositionalLevelPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/settings/approval-actions",
        element: (
            <ProtectedRoute
                requiredPermissions={["change_approvalaction", "view_approvalaction", "delete_approvalaction"]}
            >
                <ApprovalActionPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/settings/approval-modules",
        element: (
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
        ),
    },
    {
        path: "/settings/approval-modules/open/:uid",
        element: (
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
        ),
    },
    {
        path: "/settings/date-ranges",
        element: (
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
        ),
    },
];