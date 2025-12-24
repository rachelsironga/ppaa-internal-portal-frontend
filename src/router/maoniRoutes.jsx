import { Route } from "react-router-dom";
// MAONI MANAGEMENT
import { MaoniDashboardPage } from "../pages/services/MNH-MAONI/dashboard/MaoniDashboardPage.jsx";
import { Maoni } from "../pages/services/MNH-MAONI/Maoni/Maoni.jsx";

export const maoniRoutes = (
  <>
    <Route path="/mnh-maoni" element={<Maoni />} />
    <Route path="/mnh-maoni/dashboard" element={<MaoniDashboardPage />} />
  </>
);
