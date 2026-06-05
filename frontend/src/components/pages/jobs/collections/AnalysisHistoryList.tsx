"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { AnalysisListItem } from "@/types/job";
import { AnalysisHistoryItem } from "../items/AnalysisHistoryItem";
import { AnalysisDetailOverlay } from "./AnalysisDetailOverlay";

interface AnalysisHistoryListProps {
  history: AnalysisListItem[];
}

export function AnalysisHistoryList({ history }: AnalysisHistoryListProps) {
  const t = useTranslations("jobs");
  const [selected, setSelected] = useState<AnalysisListItem | null>(null);

  return (
    <div className="flex h-full flex-col">
      {history.length === 0 ? (
        <p className="text-txt-muted">{t("historyEmpty")}</p>
      ) : (
        <div className="flex min-h-0 flex-col gap-3 md:overflow-y-auto">
          {history.map((analysis) => (
            <AnalysisHistoryItem
              key={analysis.id}
              analysis={analysis}
              onClick={() => setSelected(analysis)}
            />
          ))}
          <div className="h-24 shrink-0 md:h-[250px]" />
        </div>
      )}

      {selected && (
        <AnalysisDetailOverlay
          analysis={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
