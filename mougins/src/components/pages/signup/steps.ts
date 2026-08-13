import type { Gender } from "@/constants";
import type { CvExtraction } from "@/lib/validators/cv";
import type { UserData } from "@/types";

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
  optional?: true;
}

export const SIGNUP_STEPS: SignupStep[] = [
  { key: "cv", isFilled: () => false, optional: true },
  { key: "fullName", isFilled: (d) => !!(d.firstName && d.lastName) },
  { key: "pseudo", isFilled: (d) => !!d.pseudo },
  { key: "date", isFilled: (d) => d.dob != null },
  { key: "gender", isFilled: (d) => !!d.gender },
  { key: "photo", isFilled: () => false, optional: true },
];

export const SIGNUP_TOTAL_STEPS = SIGNUP_STEPS.length;

export function stepIndexOf(key: SignupStepKey): number {
  return SIGNUP_STEPS.findIndex((s) => s.key === key) + 1;
}

export function getResumeStep(draft: SignupDraft): number {
  if (!draft.pseudo) return 1;

  const firstIncomplete = SIGNUP_STEPS.findIndex(
    (s) => !s.optional && !s.isFilled(draft),
  );
  const index =
    firstIncomplete === -1 ? SIGNUP_STEPS.length - 1 : firstIncomplete;
  return index + 1;
}

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
