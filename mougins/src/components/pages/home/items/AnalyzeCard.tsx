"use client";

import { useTranslations } from "next-intl";
import { ILLUSTRATIONS, ROUTES } from "@/constants";
import { ActionCard } from "./ActionCard";

export const AnalyzeCard = () => {
  const t = useTranslations("home");

  return (
    <ActionCard
      actionLabel={t("actions.analyzeTitle")}
      description={t("actions.analyzeDescription")}
      href={ROUTES.JOBS}
      illustration={ILLUSTRATIONS.ANALYZE_JOBS}
      emphasis="hero"
      primary
    />
  );
};
