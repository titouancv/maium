"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { API, ROUTES } from "@/constants";
import { useRouter } from "@/i18n/navigation";
import { Section } from "../ui";
import { WelcomeOverlay } from "../overlay/WelcomeOverlay";
import { cn } from "@/lib/utils";

interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  pseudo: string;
  dob: string;
  onboarding_completed: boolean;
}

interface HomeContentProps {
  user: UserData | null;
}

export const HomeContent = ({ user }: HomeContentProps) => {
  const t = useTranslations("home");
  const router = useRouter();

  const needsWelcome = user?.onboarding_completed === false;
  const [showOverlay, setShowOverlay] = useState(needsWelcome);
  const [overlayVisible, setOverlayVisible] = useState(needsWelcome);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch(API.AUTH_LOGOUT, { method: "POST" });
    router.push(ROUTES.HOME);
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    await fetch(API.USERS_ME, { method: "DELETE" });
    router.push(ROUTES.HOME);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      {showOverlay && user && (
        <div
          className={cn(
            "fixed inset-0 z-50 transition-opacity duration-500",
            overlayVisible ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <WelcomeOverlay
            firstName={user.first_name}
            onEnter={handleWelcomeEnter}
          />
        </div>
      )}
      {user && (
        <div className="flex w-full flex-col items-start gap-6 md:max-w-sm">
          <Section title={t("userData")} padding="lg">
            <ul className="space-y-2">
              <li>
                <strong>{t("email")}:</strong> {user.email}
              </li>
              <li>
                <strong>{t("name")}:</strong> {user.first_name} {user.last_name}
              </li>
              <li>
                <strong>{t("pseudo")}:</strong> {user.pseudo}
              </li>
              <li>
                <strong>{t("dob")}:</strong> {user.dob}
              </li>
            </ul>
          </Section>
          <Button
            variant="outline"
            onClick={handleLogout}
            isLoading={isLoggingOut}
          >
            {t("logoutButton")}
          </Button>
          {!showDeleteConfirm ? (
            <Button
              variant="primary"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t("deleteAccountButton")}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-txt text-sm">{t("deleteAccountConfirm")}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  {t("deleteAccountCancelButton")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteAccount}
                  isLoading={isDeletingAccount}
                >
                  {t("deleteAccountConfirmButton")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
