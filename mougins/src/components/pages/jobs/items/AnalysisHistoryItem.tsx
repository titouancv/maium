"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { Rail, Text } from "@/components/ui";
import { APPLICATION_STATUS_TONES } from "@/constants/ui";
import type { AnalysisListItem } from "@/types/job";

interface AnalysisHistoryItemProps {
  analysis: AnalysisListItem;
}

export function AnalysisHistoryItem({ analysis }: AnalysisHistoryItemProps) {
  const t = useTranslations("jobs");

  return (
    <Link
      href={ROUTES.JOB_ANALYSIS(analysis.id)}
      className="group flex w-full items-start justify-between gap-4 text-left"
    >
      <div className="flex min-w-0 gap-3">
        <Rail className={APPLICATION_STATUS_TONES[analysis.status]} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-txt group-hover:text-primary truncate">
            {analysis.job?.title || t("untitledJob")}
          </p>
          <p className="text-txt-muted truncate text-xs">
            {[analysis.job?.company, analysis.job?.location]
              .filter(Boolean)
              .join(" • ")}
          </p>
          <Text
            tone="muted"
            size="xs"
            className={APPLICATION_STATUS_TONES[analysis.status]}
          >
            {t(`status.${analysis.status}`)}
          </Text>
          {analysis.summary && (
            <p className="mt-1 line-clamp-2">{analysis.summary}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="group-hover:text-primary text-2xl font-semibold">
          {analysis.matching_score}
        </span>
      </div>
    </Link>
  );
}
