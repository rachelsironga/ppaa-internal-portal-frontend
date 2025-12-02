import { AnalyticalDashboardPage } from "../../../pages/services/analytics/dashboard/AnalyticalDashboardPage.jsx";
import { BlockListPage } from "../../../pages/services/analytics/blocks/BlockListPage.jsx";
import { ClinicListPage } from "../../../pages/services/analytics/clinics/ClinicListPage.jsx";
import { DepartmentsListPage } from "../../../pages/services/analytics/departments/DepartmentsListPage.jsx";
import { PaymentModeListPage } from "../../../pages/services/analytics/payment_model/PaymentModeListPage.jsx";
import { AttendanceListPage } from "../../../pages/services/analytics/attendance/AttendanceListPage.jsx";
// import { AttendanceSummaryPage } from "../../../pages/services/analytics/attendance/AttendanceSummaryPage.jsx";
import { PatientTrendsPage } from "../../../pages/services/analytics/patients/PatientTrendsPage.jsx";
// import { PaymentDistributionPage } from "../../../pages/services/analytics/payment_model/PaymentDistributionPage.jsx";
// import { BlockClinicDistributionPage } from "../../../pages/services/analytics/clinics/BlockClinicDistributionPage.jsx";
import ProtectedRoute from "../../../components/wrapper/ProtectedRoute";

const analyticsPermissions = {
    dashboard: ["view_dashboard"],
    blocks: ["view_block", "add_block", "change_block", "delete_block"],
    clinics: ["view_clinic", "add_clinic", "change_clinic", "delete_clinic"],
    departments: ["can_view_department", "can_add_department", "can_delete_department"],
    paymentModes: ["view_paymentmode", "add_paymentmode", "change_paymentmode", "delete_paymentmode"],
    attendances: ["view_attendance", "add_attendance", "change_attendance", "delete_attendance"],
    patientTrends: ["view_attendance", "view_patientattendance"],
    roles: [
        "admin",
        "analytical_data_entry",
        "analytical_supervisor",
        "analytical_head",
        "ReadOnly_User",
    ],
    readOnlyRoles: ["admin", "ReadOnly_User"],
}

export const analyticsRoutes = [
    {
        path: "/analytics/dashboard",
        element: (
            <ProtectedRoute
                requiredPermissions={analyticsPermissions.dashboard}
                requiredRoles={analyticsPermissions.roles}
            >
                <AnalyticalDashboardPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/analytics/blocks",
        element: (
            <ProtectedRoute
                requiredPermissions={analyticsPermissions.blocks}
                requiredRoles={analyticsPermissions.roles}
            >
                <BlockListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/analytics/clinics",
        element: (
            <ProtectedRoute
                requiredPermissions={analyticsPermissions.clinics}
                requiredRoles={analyticsPermissions.roles}
            >
                <ClinicListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/analytics/departments",
        element: (
            <ProtectedRoute
                requiredPermissions={analyticsPermissions.departments}
                requiredRoles={analyticsPermissions.roles}
            >
                <DepartmentsListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/analytics/payment-modes",
        element: (
            <ProtectedRoute
                requiredPermissions={analyticsPermissions.paymentModes}
                requiredRoles={analyticsPermissions.roles}
            >
                <PaymentModeListPage />
            </ProtectedRoute>
        ),
    },
    {
        path: "/analytics/attendances",
        element: (
            <ProtectedRoute
                requiredPermissions={analyticsPermissions.attendances}
                requiredRoles={analyticsPermissions.roles}
            >
                <AttendanceListPage />
            </ProtectedRoute>
        ),
    },
    // {
    //     path: "/analytics/attendances/summary",
    //     element: (
    //         <ProtectedRoute
    //             requiredPermissions={analyticsPermissions.attendanceSummary}
    //             requiredRoles={analyticsPermissions.readOnlyRoles}
    //         >
    //             <AttendanceSummaryPage />
    //         </ProtectedRoute>
    //     ),
    // },
    // {
    //     path: "/analytics/patient-attendances",
    //     element: (
    //         <ProtectedRoute
    //             requiredPermissions={analyticsPermissions.patientAttendances}
    //             requiredRoles={analyticsPermissions.roles}
    //         >
    //             <PatientAttendanceListPage />
    //         </ProtectedRoute>
    //     ),
    // },
    {
        path: "/analytics/patient-trends",
        element: (
            <ProtectedRoute
                requiredPermissions={analyticsPermissions.patientTrends}
                requiredRoles={analyticsPermissions.roles}
            >
                <PatientTrendsPage />
            </ProtectedRoute>
        ),
    },
    // {
    //     path: "/analytics/dashboard/payment-distribution",
    //     element: (
    //         <ProtectedRoute
    //             requiredPermissions={analyticsPermissions.paymentDistribution}
    //             requiredRoles={analyticsPermissions.readOnlyRoles}
    //         >
    //             <PaymentDistributionPage />
    //         </ProtectedRoute>
    //     ),
    // },
    // {
    //     path: "/analytics/dashboard/block-clinic-distribution",
    //     element: (
    //         <ProtectedRoute
    //             requiredPermissions={analyticsPermissions.blockClinicDistribution}
    //             requiredRoles={analyticsPermissions.readOnlyRoles}
    //         >
    //             <BlockClinicDistributionPage />
    //         </ProtectedRoute>
    //     ),
    // }
];