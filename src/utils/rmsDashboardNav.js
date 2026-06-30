import reportManagementMenu from "../data/reportManagementMenu.json";
import { hasPermission } from "./permissions";

export const RMS_DASHBOARD_IDS = ["rms-dashboard", "rms-ed-dashboard"];

const DASHBOARD_ID_SET = new Set(RMS_DASHBOARD_IDS);

export function getRmsDashboardDefinitions() {
  const topSection = reportManagementMenu[0];
  return (topSection?.items || []).filter((item) => DASHBOARD_ID_SET.has(item.id));
}

export function getVisibleRmsDashboards(user) {
  if (!user) return [];
  const userPermissions = user.user_permissions;
  const userRoles = user.groups;
  return getRmsDashboardDefinitions().filter((item) =>
    hasPermission(
      item.permission,
      item.role,
      userPermissions,
      userRoles,
      user,
      item.excludeRoles
    )
  );
}

/** Department dashboard first, then ES/ED dashboard. */
export function getRmsPrimaryDashboardLink(user) {
  const visible = getVisibleRmsDashboards(user);
  if (!visible.length) return "/report-management/dashboard";
  const byId = Object.fromEntries(visible.map((d) => [d.id, d.link]));
  return byId["rms-dashboard"] || byId["rms-ed-dashboard"] || visible[0].link;
}

export function injectRmsSidebarDashboard(items, user) {
  const visible = getVisibleRmsDashboards(user);
  const rest = (items || []).filter((item) => !DASHBOARD_ID_SET.has(item.id));
  if (!visible.length) return rest;

  const dashNav = {
    id: "rms-dashboard-nav",
    text: "Dashboard",
    icon: "bx bx-home-alt",
    available: true,
    link: getRmsPrimaryDashboardLink(user),
    permission: [],
    role: [],
    isMain: true,
    isRmsDashboardNav: true,
  };

  const servicesIdx = rest.findIndex((item) => item.link === "/services");
  if (servicesIdx === -1) return rest;
  return [...rest.slice(0, servicesIdx + 1), dashNav, ...rest.slice(servicesIdx + 1)];
}

export function isRmsDashboardPath(pathname) {
  const p = (pathname || "").split("?")[0];
  return p === "/report-management/dashboard" || p === "/report-management/dashboard/ed";
}
