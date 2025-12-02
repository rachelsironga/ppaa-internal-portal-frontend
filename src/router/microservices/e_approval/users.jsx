import { UserListPage } from "../../../pages/services/MANAGMENTS/users/View";
import { UserOpenPage } from "../../../pages/services/MANAGMENTS/users/Open";
import ProtectedRoute from "../../../components/wrapper/ProtectedRoute";

export const usersRoutes = [
    {
        path: "/users",
        element: (
            <ProtectedRoute requiredPermissions={["view_user", "add_user", "delete_user"]}>
                <UserListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/users/open/:uid",
        element: (
            <ProtectedRoute requiredPermissions={["view_user", "add_user", "delete_user"]}>
                <UserOpenPage />
            </ProtectedRoute>
        ),
    },
];