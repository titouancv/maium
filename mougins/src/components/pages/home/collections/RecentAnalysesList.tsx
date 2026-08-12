"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import type { AnalysisListItem } from "@/types/job";
import { RecentAnalysisCard } from "../items";

interface RecentAnalysesListProps {
  analysesPromise: Promise<AnalysisListItem[]>;
}

/** Unwraps the streamed recent analyses inside a Suspense boundary. */
export const RecentAnalysesList = ({
  analysesPromise,
}: RecentAnalysesListProps) => {
  const t = useTranslations("home");
  const analyses = use(analysesPromise);

  if (analyses.length === 0) {
    return <p className="text-txt-muted text-sm">{t("analyses.empty")}</p>;
  }

  return (
    <div className="flex items-stretch gap-6 overflow-x-auto">
      {analyses.map((analysis) => (
        <RecentAnalysisCard key={analysis.id} analysis={analysis} />
      ))}
    </div>
  );
};
