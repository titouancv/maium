import type { Gender } from "@/constants";
import type { Experience } from "@/types/experience";
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
  professionalExperiences: Experience[];
  educationalExperiences: Experience[];
}

export type SignupStepKey =
  | "fullName"
  | "pseudo"
  | "date"
  | "gender"
  | "professional"
  | "educational";

interface SignupStep {
  key: SignupStepKey;
  /** Required steps gate onboarding; optional steps (experiences) never block. */
  required: boolean;
  isFilled: (draft: SignupDraft) => boolean;
}

/**
 * Single source of truth for the wizard's order. Wizard steps are 1-based; step
 * 0 is the OAuth entry point and is not part of this list.
 */
export const SIGNUP_STEPS: SignupStep[] = [
  {
    key: "fullName",
    required: true,
    isFilled: (d) => !!(d.firstName && d.lastName),
  },
  { key: "pseudo", required: true, isFilled: (d) => !!d.pseudo },
  { key: "date", required: true, isFilled: (d) => d.dob != null },
  { key: "gender", required: true, isFilled: (d) => !!d.gender },
  { key: "professional", required: false, isFilled: () => true },
  { key: "educational", required: false, isFilled: () => true },
];

export const SIGNUP_TOTAL_STEPS = SIGNUP_STEPS.length;

/**
 * Wizard step (1-based) at which to resume an authenticated user: the first
 * required field still missing, or the first experiences step once all required
 * fields are filled.
 */
export function getResumeStep(draft: SignupDraft): number {
  const firstIncompleteRequired = SIGNUP_STEPS.findIndex(
    (s) => s.required && !s.isFilled(draft),
  );
  const index =
    firstIncompleteRequired === -1
      ? SIGNUP_STEPS.findIndex((s) => !s.required)
      : firstIncompleteRequired;
  return index + 1;
}

/**
 * Whether a persisted user has filled every onboarding-required field, derived
 * from the same {@link SIGNUP_STEPS} `required` definitions the wizard enforces.
 * Used by the home page to send a still-incomplete user back to the wizard.
 */
export function hasCompletedOnboarding(user: UserData): boolean {
  const draft: SignupDraft = {
    firstName: user.first_name,
    lastName: user.last_name,
    pseudo: user.pseudo,
    dob: user.dob ?? undefined,
    gender: user.gender ?? undefined,
    professionalExperiences: [],
    educationalExperiences: [],
  };
  return SIGNUP_STEPS.every((s) => !s.required || s.isFilled(draft));
}
