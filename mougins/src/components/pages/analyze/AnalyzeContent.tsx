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
import { AnalysisDetailOverlay } from "@/components/pages/jobs/collections/AnalysisDetailOverlay";

/** Where the visitor is in the funnel. */
type Stage =
  | { name: "cv" }
  | { name: "job"; extraction: CvExtraction }
  | { name: "result"; analysis: AnalysisListItem }
  | { name: "gate" };

/**
 * Whether this browser has already spent its free run, read through
 * `useSyncExternalStore` so the server renders the neutral answer and the
 * client corrects it on hydration — no `setState` in an effect.
 *
 * The value can't change under us during a session (only this component writes
 * it, and it then drives its own state), so the subscribe callback is a no-op.
 */
const NOOP_SUBSCRIBE = () => () => {};

function useFreeRunSpent(): boolean {
  return useSyncExternalStore(
    NOOP_SUBSCRIBE,
    () => localStorage.getItem(ANON_USED_STORAGE_KEY) === "1",
    () => false,
  );
}

/**
 * Public analysis funnel: drop a CV, paste an offer, get the full result —
 * analysis, optimized resume and cover letter — without an account, once.
 *
 * The parsed CV lives in component state and is posted with the offer; only the
 * server persists it (on the `analysis_jobs` row, which later fills the account
 * if the visitor signs up). The uploaded file itself is never stored.
 */
export function AnalyzeContent() {
  const t = useTranslations("analyze");

  // `null` until the visitor moves: the starting screen is derived, so a
  // returning visitor lands on the gate without a render of the CV step.
  const [stage, setStage] = useState<Stage | null>(null);

  // Mirror of the httpOnly quota cookie. Purely so a returning visitor sees the
  // sign-up screen instead of uploading a CV that will be refused — the server
  // is the authority, and clearing this grants nothing.
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
    return (
      <AnalysisDetailOverlay
        analysis={current.analysis}
        onClose={() => setStage({ name: "gate" })}
      />
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
