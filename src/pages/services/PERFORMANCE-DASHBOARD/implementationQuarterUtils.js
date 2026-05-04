/** Quarters (or bulk) with implementation status PENDING — from activity API row. */
export function getPendingImplementationQuartersFromRow(row) {
  const st = row?.implementation_quarters_state;
  const out = [];
  if (st && typeof st === "object") {
    for (const [key, entry] of Object.entries(st)) {
      if (!entry || typeof entry !== "object") continue;
      if (String(entry.status || "").toUpperCase() !== "PENDING") continue;
      if (key === "all") {
        out.push({ quarter: null, label: "All (bulk)" });
      } else if (/^[1-4]$/.test(String(key))) {
        out.push({ quarter: Number(key), label: `Q${key}` });
      }
    }
  }
  if (out.length === 0 && row?.implementation_submitted_at && (!st || Object.keys(st).length === 0)) {
    out.push({ quarter: null, label: "Full activity" });
  }
  return out.sort((a, b) => {
    if (a.quarter == null && b.quarter == null) return 0;
    if (a.quarter == null) return 1;
    if (b.quarter == null) return -1;
    return a.quarter - b.quarter;
  });
}

/**
 * Format activity title for UI. Replaces saved API error JSON with a short message.
 * @param {string|null|undefined} title
 * @param {number|false|null} maxLen - Max characters before ellipsis; `false` or `null` = no truncation
 */
export function formatActivityTitleForDisplay(title, maxLen = 80) {
  if (title == null || title === "") return "—";
  const s = String(title).trim();
  if (s.startsWith("{") && s.includes('"status"') && s.includes('"message"')) {
    return "Invalid title (error text was saved — edit activity to fix)";
  }
  if (maxLen === false || maxLen == null) {
    return s;
  }
  const n = Number(maxLen);
  if (!Number.isFinite(n) || n <= 0) {
    return s;
  }
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
