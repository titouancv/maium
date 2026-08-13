import { experienceDurationParts, experiencePeriodYears } from "@/lib/date";

export function formatDuration(startDate: number, endDate?: number): string {
  const { years, months } = experienceDurationParts(startDate, endDate);
  if (years > 0) return `${years} ${years > 1 ? "years" : "year"}`;
  return `${months} ${months > 1 ? "months" : "month"}`;
}

export function sortExperiences<
  T extends { startPeriod: number; endPeriod?: number },
>(experiences: T[]): T[] {
  const ongoing = experiences.filter((e) => !e.endPeriod);
  const finished = experiences.filter((e) => !!e.endPeriod);
  ongoing.sort((a, b) => b.startPeriod - a.startPeriod);
  finished.sort((a, b) => b.startPeriod - a.startPeriod);
  return [...ongoing, ...finished];
}

export function formatPeriod(startDate: number, endDate?: number): string {
  const { startYear, endYear } = experiencePeriodYears(startDate, endDate);
  if (endYear === undefined) return `since ${startYear}`;
  if (startYear === endYear) return `${startYear}`;
  return `${startYear}/${endYear}`;
}
