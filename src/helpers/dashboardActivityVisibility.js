import { useEffect, useState } from "react";

/**
 * Parse dashboard deadline strings the same way Django treats UTC instants:
 * - `YYYY-MM-DD` → UTC midnight that calendar day
 * - `YYYY-MM-DDThh:mm:ss` without offset → UTC (naive ISO from DRF + UTC storage)
 */
function parseDashboardDeadlineUtc(deadlineValue) {
  if (deadlineValue == null || deadlineValue === "") return null;
  const s = String(deadlineValue).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T00:00:00.000Z`);
  }
  const hasExplicitTz =
    /[zZ]\s*$/.test(s) || /[+-]\d{2}:?\d{2}\s*$/.test(s) || /[+-]\d{4}\s*$/.test(s);
  if (s.includes("T") && !hasExplicitTz) {
    const normalized = s.endsWith("Z") || s.endsWith("z") ? s : `${s}Z`;
    const d = new Date(normalized);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(s);
}

/**
 * Announcements, events, and todos stay on the dashboard through the calendar
 * day after their deadline (end_date / due_date). No deadline => no expiry.
 *
 * Uses UTC calendar dates to match Django `portal_dashboard_deadline_grace_q`
 * when `TIME_ZONE` is `UTC` (same rule as `/api/internal-portal/dashboard-summary`).
 */
export function isWithinDashboardDeadlineGrace(deadlineValue) {
  if (deadlineValue == null || deadlineValue === "") return true;
  const parsed = parseDashboardDeadlineUtc(deadlineValue);
  if (Number.isNaN(parsed.getTime())) return true;
  const y = parsed.getUTCFullYear();
  const m = parsed.getUTCMonth();
  const d = parsed.getUTCDate();
  const lastVisibleDayStart = Date.UTC(y, m, d + 1);
  const now = new Date();
  const todayStart = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  return todayStart <= lastVisibleDayStart;
}

/**
 * Order events for the welcome highlight: in progress, then upcoming, then
 * recently ended (still returned by the API grace window).
 */
export function sortPortalHighlightEvents(list) {
  const arr = [...(list || [])];
  const now = Date.now();
  const bucket = (e) => {
    const sRaw = parseDashboardDeadlineUtc(e?.start_date);
    const edRaw = parseDashboardDeadlineUtc(e?.end_date);
    const s = sRaw && !Number.isNaN(sRaw.getTime()) ? sRaw.getTime() : NaN;
    const ed = edRaw && !Number.isNaN(edRaw.getTime()) ? edRaw.getTime() : NaN;
    if (!Number.isNaN(s) && !Number.isNaN(ed) && s <= now && now <= ed) return 0;
    if (!Number.isNaN(s) && s > now) return 1;
    return 2;
  };
  arr.sort((a, b) => {
    const d = bucket(a) - bucket(b);
    if (d !== 0) return d;
    const as = parseDashboardDeadlineUtc(a?.start_date)?.getTime() ?? 0;
    const bs = parseDashboardDeadlineUtc(b?.start_date)?.getTime() ?? 0;
    return as - bs;
  });
  return arr;
}

/**
 * One welcome highlight carousel: interleave announcement → todo → event so
 * all types share the same rotation (not three separate blocks).
 */
export function buildInterleavedPortalHighlightItems({
  announcements = [],
  todos = [],
  events = [],
  maxPerType = 5,
  maxTotal = 18,
} = {}) {
  const ann = (announcements || []).slice(0, maxPerType);
  const tds = (todos || []).slice(0, maxPerType);
  const evs = sortPortalHighlightEvents(events || []).slice(0, maxPerType);
  const items = [];
  const rounds = Math.max(ann.length, tds.length, evs.length);
  for (let i = 0; i < rounds && items.length < maxTotal; i++) {
    if (i < ann.length) {
      items.push({ type: "announcement", data: ann[i] });
      if (items.length >= maxTotal) break;
    }
    if (i < tds.length) {
      items.push({ type: "todo", data: tds[i] });
      if (items.length >= maxTotal) break;
    }
    if (i < evs.length && items.length < maxTotal) {
      items.push({ type: "event", data: evs[i] });
    }
  }
  return items;
}

/** YYYY-MM-DD in UTC; changes after each UTC midnight so memoized filters re-run. */
export function useUtcDateKey() {
  const [key, setKey] = useState(() => utcDateKeyNow());

  useEffect(() => {
    const now = new Date();
    const msToNextUtcMidnight =
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        1
      ) - now.getTime();
    const id = window.setTimeout(() => {
      setKey(utcDateKeyNow());
    }, Math.max(msToNextUtcMidnight, 1000));
    return () => window.clearTimeout(id);
  }, [key]);

  return key;
}

function utcDateKeyNow() {
  const n = new Date();
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, "0")}-${String(
    n.getUTCDate()
  ).padStart(2, "0")}`;
}

export function filterDashboardAnnouncements(list) {
  return (list || []).filter((a) =>
    isWithinDashboardDeadlineGrace(a.end_date)
  );
}

export function filterDashboardEvents(list) {
  return (list || []).filter((e) =>
    isWithinDashboardDeadlineGrace(e.end_date)
  );
}

export function filterDashboardTodos(list) {
  return (list || []).filter((t) =>
    isWithinDashboardDeadlineGrace(t.due_date)
  );
}

/** Announcements created within the last N days show as "new" on dashboard cards. */
export function isPortalAnnouncementNew(createdAt, maxDays = 7) {
  if (createdAt == null || createdAt === "") return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const ageMs = Date.now() - created.getTime();
  if (ageMs < 0) return false;
  return ageMs <= maxDays * 86400000;
}

/**
 * Left accent color for dashboard todo list rows (priority first, then status).
 * Aligns with common badge semantics: urgent = red, pending = amber, etc.
 */
export function getTodoDashboardAccentColor(todo) {
  const p = String(todo?.priority ?? "").toUpperCase();
  if (p === "URGENT") return "#dc3545";
  if (p === "HIGH") return "#fd7e14";
  if (p === "MEDIUM") return "#0d6efd";
  if (p === "LOW") return "#5c8f6e";
  const s = String(todo?.status ?? "").toUpperCase();
  if (s === "PENDING") return "#f0ad4e";
  if (s === "IN_PROGRESS") return "#17a2b8";
  if (s === "COMPLETED") return "#00853f";
  if (s === "CANCELLED") return "#6c757d";
  return "#00853f";
}
