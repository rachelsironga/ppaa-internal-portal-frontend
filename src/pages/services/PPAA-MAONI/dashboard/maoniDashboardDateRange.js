/**
 * Shared date-range logic for Maoni Executive + Handler dashboards.
 * Uses local calendar days for HTML date inputs (avoids UTC off-by-one).
 */

export const toLocalDateString = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Parse YYYY-MM-DD from a date input as local start or end of day. */
export const parseLocalDay = (ymd, endOfDay = false) => {
  if (!ymd || typeof ymd !== "string") return null;
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, mo, day] = parts;
  const d = new Date(
    y,
    mo - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Prefer submission/creation for “when was this contribution” filtering. */
export const suggestionActivityDate = (s) => {
  const raw = s?.submitted_at || s?.created_at || s?.updated_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * @param {string} timeRange — 'all' | 'custom' | 'month' | 'quarter' | 'year'
 * @param {{ start: string, end: string }} customDateRange
 * @param {Date} [now]
 */
export const getDashboardRange = (timeRange, customDateRange, now = new Date()) => {
  if (timeRange === "all") {
    return { start: null, end: null };
  }
  if (timeRange === "custom") {
    const start = parseLocalDay(customDateRange?.start, false);
    const end = parseLocalDay(customDateRange?.end, true);
    if (!start || !end) return { start: null, end: null };
    if (start > end) return { start: null, end: null };
    return { start, end };
  }
  if (timeRange === "year") {
    return { start: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0), end: now };
  }
  if (timeRange === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return { start: new Date(now.getFullYear(), q * 3, 1, 0, 0, 0, 0), end: now };
  }
  if (timeRange === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0), end: now };
  }
  return { start: null, end: null };
};

export const inDashboardRange = (s, rangeStart, rangeEnd) => {
  if (!rangeStart || !rangeEnd) return true;
  const d = suggestionActivityDate(s);
  if (!d) return false;
  return d >= rangeStart && d <= rangeEnd;
};

/**
 * Monthly buckets for charts: within [rangeStart, rangeEnd] when set; otherwise last 12 months to now.
 */
export const buildMonthlyTrend = (rows, rangeStart, rangeEnd, now = new Date()) => {
  const activity = (s) => suggestionActivityDate(s);

  const monthStarts = [];
  if (rangeStart && rangeEnd) {
    let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1, 0, 0, 0, 0);
    const endCap = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1, 0, 0, 0, 0);
    let guard = 0;
    while (cur <= endCap && guard++ < 48) {
      monthStarts.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      monthStarts.push(new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0));
    }
  }

  const labels = monthStarts.map((d) =>
    d.toLocaleString(undefined, { month: "short", year: "2-digit" })
  );
  const data = monthStarts.map((monthStart) => {
    const next = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1, 0, 0, 0, 0);
    return rows.filter((s) => {
      const d = activity(s);
      return d && d >= monthStart && d < next;
    }).length;
  });

  return { labels, data };
};

/** Quarter starts (Jan/Apr/Jul/Oct) within range or last 8 quarters to now. */
export const buildQuarterlyTrend = (rows, rangeStart, rangeEnd, now = new Date()) => {
  const activity = suggestionActivityDate;
  const quarterStart = (d) => {
    const x = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    x.setMonth(Math.floor(x.getMonth() / 3) * 3);
    return x;
  };
  const starts = [];
  if (rangeStart && rangeEnd) {
    let cur = quarterStart(rangeStart);
    const end = quarterStart(rangeEnd);
    let guard = 0;
    while (cur <= end && guard++ < 24) {
      starts.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 3);
    }
  } else {
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1, 0, 0, 0, 0);
      starts.push(quarterStart(d));
    }
  }
  const labels = starts.map(
    (d) => `Q${Math.floor(d.getMonth() / 3) + 1} '${String(d.getFullYear()).slice(-2)}`
  );
  const data = starts.map((qs) => {
    const qe = new Date(qs.getFullYear(), qs.getMonth() + 3, 0, 23, 59, 59, 999);
    return rows.filter((s) => {
      const a = activity(s);
      return a && a >= qs && a <= qe;
    }).length;
  });
  return { labels, data };
};

/** Calendar years within range or last 6 years to now. */
export const buildYearlyTrend = (rows, rangeStart, rangeEnd, now = new Date()) => {
  const activity = suggestionActivityDate;
  const years = [];
  if (rangeStart && rangeEnd) {
    for (let y = rangeStart.getFullYear(); y <= rangeEnd.getFullYear(); y++) {
      years.push(y);
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      years.push(now.getFullYear() - i);
    }
  }
  const labels = years.map((y) => String(y));
  const data = years.map((y) => {
    const ys = new Date(y, 0, 1, 0, 0, 0, 0);
    const ye = new Date(y, 11, 31, 23, 59, 59, 999);
    return rows.filter((s) => {
      const a = activity(s);
      return a && a >= ys && a <= ye;
    }).length;
  });
  return { labels, data };
};
