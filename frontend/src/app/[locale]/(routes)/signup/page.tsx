import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { SignupContent } from "@/components/pages/signup";
import { getResumeStep, type SignupDraft } from "@/components/pages/signup/steps";
import { redirect } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { getCurrentUserProfile } from "@/lib/auth/getCurrentUser";

export default async function SignupPage() {
  const [locale, userData] = await Promise.all([
    getLocale(),
    getCurrentUserProfile(),
  ]);

  if (userData?.onboarding_completed) {
    redirect({ href: ROUTES.HOME, locale });
  }

  let initialStep = 0;
  let initialDraft: SignupDraft = {};

  // No authenticated user → show the OAuth entry point (step 0). Otherwise the
  // DB trigger has created a partial row; resume the wizard from the first gap.
  if (userData) {
    initialDraft = {
      firstName: userData.first_name || undefined,
      lastName: userData.last_name || undefined,
      pseudo: userData.pseudo || undefined,
      dob: userData.dob ?? undefined,
      gender: userData.gender ?? undefined,
    };
    initialStep = getResumeStep(initialDraft);
  }

  return (
    <Suspense>
      <SignupContent initialStep={initialStep} initialDraft={initialDraft} />
    </Suspense>
  );
}
