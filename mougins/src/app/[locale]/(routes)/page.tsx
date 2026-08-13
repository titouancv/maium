import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { HomeContent } from "@/components/pages/home";
import { hasCompletedOnboarding } from "@/components/pages/signup/steps";
import { redirect } from "@/i18n/navigation";
import { HOME_RECENT_ANALYSES_LIMIT, ROUTES } from "@/constants";
import { getCurrentUserProfile } from "@/lib/auth/getCurrentUser";
import { getAnalysisHistory } from "@/lib/jobs/server";
import { getHomeStats, getSuggestedUsers } from "@/lib/users";

export default async function HomePage() {
  const [locale, userData] = await Promise.all([
    getLocale(),
    getCurrentUserProfile(),
  ]);

  if (
    userData &&
    !userData.onboarding_completed &&
    !hasCompletedOnboarding(userData)
  ) {
    redirect({ href: ROUTES.SIGNUP, locale });
  }

  const statsPromise = userData ? getHomeStats() : undefined;
  const analysesPromise = userData
    ? getAnalysisHistory(HOME_RECENT_ANALYSES_LIMIT)
    : undefined;
  const suggestionsPromise = getSuggestedUsers();

  return (
    <Suspense>
      <HomeContent
        user={userData}
        statsPromise={statsPromise}
        analysesPromise={analysesPromise}
        suggestionsPromise={suggestionsPromise}
      />
    </Suspense>
  );
}
