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
