"use client";

import { useLocale, useTranslations } from "next-intl";
import { ANON_ANALYSIS_RETENTION_DAYS } from "@/constants";
import { Text } from "@/components/ui";
import { addDays, formatLongDate } from "@/lib/date";
import type { AnalysisListItem } from "@/types/job";
import { AnonAccountBenefits } from "./AnonAccountBenefits";

interface AnonResultCtaProps {
  analysis: AnalysisListItem;
}

export function AnonResultCta({ analysis }: AnonResultCtaProps) {
  const t = useTranslations("analyze.account");
  const locale = useLocale();

  const deletedOn = formatLongDate(
    addDays(analysis.created_at, ANON_ANALYSIS_RETENTION_DAYS),
    locale,
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <Text tone="primary">{t("expiresOn", { date: deletedOn })}</Text>

      <AnonAccountBenefits
        title={t("title")}
        description={t("description")}
        source="result_cta"
        analysisId={analysis.id}
      />
    </div>
  );
}
