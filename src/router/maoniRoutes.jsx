import { Route } from "react-router-dom";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";
// MAONI MANAGEMENT
import { MaoniDashboardPage } from "../pages/services/MNH-MAONI/dashboard/MaoniDashboardPage.jsx";
import { Maoni } from "../pages/services/MNH-MAONI/Maoni/Maoni.jsx";
// PPAA MAONI - SUGGESTIONS
import SuggestionsList from "../pages/services/PPAA-MAONI/SuggestionsList.jsx";
import SuggestionForm from "../pages/services/PPAA-MAONI/SuggestionForm.jsx";
import SuggestionDetail from "../pages/services/PPAA-MAONI/SuggestionDetail.jsx";

export const maoniRoutes = (
  <>
    <Route path="/ppaa-maoni" element={<Maoni />} />
    <Route path="/ppaa-maoni/dashboard" element={<MaoniDashboardPage />} />
    {/* PPAA Maoni Suggestions - Protected Routes */}
    <Route
      path="/ppaa-maoni/suggestions"
      element={
        <ProtectedRoute>
          <SuggestionsList />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-maoni/suggestions/new"
      element={
        <ProtectedRoute>
          <SuggestionForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-maoni/suggestions/:uid"
      element={
        <ProtectedRoute>
          <SuggestionDetail />
        </ProtectedRoute>
      }
    />
  </>
);
