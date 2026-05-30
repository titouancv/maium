"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { PersonalDataMenu } from "./collections/PersonalDataMenu";
import { SettingsPersonalDataSkeleton } from "./SettingsPersonalDataSkeleton";
import type { UserData } from "@/types";

interface SettingsPersonalDataContentProps {
  userPromise: Promise<UserData | null>;
}

export const SettingsPersonalDataContent = ({
  userPromise,
}: SettingsPersonalDataContentProps) => {
  const t = useTranslations("settings");

  return (
    <PageLayout title={t("personalDataMenuLabel")} backLabel={t("backButton")}>
      <Suspense fallback={<SettingsPersonalDataSkeleton />}>
        <PersonalDataMenu userPromise={userPromise} />
      </Suspense>
    </PageLayout>
  );
};
