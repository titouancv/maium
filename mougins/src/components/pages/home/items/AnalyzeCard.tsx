"use client";

import { useTranslations } from "next-intl";
import { ILLUSTRATIONS, ROUTES } from "@/constants";
import { ActionCard } from "./ActionCard";

/**
 * The home page's headline action: run a job analysis. It leads the dashboard
 * because it is the product's core loop — the CV export and the network below
 * are what you do between two applications.
 */
export const AnalyzeCard = () => {
  const t = useTranslations("home");

  return (
    <ActionCard
      actionLabel={t("actions.analyzeTitle")}
      text={t("actions.analyzeSubtitle")}
      description={t("actions.analyzeDescription")}
      href={ROUTES.JOBS}
      illustration={ILLUSTRATIONS.ANALYZE_JOBS}
      secondary={{
        label: t("actions.analyzeHistory"),
        href: ROUTES.JOBS_HISTORY,
      }}
      emphasis="hero"
      primary
    />
  );
};
