import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { HomeContent } from "@/components/pages/home";
import { redirect } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { getCurrentUserProfile, getAuthUser } from "@/lib/auth/getCurrentUser";
import { getHomeStats, getSuggestedUsers } from "@/lib/users";

export default async function HomePage() {
  const [locale, authUser, userData] = await Promise.all([
    getLocale(),
    getAuthUser(),
    getCurrentUserProfile(),
  ]);

  if (
    authUser &&
    userData &&
    !userData.onboarding_completed &&
    (!userData.first_name ||
      !userData.last_name ||
      !userData.pseudo ||
      !userData.dob)
  ) {
    redirect({ href: ROUTES.SIGNUP, locale });
  }

  // Stream the dashboard data: start the fetches without awaiting so the page
  // renders its shell immediately and the stats / suggestions resolve behind
  // their own Suspense boundaries.
  const statsPromise = userData ? getHomeStats() : undefined;
  const suggestionsPromise = userData ? getSuggestedUsers() : undefined;

  return (
    <Suspense>
      <HomeContent
        user={userData}
        statsPromise={statsPromise}
        suggestionsPromise={suggestionsPromise}
      />
    </Suspense>
  );
}
