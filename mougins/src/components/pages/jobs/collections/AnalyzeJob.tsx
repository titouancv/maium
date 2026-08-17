"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { API, ROUTES, type Locale } from "@/constants";
import { clearPendingJob, readPendingJob } from "@/lib/analyze/anonStorage";
import {
  AnalyzeJobUrlSchema,
  AnalyzeJobTextSchema,
  type AnalyzeJobInput,
} from "@/lib/validators/job";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { TextArea } from "@/components/ui/TextArea";
import { AnalysisProgress } from "./AnalysisProgress";
import { Link } from "@/i18n/navigation";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { hasEnoughProfileForAnalysis } from "@/lib/home";
import { Section, Text } from "@/components/ui";

type Mode = "url" | "text";

export function AnalyzeJob() {
  const t = useTranslations("jobs");
  const locale = useLocale() as Locale;
  const user = useCurrentUserStore((s) => s.user);
  const [mode, setMode] = useState<Mode>("url");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const urlForm = useForm<Extract<AnalyzeJobInput, { mode: "url" }>>({
    resolver: zodResolver(AnalyzeJobUrlSchema),
    defaultValues: { mode: "url", jobUrl: "" },
  });

  const textForm = useForm<Extract<AnalyzeJobInput, { mode: "text" }>>({
    resolver: zodResolver(AnalyzeJobTextSchema),
    defaultValues: { mode: "text", jobText: "" },
  });

  const isSubmitting =
    urlForm.formState.isSubmitting || textForm.formState.isSubmitting;

  const prefilledRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const [restoredPendingJob, setRestoredPendingJob] = useState(false);
  const [lastSubmittedUrl, setLastSubmittedUrl] = useState<string | null>(
    null,
  );

  const submit = useCallback(
    async (values: AnalyzeJobInput) => {
      setSubmitError(null);
      if (values.mode === "url") {
        setLastSubmittedUrl(values.jobUrl);
      }
      const res = await fetch(API.ANALYZE_JOB, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale }),
      });
      if (!res.ok) {
        setSubmitError(
          res.status === 429 ? t("rateLimited") : t("submitError"),
        );
        return;
      }
      clearPendingJob();
      const data = (await res.json()) as { analysisId: string };
      setActiveId(data.analysisId);
      urlForm.reset();
      textForm.reset();
    },
    [locale, t, urlForm, textForm],
  );

  useEffect(() => {
    const pending = readPendingJob();
    if (!pending) return;

    if (!prefilledRef.current) {
      prefilledRef.current = true;
      setMode(pending.mode);
      if (pending.mode === "url") {
        urlForm.reset(pending);
      } else {
        textForm.reset(pending);
      }
      setRestoredPendingJob(true);
    }

    if (autoSubmittedRef.current) return;
    if (!user || !hasEnoughProfileForAnalysis(user)) return;

    autoSubmittedRef.current = true;
    clearPendingJob();
    queueMicrotask(() => submit(pending));
  }, [user, urlForm, textForm, submit]);

  const urlErrors = urlForm.formState.errors;
  const textErrors = textForm.formState.errors;

  if (user && !hasEnoughProfileForAnalysis(user)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6">
        <Section title={t("gate.title")}>
          <p className="max-w-md text-sm">{t("gate.description")}</p>
          <Link href={ROUTES.SETTINGS_MY_INFORMATION}>
            <Button size="none" className="px-6 py-2">
              {t("gate.action")}
            </Button>
          </Link>
        </Section>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <form
        onSubmit={
          mode === "url"
            ? urlForm.handleSubmit((v) => submit(v))
            : textForm.handleSubmit((v) => submit(v))
        }
        className="flex flex-1 flex-col justify-between gap-4"
      >
        <div className="flex flex-col justify-between gap-4">
          {restoredPendingJob && (
            <Text tone="primary" size="sm">
              {t("pendingJobRestored")}
            </Text>
          )}
          {!activeId &&
            (mode === "url" ? (
              <TextInput
                placeholder={t("urlPlaceholder")}
                infoType={
                  urlErrors.jobUrl || submitError ? "error" : undefined
                }
                infoLabel={
                  urlErrors.jobUrl ? t("invalidUrl") : (submitError ?? "")
                }
                {...urlForm.register("jobUrl")}
              />
            ) : (
              <TextArea
                placeholder={t("textPlaceholder")}
                row={6}
                infoType={
                  textErrors.jobText || submitError ? "error" : undefined
                }
                infoLabel={
                  textErrors.jobText ? t("invalidText") : (submitError ?? "")
                }
                {...textForm.register("jobText")}
              />
            ))}
          {activeId && (
            <AnalysisProgress
              analysisJobId={activeId}
              onDone={() => setActiveId(null)}
              onRetryAsText={
                mode === "url"
                  ? () => {
                      if (lastSubmittedUrl) {
                        textForm.setValue("sourceUrl", lastSubmittedUrl);
                      }
                      setActiveId(null);
                      setMode("text");
                      setSubmitError(null);
                    }
                  : undefined
              }
            />
          )}
        </div>
        {!activeId && (
          <Button type="submit" isLoading={isSubmitting}>
            {t("analyze")}
          </Button>
        )}
      </form>
    </div>
  );
}
