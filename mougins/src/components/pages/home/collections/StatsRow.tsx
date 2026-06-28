"use client";

import { useTranslations } from "next-intl";
import { ILLUSTRATIONS, ROUTES } from "@/constants";
import type { UserData } from "@/types";
import { ActionCard, DownloadCvCard } from "../items";

interface StatsRowProps {
  user: UserData;
}

export const StatsRow = ({ user }: StatsRowProps) => {
  const t = useTranslations("home");

  return (
    <div className="flex flex-col gap-8 md:flex-row md:justify-between">
      <ActionCard
        actionLabel={t("actions.analyzeTitle")}
        text={t("actions.analyzeSubtitle")}
        description={t("actions.analyzeDescription")}
        href={ROUTES.JOBS}
        illustration={ILLUSTRATIONS.ANALYZE_JOBS}
        primary
      />
      <DownloadCvCard user={user} />
    </div>
  );
};
