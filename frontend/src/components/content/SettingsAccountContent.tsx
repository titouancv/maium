"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
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
    <PageLayout title={t("monCompte")} backLabel={t("backButton")}>
      <div className="flex flex-col items-start gap-4">
        <Button
          variant="outline"
          onClick={handleLogout}
          isLoading={isLoggingOut}
        >
          {t("logoutButton")}
        </Button>
        {!showDeleteConfirm ? (
          <Button variant="primary" onClick={() => setShowDeleteConfirm(true)}>
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
    </PageLayout>
  );
};
