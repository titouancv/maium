"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "../../layout";
import { AnalyzeJob } from "./collections/AnalyzeJob";
import { HistoryLoader } from "./collections/HistoryLoader";
import { AnalysisHistorySkeleton } from "./JobsSkeleton";
import type { AnalysisListItem } from "@/types/job";

interface JobAnalysisContentProps {
  historyPromise: Promise<AnalysisListItem[]>;
}

export function JobAnalysisContent({
  historyPromise,
}: JobAnalysisContentProps) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");

  return (
    <PageLayout title={t("title")} backLabel={tCommon("backButton")} fullHeight>
      <div className="flex h-full w-full max-w-2xl flex-col gap-8 md:overflow-hidden">
        <AnalyzeJob />
        <Suspense fallback={<AnalysisHistorySkeleton />}>
          <HistoryLoader historyPromise={historyPromise} />
        </Suspense>
      </div>
    </PageLayout>
  );
}
