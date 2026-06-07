/**
 * Curated calendar of notable days surfaced in the home greeting (public
 * holidays, observances and major dated sporting events). Each `key` maps to a
 * `home.events.<key>` translation. The list is intentionally local and
 * hand-maintained — there's no reliable free feed for "major events" — and is
 * meant to be extended over time.
 */

/** A holiday/observance that recurs every year on the same month + day. */
interface RecurringEvent {
  month: number; // 1-12
  day: number; // 1-31
  key: string;
}

/** A one-off event tied to a specific calendar date (e.g. a tournament). */
interface DatedEvent {
  date: string; // "YYYY-MM-DD"
  key: string;
}

const RECURRING_EVENTS: RecurringEvent[] = [
  { month: 1, day: 1, key: "newYear" },
  { month: 2, day: 14, key: "valentines" },
  { month: 3, day: 8, key: "womensDay" },
  { month: 4, day: 22, key: "earthDay" },
  { month: 5, day: 1, key: "labourDay" },
  { month: 6, day: 21, key: "musicDay" },
  { month: 7, day: 14, key: "bastilleDay" },
  { month: 10, day: 31, key: "halloween" },
  { month: 12, day: 25, key: "christmas" },
  { month: 12, day: 31, key: "newYearsEve" },
];

// Major dated sporting / one-off events. Extend as new editions are scheduled.
const DATED_EVENTS: DatedEvent[] = [
  { date: "2026-02-06", key: "winterOlympics" },
  { date: "2026-06-11", key: "worldCupOpening" },
  { date: "2026-07-19", key: "worldCupFinal" },
];

export interface TodayEvent {
  /** Translation key under the `home.events` namespace. */
  key: string;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Returns the notable event for `date` (defaults to now), or `null`. A specific
 * dated event takes precedence over a recurring observance on the same day.
 */
export function getTodayEvent(date: Date = new Date()): TodayEvent | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const iso = `${date.getFullYear()}-${pad(month)}-${pad(day)}`;

  const dated = DATED_EVENTS.find((e) => e.date === iso);
  if (dated) return { key: dated.key };

  const recurring = RECURRING_EVENTS.find(
    (e) => e.month === month && e.day === day,
  );
  return recurring ? { key: recurring.key } : null;
}
