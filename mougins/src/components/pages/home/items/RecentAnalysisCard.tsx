"use client";

import { useLocale, useTranslations } from "next-intl";
import { Rail, Text } from "@/components/ui";
import { ROUTES } from "@/constants";
import { APPLICATION_STATUS_COLORS } from "@/constants/ui";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/date";
import type { AnalysisListItem } from "@/types/job";

interface RecentAnalysisCardProps {
  analysis: AnalysisListItem;
}

export const RecentAnalysisCard = ({ analysis }: RecentAnalysisCardProps) => {
  const t = useTranslations("jobs");
  const locale = useLocale();
  const statusColor = { color: APPLICATION_STATUS_COLORS[analysis.status] };

  const subtitle = [analysis.job?.company, analysis.job?.location]
    .filter(Boolean)
    .join(" • ");

  return (
    <Link
      href={ROUTES.JOB_ANALYSIS(analysis.id)}
      className="group flex h-full w-56 shrink-0 gap-3 sm:w-64"
    >
      <Rail style={statusColor} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
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
        <div className="mt-auto flex items-baseline justify-between gap-2">
          <Text size="xs" truncate style={statusColor}>
            {t(`status.${analysis.status}`)}
          </Text>
          <p className="text-txt-muted shrink-0 text-xs">
            {formatRelativeTime(new Date(analysis.created_at).getTime(), locale)}
          </p>
        </div>
      </div>
    </Link>
  );
};
