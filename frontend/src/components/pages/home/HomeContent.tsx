// Stays a Client Component on purpose: as a Server Component it pulls the home
// `collections` barrel (which re-exports client components via `export *`)
// across the server/client boundary, tripping a Turbopack `export *`
// namespace-seal bug. The welcome/celebration and store-sync logic still live in
// dedicated client islands ([WelcomeCelebration], [CurrentUserSync]).
"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { UserData, SuggestedUser } from "@/types";
import type { HomeStats } from "@/lib/users";
import type { StoryGroup } from "@/types/story";
import { PageLayout } from "../../layout";
import { HeroSection } from "../../ui/collections/HeroSection";
import { CurrentUserSync } from "./CurrentUserSync";
import { GreetingSection } from "./items/GreetingSection";
import {
  StatsRow,
  StatsRowSkeleton,
  SuggestionsList,
  SuggestionsListSkeleton,
  WelcomeCelebration,
} from "./collections";
import { StoriesRow, StoriesRowSkeleton } from "@/components/stories";
import { Title } from "@/components/ui";

interface HomeContentProps {
  user: UserData | null;
  statsPromise?: Promise<HomeStats>;
  suggestionsPromise?: Promise<SuggestedUser[]>;
  storiesPromise?: Promise<StoryGroup[]>;
}

export const HomeContent = ({
  user,
  statsPromise,
  suggestionsPromise,
  storiesPromise,
}: HomeContentProps) => {
  const tNav = useTranslations("nav");
  const t = useTranslations("home");
  const tStories = useTranslations("stories");

  return (
    <PageLayout title={tNav("home")}>
      <CurrentUserSync user={user} />

      {!user && <HeroSection />}

      {user && (
        <>
          <div className="flex w-full max-w-7xl flex-col gap-12">
            <GreetingSection firstName={user.first_name} />

            {storiesPromise && (
              <div className="flex flex-col gap-4">
                <Title label={tStories("title")} size="h2" />
                <Suspense fallback={<StoriesRowSkeleton />}>
                  <StoriesRow storiesPromise={storiesPromise} />
                </Suspense>
              </div>
            )}

            {statsPromise && (
              <div className="shrink-0">
                <Suspense fallback={<StatsRowSkeleton />}>
                  <StatsRow statsPromise={statsPromise} user={user} />
                </Suspense>
              </div>
            )}

            {suggestionsPromise && (
              <div className="flex flex-col gap-4">
                <Title label={t("suggestions.title")} size="h2" />
                <Suspense fallback={<SuggestionsListSkeleton />}>
                  <SuggestionsList suggestionsPromise={suggestionsPromise} />
                </Suspense>
              </div>
            )}
          </div>

          <Suspense fallback={null}>
            <WelcomeCelebration firstName={user.first_name} />
          </Suspense>
        </>
      )}
    </PageLayout>
  );
};
