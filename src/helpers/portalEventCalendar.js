/** Local calendar date key (YYYY-MM-DD) for matching API event datetimes in the UI. */
function parseEventCalendarInstant(isoOrDate) {
  if (isoOrDate == null || isoOrDate === "") return null;
  const s = String(isoOrDate).trim();
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
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function eventCalendarDateKey(isoOrDate) {
  const d = parseEventCalendarInstant(isoOrDate);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Events visible on a calendar day (inclusive from start_date through end_date). */
export function getEventsOnCalendarDay(events, year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
  return (events || []).filter((event) => {
    if (!event?.start_date) return false;
    const startKey = eventCalendarDateKey(event.start_date);
    const endKey = eventCalendarDateKey(event.end_date || event.start_date);
    if (!startKey || !endKey) return false;
    return dateStr >= startKey && dateStr <= endKey;
  });
}

export function dayHasEventEndDate(events, year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
  return (events || []).some((event) => {
    if (!event?.end_date) return false;
    const startKey = eventCalendarDateKey(event.start_date);
    const endKey = eventCalendarDateKey(event.end_date);
    if (!startKey || !endKey || startKey === endKey) return false;
    return endKey === dateStr;
  });
}

/** Which part of a multi-day event falls on this calendar day. */
export function getEventCalendarDayRole(event, year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
  if (!event?.start_date) return null;
  const startKey = eventCalendarDateKey(event.start_date);
  const endKey = eventCalendarDateKey(event.end_date || event.start_date);
  if (!startKey || !endKey) return null;
  if (dateStr < startKey || dateStr > endKey) return null;
  if (startKey === endKey) return "start";
  if (dateStr === startKey) return "start";
  if (dateStr === endKey) return "end";
  return "middle";
}

/**
 * Calendar chips: start day = event card, end day = small mark, middle days = nothing.
 */
export function getCalendarDisplayEventsForDay(events, year, month, day) {
  return (events || [])
    .map((event) => ({
      event,
      dayRole: getEventCalendarDayRole(event, year, month, day),
    }))
    .filter(({ dayRole }) => dayRole === "start" || dayRole === "end");
}

export function truncateEventTitle(title, max = 10) {
  const s = (title || "").trim();
  if (!s) return "";
  return s.length > max ? `${s.substring(0, max)}...` : s;
}

export function isMultiDayCalendarEvent(event) {
  if (!event?.start_date) return false;
  const startKey = eventCalendarDateKey(event.start_date);
  const endKey = eventCalendarDateKey(event.end_date || event.start_date);
  return Boolean(startKey && endKey && startKey !== endKey);
}

export function shouldShowEventTitleOnCalendarDay(dayRole) {
  return dayRole === "start";
}

export function shouldShowEventEndMarkOnCalendarDay(dayRole, event) {
  return dayRole === "end" && isMultiDayCalendarEvent(event);
}
