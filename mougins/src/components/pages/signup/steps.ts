import type { Gender } from "@/constants";
import type { CvExtraction } from "@/lib/validators/cv";
import type { UserData } from "@/types";

/**
 * The in-progress signup profile. There is a single signup path (Google OAuth):
 * a DB trigger creates a partial `public.users` row, and the wizard fills the
 * remaining fields step by step (each step PATCHes `/api/users/me`).
 *
 * It extends `CvExtraction` because the CV-import step fills the very same
 * fields — everything a CV can yield is part of the draft, and the remaining
 * steps (pseudo, date of birth, gender) add what a CV must never supply.
 */
export interface SignupDraft extends CvExtraction {
  pseudo?: string;
  dob?: number;
  gender?: Gender;
  profilePhoto?: string;
}

export type SignupStepKey =
  | "cv"
  | "fullName"
  | "pseudo"
  | "date"
  | "gender"
  | "photo";

interface SignupStep {
  key: SignupStepKey;
  isFilled: (draft: SignupDraft) => boolean;
  /**
   * Skippable steps that carry no required field. They are never a resume
   * target and never hold onboarding "incomplete", so someone who skips one
   * isn't bounced back to the wizard forever by the home page.
   */
  optional?: true;
}

/**
 * Single source of truth for the wizard's order. Wizard steps are 1-based; step
 * 0 is the OAuth entry point and is not part of this list.
 *
 * The CV import comes first on purpose: it pre-fills the full name and the deep
 * profile (experiences, education, skills) that the wizard would otherwise
 * never collect, so the steps after it become a confirmation rather than data
 * entry. The photo closes the flow, where skipping costs nothing.
 */
export const SIGNUP_STEPS: SignupStep[] = [
  { key: "cv", isFilled: () => false, optional: true },
  { key: "fullName", isFilled: (d) => !!(d.firstName && d.lastName) },
  { key: "pseudo", isFilled: (d) => !!d.pseudo },
  { key: "date", isFilled: (d) => d.dob != null },
  { key: "gender", isFilled: (d) => !!d.gender },
  { key: "photo", isFilled: () => false, optional: true },
];

export const SIGNUP_TOTAL_STEPS = SIGNUP_STEPS.length;

/** 1-based wizard step for a key. */
export function stepIndexOf(key: SignupStepKey): number {
  return SIGNUP_STEPS.findIndex((s) => s.key === key) + 1;
}

/**
 * Wizard step (1-based) at which to start an authenticated user.
 *
 * On a **first run** that is step 1, so the CV import is actually seen — it is
 * the wizard's entry point and pre-fills most of what follows. "First run" is
 * `pseudo` being unset: it is the first *required* field only the wizard can
 * write (the OAuth trigger already supplies first/last name from Google), so
 * its absence means nothing has been submitted yet.
 *
 * Afterwards the user is genuinely resuming, and lands on the first required
 * field still missing — or the last step once everything is filled. Optional
 * steps are never resume targets: they can't be "filled", so resuming onto one
 * would put the user back there on every reload.
 */
export function getResumeStep(draft: SignupDraft): number {
  if (!draft.pseudo) return 1;

  const firstIncomplete = SIGNUP_STEPS.findIndex(
    (s) => !s.optional && !s.isFilled(draft),
  );
  const index =
    firstIncomplete === -1 ? SIGNUP_STEPS.length - 1 : firstIncomplete;
  return index + 1;
}

/**
 * Whether a persisted user has filled every required onboarding field, derived
 * from the same {@link SIGNUP_STEPS} definitions the wizard enforces. Used by
 * the home page to send a still-incomplete user back to the wizard.
 */
export function hasCompletedOnboarding(user: UserData): boolean {
  const draft: SignupDraft = {
    firstName: user.first_name,
    lastName: user.last_name,
    pseudo: user.pseudo,
    dob: user.dob ?? undefined,
    gender: user.gender ?? undefined,
  };
  return SIGNUP_STEPS.every((s) => s.optional || s.isFilled(draft));
}
