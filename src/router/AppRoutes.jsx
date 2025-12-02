import { Route, Routes } from "react-router-dom";

import { authenticationRoutes } from "./microservices/auth/authentication.jsx";
import { accountRoutes } from "./microservices/auth/account.jsx";
import { settingsRoutes } from "./microservices/e_approval/settings.jsx";
import { usersRoutes } from "./microservices/e_approval/users.jsx";
import { eApprovalRoutes } from "./microservices/e_approval/operations.jsx";
import { ictAssetsRoutes } from "./microservices/ict_assets/ict-assets.jsx";
import { analyticsRoutes } from "./microservices/analytics/analytics.jsx";
import { ErrorPage } from "../pages/misc/ErrorPage";
import { Services } from "../pages/Services";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      {authenticationRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* Core Routes */}
      <Route path="/" element={<Services />} />
      <Route path="*" element={<ErrorPage />} />

      {/* Account Routes */}
      {accountRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* Module Routes */}
      {settingsRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {usersRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {eApprovalRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {ictAssetsRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {analyticsRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* Add future modules here */}
    </Routes>
  );
};

export default AppRoutes;
