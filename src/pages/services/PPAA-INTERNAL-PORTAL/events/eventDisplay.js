/** Shared event list/detail display: type badges, title truncation, lifecycle status. */

/** Narrow single-column title (legacy). */
export const EVENT_TITLE_TABLE_MAX_CHARS = 64;
/** Wider limit when title shares a cell with badges and meta only (events table). */
export const EVENT_MERGED_TITLE_MAX_CHARS = 160;

const NEW_EVENT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const EVENT_TYPE_CONFIG = {
  MEETING: { class: "bg-primary", label: "Meeting" },
  TRAINING: { class: "bg-info", label: "Training" },
  WORKSHOP: { class: "bg-success", label: "Workshop" },
  HOLIDAY: { class: "bg-warning text-dark", label: "Holiday" },
  OTHER: { class: "bg-secondary", label: "Other" },
};

/** Solid fills for compact calendar chips (match badge hues). */
const EVENT_TYPE_CALENDAR = {
  MEETING: { backgroundColor: "#0d6efd", color: "#fff" },
  TRAINING: { backgroundColor: "#0dcaf0", color: "#08252a" },
  WORKSHOP: { backgroundColor: "#198754", color: "#fff" },
  HOLIDAY: { backgroundColor: "#ffc107", color: "#212529" },
  OTHER: { backgroundColor: "#6c757d", color: "#fff" },
};

/**
 * @param {string} [title]
 * @param {number} [maxLen]
 * @returns {{ display: string; full: string }}
 */
export function truncateEventTitle(title, maxLen = EVENT_TITLE_TABLE_MAX_CHARS) {
  const full = (title || "").trim();
  if (!full) return { display: "—", full: "" };
  if (full.length <= maxLen) return { display: full, full };
  return { display: `${full.slice(0, Math.max(0, maxLen - 1))}…`, full };
}

/**
 * Badge classes for `className={`badge ${info.class}`}` (Sneat / Bootstrap).
 * @param {string} [eventType]
 * @returns {{ class: string; label: string }}
 */
export function getEventTypeBadge(eventType) {
  const key = (eventType || "").toUpperCase();
  return (
    EVENT_TYPE_CONFIG[key] || {
      class: "bg-secondary",
      label: eventType || "Unknown",
    }
  );
}

/**
 * Inline style for small calendar/list chips by event_type.
 * @param {string} [eventType]
 * @returns {{ backgroundColor: string; color: string }}
 */
export function getEventTypeCalendarStyle(eventType) {
  const key = (eventType || "").toUpperCase();
  return (
    EVENT_TYPE_CALENDAR[key] || {
      backgroundColor: EVENT_TYPE_CALENDAR.OTHER.backgroundColor,
      color: EVENT_TYPE_CALENDAR.OTHER.color,
    }
  );
}

/**
 * Lifecycle: Completed (past), In progress (between start and end), Upcoming (before start).
 * Shows an extra "New" pill only for edge cases (e.g. scheduled with no start): never with Upcoming or In progress.
 * @param {object} row
 * @param {string} [row.start_date]
 * @param {string} [row.end_date]
 * @param {string} [row.created_at]
 * @returns {{ mainLabel: string; mainClass: string; showNew: boolean }}
 */
export function getEventLifecycleStatus(row) {
  const now = Date.now();
  const startMs = row?.start_date ? new Date(row.start_date).getTime() : NaN;
  let endMs = row?.end_date ? new Date(row.end_date).getTime() : NaN;
  if (Number.isNaN(endMs) && !Number.isNaN(startMs)) {
    endMs = startMs;
  }

  const createdMs = row?.created_at ? new Date(row.created_at).getTime() : NaN;
  const isRecentCreate =
    !Number.isNaN(createdMs) &&
    now - createdMs >= 0 &&
    now - createdMs <= NEW_EVENT_MAX_AGE_MS;

  if (Number.isNaN(startMs)) {
    return {
      mainLabel: "Scheduled",
      mainClass: "rounded-pill bg-label-secondary",
      showNew: isRecentCreate,
    };
  }

  if (!Number.isNaN(endMs) && now > endMs) {
    return {
      mainLabel: "Completed",
      mainClass: "rounded-pill bg-label-secondary",
      showNew: false,
    };
  }

  if (now < startMs) {
    return {
      mainLabel: "Upcoming",
      mainClass: "rounded-pill bg-label-info",
      showNew: false,
    };
  }

  return {
    mainLabel: "In progress",
    mainClass: "rounded-pill bg-label-success",
    showNew: false,
  };
}
