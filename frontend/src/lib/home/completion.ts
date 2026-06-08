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

/**
 * How complete the user's profile is, based on the optional fields that enrich
 * a public profile. Drives the "complete your profile" home action, which is
 * hidden once `isComplete` is true.
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
  return { percent, isComplete: percent === 75 };
}
