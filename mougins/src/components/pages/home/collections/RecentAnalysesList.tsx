"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { EmptyState, ScrollRow } from "@/components/ui";
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
    return <EmptyState label={t("analyses.empty")} />;
  }

  return (
    <ScrollRow stretch>
      {analyses.map((analysis) => (
        <RecentAnalysisCard key={analysis.id} analysis={analysis} />
      ))}
    </ScrollRow>
  );
};
