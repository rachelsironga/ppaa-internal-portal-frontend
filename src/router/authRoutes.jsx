import { Route } from "react-router-dom";
import LoginPage from "../pages/authentication/LoginPage";
import NewUserPage from "../pages/authentication/NewUserPage";
import { ForgotPasswordPage } from "../pages/authentication/ForgotPasswordPage";
import RegisterPage from "../pages/authentication/RegisterPage";
import PortalPage from "../PortalPage";

function RegisterAndLogout() {
  localStorage.clear();
  return <RegisterPage />;
}
export const authRoutes = (
  <>
    <Route path="/public/login" element={<PortalPage />} />
    <Route path="/auth/login" element={<LoginPage />} />
    <Route path="/auth/register" element={<RegisterAndLogout />} />
    <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
    <Route
      path="/auth/new-user-0InEm7BVGIrZafX2riM8DQFgQG2L06ImZlP3oJF"
      element={<NewUserPage />}
    />
  </>
);
