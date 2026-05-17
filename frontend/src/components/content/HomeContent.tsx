"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { API, ROUTES } from "@/constants";
import { useRouter } from "@/i18n/navigation";
import { WelcomeOverlay } from "../overlay/WelcomeOverlay";
import { cn } from "@/lib/utils";
import { UserData } from "@/types";
import { PageLayout } from "../layout";

interface HomeContentProps {
  user: UserData | null;
}

export const HomeContent = ({ user }: HomeContentProps) => {
  const t = useTranslations("nav");
  const router = useRouter();

  const needsWelcome = user?.onboarding_completed === false;
  const [showOverlay, setShowOverlay] = useState(needsWelcome);
  const [overlayVisible, setOverlayVisible] = useState(needsWelcome);
  useEffect(() => {
    if (!user) {
      router.replace(ROUTES.SIGNUP);
    }
  }, [user, router]);

  const handleWelcomeEnter = () => {
    fetch(API.USERS_ME, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingCompleted: true }),
    });
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
    <PageLayout title={t("home")}>
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
