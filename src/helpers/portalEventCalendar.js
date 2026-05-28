/** Local calendar date key (YYYY-MM-DD) for matching API event datetimes in the UI. */
export function eventCalendarDateKey(isoOrDate) {
  if (isoOrDate == null || isoOrDate === "") return null;
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
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
    return eventCalendarDateKey(event.end_date) === dateStr;
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

export function truncateEventTitle(title, max = 10) {
  const s = (title || "").trim();
  if (!s) return "";
  return s.length > max ? `${s.substring(0, max)}...` : s;
}
