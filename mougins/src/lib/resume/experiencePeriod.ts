export function sortExperiences<
  T extends { startPeriod: number; endPeriod?: number },
>(experiences: T[]): T[] {
  const ongoing = experiences.filter((e) => !e.endPeriod);
  const finished = experiences.filter((e) => !!e.endPeriod);
  ongoing.sort((a, b) => b.startPeriod - a.startPeriod);
  finished.sort((a, b) => b.startPeriod - a.startPeriod);
  return [...ongoing, ...finished];
}
