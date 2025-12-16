import { Route } from "react-router-dom";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";

// TRAINING MANAGEMENT - STUDENTS
import { StudentsListPage } from "../pages/services/TRAINING/students/ListPage";
import { StudentDetailsPage } from "../pages/services/TRAINING/students/Details";

// TRAINING MANAGEMENT - APPLICATIONS
import { ApplicationsListPage } from "../pages/services/TRAINING/applications/ListPage";
import { ApplicationDetailsPage } from "../pages/services/TRAINING/applications/Details";

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
    </>
);
