/**
 * Shared SPISM financial year helpers (July–June FY labels + API list parsing).
 */

export const getDefaultFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  if (month >= 7) {
    return `${year}/${year + 1}`;
  }
  return `${year - 1}/${year}`;
};

export const extractFinancialYearRows = (res) => {
  const list = res?.data ?? res?.results ?? res ?? [];
  const fyList = Array.isArray(list) ? list : list?.data ?? [];
  return [...fyList].sort((a, b) => {
    if (a.start_date && b.start_date) {
      return new Date(b.start_date) - new Date(a.start_date);
    }
    return String(b.name || "").localeCompare(String(a.name || ""));
  });
};

/** If the current FY is not in configured years, return the latest configured name. */
export const resolveFinancialYearForList = (sortedRows, current) => {
  const names = sortedRows.map((y) => y.name).filter(Boolean);
  if (!names.length) return current;
  return names.includes(current) ? current : sortedRows[0].name;
};
