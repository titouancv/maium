// Period/duration formatting mirroring the app's ExperienceItem component
// (src/components/ui/items/ExperienceItem.tsx). The PDF templates are rendered
// outside the next-intl context, so the English labels are inlined here to match
// the templates' hardcoded English copy.

/**
 * Human duration between two epoch-ms dates, e.g. "2 yrs" or "5 mos".
 * Falls back to "now" for ongoing experiences (no end date).
 */
export function formatDuration(startDate: number, endDate?: number): string {
  const d1 = new Date(startDate);
  const d2 = new Date(endDate ?? Date.now());
  const totalMonthsStart = d1.getUTCFullYear() * 12 + d1.getUTCMonth();
  const totalMonthsEnd = d2.getUTCFullYear() * 12 + d2.getUTCMonth();
  const diffMonths = totalMonthsEnd - totalMonthsStart;
  const years = Math.floor(diffMonths / 12);
  const months = (diffMonths % 12) + 1;
  if (years > 0) return `${years} ${years > 1 ? "years" : "year"}`;
  return `${months} ${months > 1 ? "months" : "month"}`;
}

/**
 * Orders experiences like the app's ExperienceList component: ongoing ones
 * (no end date) first, then finished, each group sorted by most recent start.
 */
export function sortExperiences<
  T extends { startPeriod: number; endPeriod?: number },
>(experiences: T[]): T[] {
  const ongoing = experiences.filter((e) => !e.endPeriod);
  const finished = experiences.filter((e) => !!e.endPeriod);
  ongoing.sort((a, b) => b.startPeriod - a.startPeriod);
  finished.sort((a, b) => b.startPeriod - a.startPeriod);
  return [...ongoing, ...finished];
}

/** Period label, e.g. "since 2021", "2022" or "2019/2022". */
export function formatPeriod(startDate: number, endDate?: number): string {
  const startYear = new Date(startDate).getUTCFullYear();
  if (!endDate) return `since ${startYear}`;
  const endYear = new Date(endDate).getUTCFullYear();
  if (startYear === endYear) return `${startYear}`;
  return `${startYear}/${endYear}`;
}
