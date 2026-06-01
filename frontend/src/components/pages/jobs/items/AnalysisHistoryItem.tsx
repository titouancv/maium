"use client";

import { useTranslations } from "next-intl";
import type { AnalysisListItem } from "@/types/job";

interface AnalysisHistoryItemProps {
  analysis: AnalysisListItem;
  onClick: () => void;
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-success";
  if (score >= 40) return "text-txt";
  return "text-error";
}

export function AnalysisHistoryItem({ analysis, onClick }: AnalysisHistoryItemProps) {
  const t = useTranslations("jobs");

  return (
    <button
      onClick={onClick}
      className="bg-surface-50 border-brd-200 hover:bg-surface-100 flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition-colors">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-txt truncate font-medium">
          {analysis.job?.title || t("untitledJob")}
        </p>
        <p className="text-txt-muted truncate text-sm">
          {[analysis.job?.company, analysis.job?.location]
            .filter(Boolean)
            .join(" • ")}
        </p>
        {analysis.summary && (
          <p className="text-txt-muted mt-1 line-clamp-2 text-sm">
            {analysis.summary}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className={`text-2xl font-semibold ${scoreColor(analysis.matching_score)}`}>
          {analysis.matching_score}
        </span>
        <span className="text-txt-muted text-xs">{t("matchScore")}</span>
      </div>
    </button>
  );
}
