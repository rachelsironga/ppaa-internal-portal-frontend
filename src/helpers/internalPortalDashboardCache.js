/** Session cache keys used by StaffDashboard and the public PortalPage dashboard. */

export const PUBLIC_DASHBOARD_CACHE_KEY = "publicPortalDashboardCache";
const STAFF_DASHBOARD_CACHE_PREFIX = "internalPortalDashboardCache:";

/** Clear dashboard caches after portal content changes (events, announcements, etc.). */
export function invalidateInternalPortalDashboardCaches() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (
        key &&
        (key === PUBLIC_DASHBOARD_CACHE_KEY ||
          key.startsWith(STAFF_DASHBOARD_CACHE_PREFIX))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Ignore private mode / quota errors.
  }
}
