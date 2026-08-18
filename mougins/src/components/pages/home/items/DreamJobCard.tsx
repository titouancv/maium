"use client";

import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { ActionCard } from "./ActionCard";

export const DreamJobCard = () => {
  const t = useTranslations("home");

  return (
    <ActionCard
      actionLabel={t("actions.dreamJobTitle")}
      description={t("actions.dreamJobDescription")}
      href={`${ROUTES.SETTINGS_DREAM_JOB}?onboarding=1`}
      emphasis="hero"
      primary
    />
  );
};
