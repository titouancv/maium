"use client";

import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { Tabs } from "./Tabs";

export function NavigationBar() {
  const t = useTranslations("nav");
  const pseudo = useCurrentUserStore((s) => s.user?.pseudo);

  const tabs = [
    { name: t("home"), href: ROUTES.HOME },
    pseudo
      ? { name: `@${pseudo}`, href: ROUTES.PROFILE(pseudo) }
      : { name: t("settings"), href: ROUTES.SETTINGS },
  ];

  return <Tabs tabs={tabs} />;
}
