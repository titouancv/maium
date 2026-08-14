"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { ANALYTICS_EVENTS, API } from "@/constants";
import { PageLayout } from "@/components/layout/PageLayout";
import { Text } from "@/components/ui";
import { trackEvent } from "@/lib/analytics";
import {
  clearStoredAnalysisId,
  hasPendingJob,
  isFreeRunSpent,
  markFreeRunSpent,
  readStoredAnalysisId,
  writeStoredAnalysisId,
} from "@/lib/analyze/anonStorage";
import type { CvExtraction } from "@/lib/validators/cv";
import type { AnalysisListItem } from "@/types/job";
import { AnalyzeCvStep } from "./collections/AnalyzeCvStep";
import { AnalyzeJobStep } from "./collections/AnalyzeJobStep";
import { AnonQuotaGate } from "./collections/AnonQuotaGate";
import { AnonLockedContacts } from "./collections/AnonLockedContacts";
import { AnonLockedTracking } from "./collections/AnonLockedTracking";
import {
  AnalysisHeading,
  analysisHeadingLabel,
} from "@/components/pages/jobs/collections/AnalysisHeading";
import { AnalysisView } from "@/components/pages/jobs/collections/AnalysisView";

type Stage =
  | { name: "cv" }
  | { name: "job"; extraction: CvExtraction }
  | { name: "restoring"; analysisId: string }
  | { name: "result"; analysis: AnalysisListItem }
  | { name: "gate" };

const NOOP_SUBSCRIBE = () => () => {};

function useFreeRunSpent(): boolean {
  return useSyncExternalStore(NOOP_SUBSCRIBE, isFreeRunSpent, () => false);
}

function useStoredAnalysisId(): string | null {
  return useSyncExternalStore(NOOP_SUBSCRIBE, readStoredAnalysisId, () => null);
}

function usePendingJob(): boolean {
  return useSyncExternalStore(NOOP_SUBSCRIBE, hasPendingJob, () => false);
}

async function fetchAnalysis(
  analysisId: string,
): Promise<AnalysisListItem | null> {
  try {
    const res = await fetch(`${API.ANALYSIS(analysisId)}/result`);
    if (!res.ok) return null;
    return (await res.json()) as AnalysisListItem;
  } catch {
    return null;
  }
}

interface AnalyzeContentProps {
  initialFreeRunSpent: boolean;
}

export function AnalyzeContent({ initialFreeRunSpent }: AnalyzeContentProps) {
  const t = useTranslations("analyze");
  const tJobs = useTranslations("jobs");
  const tCommon = useTranslations("common");

  const [stage, setStage] = useState<Stage | null>(null);

  const freeRunSpent = useFreeRunSpent() || initialFreeRunSpent;
  const storedAnalysisId = useStoredAnalysisId();
  const pendingJob = usePendingJob();

  const initial: Stage = storedAnalysisId
    ? { name: "restoring", analysisId: storedAnalysisId }
    : freeRunSpent
      ? { name: "gate" }
      : { name: "cv" };

  const current: Stage = stage ?? initial;

  const restoringId = current.name === "restoring" ? current.analysisId : null;

  useEffect(() => {
    if (!restoringId) return;

    let active = true;
    fetchAnalysis(restoringId).then((analysis) => {
      if (!active) return;
      if (analysis) {
        trackEvent(ANALYTICS_EVENTS.ANON_RESULT_RESTORED);
        setStage({ name: "result", analysis });
        return;
      }
      clearStoredAnalysisId();
      setStage(
        isFreeRunSpent() || initialFreeRunSpent
          ? { name: "gate" }
          : { name: "cv" },
      );
    });

    return () => {
      active = false;
    };
  }, [restoringId, initialFreeRunSpent]);

  useEffect(() => {
    if (current.name === "gate") trackEvent(ANALYTICS_EVENTS.ANON_GATE_VIEWED);
  }, [current.name]);

  const handleQuotaExhausted = () => {
    markFreeRunSpent();
    setStage({ name: "gate" });
  };

  const handleAnalysisReady = async (analysisId: string) => {
    markFreeRunSpent();
    writeStoredAnalysisId(analysisId);
    const analysis = await fetchAnalysis(analysisId);
    if (!analysis) {
      setStage({ name: "restoring", analysisId });
      return;
    }
    trackEvent(ANALYTICS_EVENTS.ANON_RESULT_VIEWED);
    setStage({ name: "result", analysis });
  };

  const seeStoredAnalysis = () => {
    if (!storedAnalysisId) return;
    setStage({ name: "restoring", analysisId: storedAnalysisId });
  };

  if (current.name === "result") {
    const { analysis } = current;
    const heading = analysisHeadingLabel(analysis, tJobs("untitledJob"));

    return (
      <PageLayout
        title={<AnalysisHeading analysis={analysis} />}
        documentTitle={heading}
      >
        <div className="flex w-full max-w-7xl min-w-0 flex-col gap-12">
          <AnalysisView
            analysis={analysis}
            contacts={<AnonLockedContacts analysis={analysis} />}
            tracking={<AnonLockedTracking analysisId={analysis.id} />}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={t("title")}>
      <div className="flex h-full w-full max-w-2xl flex-col gap-8">
        {current.name === "restoring" && (
          <Text tone="muted" size="sm">
            {tCommon("loading")}
          </Text>
        )}

        {current.name === "gate" && (
          <AnonQuotaGate
            analysisId={storedAnalysisId}
            hasPendingJob={pendingJob}
            onSeeAnalysis={seeStoredAnalysis}
          />
        )}

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
