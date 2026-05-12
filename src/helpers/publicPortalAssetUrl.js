import { API_BASE_URL } from "../Costants";

/**
 * Public portal assets (quick-link logos, popup/PR images) are returned as absolute URLs
 * built with ``PUBLIC_API_ORIGIN`` on the server. If that host/port does not match what the
 * browser uses for API calls (``VITE_API_URL`` / ``API_BASE_URL``), ``<img src>`` fails and
 * UI may hide broken images — rewrite ``/public/...`` paths to the SPA's configured API origin.
 */
export function normalizePublicPortalAssetUrl(url) {
  if (!url || typeof url !== "string") return "";
  const base = (API_BASE_URL || "").replace(/\/+$/, "");
  if (!base) return url;
  try {
    const parsed = new URL(url.trim(), `${base}/`);
    if (!parsed.pathname.startsWith("/public/")) return url.trim();
    const api = new URL(`${base}/`);
    return `${api.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url.trim();
  }
}
