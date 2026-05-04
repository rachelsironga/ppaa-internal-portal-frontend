import { Route } from "react-router-dom";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";
// MAONI MANAGEMENT
import { MaoniDashboardPage } from "../pages/services/MNH-MAONI/dashboard/MaoniDashboardPage.jsx";
import HandlerDashboardPage from "../pages/services/MNH-MAONI/dashboard/HandlerDashboardPage.jsx";
import { Maoni } from "../pages/services/MNH-MAONI/Maoni/Maoni.jsx";
import { AccountPage } from "../pages/account/AccountPage";
import MaoniSettingsPage from "../pages/services/MNH-MAONI/settings/MaoniSettingsPage.jsx";
// PPAA MAONI - SUGGESTIONS
import SuggestionsList from "../pages/services/PPAA-MAONI/SuggestionsList.jsx";
import SuggestionForm from "../pages/services/PPAA-MAONI/SuggestionForm.jsx";
import SuggestionDetail from "../pages/services/PPAA-MAONI/SuggestionDetail.jsx";

export const maoniRoutes = (
  <>
    <Route path="/ppaa-maoni" element={<Maoni />} />
    <Route path="/ppaa-maoni/dashboard" element={<MaoniDashboardPage />} />
    <Route path="/ppaa-maoni/handler-dashboard" element={<HandlerDashboardPage />} />
    <Route
      path="/ppaa-maoni/profile"
      element={
        <ProtectedRoute>
          <AccountPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-maoni/settings"
      element={
        <ProtectedRoute>
          <MaoniSettingsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-maoni/maoni-escalation-settings"
      element={
        <ProtectedRoute>
          <MaoniSettingsPage />
        </ProtectedRoute>
      }
    />
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
