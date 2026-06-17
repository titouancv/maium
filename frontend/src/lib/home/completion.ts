import type { UserData } from "@/types";

export interface ProfileCompletion {
  /** Percentage of tracked profile fields that are filled (0-100). */
  percent: number;
  isComplete: boolean;
}

function hasItems(value?: unknown[] | null): boolean {
  return Array.isArray(value) && value.length > 0;
}

function hasText(value?: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** A profile is considered "complete enough" at this fill ratio (not 100%). */
const COMPLETE_THRESHOLD_PERCENT = 75;

/**
 * Minimum profile fill ratio required before running a job analysis. Below this,
 * the AI lacks enough signal to produce an accurate match, so the analysis form
 * is gated behind a "complete your profile" prompt.
 */
export const ANALYSIS_MIN_PROFILE_PERCENT = 60;

/** Whether the profile is filled enough for the AI to produce an accurate analysis. */
export function hasEnoughProfileForAnalysis(user: UserData): boolean {
  return getProfileCompletion(user).percent >= ANALYSIS_MIN_PROFILE_PERCENT;
}

/**
 * How complete the user's profile is, based on the optional fields that enrich
 * a public profile. Drives the "complete your profile" home action, which is
 * hidden once `isComplete` is true (≥ 75% of tracked fields filled).
 */
export function getProfileCompletion(user: UserData): ProfileCompletion {
  const checks: boolean[] = [
    hasText(user.bio),
    hasText(user.location),
    hasItems(user.professional_experiences),
    hasItems(user.educational_experiences),
    hasItems(user.skills),
    hasItems(user.hobbies),
    hasItems(user.social_networks),
  ];

  const filled = checks.filter(Boolean).length;
  const percent = Math.round((filled / checks.length) * 100);
  return { percent, isComplete: percent >= COMPLETE_THRESHOLD_PERCENT };
}
