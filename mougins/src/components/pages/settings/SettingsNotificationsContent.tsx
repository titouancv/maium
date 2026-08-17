"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { Section, Tabs, Text } from "@/components/ui";
import { TabsVertical } from "@/components/ui/TabsVertical";
import { LOCALES, type Locale } from "@/constants";
import { updateProfile } from "@/lib/users/updateProfile";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import type { UserData } from "@/types";

export const SettingsNotificationsContent = () => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tLanguages = useTranslations("languages");
  const user = useCurrentUserStore((s) => s.user);
  const setUser = useCurrentUserStore((s) => s.setUser);
  const notify = useNotificationStore((s) => s.notify);

  const save = async (
    patch: Partial<UserData>,
    body: Record<string, unknown>,
  ) => {
    if (!user) return;

    const previous = user;
    setUser({ ...previous, ...patch });

    if (!(await updateProfile(body))) {
      setUser(previous);
      notify(t("notificationsSaveError"));
    }
  };

  const emailsEnabled = user?.email_notifications ?? true;
  const emailTabs = [t("emailsEnabled"), t("emailsDisabled")];
  const setEmailsEnabled = (index: number) => {
    const enabled = index === 0;
    if (enabled === emailsEnabled) return;
    save({ email_notifications: enabled }, { emailNotifications: enabled });
  };

  const localeIndex = Math.max(
    LOCALES.indexOf((user?.locale ?? "en") as Locale),
    0,
  );
  const localeTabs = LOCALES.map((locale) => tLanguages(locale));
  const setEmailLocale = (index: number) => {
    if (index === localeIndex) return;
    save({ locale: LOCALES[index] }, { locale: LOCALES[index] });
  };

  return (
    <PageLayout title={t("notificationsMenuLabel")} backLabel={t("backButton")}>
      <div className="flex w-full max-w-2xl flex-col justify-center gap-10">
        {!user ? (
          <Text tone="muted" size="sm">
            {tCommon("loading")}
          </Text>
        ) : (
          <>
            <Section title={t("emailNotificationsTitle")}>
              <div className="flex w-full items-center justify-start">
                <div className="hidden md:block">
                  <Tabs
                    tabs={emailTabs}
                    activeTab={emailsEnabled ? 0 : 1}
                    onChange={setEmailsEnabled}
                  />
                </div>
                <div className="w-full md:hidden">
                  <TabsVertical
                    tabs={emailTabs}
                    activeTab={emailsEnabled ? 0 : 1}
                    onChange={setEmailsEnabled}
                  />
                </div>
              </div>
              <Text tone="muted" size="sm">
                {emailsEnabled
                  ? t("emailNotificationsEnabledDescription")
                  : t("emailNotificationsDisabledDescription")}
              </Text>
            </Section>

            <Section title={t("emailLanguageTitle")}>
              <div className="flex w-full items-center justify-start">
                <div className="hidden md:block">
                  <Tabs
                    tabs={localeTabs}
                    activeTab={localeIndex}
                    onChange={setEmailLocale}
                    layoutId="activeEmailLocale"
                  />
                </div>
                <div className="w-full md:hidden">
                  <TabsVertical
                    tabs={localeTabs}
                    activeTab={localeIndex}
                    onChange={setEmailLocale}
                    layoutId="activeEmailLocaleVertical"
                  />
                </div>
              </div>
              <Text tone="muted" size="sm">
                {t("emailLanguageDescription")}
              </Text>
            </Section>
          </>
        )}
      </div>
    </PageLayout>
  );
};
