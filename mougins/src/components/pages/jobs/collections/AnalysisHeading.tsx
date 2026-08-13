"use client";

import { useTranslations } from "next-intl";
import { Title } from "@/components/ui";
import type { AnalysisListItem } from "@/types/job";

interface AnalysisHeadingProps {
  analysis: AnalysisListItem;
}

export function analysisHeadingLabel(
  analysis: AnalysisListItem,
  fallback: string,
): string {
  return (
    [analysis.job?.company, analysis.job?.title, analysis.job?.location]
      .filter(Boolean)
      .join(" • ") || fallback
  );
}

export function AnalysisHeading({ analysis }: AnalysisHeadingProps) {
  const t = useTranslations("jobs");

  return (
    <div className="flex min-w-0">
      <Title
        label={analysisHeadingLabel(analysis, t("untitledJob"))}
        size="h1"
      />
    </div>
  );
}
