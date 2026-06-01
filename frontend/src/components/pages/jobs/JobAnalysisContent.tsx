"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "../../layout";
import { AnalyzeJobForm } from "./AnalyzeJobForm";
import { HistoryLoader } from "./collections/HistoryLoader";
import { AnalysisHistorySkeleton } from "./JobsSkeleton";
import type { AnalysisListItem } from "@/types/job";

interface JobAnalysisContentProps {
  historyPromise: Promise<AnalysisListItem[]>;
}

export function JobAnalysisContent({ historyPromise }: JobAnalysisContentProps) {
  const t = useTranslations("jobs");

  return (
    <PageLayout title={t("title")}>
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <AnalyzeJobForm />
        <Suspense fallback={<AnalysisHistorySkeleton />}>
          <HistoryLoader historyPromise={historyPromise} />
        </Suspense>
      </div>
    </PageLayout>
  );
}
