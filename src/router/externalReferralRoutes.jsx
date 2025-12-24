import { Route } from "react-router-dom";
import { ReferralDashboardPage } from "../pages/services/EXTERNAL-REFERRAL/dashboard/ReferralDashboardQueries";
import { ReferralView } from "../pages/services/EXTERNAL-REFERRAL/Referrals/View";
import { ReferralsListPage } from "../pages/services/EXTERNAL-REFERRAL/Referrals/ListPage";
import { ReferralDetailsPage } from "../pages/services/EXTERNAL-REFERRAL/Referrals/Details";

export const externalReferralRoutes = (
  <>
    <Route path="/external-referral" element={<ReferralsListPage />} />
    <Route path="/external-referral/referrals" element={<ReferralsListPage />} />
    <Route path="/external-referral/referrals/:uid" element={<ReferralDetailsPage />} />
    <Route path="/external-referral/view" element={<ReferralView />} />
    <Route
      path="/external-referral/dashboard"
      element={<ReferralDashboardPage />}
    />
  </>
);
