/** Shared with public PortalPage and authenticated internal portal (Layout / StaffDashboard). */
export const PORTAL_THEME_STORAGE_KEY = "portalTheme";

export function readPortalThemeIsDark() {
  try {
    return localStorage.getItem(PORTAL_THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

export function applyPortalThemeToDocument(isDark) {
  const root = document.documentElement;
  if (isDark) {
    root.setAttribute("data-portal-theme", "dark");
    try {
      localStorage.setItem(PORTAL_THEME_STORAGE_KEY, "dark");
    } catch {
      /* ignore */
    }
  } else {
    root.removeAttribute("data-portal-theme");
    try {
      localStorage.setItem(PORTAL_THEME_STORAGE_KEY, "light");
    } catch {
      /* ignore */
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("portal-theme-changed", { detail: !!isDark }));
  }
}
