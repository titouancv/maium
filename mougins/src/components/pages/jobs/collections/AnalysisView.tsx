"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { AnalysisListItem } from "@/types/job";
import { Button, Text } from "@/components/ui";
import { DownloadResumeButton } from "./DownloadResumeButton";
import { CoverLetterButton } from "./CoverLetterButton";
import { PrepPointList } from "./PrepPointList";
import { RecruiterQuestionList } from "./RecruiterQuestionList";

interface AnalysisViewProps {
  analysis: AnalysisListItem;
  tracking?: ReactNode;
  contacts?: ReactNode;
}

export function AnalysisView({
  analysis,
  tracking,
  contacts,
}: AnalysisViewProps) {
  const t = useTranslations("jobs");

  return (
    <div className="grid h-full w-full min-w-0 grid-cols-1 gap-6 md:grid-cols-3">
      <div className="flex w-full min-w-0 flex-col gap-6">
        <div className="flex items-end gap-2">
          <span className="text-primary text-4xl font-bold">
            {analysis.matching_score}
          </span>
          <span className="pb-0.5">{t("matchScore")}</span>
        </div>
        {analysis.confidence_score < 75 && (
          <Text tone="primary" size="sm">
            {t("detail.lowConfidenceWarning", {
              score: analysis.confidence_score,
            })}
          </Text>
        )}
        <div className="flex flex-col gap-1">
          {analysis.job?.location && (
            <Text tone="muted" truncate>
              {analysis.job.location}
            </Text>
          )}
          {analysis.summary && (
            <Text className="leading-relaxed">{analysis.summary}</Text>
          )}
        </div>
        {analysis.resume_id && (
          <DownloadResumeButton resumeId={analysis.resume_id} />
        )}
        {analysis.cover_letter && (
          <CoverLetterButton coverLetter={analysis.cover_letter} />
        )}
        {analysis.job?.source_url?.startsWith("http") && (
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

      <div className="flex min-h-0 min-w-0 flex-col gap-10 md:col-span-2 md:overflow-y-auto">
        <PrepPointList points={analysis.prep_points} />
        <RecruiterQuestionList questions={analysis.recruiter_questions} />
        {contacts}
        {tracking}
        <Text tone="muted" size="xs" className="text-center">
          {t("detail.aiDisclaimer")}
        </Text>
        <div className="h-24 shrink-0 md:h-32" />
      </div>
    </div>
  );
}
