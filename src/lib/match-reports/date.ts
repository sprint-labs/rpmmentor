import type { MatchReportRow } from "./schema";

/**
 * Normalise the date formats used by the Match Reports sheet without relying
 * on JavaScript's permissive string-date parsing.
 */
export function normaliseReportDate(
  raw: string | null | undefined,
): string | null {
  const value = raw?.trim() ?? "";
  if (!value) return null;

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const dmy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const year = iso ? Number(iso[1]) : dmy ? Number(dmy[3]) : NaN;
  const month = iso ? Number(iso[2]) : dmy ? Number(dmy[2]) : NaN;
  const day = iso ? Number(iso[3]) : dmy ? Number(dmy[1]) : NaN;

  if (!Number.isInteger(year) || year < 1 || year > 9999) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  // setUTCFullYear avoids Date.UTC's special handling of years 0–99.
  const date = new Date(Date.UTC(2000, 0, 1));
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  const yyyy = year.toString().padStart(4, "0");
  const mm = month.toString().padStart(2, "0");
  const dd = day.toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Sort newest-first, keeping missing or invalid dates last and stable. */
export function sortMatchReportsByDate(
  reports: readonly MatchReportRow[],
): MatchReportRow[] {
  return reports
    .map((report, index) => ({
      report: { ...report, match_date: normaliseReportDate(report.match_date) },
      index,
    }))
    .sort((a, b) => {
      const aDate = a.report.match_date;
      const bDate = b.report.match_date;
      if (aDate && bDate) return bDate.localeCompare(aDate) || a.index - b.index;
      if (aDate) return -1;
      if (bDate) return 1;
      return a.index - b.index;
    })
    .map(({ report }) => report);
}
