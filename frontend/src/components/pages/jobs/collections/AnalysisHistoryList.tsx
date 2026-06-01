"use client";

import { useTranslations } from "next-intl";
import { Section } from "@/components/ui/Section";
import type { AnalysisListItem } from "@/types/job";
import { AnalysisHistoryItem } from "../items/AnalysisHistoryItem";

interface AnalysisHistoryListProps {
  history: AnalysisListItem[];
}

export function AnalysisHistoryList({ history }: AnalysisHistoryListProps) {
  const t = useTranslations("jobs");

  return (
    <Section title={t("historyTitle")}>
      {history.length === 0 ? (
        <p className="text-txt-muted text-sm">{t("historyEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((analysis) => (
            <AnalysisHistoryItem key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </Section>
  );
}
