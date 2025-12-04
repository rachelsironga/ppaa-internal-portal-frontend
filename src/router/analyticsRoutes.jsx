import { AnalyticalDashboardPage } from "../pages/services/analytics/dashboard/AnalyticalDashboardPage.jsx";
import { BlockListPage } from "../pages/services/analytics/blocks/BlockListPage.jsx";
import { ClinicListPage } from "../pages/services/analytics/clinics/ClinicListPage.jsx";
import { DepartmentsListPage } from "../pages/services/analytics/departments/DepartmentsListPage.jsx";
import { PaymentModeListPage } from "../pages/services/analytics/payment_model/PaymentModeListPage.jsx";
import { AttendanceListPage } from "../pages/services/analytics/attendance/AttendanceListPage.jsx";
// import { AttendanceSummaryPage } from "../../../pages/services/analytics/attendance/AttendanceSummaryPage.jsx";
import { PatientTrendsPage } from "../pages/services/analytics/patients/PatientTrendsPage.jsx";
// import { PaymentDistributionPage } from "../../../pages/services/analytics/payment_model/PaymentDistributionPage.jsx";
// import { BlockClinicDistributionPage } from "../../../pages/services/analytics/clinics/BlockClinicDistributionPage.jsx";
import { Route } from "react-router-dom";

import ProtectedRoute from "../components/wrapper/ProtectedRoute";

const requiredRoles = [
  "admin",
  "analytical_data_entry",
  "analytical_supervisor",
  "analytical_head",
  "ReadOnly_User",
];

const readOnlyRoles = ["admin", "ReadOnly_User"];

export const analyticsRoutes = (
  <>
    <Route
      path="/analytics/dashboard"
      element={
        <ProtectedRoute
          requiredPermissions={["view_dashboard"]}
          requiredRoles={requiredRoles}
        >
          <AnalyticalDashboardPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics/blocks"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "view_block",
            "add_block",
            "change_block",
            "delete_block",
          ]}
          requiredRoles={requiredRoles}
        >
          <BlockListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics/clinics"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "view_clinic",
            "add_clinic",
            "change_clinic",
            "delete_clinic",
          ]}
          requiredRoles={requiredRoles}
        >
          <ClinicListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics/departments"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_department",
            "can_add_department",
            "can_delete_department",
          ]}
          requiredRoles={requiredRoles}
        >
          <DepartmentsListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics/payment-modes"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "view_paymentmode",
            "add_paymentmode",
            "change_paymentmode",
            "delete_paymentmode",
          ]}
          requiredRoles={requiredRoles}
        >
          <PaymentModeListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics/attendances"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "view_attendance",
            "add_attendance",
            "change_attendance",
            "delete_attendance",
          ]}
          requiredRoles={requiredRoles}
        >
          <AttendanceListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics/patient-trends"
      element={
        <ProtectedRoute
          requiredPermissions={["view_attendance", "view_patientattendance"]}
          requiredRoles={requiredRoles}
        >
          <PatientTrendsPage />
        </ProtectedRoute>
      }
    />

    {/* Uncomment and use if needed */}
    {/* 
    <Route
      path="/analytics/attendances/summary"
      element={
        <ProtectedRoute
          requiredPermissions={analyticsPermissions.attendanceSummary}
          requiredRoles={readOnlyRoles}
        >
          <AttendanceSummaryPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics/patient-attendances"
      element={
        <ProtectedRoute
          requiredPermissions={analyticsPermissions.patientAttendances}
          requiredRoles={requiredRoles}
        >
          <PatientAttendanceListPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics/dashboard/payment-distribution"
      element={
        <ProtectedRoute
          requiredPermissions={analyticsPermissions.paymentDistribution}
          requiredRoles={readOnlyRoles}
        >
          <PaymentDistributionPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/analytics/dashboard/block-clinic-distribution"
      element={
        <ProtectedRoute
          requiredPermissions={analyticsPermissions.blockClinicDistribution}
          requiredRoles={readOnlyRoles}
        >
          <BlockClinicDistributionPage />
        </ProtectedRoute>
      }
    />
    */}
  </>
);
