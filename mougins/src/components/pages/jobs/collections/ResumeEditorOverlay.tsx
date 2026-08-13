"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { API, EXPERIENCE_NAMESPACE } from "@/constants";
import { Form } from "@/components/form";
import type { FormProps } from "@/components/form";
import { FormLayout } from "@/components/layout/FormLayout";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Overlay } from "@/components/ui/Overlay";
import { InfoMessage } from "@/components/ui/InfoMessage";
import { Text } from "@/components/ui/Text";
import {
  RESUME_TEMPLATES,
  type ResumeJson,
  type ResumeTemplate,
} from "@/types/job";
import type { Experience } from "@/types/experience";
import { TabsVertical } from "@/components/ui/TabsVertical";

interface Props {
  resumeId?: string;
  initialDraft?: ResumeJson;
  pdfEndpoint?: string;
  onClose: () => void;
}

const TOTAL_STEPS = 5;
const TEMPLATE_STEP = 4;

type Phase = "idle" | "generating" | "error";

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

  const [draft, setDraft] = useState<ResumeJson | null>(initialDraft ?? null);
  const [step, setStep] = useState(0);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);

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
      <Overlay onClose={onClose} center>
        <Text as="span" tone="muted">
          {t("detail.loadingResume")}
        </Text>
      </Overlay>
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
      <Overlay onClose={onClose}>
        <Form {...getFormProps()} />
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
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
              <Text tone="muted" size="sm">
                {t(
                  `detail.templateDescription.${RESUME_TEMPLATES[templateIndex]}`,
                )}
              </Text>
            </>
          )}
          <InfoMessage
            message={phase === "error" ? t("detail.downloadError") : null}
          />
        </div>
      </FormLayout>
    </Overlay>
  );
}
