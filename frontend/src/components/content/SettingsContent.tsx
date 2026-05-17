"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui";
import { API, ROUTES } from "@/constants";
import { useRouter } from "@/i18n/navigation";

interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  pseudo: string;
  dob: string;
}

interface SettingsContentProps {
  user: UserData | null;
}

export const SettingsContent = ({ user }: SettingsContentProps) => {
  const t = useTranslations("settings");
  const tHome = useTranslations("home");
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      <div className="flex w-full flex-col items-start gap-6 md:max-w-sm">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 transition-colors hover:bg-surface-100"
          aria-label={t("backButton")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-txt-muted"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {user && (
          <Section title={t("mesInformations")} padding="lg">
            <ul className="space-y-2">
              <li>
                <strong>{tHome("email")}:</strong> {user.email}
              </li>
              <li>
                <strong>{tHome("name")}:</strong> {user.first_name}{" "}
                {user.last_name}
              </li>
              <li>
                <strong>{tHome("pseudo")}:</strong> {user.pseudo}
              </li>
              <li>
                <strong>{tHome("dob")}:</strong> {user.dob}
              </li>
            </ul>
          </Section>
        )}

        <Section title={t("monCompte")} padding="lg">
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
        </Section>
      </div>
    </div>
  );
};
