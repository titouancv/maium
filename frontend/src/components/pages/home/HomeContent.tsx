"use client";

import { useState, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { WelcomeOverlay } from "./collections/WelcomeOverlay";
import { HeroSection } from "./collections/HeroSection";
import { cn } from "@/lib/utils";
import { UserData } from "@/types";
import { PageLayout } from "../../layout";
import { Button } from "@/components/ui";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";

interface HomeContentProps {
  user: UserData | null;
}

export const HomeContent = ({ user }: HomeContentProps) => {
  const tNav = useTranslations("nav");
  const t = useTranslations("home");

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
    <PageLayout title={tNav("home")}>
      {!user && <HeroSection />}
      {user && (
        <div className="flex items-center justify-center py-12">
          <Link href={ROUTES.JOBS}>
            <Button variant="primary">{t("goToAnalysis")}</Button>
          </Link>
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
