import type { Gender } from "@/constants";
import type { UserData } from "@/types";

/**
 * The in-progress signup profile. There is a single signup path (Google OAuth):
 * a DB trigger creates a partial `public.users` row, and the wizard fills the
 * remaining fields step by step (each step PATCHes `/api/users/me`).
 */
export interface SignupDraft {
  firstName?: string;
  lastName?: string;
  pseudo?: string;
  dob?: number;
  gender?: Gender;
}

export type SignupStepKey = "fullName" | "pseudo" | "date" | "gender";

interface SignupStep {
  key: SignupStepKey;
  isFilled: (draft: SignupDraft) => boolean;
}

/**
 * Single source of truth for the wizard's order. Wizard steps are 1-based; step
 * 0 is the OAuth entry point and is not part of this list.
 */
export const SIGNUP_STEPS: SignupStep[] = [
  { key: "fullName", isFilled: (d) => !!(d.firstName && d.lastName) },
  { key: "pseudo", isFilled: (d) => !!d.pseudo },
  { key: "date", isFilled: (d) => d.dob != null },
  { key: "gender", isFilled: (d) => !!d.gender },
];

export const SIGNUP_TOTAL_STEPS = SIGNUP_STEPS.length;

/**
 * Wizard step (1-based) at which to resume an authenticated user: the first
 * field still missing, or the last step once everything is filled.
 */
export function getResumeStep(draft: SignupDraft): number {
  const firstIncomplete = SIGNUP_STEPS.findIndex((s) => !s.isFilled(draft));
  const index =
    firstIncomplete === -1 ? SIGNUP_STEPS.length - 1 : firstIncomplete;
  return index + 1;
}

/**
 * Whether a persisted user has filled every onboarding field, derived from the
 * same {@link SIGNUP_STEPS} definitions the wizard enforces. Used by the home
 * page to send a still-incomplete user back to the wizard.
 */
export function hasCompletedOnboarding(user: UserData): boolean {
  const draft: SignupDraft = {
    firstName: user.first_name,
    lastName: user.last_name,
    pseudo: user.pseudo,
    dob: user.dob ?? undefined,
    gender: user.gender ?? undefined,
  };
  return SIGNUP_STEPS.every((s) => s.isFilled(draft));
}
