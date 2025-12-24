import { Route } from "react-router-dom";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";

// TRAINING MANAGEMENT - DASHBOARD
import { TrainingDashboardPage } from "../pages/services/TRAINING/dashboard/TrainingDashboardPage";

// TRAINING MANAGEMENT - STUDENTS
import { StudentsListPage } from "../pages/services/TRAINING/students/ListPage";
import { StudentDetailsPage } from "../pages/services/TRAINING/students/Details";

// TRAINING MANAGEMENT - APPLICATIONS
import { ApplicationsListPage } from "../pages/services/TRAINING/applications/ListPage";
import { ApplicationDetailsPage } from "../pages/services/TRAINING/applications/Details";
import { StudentApplicationWizard } from "../pages/services/TRAINING/student-application-wizard/StudentApplicationWizard";

// TRAINING MANAGEMENT - ALLOCATIONS
import { AllocationsListPage } from "../pages/services/TRAINING/allocations/ListPage";
import { AllocationDetailsPage } from "../pages/services/TRAINING/allocations/Details";

// TRAINING MANAGEMENT - INSTITUTIONS
import { InstitutionsListPage } from "../pages/services/TRAINING/institutions/ListPage";
import { InstitutionDetailsPage } from "../pages/services/TRAINING/institutions/Details";

// TRAINING MANAGEMENT - MOUS
import { MOUsListPage } from "../pages/services/TRAINING/mous/ListPage";
import { MOUDetailsPage } from "../pages/services/TRAINING/mous/Details";

// TRAINING MANAGEMENT - BATCH TRAININGS
import { BatchTrainingsListPage } from "../pages/services/TRAINING/batches/ListPage";
import { BatchTrainingsDetailsPage } from "../pages/services/TRAINING/batches/Details";

// TRAINING MANAGEMENT - SETUPS
import { TrainingSetupsListPage } from "../pages/services/TRAINING/setups/ListPage";

const requiredRoles = [
    "Training_Head",
    "Head_of_Training_Secretary",
    "Training_Coordinator",
    "Training_Auditor",
    "Department_Training_User",
    "Training_ReadOnly_User",
    "admin",
];

export const trainingRoutes = (
    <>
        {/* DASHBOARD ROUTE */}
        <Route
            path="/training/dashboard"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_student"]}
                    requiredRoles={requiredRoles}
                >
                    <TrainingDashboardPage />
                </ProtectedRoute>
            }
        />

        {/* STUDENTS ROUTES */}
        <Route
            path="/training/students"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_student"]}
                    requiredRoles={requiredRoles}
                >
                    <StudentsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/students/create"
            element={
                <ProtectedRoute
                    requiredPermissions={["add_student"]}
                    requiredRoles={requiredRoles}
                >
                    <StudentsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/students/:uid"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_student"]}
                    requiredRoles={requiredRoles}
                >
                    <StudentDetailsPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/students/:uid/edit"
            element={
                <ProtectedRoute
                    requiredPermissions={["change_student"]}
                    requiredRoles={requiredRoles}
                >
                    <StudentsListPage />
                </ProtectedRoute>
            }
        />

        {/* STUDENT & APPLICATION WIZARD */}
        <Route
            path="/training/student/application/add"
            element={
                <ProtectedRoute
                    requiredPermissions={["add_student", "add_application"]}
                    requiredRoles={requiredRoles}
                >
                    <StudentApplicationWizard />
                </ProtectedRoute>
            }
        />

        {/* APPLICATIONS ROUTES */}
        <Route
            path="/training/applications"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_application"]}
                    requiredRoles={requiredRoles}
                >
                    <ApplicationsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/applications/create"
            element={
                <ProtectedRoute
                    requiredPermissions={["add_application"]}
                    requiredRoles={requiredRoles}
                >
                    <ApplicationsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/applications/:uid"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_application"]}
                    requiredRoles={requiredRoles}
                >
                    <ApplicationDetailsPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/applications/:uid/edit"
            element={
                <ProtectedRoute
                    requiredPermissions={["change_application"]}
                    requiredRoles={requiredRoles}
                >
                    <ApplicationsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/search-applications"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_application"]}
                    requiredRoles={requiredRoles}
                >
                    <ApplicationsListPage />
                </ProtectedRoute>
            }
        />

        {/* ALLOCATIONS ROUTES */}
        <Route
            path="/training/allocation"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_departmentallocation"]}
                    requiredRoles={requiredRoles}
                >
                    <AllocationsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/allocation/create"
            element={
                <ProtectedRoute
                    requiredPermissions={["add_departmentallocation"]}
                    requiredRoles={requiredRoles}
                >
                    <AllocationsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/allocation/:uid"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_departmentallocation"]}
                    requiredRoles={requiredRoles}
                >
                    <AllocationDetailsPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/allocation/:uid/edit"
            element={
                <ProtectedRoute
                    requiredPermissions={["change_departmentallocation"]}
                    requiredRoles={requiredRoles}
                >
                    <AllocationsListPage />
                </ProtectedRoute>
            }
        />

        {/* INSTITUTIONS ROUTES */}
        <Route
            path="/training/institutions"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_institution"]}
                    requiredRoles={requiredRoles}
                >
                    <InstitutionsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/institutions/create"
            element={
                <ProtectedRoute
                    requiredPermissions={["add_institution"]}
                    requiredRoles={requiredRoles}
                >
                    <InstitutionsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/institutions/:uid"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_institution"]}
                    requiredRoles={requiredRoles}
                >
                    <InstitutionDetailsPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/institutions/:uid/edit"
            element={
                <ProtectedRoute
                    requiredPermissions={["change_institution"]}
                    requiredRoles={requiredRoles}
                >
                    <InstitutionsListPage />
                </ProtectedRoute>
            }
        />

        {/* MOUS ROUTES */}
        <Route
            path="/training/mous"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_mou"]}
                    requiredRoles={requiredRoles}
                >
                    <MOUsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/mous/create"
            element={
                <ProtectedRoute
                    requiredPermissions={["add_mou"]}
                    requiredRoles={requiredRoles}
                >
                    <MOUsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/mous/:uid"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_mou"]}
                    requiredRoles={requiredRoles}
                >
                    <MOUDetailsPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/mous/:uid/edit"
            element={
                <ProtectedRoute
                    requiredPermissions={["change_mou"]}
                    requiredRoles={requiredRoles}
                >
                    <MOUsListPage />
                </ProtectedRoute>
            }
        />

        {/* BATCH TRAININGS ROUTES */}
        <Route
            path="/training/batch-trainings"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_trainingbatch"]}
                    requiredRoles={requiredRoles}
                >
                    <BatchTrainingsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/batch-trainings/create"
            element={
                <ProtectedRoute
                    requiredPermissions={["add_trainingbatch"]}
                    requiredRoles={requiredRoles}
                >
                    <BatchTrainingsListPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/batch-trainings/:uid"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_trainingbatch"]}
                    requiredRoles={requiredRoles}
                >
                    <BatchTrainingsDetailsPage />
                </ProtectedRoute>
            }
        />

        <Route
            path="/training/batch-trainings/:uid/edit"
            element={
                <ProtectedRoute
                    requiredPermissions={["change_trainingbatch"]}
                    requiredRoles={requiredRoles}
                >
                    <BatchTrainingsListPage />
                </ProtectedRoute>
            }
        />

        {/* TRAINING SETUPS ROUTES */}
        <Route
            path="/training/setups"
            element={
                <ProtectedRoute
                    requiredPermissions={["view_trainingsetting"]}
                    requiredRoles={requiredRoles}
                >
                    <TrainingSetupsListPage />
                </ProtectedRoute>
            }
        />
    </>
);
