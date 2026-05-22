"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SlideToEnter } from "@/components/ui/SlideToEnter";
import { API, ROUTES } from "@/constants";
import { useRouter } from "@/i18n/navigation";
import { PageLayout } from "@/components/layout";

export const SettingsAccountContent = () => {
  const t = useTranslations("settings");
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
    <PageLayout title={t("accountMenuLabel")} backLabel={t("backButton")}>
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 md:max-w-5xl">
        {!showDeleteConfirm ? (
          <>
            <Button
              variant="outline"
              onClick={handleLogout}
              isLoading={isLoggingOut}
              className="w-full max-w-xl"
            >
              {t("logoutButton")}
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full max-w-xl"
            >
              {t("deleteAccountButton")}
            </Button>
          </>
        ) : (
          <div className="flex w-full flex-col items-center justify-center">
            <div className="flex w-full items-center justify-center md:hidden">
              <SlideToEnter
                onConfirm={handleDeleteAccount}
                label={t("deleteAccountSlideLabel")}
              />
            </div>
            <div className="hidden w-full max-w-xl md:flex">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleDeleteAccount}
                isLoading={isDeletingAccount}
              >
                {t("deleteAccountConfirmButton")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
