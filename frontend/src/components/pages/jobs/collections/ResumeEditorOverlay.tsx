"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { API, EXPERIENCE_NAMESPACE } from "@/constants";
import { Form } from "@/components/form";
import type { FormProps } from "@/components/form";
import { FormLayout } from "@/components/layout/FormLayout";
// Import UI primitives from their files, not the `@/components/ui` barrel:
// pulling this client tree through the barrel trips a Turbopack
// `export *` namespace-seal bug at build time (see AnalyzeJob).
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  RESUME_TEMPLATES,
  type ResumeJson,
  type ResumeTemplate,
} from "@/types/job";
import type { Experience } from "@/types/experience";
import { TabsVertical } from "@/components/ui/TabsVertical";

interface Props {
  /**
   * Job-analysis source: the editor loads the optimized `resume_json` from this
   * resume and (by default) posts the edited draft back to its PDF route.
   */
  resumeId?: string;
  /**
   * Profile source: seed the editor with this draft instead of fetching one.
   * Pair it with `pdfEndpoint` to point the render at the right route.
   */
  initialDraft?: ResumeJson;
  /** PDF endpoint the edited draft is POSTed to. Defaults to the `resumeId` route. */
  pdfEndpoint?: string;
  onClose: () => void;
}

/** Edit steps (summary → experiences → education → skills) + template choice. */
const TOTAL_STEPS = 5;
const TEMPLATE_STEP = 4;

type Phase = "idle" | "generating" | "error";

/** Maps the editor's `Experience[]` back into the stored resume_json shape. */
function toResumeEntries(items: Experience[]): ResumeJson["experiences"] {
  return items.map((e) => ({
    organization: e.organization,
    role: e.role,
    startPeriod: e.startPeriod,
    endPeriod: e.endPeriod,
    location: e.location,
    description: e.description ?? "",
  }));
}

export function ResumeEditorOverlay({
  resumeId,
  initialDraft,
  pdfEndpoint,
  onClose,
}: Props) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");

  // Profile source seeds the draft up front (lazy init); job source fetches it.
  const [draft, setDraft] = useState<ResumeJson | null>(initialDraft ?? null);
  const [step, setStep] = useState(0);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);

  // Load the optimized resume_json that the AI generated (job-analysis source
  // only — the profile source is already seeded via `initialDraft`).
  useEffect(() => {
    if (initialDraft || !resumeId) return;
    let active = true;
    (async () => {
      const res = await fetch(API.RESUME(resumeId));
      if (!res.ok) return;
      const json = (await res.json()) as {
        resume: { resume_json: ResumeJson };
      };
      if (active) setDraft(json.resume.resume_json);
    })();
    return () => {
      active = false;
    };
  }, [resumeId, initialDraft]);

  // No real progress events for a single render call — creep toward 90 % while
  // the request is in flight, then jump to 100 % on completion.
  useEffect(() => {
    if (phase !== "generating") return;
    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + (90 - p) * 0.08 : p));
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  async function generate() {
    if (!draft) return;
    const endpoint = pdfEndpoint ?? (resumeId ? API.RESUME_PDF(resumeId) : null);
    if (!endpoint) return;
    const template: ResumeTemplate = RESUME_TEMPLATES[templateIndex];
    setPhase("generating");
    setProgress(8);
    try {
      // Edits are sent in the body and used to render the PDF on the fly — they
      // are never persisted to the database.
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_json: draft, template }),
      });
      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      setProgress(100);

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename =
        disposition.match(/filename="?([^"]+)"?/)?.[1] ?? "CV.pdf";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setTimeout(onClose, 800);
    } catch {
      setPhase("error");
    }
  }

  if (!draft) {
    return (
      <div className="bg-surface-50 fixed inset-0 z-50 flex items-center justify-center">
        <span className="text-txt-muted">{t("detail.loadingResume")}</span>
      </div>
    );
  }

  const base = {
    step: step + 1,
    totalSteps: TOTAL_STEPS,
    primaryLabel: tCommon("nextButton"),
    secondaryLabel:
      step === 0 ? tCommon("cancelButton") : tCommon("backButton"),
    onSecondary: step === 0 ? onClose : () => setStep((s) => s - 1),
    onPrimary: () => setStep((s) => s + 1),
  };

  const getFormProps = (): FormProps => {
    switch (step) {
      case 0:
        return {
          ...base,
          type: "longText",
          title: t("detail.editSummary"),
          placeholder: t("detail.summaryPlaceholder"),
          rows: 10,
          defaultValue: draft.summary,
          onChange: (v) =>
            setDraft((d) => (d ? { ...d, summary: v ?? "" } : d)),
        };
      case 1:
        return {
          ...base,
          type: "experiences",
          title: t("detail.editExperiences"),
          namespace: EXPERIENCE_NAMESPACE.professional,
          dateMode: "MM-YYYY",
          defaultValue: draft.experiences as Experience[],
          onChange: (exps) =>
            setDraft((d) =>
              d ? { ...d, experiences: toResumeEntries(exps) } : d,
            ),
        };
      case 2:
        return {
          ...base,
          type: "experiences",
          title: t("detail.editEducation"),
          namespace: EXPERIENCE_NAMESPACE.educational,
          dateMode: "MM-YYYY",
          defaultValue: draft.education as Experience[],
          onChange: (exps) =>
            setDraft((d) =>
              d ? { ...d, education: toResumeEntries(exps) } : d,
            ),
        };
      case 3:
        return {
          ...base,
          type: "keys",
          title: t("detail.editSkills"),
          placeholder: t("detail.skillPlaceholder"),
          defaultValue: draft.skills,
          onChange: (items) =>
            setDraft((d) => (d ? { ...d, skills: items } : d)),
        };
      default:
        return base as FormProps;
    }
  };

  if (step !== TEMPLATE_STEP) {
    return (
      <div className="bg-surface-50 fixed inset-0 z-50">
        <Form {...getFormProps()} />
      </div>
    );
  }

  return (
    <div className="bg-surface-50 fixed inset-0 z-50">
      <FormLayout
        title={t("detail.chooseTemplateTitle")}
        step={TOTAL_STEPS}
        totalSteps={TOTAL_STEPS}
        secondaryLabel={tCommon("backButton")}
        onSecondary={() => setStep(3)}
        primaryLabel={t("detail.generateButton")}
        primaryLoading={phase === "generating"}
        onPrimary={generate}
      >
        <div className="flex flex-col gap-6">
          {phase === "generating" ? (
            <ProgressBar value={progress} label={t("detail.generating")} />
          ) : (
            <>
              <p>{t("detail.chooseTemplateDescription")}</p>
              <TabsVertical
                tabs={RESUME_TEMPLATES.map((tpl) =>
                  t(`detail.template.${tpl}`),
                )}
                activeTab={templateIndex}
                onChange={setTemplateIndex}
              />
              <p className="text-txt-muted text-sm">
                {t(
                  `detail.templateDescription.${RESUME_TEMPLATES[templateIndex]}`,
                )}
              </p>
            </>
          )}
          {phase === "error" && (
            <span className="text-error text-sm">
              {t("detail.downloadError")}
            </span>
          )}
        </div>
      </FormLayout>
    </div>
  );
}
