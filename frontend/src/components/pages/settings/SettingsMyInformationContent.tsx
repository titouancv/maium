"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { MyInformationMenu } from "./collections/MyInformationMenu";
import { SettingsMyInformationSkeleton } from "./SettingsMyInformationSkeleton";
import type { UserData } from "@/types";

interface SettingsMyInformationContentProps {
  userPromise: Promise<UserData | null>;
}

export const SettingsMyInformationContent = ({
  userPromise,
}: SettingsMyInformationContentProps) => {
  const t = useTranslations("settings");

  return (
    <PageLayout title={t("myInformationMenuLabel")} backLabel={t("backButton")}>
      <Suspense fallback={<SettingsMyInformationSkeleton />}>
        <MyInformationMenu userPromise={userPromise} />
      </Suspense>
    </PageLayout>
  );
};
