"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { ANON_USED_STORAGE_KEY, API } from "@/constants";
import { PageLayout } from "@/components/layout/PageLayout";
import type { CvExtraction } from "@/lib/validators/cv";
import type { AnalysisListItem } from "@/types/job";
import { AnalyzeCvStep } from "./collections/AnalyzeCvStep";
import { AnalyzeJobStep } from "./collections/AnalyzeJobStep";
import { AnonQuotaGate } from "./collections/AnonQuotaGate";
import { AnalysisView } from "@/components/pages/jobs/collections/AnalysisView";

type Stage =
  | { name: "cv" }
  | { name: "job"; extraction: CvExtraction }
  | { name: "result"; analysis: AnalysisListItem }
  | { name: "gate" };

const NOOP_SUBSCRIBE = () => () => {};

function useFreeRunSpent(): boolean {
  return useSyncExternalStore(
    NOOP_SUBSCRIBE,
    () => localStorage.getItem(ANON_USED_STORAGE_KEY) === "1",
    () => false,
  );
}

export function AnalyzeContent() {
  const t = useTranslations("analyze");
  const tJobs = useTranslations("jobs");

  const [stage, setStage] = useState<Stage | null>(null);

  const freeRunSpent = useFreeRunSpent();
  const current: Stage =
    stage ?? (freeRunSpent ? { name: "gate" } : { name: "cv" });

  const handleQuotaExhausted = () => {
    localStorage.setItem(ANON_USED_STORAGE_KEY, "1");
    setStage({ name: "gate" });
  };

  const handleAnalysisReady = async (analysisId: string) => {
    localStorage.setItem(ANON_USED_STORAGE_KEY, "1");
    const res = await fetch(`${API.ANALYSIS(analysisId)}/result`);
    if (!res.ok) return;
    setStage({ name: "result", analysis: (await res.json()) as AnalysisListItem });
  };

  if (current.name === "result") {
    const heading =
      [current.analysis.job?.company, current.analysis.job?.title]
        .filter(Boolean)
        .join(" • ") || tJobs("untitledJob");

    return (
      <PageLayout title={heading} fullHeight>
        <div className="flex h-full w-full max-w-7xl flex-col gap-8">
          <AnalysisView analysis={current.analysis} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={t("title")}>
      <div className="flex h-full w-full max-w-2xl flex-col gap-8">
        {current.name === "gate" && <AnonQuotaGate />}

        {current.name === "cv" && (
          <AnalyzeCvStep
            onParsed={(extraction) => setStage({ name: "job", extraction })}
          />
        )}

        {current.name === "job" && (
          <AnalyzeJobStep
            extraction={current.extraction}
            onQuotaExhausted={handleQuotaExhausted}
            onCompleted={handleAnalysisReady}
          />
        )}
      </div>
    </PageLayout>
  );
}
