"use client";

import { useLocale, useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/date";
import type { AnalysisListItem } from "@/types/job";

interface RecentAnalysisCardProps {
  analysis: AnalysisListItem;
}

/**
 * One past analysis, previewed on the home dashboard. It links to the history
 * page with the detail overlay already open, so the card is a shortcut into the
 * existing screen rather than a second place where an analysis can be read.
 */
export const RecentAnalysisCard = ({ analysis }: RecentAnalysisCardProps) => {
  const t = useTranslations("jobs");
  const locale = useLocale();

  const subtitle = [analysis.job?.company, analysis.job?.location]
    .filter(Boolean)
    .join(" • ");

  return (
    <Link
      href={ROUTES.JOBS_HISTORY_ANALYSIS(analysis.id)}
      className="group flex h-full w-56 shrink-0 flex-col gap-2 sm:w-64"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Clamped: job titles run long, and an unbounded one makes every card
            in the row as tall as the worst offender. */}
        <p className="group-hover:text-primary line-clamp-2 text-lg font-extrabold">
          {analysis.job?.title || t("untitledJob")}
        </p>
        <span className="group-hover:text-primary shrink-0 text-2xl font-semibold">
          {analysis.matching_score}
        </span>
      </div>
      {subtitle && (
        <p className="text-txt-muted truncate text-xs">{subtitle}</p>
      )}
      <p className="text-txt-muted mt-auto text-xs">
        {formatRelativeTime(new Date(analysis.created_at).getTime(), locale)}
      </p>
    </Link>
  );
};
