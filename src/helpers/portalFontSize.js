/** Shared portal text scale (public landing + authenticated internal portal). */
export const PORTAL_FONT_STORAGE_KEY = "portalFontSize";

const MIN_PCT = 70;
const MAX_PCT = 150;

export function clampPortalFontPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 100;
  return Math.min(MAX_PCT, Math.max(MIN_PCT, Math.round(x)));
}

export function readPortalFontPct() {
  try {
    const raw = localStorage.getItem(PORTAL_FONT_STORAGE_KEY);
    if (raw == null || raw === "") return 100;
    return clampPortalFontPct(parseInt(raw, 10));
  } catch {
    return 100;
  }
}

/**
 * Apply scale to the document root so all `rem`-based UI (Bootstrap, cards) follows the setting.
 * Also updates `--bs-root-font-size`, which the theme pins on :root.
 */
export function applyPortalRootFontSize(pct) {
  const p = clampPortalFontPct(pct);
  const root = document.documentElement;
  root.style.fontSize = `${p}%`;
  const rootPx = 16 * (p / 100);
  root.style.setProperty("--bs-root-font-size", `${rootPx}px`);
  root.setAttribute("data-portal-font-pct", String(p));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("portal-font-size-changed", { detail: p }));
  }
}

export function persistAndApplyPortalFontSize(pct) {
  const p = clampPortalFontPct(pct);
  try {
    localStorage.setItem(PORTAL_FONT_STORAGE_KEY, String(p));
  } catch {
    // ignore quota / private mode
  }
  applyPortalRootFontSize(p);
  return p;
}
