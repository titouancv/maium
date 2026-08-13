"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { ANALYSIS_POLL_INTERVAL_MS, API, ROUTES } from "@/constants";
import { InfoMessage, ProgressBar } from "@/components/ui";
import type { AnalysisStatus, AnalysisStep } from "@/types/job";

interface AnalysisProgressProps {
  analysisJobId: string;
  onDone: () => void;
  anonymous?: boolean;
  onCompleted?: (analysisId: string) => void;
}

interface ProgressState {
  status: AnalysisStatus;
  currentStep: AnalysisStep | null;
  progress: number;
  error: string | null;
  analysisId: string | null;
}

export function AnalysisProgress({
  analysisJobId,
  onDone,
  anonymous,
  onCompleted,
}: AnalysisProgressProps) {
  const t = useTranslations("jobs");
  const router = useRouter();
  const [state, setState] = useState<ProgressState>({
    status: "queued",
    currentStep: null,
    progress: 0,
    error: null,
    analysisId: null,
  });

  const [displayProgress, setDisplayProgress] = useState(0);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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

    const readStatus = () =>
      fetch(API.ANALYSIS(analysisJobId))
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled || !data) return null;
          setState({
            status: data.status,
            currentStep: data.currentStep,
            progress: data.progress,
            error: data.error,
            analysisId: data.analysisId ?? null,
          });
          return data.status as AnalysisStatus;
        })
        .catch(() => null);

    readStatus();

    if (anonymous) {
      const timer = setInterval(async () => {
        const status = await readStatus();
        if (status === "completed" || status === "failed") {
          clearInterval(timer);
        }
      }, ANALYSIS_POLL_INTERVAL_MS);
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }

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
            analysis_id: string | null;
          };
          setState({
            status: row.status,
            currentStep: row.current_step,
            progress: row.progress,
            error: row.error_message,
            analysisId: row.analysis_id ?? null,
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [analysisJobId, anonymous]);

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const onCompletedRef = useRef(onCompleted);
  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  const redirectedRef = useRef(false);
  useEffect(() => {
    if (state.status === "completed" && state.analysisId && !redirectedRef.current) {
      redirectedRef.current = true;
      const handler = onCompletedRef.current;
      if (handler) {
        handler(state.analysisId);
      } else {
        router.push(ROUTES.JOB_ANALYSIS(state.analysisId));
      }
    }
  }, [state.status, state.analysisId, router]);

  if (state.status === "failed") {
    const errorMessage =
      state.error === "INSUFFICIENT_JOB_DATA"
        ? t("error.insufficientData")
        : t("error.unknown");
    return <InfoMessage message={errorMessage} />;
  }

  return (
    <ProgressBar
      value={displayProgress}
      label={state.currentStep ? t(`step.${state.currentStep}`) : t("queued")}
    />
  );
}
