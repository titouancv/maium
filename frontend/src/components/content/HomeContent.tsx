"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { API, ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { WelcomeOverlay } from "../overlay/WelcomeOverlay";
import { cn } from "@/lib/utils";
import { UserData } from "@/types";
import { PageLayout } from "../layout";
import { Title } from "../ui";
import { GoogleSignInButton } from "../custom";

interface HomeContentProps {
  user: UserData | null;
}

export const HomeContent = ({ user }: HomeContentProps) => {
  const tNav = useTranslations("nav");
  const t = useTranslations("home");

  const needsWelcome = user?.onboarding_completed === false;
  const [showOverlay, setShowOverlay] = useState(needsWelcome);
  const [overlayVisible, setOverlayVisible] = useState(needsWelcome);

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
    <PageLayout title={tNav("home")}>
      {!user && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="flex max-w-xl flex-col justify-start gap-8">
            <Title label={t("heroTitle")} size="h1" />
            <p>{t("appDescription")}</p>
            <GoogleSignInButton />
            <p className="text-txt-muted text-xs opacity-50">
              {t("dataUsagePrefix")}{" "}
              <Link
                href={ROUTES.PRIVACY_POLICY}
                className="underline underline-offset-2"
              >
                {t("privacyPolicyLink")}
              </Link>
              .
            </p>
          </div>
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
