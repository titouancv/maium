"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/EmptyState";
import { Selector } from "@/components/ui/Selector";
import { APPLICATION_STATUS_COLORS } from "@/constants/ui";
import { APPLICATION_STATUSES, type AnalysisListItem } from "@/types/job";
import { AnalysisHistoryItem } from "../items/AnalysisHistoryItem";

interface AnalysisHistoryListProps {
  history: AnalysisListItem[];
}

const FILTERS = [null, ...APPLICATION_STATUSES] as const;

export function AnalysisHistoryList({ history }: AnalysisHistoryListProps) {
  const t = useTranslations("jobs");
  const [filterIndex, setFilterIndex] = useState(0);

  const activeStatus = FILTERS[filterIndex];
  const visible = activeStatus
    ? history.filter((analysis) => analysis.status === activeStatus)
    : history;

  if (history.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <EmptyState label={t("historyEmpty")} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <Selector
        values={FILTERS.map((status) => ({
          label: status ? t(`status.${status}`) : t("historyFilterAll"),
          color: status ? APPLICATION_STATUS_COLORS[status] : undefined,
        }))}
        activeIndex={filterIndex}
        onChange={setFilterIndex}
      />

      {visible.length === 0 ? (
        <EmptyState label={t("historyFilterEmpty")} />
      ) : (
        <div className="flex min-h-0 flex-col gap-4 md:overflow-y-auto">
          {visible.map((analysis) => (
            <AnalysisHistoryItem key={analysis.id} analysis={analysis} />
          ))}
          <div className="h-24 shrink-0 md:h-[250px]" />
        </div>
      )}
    </div>
  );
}
