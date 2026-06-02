"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { AnalyzeJobSchema, type AnalyzeJobInput } from "@/lib/validators/job";
// Import UI primitives from their files, not the `@/components/ui` barrel:
// pulling this new client tree through the barrel trips a Turbopack
// `export *` namespace-seal bug at build time (see also JobsSkeleton/loading).
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { AnalysisProgress } from "./AnalysisProgress";

export function AnalyzeJob() {
  const t = useTranslations("jobs");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnalyzeJobInput>({
    resolver: zodResolver(AnalyzeJobSchema),
    defaultValues: { jobUrl: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const res = await fetch(API.ANALYZE_JOB, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      setSubmitError(res.status === 429 ? t("rateLimited") : t("submitError"));
      return;
    }
    const data = (await res.json()) as { analysisId: string };
    setActiveId(data.analysisId);
    reset();
  });

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3 md:flex-row md:items-start"
      >
        <TextInput
          placeholder={t("urlPlaceholder")}
          infoType={errors.jobUrl || submitError ? "error" : undefined}
          infoLabel={errors.jobUrl ? t("invalidUrl") : (submitError ?? "")}
          {...register("jobUrl")}
        />
        <Button type="submit" isLoading={isSubmitting}>
          {t("analyze")}
        </Button>
      </form>

      {activeId && (
        <AnalysisProgress
          analysisJobId={activeId}
          onDone={() => setActiveId(null)}
        />
      )}
    </div>
  );
}
