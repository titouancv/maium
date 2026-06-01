"use client";

import { useTranslations } from "next-intl";
import type { AnalysisListItem } from "@/types/job";

interface Props {
  analysis: AnalysisListItem;
  onClose: () => void;
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-success";
  if (score >= 40) return "text-txt";
  return "text-error";
}

export function AnalysisDetailOverlay({ analysis, onClose }: Props) {
  const t = useTranslations("jobs");

  return (
    <div className="bg-surface-50 fixed inset-0 z-50 flex flex-col overflow-y-auto">
      <div className="border-brd-200 flex items-center justify-between border-b px-4 py-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-txt truncate font-semibold">
            {analysis.job?.title || t("untitledJob")}
          </p>
          <p className="text-txt-muted truncate text-sm">
            {[analysis.job?.company, analysis.job?.location]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-txt-muted hover:text-txt ml-4 shrink-0 text-2xl leading-none"
          aria-label={t("detail.close")}
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-6 px-4 py-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className={`text-4xl font-bold ${scoreColor(analysis.matching_score)}`}>
              {analysis.matching_score}
            </span>
            <span className="text-txt-muted text-xs">{t("matchScore")}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-txt text-4xl font-bold">
              {analysis.confidence_score}
            </span>
            <span className="text-txt-muted text-xs">{t("detail.confidence")}</span>
          </div>
        </div>

        {analysis.summary && (
          <p className="text-txt text-sm leading-relaxed">{analysis.summary}</p>
        )}

        {analysis.strengths.length > 0 && (
          <Section title={t("detail.strengths")}>
            <ul className="flex flex-col gap-1.5">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="text-txt flex gap-2 text-sm">
                  <span className="text-success mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {analysis.weaknesses.length > 0 && (
          <Section title={t("detail.weaknesses")}>
            <ul className="flex flex-col gap-1.5">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="text-txt flex gap-2 text-sm">
                  <span className="text-error mt-0.5 shrink-0">✗</span>
                  {w}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {analysis.missing_skills.length > 0 && (
          <Section title={t("detail.missingSkills")}>
            <div className="flex flex-wrap gap-2">
              {analysis.missing_skills.map((skill, i) => (
                <span
                  key={i}
                  className="bg-surface-100 border-brd-200 text-txt-muted rounded-full border px-3 py-1 text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Section>
        )}

        {analysis.recommendations.length > 0 && (
          <Section title={t("detail.recommendations")}>
            <ul className="flex flex-col gap-2">
              {analysis.recommendations.map((r, i) => (
                <li key={i} className="text-txt text-sm leading-relaxed">
                  {i + 1}. {r}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-txt text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}
