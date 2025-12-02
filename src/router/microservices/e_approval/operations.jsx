import { ApprovalRequestPage } from "../../../pages/services/E-APPROVAL/approval_request/View";
import { ApprovalRequestOpenPage } from "../../../pages/services/E-APPROVAL/approval_request/Open";
import { RequestHandlingPage } from "../../../pages/services/E-APPROVAL/request_handling/View.jsx";
import { RequestHandlingOpenPage } from "../../../pages/services/E-APPROVAL/request_handling/Open.jsx";
import { RolesManagementPage } from "../../../pages/services/MANAGMENTS/roles_management/View.jsx";
import { OpenRolesManagementPage } from "../../../pages/services/MANAGMENTS/roles_management/Open.jsx";
import ProtectedRoute from "../../../components/wrapper/ProtectedRoute";

export const eApprovalRoutes = [
    {
        path: "/requests",
        element: (
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
        ),
    },
    {
        path: "/requests/open/:uid",
        element: (
            <ProtectedRoute
                requiredPermissions={[
                    "can_view_approval_request",
                    "can_create_approval_request",
                    "can_update_approval_request_status",
                ]}
            >
                <ApprovalRequestOpenPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/requests-handling",
        element: (
            <ProtectedRoute
                requiredPermissions={["can_view_request_handling", "can_perform_request_handling"]}
                requiredRoles={["Request_Handler"]}
            >
                <RequestHandlingPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/requests-handling/open/:uid",
        element: (
            <ProtectedRoute
                requiredPermissions={["can_view_request_handling", "can_perform_request_handling"]}
                requiredRoles={["Request_Handler"]}
            >
                <RequestHandlingOpenPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/roles-managements",
        element: (
            <ProtectedRoute requiredPermissions={[]} requiredRoles={["admin"]}>
                <RolesManagementPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/roles-managements/open/:uid",
        element: (
            <ProtectedRoute requiredPermissions={[]} requiredRoles={["admin"]}>
                <OpenRolesManagementPage />
            </ProtectedRoute>
        ),
    },
];