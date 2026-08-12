// Stays a Client Component on purpose: as a Server Component it pulls the home
// `collections` barrel (which re-exports client components via `export *`)
// across the server/client boundary, tripping a Turbopack `export *`
// namespace-seal bug. The welcome/celebration and store-sync logic still live in
// dedicated client islands ([WelcomeCelebration], [CurrentUserSync]).
"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { APP_NAME, ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { UserData, SuggestedUser } from "@/types";
import type { HomeStats } from "@/lib/users";
import { PageLayout } from "../../layout";
import { HeroSection } from "../../ui/collections/HeroSection";
import { CurrentUserSync } from "./CurrentUserSync";
import { GreetingSection } from "./items/GreetingSection";
import { AnalyzeCard, DownloadCvCard } from "./items";
import {
  NotificationsCenter,
  SuggestionsList,
  SuggestionsListSkeleton,
  WelcomeCelebration,
} from "./collections";
import { Section, DataUsageNotice } from "@/components/ui";

interface HomeContentProps {
  user: UserData | null;
  statsPromise?: Promise<HomeStats>;
  suggestionsPromise?: Promise<SuggestedUser[]>;
}

export const HomeContent = ({
  user,
  statsPromise,
  suggestionsPromise,
}: HomeContentProps) => {
  const tNav = useTranslations("nav");
  const t = useTranslations("home");

  // The greeting becomes the page title and the notifications card sits in the
  // header (where the back button would be); see PageLayout's node-title mode.
  // Signed out, the page *is* the landing page, so it wears the brand name.
  const headerTitle = user ? (
    <>
      <GreetingSection firstName={user.first_name} />
      {statsPromise && (
        <Suspense fallback={null}>
          <NotificationsCenter statsPromise={statsPromise} userId={user.id} />
        </Suspense>
      )}
    </>
  ) : (
    APP_NAME
  );

  return (
    <PageLayout title={headerTitle} documentTitle={tNav("home")}>
      <CurrentUserSync user={user} />

      {!user && (
        <div className="flex w-full max-w-7xl flex-col gap-16">
          <HeroSection variant="landing" />
          {suggestionsPromise && (
            <Section title={t("sections.landingNetwork")} titleSize="h2">
              {/* No follow button here: a visitor can't follow anyone yet, and
                  the pitch above is the action we want them to take. */}
              <Suspense fallback={<SuggestionsListSkeleton />}>
                <SuggestionsList
                  suggestionsPromise={suggestionsPromise}
                  showFollow={false}
                />
              </Suspense>
            </Section>
          )}

          <DataUsageNotice />
        </div>
      )}

      {user && (
        <>
          {/* Sections are ordered by how central they are to the product: the
              job analysis leads, the CV export and the network follow. */}
          <div className="flex w-full max-w-7xl flex-col gap-16">
            <Section title={t("sections.analyze")} titleSize="h2">
              <AnalyzeCard />
            </Section>

            <Section title={t("sections.resume")} titleSize="h2">
              <DownloadCvCard user={user} />
            </Section>

            {suggestionsPromise && (
              <Section title={t("sections.network")} titleSize="h2">
                <Suspense fallback={<SuggestionsListSkeleton />}>
                  <SuggestionsList suggestionsPromise={suggestionsPromise} />
                </Suspense>
              </Section>
            )}

            <Link
              href={ROUTES.PRIVACY_POLICY}
              className="text-txt-muted text-xs underline-offset-2 hover:underline"
            >
              {tNav("privacyPolicy")}
            </Link>
          </div>

          <Suspense fallback={null}>
            <WelcomeCelebration firstName={user.first_name} />
          </Suspense>
        </>
      )}
    </PageLayout>
  );
};
