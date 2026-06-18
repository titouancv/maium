"use client";

import { useTranslations } from "next-intl";
import type { AnalysisListItem } from "@/types/job";

interface AnalysisHistoryItemProps {
  analysis: AnalysisListItem;
  onClick: () => void;
}

export function AnalysisHistoryItem({
  analysis,
  onClick,
}: AnalysisHistoryItemProps) {
  const t = useTranslations("jobs");

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start justify-between gap-4 text-left hover:cursor-pointer"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-txt group-hover:text-primary truncate">
          {analysis.job?.title || t("untitledJob")}
        </p>
        <p className="text-txt-muted truncate text-xs">
          {[analysis.job?.company, analysis.job?.location]
            .filter(Boolean)
            .join(" • ")}
        </p>
        {analysis.summary && (
          <p className="text-txt-muted mt-1 line-clamp-2">{analysis.summary}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="group-hover:text-primary text-2xl font-semibold">
          {analysis.matching_score}
        </span>
      </div>
    </button>
  );
}
