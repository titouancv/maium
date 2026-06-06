"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { API } from "@/constants";
import { RESUME_TEMPLATES, type ResumeTemplate } from "@/types/job";
// Import UI primitives from their files, not the `@/components/ui` barrel:
// pulling this client tree through the barrel trips a Turbopack
// `export *` namespace-seal bug at build time (see AnalyzeJob).
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface Props {
  resumeId: string;
}

type Phase = "idle" | "choosing" | "generating" | "error";

export function DownloadResumeButton({ resumeId }: Props) {
  const t = useTranslations("jobs");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);

  // No real progress events for a single render call — creep smoothly toward
  // 90 % while the request is in flight, then jump to 100 % on completion.
  useEffect(() => {
    if (phase !== "generating") return;
    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + (90 - p) * 0.08 : p));
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  async function download(template: ResumeTemplate) {
    setPhase("generating");
    setProgress(8);
    try {
      const res = await fetch(`${API.RESUME_PDF(resumeId)}?template=${template}`);
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

      setTimeout(() => {
        setPhase("idle");
        setProgress(0);
      }, 800);
    } catch {
      setPhase("error");
    }
  }

  if (phase === "generating") {
    return <ProgressBar value={progress} label={t("detail.generating")} />;
  }

  if (phase === "choosing") {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-txt-muted text-sm">{t("detail.chooseTemplate")}</span>
        <div className="flex gap-2">
          {RESUME_TEMPLATES.map((template) => (
            <Button
              key={template}
              variant="outline"
              className="flex-1"
              onClick={() => download(template)}
            >
              {t(`detail.template.${template}`)}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setPhase("choosing")}
      >
        {t("detail.downloadResume")}
      </Button>
      {phase === "error" && (
        <span className="text-error text-sm">{t("detail.downloadError")}</span>
      )}
    </div>
  );
}
