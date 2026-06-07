"use client";

import { Suspense, useState, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { UserData, SuggestedUser } from "@/types";
import type { HomeStats } from "@/lib/users";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { PageLayout } from "../../layout";
import { HeroSection } from "../../ui/collections/HeroSection";
import { WelcomeOverlay } from "./collections/WelcomeOverlay";
import { GreetingSection } from "./GreetingSection";
import {
  StatsRow,
  StatsRowSkeleton,
  SuggestionsList,
  SuggestionsListSkeleton,
} from "./collections";

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

  // The wizard hands off here with ?welcome=1 once onboarding is complete; that
  // is the single trigger for the celebration (the flag is already persisted).
  const searchParams = useSearchParams();
  const showWelcome = !!user && searchParams.get("welcome") === "1";
  const [showOverlay, setShowOverlay] = useState(showWelcome);
  const [overlayVisible, setOverlayVisible] = useState(showWelcome);

  // Keep the global user store in sync with the freshest server data. The
  // layout's UserHydration only runs on a full load, so after a client-side
  // navigation here (e.g. finishing signup) the store would otherwise stay
  // stale and the nav tabs (pseudo) wouldn't appear until a hard refresh.
  useLayoutEffect(() => {
    useCurrentUserStore.getState().setUser(user);
  }, [user]);

  const handleWelcomeEnter = () => {
    // Drop ?welcome=1 so a refresh doesn't replay the celebration.
    window.history.replaceState(null, "", window.location.pathname);
    setOverlayVisible(false);
    import("canvas-confetti").then(({ default: confetti }) => {
      if (window.innerWidth >= 768) {
        confetti({
          particleCount: 120,
          angle: 45,
          spread: 90,
          origin: { x: 0, y: 1 },
          startVelocity: 50,
        });
        confetti({
          particleCount: 120,
          angle: 135,
          spread: 90,
          origin: { x: 1, y: 1 },
          startVelocity: 50,
        });
      } else {
        confetti({
          particleCount: 120,
          angle: 315,
          spread: 70,
          origin: { x: 0, y: 0 },
          startVelocity: 30,
          gravity: 0.7,
          scalar: 0.8,
        });
        confetti({
          particleCount: 120,
          angle: 225,
          spread: 70,
          origin: { x: 1, y: 0 },
          startVelocity: 30,
          gravity: 0.7,
          scalar: 0.8,
        });
      }
    });
    setTimeout(() => setShowOverlay(false), 500);
  };

  return (
    <PageLayout title={tNav("home")} fullHeight>
      {!user && <HeroSection />}

      {user && (
        <div className="flex h-full w-full max-w-7xl flex-col gap-6 pb-28 md:gap-8 md:pb-32">
          <GreetingSection firstName={user.first_name} />

          {statsPromise && (
            <div className="shrink-0">
              <Suspense fallback={<StatsRowSkeleton />}>
                <StatsRow statsPromise={statsPromise} user={user} />
              </Suspense>
            </div>
          )}

          {suggestionsPromise && (
            <div className="flex min-h-0 flex-1 flex-col">
              <Suspense fallback={<SuggestionsListSkeleton />}>
                <SuggestionsList suggestionsPromise={suggestionsPromise} />
              </Suspense>
            </div>
          )}
        </div>
      )}

      {showOverlay && user && (
        <div
          className={cn(
            "fixed inset-0 z-50 p-4 transition-opacity duration-500",
            overlayVisible ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <WelcomeOverlay
            firstName={user.first_name}
            onEnter={handleWelcomeEnter}
          />
        </div>
      )}
    </PageLayout>
  );
};
