"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { API } from "@/constants";
import type { AnalysisStatus, AnalysisStep } from "@/types/job";

interface AnalysisProgressProps {
  analysisJobId: string;
  onDone: () => void;
}

interface ProgressState {
  status: AnalysisStatus;
  currentStep: AnalysisStep | null;
  progress: number;
  error: string | null;
}

/**
 * Follows a running analysis live. Seeds from a one-shot status fetch, then
 * subscribes to `analysis_jobs` UPDATE rows over Realtime (same pattern as the
 * messaging postgres_changes subscription). On completion it refreshes the
 * route so the history list re-streams with the new analysis.
 */
export function AnalysisProgress({
  analysisJobId,
  onDone,
}: AnalysisProgressProps) {
  const t = useTranslations("jobs");
  const router = useRouter();
  const [state, setState] = useState<ProgressState>({
    status: "queued",
    currentStep: null,
    progress: 0,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    // Seed current state in case the job advanced before we subscribed.
    fetch(API.ANALYSIS(analysisJobId))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setState({
            status: data.status,
            currentStep: data.currentStep,
            progress: data.progress,
            error: data.error,
          });
        }
      })
      .catch(() => {});

    const supabase = createClient();
    const channel = supabase
      .channel(`analysis:${analysisJobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "analysis_jobs",
          filter: `id=eq.${analysisJobId}`,
        },
        (payload) => {
          const row = payload.new as {
            status: AnalysisStatus;
            current_step: AnalysisStep | null;
            progress: number;
            error_message: string | null;
          };
          setState({
            status: row.status,
            currentStep: row.current_step,
            progress: row.progress,
            error: row.error_message,
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [analysisJobId]);

  useEffect(() => {
    if (state.status === "completed") {
      router.refresh();
      const timer = setTimeout(onDone, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.status, router, onDone]);

  if (state.status === "failed") {
    return (
      <div className="bg-error/10 text-error rounded-xl p-4 text-sm">
        {t("failed")}
      </div>
    );
  }

  return (
    <div className="bg-surface-100 flex flex-col gap-2 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-txt text-sm">
          {state.currentStep ? t(`step.${state.currentStep}`) : t("queued")}
        </span>
        <span className="text-txt-muted text-xs">{state.progress}%</span>
      </div>
      <div className="bg-surface-200 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${state.progress}%` }}
        />
      </div>
    </div>
  );
}
