"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { API, type Locale } from "@/constants";
import {
  AnalyzeJobUrlSchema,
  AnalyzeJobTextSchema,
  type AnalyzeJobInput,
} from "@/lib/validators/job";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { TextArea } from "@/components/ui/TextArea";
import { Tabs } from "@/components/ui/Tabs";
import { Title } from "@/components/ui/Title";
import { Text } from "@/components/ui/Text";
import { AnalysisProgress } from "@/components/pages/jobs/collections/AnalysisProgress";
import type { CvExtraction } from "@/lib/validators/cv";

interface AnalyzeJobStepProps {
  extraction: CvExtraction;
  onQuotaExhausted: () => void;
  onCompleted: (analysisId: string) => void;
}

type Mode = "url" | "text";

export function AnalyzeJobStep({
  extraction,
  onQuotaExhausted,
  onCompleted,
}: AnalyzeJobStepProps) {
  const t = useTranslations("analyze.job");
  const tJobs = useTranslations("jobs");
  const locale = useLocale() as Locale;
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

  async function submit(values: AnalyzeJobInput) {
    setSubmitError(null);
    const res = await fetch(API.ANALYZE_JOB, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, cvExtraction: extraction, locale }),
    });

    if (res.status === 402) {
      onQuotaExhausted();
      return;
    }
    if (!res.ok) {
      setSubmitError(
        res.status === 429 ? tJobs("rateLimited") : tJobs("submitError"),
      );
      return;
    }

    const data = (await res.json()) as { analysisId: string };
    setActiveId(data.analysisId);
  }

  const urlErrors = urlForm.formState.errors;
  const textErrors = textForm.formState.errors;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Title label={t("title")} size="h2" />
        <Text tone="muted" size="sm">
          {t("description")}
        </Text>
      </div>

      <div className="flex w-full justify-end">
        <Tabs
          tabs={[tJobs("modeUrl"), tJobs("modeText")]}
          activeTab={mode === "url" ? 0 : 1}
          onChange={(idx) => {
            setMode(idx === 0 ? "url" : "text");
            setSubmitError(null);
          }}
          layoutId="analyzeAnonMode"
        />
      </div>

      <form
        onSubmit={
          mode === "url"
            ? urlForm.handleSubmit((v) => submit(v))
            : textForm.handleSubmit((v) => submit(v))
        }
        className="flex flex-col gap-4"
      >
        {mode === "url" ? (
          <TextInput
            placeholder={tJobs("urlPlaceholder")}
            infoType={urlErrors.jobUrl || submitError ? "error" : undefined}
            infoLabel={urlErrors.jobUrl ? tJobs("invalidUrl") : (submitError ?? "")}
            {...urlForm.register("jobUrl")}
          />
        ) : (
          <TextArea
            placeholder={tJobs("textPlaceholder")}
            row={6}
            infoType={textErrors.jobText || submitError ? "error" : undefined}
            infoLabel={textErrors.jobText ? tJobs("invalidText") : (submitError ?? "")}
            {...textForm.register("jobText")}
          />
        )}

        {activeId && (
          <AnalysisProgress
            analysisJobId={activeId}
            anonymous
            onDone={() => setActiveId(null)}
            onCompleted={onCompleted}
          />
        )}

        {!activeId && (
          <Button type="submit" size="lg" isLoading={isSubmitting}>
            {tJobs("analyze")}
          </Button>
        )}
      </form>
    </div>
  );
}
