import { hasPermission, canAccessServiceMenu } from "./permissions";
import servicesConfig from "../data/servicesConfig";

/** Whether the current user may open a service card / navbar link. */
export function isServiceVisible(service, userPermissions, userRoles, user) {
  const cfg = servicesConfig.find(
    (s) => s.id === service.id || s.link === service.link
  );
  if (cfg) {
    const viaMenu = canAccessServiceMenu(cfg.menu, userPermissions, userRoles, user);
    if (viaMenu !== null) return viaMenu;
  }
  return hasPermission(
    service.permission,
    service.role,
    userPermissions,
    userRoles,
    user
  );
}
