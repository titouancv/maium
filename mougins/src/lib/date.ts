export function formatTimestampToDate(ts: number): string {
  const d = new Date(ts);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
}

export function isAtLeastYearsOld(dobTs: number, years: number): boolean {
  const now = new Date();
  const cutoff = Date.UTC(
    now.getUTCFullYear() - years,
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return dobTs <= cutoff;
}

export function parsePartialDateToTimestamp(value: string): number | null {
  const match = /^(\d{4})(?:-(\d{2}))?$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = match[2] === undefined ? 1 : Number(match[2]);
  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > new Date().getUTCFullYear() + 10) return null;

  return Date.UTC(year, month - 1, 1);
}

export function formatTime(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatLongDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

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

export function experiencePeriodYears(
  startDate: number,
  endDate?: number,
): { startYear: number; endYear?: number } {
  const startYear = new Date(startDate).getUTCFullYear();
  if (!endDate) return { startYear };
  return { startYear, endYear: new Date(endDate).getUTCFullYear() };
}

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

export function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
