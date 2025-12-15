import { Route } from "react-router-dom";
// ICT ASSETS MANAGEMENT
import { OxygenLocationPage } from "../pages/services/OXYGEN-MANAGMENT/locations/View.jsx";
import { OxygenLocationOpenPage } from "../pages/services/OXYGEN-MANAGMENT/locations/Open.jsx";
import { OxygenLocationUsagePage } from "../pages/services/OXYGEN-MANAGMENT/locations/Usage.jsx";
import { OxygenAllocationOpenPage } from "../pages/services/OXYGEN-MANAGMENT/allocation/Open.jsx";
import { OxygenRecievingPage } from "../pages/services/OXYGEN-MANAGMENT/recieving/View.jsx";
import { OxygenRecievingOpenPage } from "../pages/services/OXYGEN-MANAGMENT/recieving/Open.jsx";
import { OxygenAllocationPage } from "../pages/services/OXYGEN-MANAGMENT/allocation/View.jsx";
import { OxygenUsagePage } from "../pages/services/OXYGEN-MANAGMENT/usage/View.jsx";
import { OxygenUsageOpenPage } from "../pages/services/OXYGEN-MANAGMENT/usage/Open.jsx";
import { OxygenVolumePage } from "../pages/services/OXYGEN-MANAGMENT/volumes/View.jsx";
import { OxygenSupplierPage } from "../pages/services/OXYGEN-MANAGMENT/suppliers/View.jsx";
import { PatientAgeGroupPage } from "../pages/services/OXYGEN-MANAGMENT/patientAgeGroups/View.jsx";

export const oxygenRoutes = (
  <>
    <Route
      path="/oxygen-management/locations"
      element={<OxygenLocationPage />}
    />
    <Route
      path="/oxygen-management/locations/open/:uid"
      element={<OxygenLocationOpenPage />}
    />
    <Route
      path="/oxygen-management/locational-oxygen-usages/open/:uid"
      element={<OxygenLocationUsagePage />}
    />
    <Route
      path="/oxygen-management/recievings"
      element={<OxygenRecievingPage />}
    />
    <Route
      path="/oxygen-management/recievings/open/:uid"
      element={<OxygenRecievingOpenPage />}
    />
    <Route
      path="/oxygen-management/allocations"
      element={<OxygenAllocationPage />}
    />
    <Route
      path="/oxygen-management/allocations/open/:uid"
      element={<OxygenAllocationOpenPage />}
    />
    <Route path="/oxygen-management/usages" element={<OxygenUsagePage />} />
    <Route
      path="/oxygen-management/usages/open/:uid"
      element={<OxygenUsageOpenPage />}
    />
    <Route path="/oxygen-management/volumes" element={<OxygenVolumePage />} />
    <Route
      path="/oxygen-management/suppliers"
      element={<OxygenSupplierPage />}
    />
    <Route
      path="/oxygen-management/patient-age-groups"
      element={<PatientAgeGroupPage />}
    />
  </>
);
