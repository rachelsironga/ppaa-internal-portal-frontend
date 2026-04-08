import { Route, Routes } from "react-router-dom";
import { ErrorPage } from "../pages/misc/ErrorPage";
import { Services } from "../pages/Services";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";
import PortalPage from "../PortalPage";

// Import all service routes
import { authRoutes } from "./authRoutes";
import { managementRoutes } from "./managementRoutes";
import { ictAssetsRoutes } from "./ictAssetsRoutes";
import { oxygenRoutes } from "./oxygenRoutes";
import { analyticsRoutes } from "./analyticsRoutes";
import { MaintenancePage } from "../pages/misc/MaintenancePage";
import { maoniRoutes } from "./maoniRoutes";
import { trainingRoutes } from "./trainingRoutes";
import { externalReferralRoutes } from "./externalReferralRoutes";
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

      {/* Performance Dashboard Routes */}
      {performanceDashboardRoutes}

      {/* PPAA Reports Routes */}
      {reportManagementRoutes}

      {/* ICT Assets Routes */}
      {/* {ictAssetsRoutes} */}

      {/* Oxygen Management Routes */}
      {/* {oxygenRoutes} */}

      {/* Hospital Analitics Routes */}
      {/* {analyticsRoutes} */}

      

      {/* Training Management Routes */}
      {/* {trainingRoutes} */}

      {/* External Referral Routes */}
      {/* {externalReferralRoutes} */}

      {/* Catch-all 404 */}
      <Route path="*" element={<MaintenancePage />} />
      {/* <Route path="*" element={<ErrorPage />} /> */}
    </Routes>
  );
};

export default AppRoutes;
