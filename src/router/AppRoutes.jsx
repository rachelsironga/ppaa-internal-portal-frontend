import { Route, Routes } from "react-router-dom";
import { ErrorPage } from "../pages/misc/ErrorPage";
import { Services } from "../pages/Services";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";

// Import all service routes
import { authRoutes } from "./authRoutes";
import { eApprovalRoutes } from "./eApprovalRoutes";
import { managementRoutes } from "./managementRoutes";
import { ictAssetsRoutes } from "./ictAssetsRoutes";
import { oxygenRoutes } from "./oxygenRoutes";
import { analyticsRoutes } from "./analyticsRoutes";
import { trainingRoutes } from "./trainingRoutes";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Home & Services */}
      <Route path="/" element={<Services />} />

      {/* Auth Routes */}
      {authRoutes}

      {/* Management Routes */}
      {managementRoutes}

      {/* E-Approval Routes */}
      {eApprovalRoutes}

      {/* ICT Assets Routes */}
      {ictAssetsRoutes}

      {/* Oxygen Management Routes */}
      {oxygenRoutes}

      {/* Hospital Analitics Routes */}
      {analyticsRoutes}

      {/* Training Management Routes */}
      {trainingRoutes}

      {/* Catch-all 404 */}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
};

export default AppRoutes;
