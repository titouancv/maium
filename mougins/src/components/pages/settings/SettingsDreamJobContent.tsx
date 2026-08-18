"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { Text } from "@/components/ui";
import { DreamJobOnboardingWizard } from "./collections/DreamJobOnboardingWizard";
import { DreamJobMenu } from "./collections/DreamJobMenu";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";

export const SettingsDreamJobContent = () => {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const tDreamJob = useTranslations("dreamJob");
  const user = useCurrentUserStore((s) => s.user);
  const setUser = useCurrentUserStore((s) => s.setUser);
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";

  if (!user) {
    return (
      <PageLayout title={t("dreamJobTitle")} backLabel={t("backButton")}>
        <Text tone="muted" size="sm">
          {tCommon("loading")}
        </Text>
      </PageLayout>
    );
  }

  if (isOnboarding) {
    return (
      <DreamJobOnboardingWizard key={user.id} user={user} setUser={setUser} />
    );
  }

  return (
    <PageLayout title={t("dreamJobTitle")} backLabel={t("backButton")}>
      <div className="flex w-full max-w-2xl flex-col justify-center gap-10">
        <Text tone="muted" size="sm">
          {tDreamJob("intro")}
        </Text>
        <DreamJobMenu key={user.id} user={user} />
      </div>
    </PageLayout>
  );
};
