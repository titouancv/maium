import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { HomeContent } from "@/components/pages/home";
import { hasCompletedOnboarding } from "@/components/pages/signup/steps";
import { redirect } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { getCurrentUserProfile } from "@/lib/auth/getCurrentUser";
import { getHomeStats, getSuggestedUsers } from "@/lib/users";
import { getStoriesFeed } from "@/lib/stories";

export default async function HomePage() {
  // `getCurrentUserProfile` resolves to null when signed out, so it doubles as
  // the auth check — no separate `getAuthUser` round-trip needed.
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

  // Stream the dashboard data: start the fetches without awaiting so the page
  // renders its shell immediately and the stats / suggestions resolve behind
  // their own Suspense boundaries.
  const statsPromise = userData ? getHomeStats() : undefined;
  const suggestionsPromise = userData ? getSuggestedUsers() : undefined;
  const storiesPromise = userData ? getStoriesFeed() : undefined;

  return (
    <Suspense>
      <HomeContent
        user={userData}
        statsPromise={statsPromise}
        suggestionsPromise={suggestionsPromise}
        storiesPromise={storiesPromise}
      />
    </Suspense>
  );
}
