import LoginPage from "../../../pages/authentication/LoginPage.jsx";
import RegisterPage from "../../../pages/authentication/RegisterPage.jsx";
import { ForgotPasswordPage } from "../../../pages/authentication/ForgotPasswordPage.jsx";
import NewUserPage from "../../../pages/authentication/NewUserPage.jsx";

function RegisterAndLogout() {
    localStorage.clear;
    return <RegisterPage />;
}

export const authenticationRoutes = [
    { path: "/auth/login", element: <LoginPage />, isPublic: true },
    {
        path: "/auth/new-user-0InEm7BVGIrZafX2riM8DQFgQG2L06ImZlP3oJF",
        element: <NewUserPage />,
        isPublic: true
    },
    { path: "/auth/register", element: <RegisterAndLogout />, isPublic: true },
    { path: "/auth/forgot-password", element: <ForgotPasswordPage />, isPublic: true },
];