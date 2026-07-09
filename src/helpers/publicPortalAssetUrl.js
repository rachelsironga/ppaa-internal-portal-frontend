import { API_BASE_URL } from "../Costants";

/**
 * Public portal assets (quick-link logos, popup/PR images) are returned as absolute URLs
 * built with ``PUBLIC_API_ORIGIN`` on the server. Rewrite ``/public/`` and ``/media/``
 * paths to the API origin the browser actually uses (``VITE_API_URL`` / ``API_BASE_URL``).
 */
export function normalizePublicPortalAssetUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // YouTube / external thumbnails — use as-is
  if (/^https?:\/\//i.test(trimmed) && !trimmed.includes("/public/") && !trimmed.includes("/media/")) {
    return trimmed;
  }

  const base = (API_BASE_URL || "").replace(/\/+$/, "");
  if (!base) return trimmed;

  try {
    const parsed = new URL(trimmed, `${base}/`);
    const path = parsed.pathname;
    if (!path.startsWith("/public/") && !path.startsWith("/media/")) {
      return trimmed;
    }
    const api = new URL(`${base}/`);
    // Same origin as SPA → relative path works through host nginx
    if (typeof window !== "undefined" && window.location.origin === api.origin) {
      return `${path}${parsed.search}`;
    }
    return `${api.origin}${path}${parsed.search}`;
  } catch {
    if (trimmed.startsWith("/public/") || trimmed.startsWith("/media/")) {
      return trimmed;
    }
    return trimmed;
  }
}
