import type { UserData } from "@/types";

export interface ProfileCompletion {
  percent: number;
  isComplete: boolean;
}

function hasItems(value?: unknown[] | null): boolean {
  return Array.isArray(value) && value.length > 0;
}

function hasText(value?: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

const COMPLETE_THRESHOLD_PERCENT = 75;

const ANALYSIS_MIN_PROFILE_PERCENT = 60;

export function hasEnoughProfileForAnalysis(user: UserData): boolean {
  return getProfileCompletion(user).percent >= ANALYSIS_MIN_PROFILE_PERCENT;
}

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
