import { Navigate, Route, Routes } from "react-router-dom";
// Layout
import { WithoutMenuPage } from "../pages/layouts/WithoutMenuPage";
import { WithoutNavbarPage } from "../pages/layouts/WithoutNavbarPage";
import { ContainerPage } from "../pages/layouts/ContainerPage";
import { FluidPage } from "../pages/layouts/FluidPage";
import { BlankPage } from "../pages/layouts/BlankPage";

import LoginPage from "../pages/authentication/LoginPage";
import RegisterPage from "../pages/authentication/RegisterPage";
import { ForgotPasswordPage } from "../pages/authentication/ForgotPasswordPage";
import { AccountPage } from "../pages/account/AccountPage";
import { Connections } from "../pages/account/ConnectionsPage";
import { NotificationPage } from "../pages/account/NotificationPage";
import { ErrorPage } from "../pages/misc/ErrorPage";
import { MaintenancePage } from "../pages/misc/MaintenancePage";

import { AccordionPage } from "../pages/user-interface/AccordionPage";
import { AlertPage } from "../pages/user-interface/AlertPage";
import { BadgesPage } from "../pages/user-interface/BadgePage";
import { ButtonPage } from "../pages/user-interface/ButtonPage";
import { CarouselPage } from "../pages/user-interface/CarouselPage";
import { CardsPage } from "../pages/user-interface/CardsPage";
import { CollapsePage } from "../pages/user-interface/CollapsePage";
import { DropdownPage } from "../pages/user-interface/DropdownPage";
import { FooterPage } from "../pages/user-interface/FooterPage";
import { ListGroupPage } from "../pages/user-interface/ListGroupPage";
import { ModalPage } from "../pages/user-interface/ModalPage";
import { NavbarPage } from "../pages/user-interface/NavbarPage";
import { OffcanvasPage } from "../pages/user-interface/OffcanvasPage";
import { PaginationBreadcrumbsPage } from "../pages/user-interface/PaginationBreadcrumbsPage";
import { ProgressPage } from "../pages/user-interface/ProgressPage";
import { SpinnersPage } from "../pages/user-interface/SpinnersPage";
import { TabsPillPage } from "../pages/user-interface/TabsPillPage";
import { ToastPage } from "../pages/user-interface/ToastPage";
import { TooltipPopoverPage } from "../pages/user-interface/TooltipPopoverPage";
import { TypographyPage } from "../pages/user-interface/TypographyPage";

import { BoxiconsPage } from "../pages/icons/BoxiconPage";

import { BasicInputPage } from "../pages/form-element/BasicInputPage";
import { InputGroupPage } from "../pages/form-element/InputGroupPage";
import { HorizontalFormPage } from "../pages/form-layout/HorizontalFormPage";
import { VerticalFormPage } from "../pages/form-layout/VerticalFormPage";
import { TablesPage } from "../pages/TablesPage";
import { DashboardPage } from "../pages/DashboardPage";

import { PerfectScrollbarPage } from "../pages/extended-ui/PerfectScrollbar";
import { TextDividerPage } from "../pages/extended-ui/TextDividerPage";
import ChangePassword from "../pages/account/ChangePassword";
import { DepartmentPage } from "../pages/department/View";
import { PositionalLevelPage } from "../pages/positional_level/View";
import { ApprovalActionPage } from "../pages/approval_action/View";
import { ApprovalModulePage } from "../pages/approval_module/View";
import { ApprovalModuleOpenPage } from "../pages/approval_module/Open";
import { ApprovalRequestPage } from "../pages/approval_request/View";
import { DirectoryPage } from "../pages/directory/View";
import { DirectoryOpenPage } from "../pages/directory/Open";
import { UserListPage } from "../pages/users/View";
import { UserOpenPage } from "../pages/users/Open";
import { DateRangePage } from "../pages/date_range/View";




function Logout() {
    localStorage.clear
    return <Navigate to="/auth/login" />
}

function RegisterAndLogout() {
    localStorage.clear
    return <RegisterPage />
}


const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterAndLogout />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/" element={<DashboardPage />} />
            <Route path="*" element={<ErrorPage />} />

            {/* settings */}
            <Route path="/settings/directories" element={<DirectoryPage />} />
            <Route path="/settings/directory-open/:uid" element={<DirectoryOpenPage />} />
            <Route path="/settings/departments" element={<DepartmentPage />} />
            <Route path="/settings/positional-levels" element={<PositionalLevelPage />} />
            <Route path="/settings/approval-actions" element={<ApprovalActionPage />} />
            <Route path="/settings/approval-modules" element={<ApprovalModulePage />} />
            <Route path="/settings/approval-modules-open/:uid" element={<ApprovalModuleOpenPage />} />
            <Route path="/settings/date-ranges" element={<DateRangePage />} />

            {/* Users */}
            <Route path="/users/list" element={<UserListPage />} />
            <Route path="/users/view/:uid" element={<UserOpenPage />} />

            {/* Requestes */}
            <Route path="/requests" element={<ApprovalRequestPage />} />


            <Route path="/layout/without-menu" element={<WithoutMenuPage />} />
            <Route path="/layout/without-navbar" element={<WithoutNavbarPage />} />
            <Route path="/layout/container" element={<ContainerPage />} />
            <Route path="/layout/fluid" element={<FluidPage />} />
            <Route path="/layout/fluid" element={<FluidPage />} />
            <Route path="/layout/blank" element={<BlankPage />} />

            <Route path="/ui/accordion" element={<AccordionPage />} />
            <Route path="/ui/alerts" element={<AlertPage />} />
            <Route path="/ui/badges" element={<BadgesPage />} />
            <Route path="/ui/buttons" element={<ButtonPage />} />
            <Route path="/ui/cards" element={<CardsPage />} />
            <Route path="/ui/carousel" element={<CarouselPage />} />
            <Route path="/ui/collapse" element={<CollapsePage />} />
            <Route path="/ui/dropdown" element={<DropdownPage />} />
            <Route path="/ui/footer" element={<FooterPage />} />
            <Route path="/ui/list-group" element={<ListGroupPage />} />
            <Route path="/ui/modals" element={<ModalPage />} />
            <Route path="/ui/navbar" element={<NavbarPage />} />
            <Route path="/ui/offcanvas" element={<OffcanvasPage />} />
            <Route path="/ui/pagination-breadcrumbs" element={<PaginationBreadcrumbsPage />} />
            <Route path="/ui/progress" element={<ProgressPage />} />
            <Route path="/ui/spinners" element={<SpinnersPage />} />
            <Route path="/ui/tabs-pills" element={<TabsPillPage />} />
            <Route path="/ui/toasts" element={<ToastPage />} />
            <Route path="/ui/tooltips-popovers" element={<TooltipPopoverPage />} />
            <Route path="/ui/typography" element={<TypographyPage />} />


            <Route path="/account/settings" element={<AccountPage />} />
            <Route path="/account/notifications" element={<NotificationPage />} />
            <Route path="/account/connections" element={<Connections />} />
            <Route path="/account/password" element={<ChangePassword />} />

            <Route path="/misc/error" element={<ErrorPage />} />
            <Route path="/misc/under-maintenance" element={<MaintenancePage />} />

            <Route path="/extended-ui/perfect-scrollbar" element={<PerfectScrollbarPage />} />
            <Route path="/extended-ui/text-divider" element={<TextDividerPage />} />

            <Route path="/boxicons" element={<BoxiconsPage />} />

            <Route path="/form/basic-inputs" element={<BasicInputPage />} />
            <Route path="/form/input-groups" element={<InputGroupPage />} />

            <Route path="/form-layout/horizontal-form" element={<HorizontalFormPage />} />
            <Route path="/form-layout/vertical-form" element={<VerticalFormPage />} />

            <Route path="/tables" element={<TablesPage />} />
        </Routes>
    )
}
export default AppRoutes;