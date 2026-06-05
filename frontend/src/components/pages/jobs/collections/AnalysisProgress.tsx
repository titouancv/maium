"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { API } from "@/constants";
import { ProgressBar } from "@/components/ui";
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

  // Animated display value (float). Slowly creeps forward between real updates.
  const [displayProgress, setDisplayProgress] = useState(0);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 60 fps animation via requestAnimationFrame.
  //   • Behind real progress → proportional catch-up (τ ≈ 0.33s), min 5 %/s
  //   • At or ahead → exponential deceleration toward progress+5, min 0.08 %/s
  //   dt is capped at 100 ms to avoid a big jump when the tab regains focus.
  useEffect(() => {
    let rafId: number;
    let lastTime: number | null = null;

    const animate = (now: number) => {
      if (lastTime === null) {
        lastTime = now;
        rafId = requestAnimationFrame(animate);
        return;
      }
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      setDisplayProgress((prev) => {
        const { progress, status } = stateRef.current;
        if (status === "completed") return 100;
        if (status === "failed") return prev;

        const distance = progress - prev;
        if (distance > 0.01) {
          const rate = Math.max(distance * 3, 5);
          return Math.min(prev + rate * dt, progress);
        }

        const cap = Math.min(progress + 5, 99);
        const remaining = cap - prev;
        if (remaining <= 0) return prev;
        return prev + Math.max(remaining * 0.4, 0.08) * dt;
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

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

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const refreshedRef = useRef(false);
  useEffect(() => {
    if (state.status === "completed" && !refreshedRef.current) {
      refreshedRef.current = true;
      router.refresh();
      const timer = setTimeout(() => onDoneRef.current(), 1200);
      return () => clearTimeout(timer);
    }
  }, [state.status, router]);

  if (state.status === "failed") {
    const errorMessage =
      state.error === "INSUFFICIENT_JOB_DATA"
        ? t("error.insufficientData")
        : t("error.unknown");
    return (
      <div className="bg-error/10 text-error rounded-xl p-4 text-sm">
        {errorMessage}
      </div>
    );
  }

  return (
    <ProgressBar
      value={displayProgress}
      label={state.currentStep ? t(`step.${state.currentStep}`) : t("queued")}
    />
  );
}
