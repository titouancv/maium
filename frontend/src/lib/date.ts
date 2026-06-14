/**
 * Shared date/time formatting helpers.
 * Display helpers take the active locale so output follows the user's language;
 * timestamp helpers operate in UTC to keep stored dates stable across timezones.
 */

/** Format a UTC timestamp as `DD/MM/YYYY` (used for dates of birth). */
export function formatTimestampToDate(ts: number): string {
  const d = new Date(ts);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

/** Format an ISO date string as a locale-aware `HH:MM` time. */
export function formatTime(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format an ISO date string as a locale-aware long date (e.g. `02 June 2026`). */
export function formatLongDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Whole years/months spanned between two epoch-ms dates, computed in UTC.
 * Shared by the in-app experience UI and the PDF resume templates so the
 * duration math (and its quirks) live in exactly one place.
 */
export function experienceDurationParts(
  startDate: number,
  endDate?: number,
): { years: number; months: number } {
  const d1 = new Date(startDate);
  const d2 = new Date(endDate ?? Date.now());
  const totalMonthsStart = d1.getUTCFullYear() * 12 + d1.getUTCMonth();
  const totalMonthsEnd = d2.getUTCFullYear() * 12 + d2.getUTCMonth();
  const diffMonths = totalMonthsEnd - totalMonthsStart;
  const years = Math.floor(diffMonths / 12);
  const months = (diffMonths % 12) + 1;
  return { years, months };
}

/** Start (and optional end) UTC year for an experience period. */
export function experiencePeriodYears(
  startDate: number,
  endDate?: number,
): { startYear: number; endYear?: number } {
  const startYear = new Date(startDate).getUTCFullYear();
  if (!endDate) return { startYear };
  return { startYear, endYear: new Date(endDate).getUTCFullYear() };
}

/**
 * Locale-aware relative time from an epoch-ms timestamp to now, picking the
 * largest sensible unit (e.g. `2h ago` / `il y a 2 h`, `yesterday` / `hier`).
 */
export function formatRelativeTime(ts: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffSec = Math.round((ts - Date.now()) / 1000); // negative in the past
  const abs = Math.abs(diffSec);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (abs >= secs) return rtf.format(Math.round(diffSec / secs), unit);
  }
  return rtf.format(diffSec, "second");
}

/** Whether two ISO date strings fall on the same calendar day (local time). */
export function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
