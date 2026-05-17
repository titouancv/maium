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
  ];

  return (
    <PageLayout title={t("title")}>
      <MenuList items={menuItems} />
    </PageLayout>
  );
};
