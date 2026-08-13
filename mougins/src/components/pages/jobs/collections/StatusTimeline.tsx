"use client";

import { useLocale, useTranslations } from "next-intl";
import { Rail, Text } from "@/components/ui";
import { formatLongDate } from "@/lib/date";
import type { AnalysisStatusEvent } from "@/types/job";

interface StatusTimelineProps {
  events: AnalysisStatusEvent[];
  createdAt: string;
}

export function StatusTimeline({ events, createdAt }: StatusTimelineProps) {
  const t = useTranslations("jobs");
  const locale = useLocale();

  const entries = [
    ...events.map((event) => ({
      key: event.id,
      label: t(`status.${event.status}`),
      date: event.created_at,
    })),
    { key: "created", label: t("detail.tracking.analysed"), date: createdAt },
  ];

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.key} className="text-txt-muted flex items-center gap-3">
          <Rail />
          <Text size="sm">{entry.label}</Text>
          <Text tone="muted" size="sm">
            {formatLongDate(entry.date, locale)}
          </Text>
        </li>
      ))}
    </ul>
  );
}
