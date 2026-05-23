"use client";

import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { PageLayout } from "@/components/layout";
import { MenuList } from "@/components/ui";

export const SettingsContent = () => {
  const t = useTranslations("settings");

  const menuItems = [
    { label: t("personalDataMenuLabel"), href: ROUTES.SETTINGS_PERSONAL_DATA },
    { label: t("accountMenuLabel"), href: ROUTES.SETTINGS_ACCOUNT },
    { label: t("privacyPolicyMenuLabel"), href: ROUTES.PRIVACY_POLICY },
  ];

  return (
    <PageLayout title={t("title")} backLabel={t("backButton")}>
      <div className="w-full max-w-2xl">
        <MenuList items={menuItems} />
      </div>
    </PageLayout>
  );
};
