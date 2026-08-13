"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { APP_NAME, ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { UserData, SuggestedUser } from "@/types";
import type { AnalysisListItem } from "@/types/job";
import type { HomeStats } from "@/lib/users";
import { PageLayout } from "../../layout";
import { HeroSection } from "../../ui/collections/HeroSection";
import { CurrentUserSync } from "./CurrentUserSync";
import { GreetingSection } from "./items/GreetingSection";
import { AnalyzeCard } from "./items";
import {
  NotificationsCenter,
  RecentAnalysesList,
  RecentAnalysesListSkeleton,
  SuggestionsList,
  SuggestionsListSkeleton,
  WelcomeCelebration,
} from "./collections";
import { Button, Section, DataUsageNotice } from "@/components/ui";

interface HomeContentProps {
  user: UserData | null;
  statsPromise?: Promise<HomeStats>;
  analysesPromise?: Promise<AnalysisListItem[]>;
  suggestionsPromise?: Promise<SuggestedUser[]>;
}

export const HomeContent = ({
  user,
  statsPromise,
  analysesPromise,
  suggestionsPromise,
}: HomeContentProps) => {
  const tNav = useTranslations("nav");
  const t = useTranslations("home");

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
        <div className="flex w-full max-w-7xl flex-col gap-32 pt-16">
          <HeroSection variant="landing" />
          {suggestionsPromise && (
            <Section title={t("sections.landingNetwork")} titleSize="h2">
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
          <div className="flex w-full max-w-7xl flex-col gap-24 pt-24">
            <Section title={t("sections.analyze")} titleSize="h2">
              <AnalyzeCard />
            </Section>

            {analysesPromise && (
              <Section title={t("sections.analyses")} titleSize="h2">
                <Suspense fallback={<RecentAnalysesListSkeleton />}>
                  <RecentAnalysesList analysesPromise={analysesPromise} />
                </Suspense>
                <Link href={ROUTES.JOBS_HISTORY} className="self-start pt-4">
                  <Button variant="outline">
                    {t("actions.analyzeHistory")}
                  </Button>
                </Link>
              </Section>
            )}

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
