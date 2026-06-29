/**
 * Helpers for PR flyer gallery: YouTube / Instagram page URLs → embed iframes.
 */
import { API_BASE_URL } from "../Costants.jsx";

export function prFlyerYoutubeVideoId(url) {
  if (!url || typeof url !== "string") return "";
  const s = url.trim();
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    const path = u.pathname || "";
    if (host === "youtu.be") {
      const seg = path.split("/").filter(Boolean);
      return seg[0] || "";
    }
    if (!host.includes("youtube")) return "";
    const parts = path.split("/").filter(Boolean);
    if (parts[0] === "shorts" || parts[0] === "embed") {
      return parts[1] || "";
    }
    const v = u.searchParams.get("v");
    return v || "";
  } catch {
    return "";
  }
}

export function prFlyerYoutubeEmbedSrc(url) {
  const id = prFlyerYoutubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
}

export function prFlyerInstagramEmbedSrc(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url.trim());
    if (!u.hostname.toLowerCase().includes("instagram.com")) return null;
    const m = u.pathname.match(/\/(p|reel|reels|tv)\/([^/?#]+)/i);
    if (!m) return null;
    const raw = m[1].toLowerCase();
    const kind = raw === "reels" ? "reel" : raw;
    const code = m[2];
    return `https://www.instagram.com/${kind}/${code}/embed`;
  } catch {
    return null;
  }
}

export function prFlyerVideoEmbedSrc(url) {
  if (!url || !String(url).trim()) return null;
  const s = String(url).trim();
  const ig = prFlyerInstagramEmbedSrc(s);
  if (ig) return ig;
  return prFlyerYoutubeEmbedSrc(s);
}

export function prFlyerVideoProviderLabel(url) {
  if (!url || !String(url).trim()) return null;
  const low = String(url).toLowerCase();
  if (low.includes("instagram.com")) return "Instagram";
  if (low.includes("youtu.be") || low.includes("youtube.com")) return "YouTube";
  return "Video";
}

/** Rewrite flyer/logo public URLs to the API base the browser actually uses (fixes wrong LAN host in image_url). */
export function resolvePublicPortalAssetUrl(url) {
  const raw = (url || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.pathname.startsWith("/public/")) {
      return `${API_BASE_URL}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* fall through */
  }
  if (raw.startsWith("/public/")) {
    return `${API_BASE_URL}${raw}`;
  }
  return raw;
}
