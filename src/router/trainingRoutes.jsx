import { Route } from "react-router-dom";
import ProtectedRoute from "../components/wrapper/ProtectedRoute";

// TRAINING MANAGEMENT
import { StudentsListPage } from "../pages/services/TRAINING/students/ListPage";

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
                    <StudentsListPage />
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
    </>
);
