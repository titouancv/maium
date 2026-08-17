"use client";

import { useTranslations } from "next-intl";
import { ANALYSIS_LOW_CONFIDENCE_SCORE } from "@/constants";
import { Button, Text } from "@/components/ui";
import type { AnalysisListItem } from "@/types/job";
import { DownloadResumeButton } from "./DownloadResumeButton";
import { CoverLetterButton } from "./CoverLetterButton";

interface AnalysisOverviewProps {
  analysis: AnalysisListItem;
}

export function AnalysisOverview({ analysis }: AnalysisOverviewProps) {
  const t = useTranslations("jobs");

  const jobUrl = analysis.job?.source_url?.startsWith("http")
    ? analysis.job.source_url
    : null;
  const hasDocuments = Boolean(
    analysis.resume_id || analysis.cover_letter || jobUrl,
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-10">
      <div className="flex w-full min-w-0 flex-col gap-6 md:items-start md:gap-8">
        <div className="flex shrink-0 flex-col items-start gap-2">
          <div className="flex shrink-0 flex-col items-start gap-1">
            <span className="text-primary text-5xl leading-none font-extrabold">
              {analysis.matching_score}
            </span>
            <Text tone="muted" className="pb-0.5">
              {t("matchScore")}
            </Text>
          </div>
          {analysis.confidence_score < ANALYSIS_LOW_CONFIDENCE_SCORE && (
            <Text tone="primary" size="sm">
              {t("detail.lowConfidenceWarning")}
            </Text>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {analysis.summary && <Text>{analysis.summary}</Text>}
        </div>
      </div>

      {hasDocuments && (
        <div className="flex flex-col items-start gap-3">
          {analysis.resume_id && (
            <DownloadResumeButton resumeId={analysis.resume_id} />
          )}
          {analysis.cover_letter && (
            <CoverLetterButton coverLetter={analysis.cover_letter} />
          )}
          {jobUrl && (
            <a href={jobUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">{t("detail.viewJobPosting")}</Button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
