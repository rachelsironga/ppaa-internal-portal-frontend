import { Route } from "react-router-dom";
import { ReferralDashboardPage } from "../pages/services/EXTERNAL-REFERRAL/dashboard/ReferralDashboardQueries";
import { ReferralView } from "../pages/services/EXTERNAL-REFERRAL/Referrals/View";

export const externalReferralRoutes = (
  <>
    <Route path="/external-referral" element={<ReferralView />} />
    <Route
      path="/external-referral/dashboard"
      element={<ReferralDashboardPage />}
    />
  </>
);
