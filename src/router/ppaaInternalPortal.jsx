import { Route } from "react-router-dom";
import ProtectedRoute from "../components/wrapper/ProtectedRoute.jsx";
import { StaffDashboard } from "../pages/services/PPAA-INTERNAL-PORTAL/Dashboards/StaffDashboard.jsx";
import { DepartmentPage } from "../pages/services/PPAA-INTERNAL-PORTAL/departments/View.jsx";
import { DepartmentOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/departments/Open.jsx";
import { DocumentPage } from "../pages/services/PPAA-INTERNAL-PORTAL/documents/View.jsx";
import { DocumentOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/documents/Open.jsx";
import { EventPage } from "../pages/services/PPAA-INTERNAL-PORTAL/events/View.jsx";
import { EventOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/events/Open.jsx";
import { PositionalLevelPage } from "../pages/services/PPAA-INTERNAL-PORTAL/positional_levels/View.jsx";
import { PositionalLevelOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/positional_levels/Open.jsx";
import { DocumentCategoryPage } from "../pages/services/PPAA-INTERNAL-PORTAL/document_categories/View.jsx";
import { AuditLogPage } from "../pages/services/PPAA-INTERNAL-PORTAL/audit_logs/View.jsx";
import { AuditLogOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/audit_logs/Open.jsx";
import { FAQPage } from "../pages/services/PPAA-INTERNAL-PORTAL/faqs/View.jsx";
import { FAQOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/faqs/Open.jsx";
import { AnnouncementPage } from "../pages/services/PPAA-INTERNAL-PORTAL/announcements/View.jsx";
import { AnnouncementOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/announcements/Open.jsx";
import { TodoPage } from "../pages/services/PPAA-INTERNAL-PORTAL/todos/View.jsx";
import { TodoOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/todos/Open.jsx";
import { QuickLinkPage } from "../pages/services/PPAA-INTERNAL-PORTAL/quick_links/View.jsx";
import { QuickLinkOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/quick_links/Open.jsx";
import { PopupCardPage } from "../pages/services/PPAA-INTERNAL-PORTAL/popup_cards/View.jsx";
import { PopupCardOpenPage } from "../pages/services/PPAA-INTERNAL-PORTAL/popup_cards/Open.jsx";

export const ppaaInternalPortalRoutes = (
  <>
    <Route path="/ppaa-internal-portal" element={<StaffDashboard />} />

    <Route
      path="/ppaa-internal-portal/departments"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_department",
            "can_add_department",
            "can_edit_department",
          ]}
          requiredRoles={["admin"]}
        >
          <DepartmentPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/departments/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_department",
            "can_add_department",
            "can_edit_department",
          ]}
          requiredRoles={["admin"]}
        >
          <DepartmentOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/documents"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_document",
            "can_add_document",
            "can_edit_document",
          ]}
        >
          <DocumentPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/documents/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_document",
            "can_add_document",
            "can_edit_document",
          ]}
        >
          <DocumentOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/events"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_event",
            "can_add_event",
            "can_edit_event",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <EventPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/events/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_event",
            "can_add_event",
            "can_edit_event",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <EventOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/document-categories"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_document",
            "can_add_document",
            "can_edit_document",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <DocumentCategoryPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/positional-levels"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_department",
            "can_add_department",
            "can_edit_department",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <PositionalLevelPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/positional-levels/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_department",
            "can_add_department",
            "can_edit_department",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <PositionalLevelOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/audit-logs"
      element={
        <ProtectedRoute
          requiredPermissions={["can_view_audit_log"]}
          requiredRoles={["admin", "ICT"]}
        >
          <AuditLogPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/audit-logs/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["can_view_audit_log"]}
          requiredRoles={["admin", "ICT"]}
        >
          <AuditLogOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/faqs"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_faq",
            "can_add_faq",
            "can_edit_faq",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <FAQPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/faqs/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_faq",
            "can_add_faq",
            "can_edit_faq",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <FAQOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/announcements"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_announcement",
            "can_add_announcement",
            "can_edit_announcement",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <AnnouncementPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/announcements/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_announcement",
            "can_add_announcement",
            "can_edit_announcement",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <AnnouncementOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/todos"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_todo",
            "can_add_todo",
            "can_edit_todo",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <TodoPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/todos/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_todo",
            "can_add_todo",
            "can_edit_todo",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <TodoOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/quick-links"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_quick_link",
            "can_add_quick_link",
            "can_edit_quick_link",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <QuickLinkPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/quick-links/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_quick_link",
            "can_add_quick_link",
            "can_edit_quick_link",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <QuickLinkOpenPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/ppaa-internal-portal/popup-cards"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_popup_card",
            "can_add_popup_card",
            "can_edit_popup_card",
          ]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <PopupCardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/ppaa-internal-portal/popup-cards/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={["can_view_popup_card"]}
          requiredRoles={["admin", "HR", "ICT"]}
        >
          <PopupCardOpenPage />
        </ProtectedRoute>
      }
    />
    {/* <Route
      path="/mnh-connect/requests-handling/open/:uid"
      element={
        <ProtectedRoute
          requiredPermissions={[
            "can_view_request_handling",
            "can_perform_request_handling",
          ]}
          requiredRoles={["Request_Handler"]}
        >
          <RequestHandlingOpenPage />
        </ProtectedRoute>
      }
    /> */}
  </>
);
