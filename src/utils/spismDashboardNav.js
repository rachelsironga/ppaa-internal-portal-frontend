import performanceDashboardMenu from "../data/performanceDashboardMenu.json";
import { hasPermission } from "./permissions";

export const SPISM_DASHBOARD_IDS = [
  "spism-dashboard",
  "spism-viewer-dashboard",
  "spism-es-dashboard",
];

const DASHBOARD_ID_SET = new Set(SPISM_DASHBOARD_IDS);

/** Dashboard nav entries from performanceDashboardMenu.json (order preserved). */
export function getSpismDashboardDefinitions() {
  const topSection = performanceDashboardMenu[0];
  return (topSection?.items || []).filter((item) => DASHBOARD_ID_SET.has(item.id));
}

/** Dashboards the current user is allowed to open. */
export function getVisibleSpismDashboards(user) {
  if (!user) return [];
  const userPermissions = user.user_permissions;
  const userRoles = user.groups;
  return getSpismDashboardDefinitions().filter((item) =>
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

/** Default sidebar / entry link — operational first, then approver, then viewer. */
export function getSpismPrimaryDashboardLink(user) {
  const visible = getVisibleSpismDashboards(user);
  if (!visible.length) return "/performance-dashboard";
  const byId = Object.fromEntries(visible.map((d) => [d.id, d.link]));
  return (
    byId["spism-dashboard"] ||
    byId["spism-es-dashboard"] ||
    byId["spism-viewer-dashboard"] ||
    visible[0].link
  );
}

/** Collapse sidebar: one Dashboard link; hide individual dashboard rows. */
export function injectSpismSidebarDashboard(items, user) {
  const visible = getVisibleSpismDashboards(user);
  const rest = (items || []).filter((item) => !DASHBOARD_ID_SET.has(item.id));
  if (!visible.length) return rest;

  const dashNav = {
    id: "spism-dashboard-nav",
    text: "Dashboard",
    icon: "bx bx-home-alt",
    available: true,
    link: getSpismPrimaryDashboardLink(user),
    permission: [],
    role: [],
    isMain: true,
    isSpismDashboardNav: true,
  };

  const servicesIdx = rest.findIndex((item) => item.link === "/services");
  if (servicesIdx === -1) return rest;
  return [...rest.slice(0, servicesIdx + 1), dashNav, ...rest.slice(servicesIdx + 1)];
}

export function isSpismDashboardPath(pathname) {
  const p = (pathname || "").split("?")[0];
  return (
    p === "/performance-dashboard" ||
    p === "/performance-dashboard/viewer-dashboard" ||
    p === "/performance-dashboard/es-dashboard"
  );
}
