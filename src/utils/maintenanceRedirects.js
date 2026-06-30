/** Apps shown on /services that route to MaintenancePage while under development. */
export const MAINTENANCE_APP_PATH_PREFIXES = [
  "/help-desk",
];

export function pathIsUnderMaintenanceApp(path) {
  const p = (path || "").split("?")[0].replace(/\/$/, "") || "/";
  return MAINTENANCE_APP_PATH_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`)
  );
}

/** Use for navigate(): canonical URL for the maintenance screen. */
export function maintenanceScreenPath() {
  return "/maintenance";
}
