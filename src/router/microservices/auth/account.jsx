import { AccountPage } from "../../../pages/account/AccountPage";
import { Connections } from "../../../pages/account/ConnectionsPage";
import { NotificationPage } from "../../../pages/account/NotificationPage";
import ChangePassword from "../../../pages/account/ChangePassword";

export const accountRoutes = [
    { path: "/account/settings", element: <AccountPage /> },
    { path: "/account/notifications", element: <NotificationPage /> },
    { path: "/account/connections", element: <Connections /> },
    { path: "/account/password", element: <ChangePassword /> },
];