// Period/duration label formatting for the PDF resume templates. The templates
// render outside the next-intl context, so the English labels are inlined here.
// The underlying date math is shared with the in-app ExperienceItem component
// via experienceDurationParts / experiencePeriodYears in src/lib/date.ts.

import { experienceDurationParts, experiencePeriodYears } from "@/lib/date";

/**
 * Human duration between two epoch-ms dates, e.g. "2 years" or "5 months".
 * Falls back to "now" for ongoing experiences (no end date).
 */
export function formatDuration(startDate: number, endDate?: number): string {
  const { years, months } = experienceDurationParts(startDate, endDate);
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
  const { startYear, endYear } = experiencePeriodYears(startDate, endDate);
  if (endYear === undefined) return `since ${startYear}`;
  if (startYear === endYear) return `${startYear}`;
  return `${startYear}/${endYear}`;
}
