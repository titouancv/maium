"use client";

import { useTranslations } from "next-intl";
import type { AnalysisListItem } from "@/types/job";
import { Button, ChipList, Section } from "@/components/ui";
import { PageLayout } from "@/components/layout/PageLayout";

interface Props {
  analysis: AnalysisListItem;
  onClose: () => void;
}

export function AnalysisDetailOverlay({ analysis, onClose }: Props) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");

  return (
    <div className="bg-surface-50 fixed inset-0 z-50 flex flex-col">
      <PageLayout
        onBack={onClose}
        backLabel={tCommon("backButton")}
        title={
          [analysis.job?.company, analysis.job?.title]
            .filter(Boolean)
            .join(" • ") || t("untitledJob")
        }
        showNavigationBar={false}
        fullHeight
      >
        <div className="flex h-full w-full max-w-7xl flex-col gap-8">
          <div className="grid h-full w-full min-w-0 grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex w-full min-w-0 flex-col gap-6">
              <div className="flex items-end gap-2">
                <span className="text-primary text-4xl font-bold">
                  {analysis.matching_score}
                </span>
                <span className="pb-0.5">{t("matchScore")}</span>
              </div>
              {analysis.confidence_score < 75 && (
                <div className="bg-secondary-600 text-on-primary flex rounded-sm px-2 py-1 text-sm">
                  <span>
                    {t("detail.lowConfidenceWarning", {
                      score: analysis.confidence_score,
                    })}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                {analysis.job?.location && (
                  <p className="text-txt-muted truncate">
                    {analysis.job?.location}
                  </p>
                )}
                {analysis.summary && (
                  <p className="text-txt leading-relaxed">{analysis.summary}</p>
                )}
              </div>
              {analysis.job?.source_url && (
                <a
                  href={analysis.job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    {t("detail.viewJobPosting")}
                  </Button>
                </a>
              )}
            </div>

            <div className="flex min-h-0 min-w-0 flex-col gap-6 md:col-span-2 md:overflow-y-auto">
              {analysis.strengths.length > 0 && (
                <Section title={t("detail.strengths")}>
                  <ul className="flex flex-col gap-1.5">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="text-txt flex gap-2">
                        <span className="mt-0.5 shrink-0">•</span>
                        <span className="break-words">{s}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {analysis.weaknesses.length > 0 && (
                <Section title={t("detail.weaknesses")}>
                  <ul className="flex flex-col gap-1.5">
                    {analysis.weaknesses.map((w, i) => (
                      <li key={i} className="text-txt flex gap-2">
                        <span className="mt-0.5 shrink-0">•</span>
                        <span className="break-words">{w}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {analysis.missing_skills.length > 0 && (
                <Section title={t("detail.missingSkills")}>
                  <div className="flex flex-wrap gap-2">
                    <ChipList items={analysis.missing_skills} />
                  </div>
                </Section>
              )}
              <div className="h-24 shrink-0 md:h-32" />
            </div>
          </div>
        </div>
      </PageLayout>
    </div>
  );
}
