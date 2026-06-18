"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { Section, Tabs } from "@/components/ui";
import { TabsVertical } from "@/components/ui/TabsVertical";
import { useThemeStore, type Theme } from "@/stores/useThemeStore";

const THEMES: Theme[] = ["light", "dark", "system", "day-cycle"];

export const SettingsPersonalizationContent = () => {
  const t = useTranslations("settings");
  const { theme, setTheme } = useThemeStore();

  const activeTab = THEMES.indexOf(theme);

  const tabs = [
    t("themeLight"),
    t("themeDark"),
    t("themeSystem"),
    t("themeDayCycle"),
  ];

  const descriptions = [
    t("themeLightDescription"),
    t("themeDarkDescription"),
    t("themeSystemDescription"),
    t("themeDayCycleDescription"),
  ];

  return (
    <PageLayout title={t("personalizationTitle")} backLabel={t("backButton")}>
      <div className="flex w-full max-w-2xl flex-col justify-center gap-4">
        <Section title={t("themeTitle")}>
          <div className="flex w-full items-center justify-start">
            <div className="hidden md:block">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(idx) => setTheme(THEMES[idx])}
              />
            </div>
            <div className="w-full md:hidden">
              <TabsVertical
                tabs={tabs}
                activeTab={activeTab}
                onChange={(idx) => setTheme(THEMES[idx])}
              />
            </div>
          </div>
          <p>{descriptions[activeTab]}</p>
        </Section>
      </div>
    </PageLayout>
  );
};
