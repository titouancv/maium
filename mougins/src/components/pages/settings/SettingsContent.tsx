"use client";

import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { PageLayout } from "@/components/layout";
import { MenuList } from "@/components/ui";

export const SettingsContent = () => {
  const t = useTranslations("settings");

  const menuItems = [
    { label: t("accountMenuLabel"), href: ROUTES.SETTINGS_ACCOUNT },
    {
      label: t("myInformationMenuLabel"),
      href: ROUTES.SETTINGS_MY_INFORMATION,
    },
    {
      label: t("personalizationMenuLabel"),
      href: ROUTES.SETTINGS_PERSONALIZATION,
    },
    {
      label: t("notificationsMenuLabel"),
      href: ROUTES.SETTINGS_NOTIFICATIONS,
    },
    { label: t("dreamJobMenuLabel"), href: ROUTES.SETTINGS_DREAM_JOB },
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
