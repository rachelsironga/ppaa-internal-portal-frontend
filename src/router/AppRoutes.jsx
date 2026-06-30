import { Route, Routes } from "react-router-dom";
import { ErrorPage } from "../pages/misc/ErrorPage";
import { Services } from "../pages/Services";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";
import PortalPage from "../PortalPage";

// Import all service routes
import { authRoutes } from "./authRoutes";
import { managementRoutes } from "./managementRoutes";
import { MaintenancePage } from "../pages/misc/MaintenancePage";
import { maoniRoutes } from "./maoniRoutes";
import { ppaaInternalPortalRoutes } from "./ppaaInternalPortal";
import { performanceDashboardRoutes } from "./performanceDashboardRoutes";
import { reportManagementRoutes } from "./reportManagementRoutes";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Landing Page - Portal */}
      <Route path="/" element={<PortalPage />} />

      {/* Services (requires login) */}
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <Services />
          </ProtectedRoute>
        }
      />

      {/* Auth Routes */}
      {authRoutes}

      {/* Management Routes */}
      {managementRoutes}

      {/* PPAA Internal Portal Routes */}
      {ppaaInternalPortalRoutes}

      {/* MAONI Routes */}
      {maoniRoutes}

      {/* Strategic Performance */}
      {performanceDashboardRoutes}

      {/* Reports Management */}
      {reportManagementRoutes}

      {/* Dedicated maintenance screen (e.g. Help Desk placeholder) */}
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <MaintenancePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/help-desk/*"
        element={
          <ProtectedRoute>
            <MaintenancePage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all 404 */}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
};

export default AppRoutes;
