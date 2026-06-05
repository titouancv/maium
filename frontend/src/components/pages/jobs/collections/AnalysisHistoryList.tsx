"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import type { AnalysisListItem } from "@/types/job";
import { AnalysisHistoryItem } from "../items/AnalysisHistoryItem";
import { AnalysisDetailOverlay } from "./AnalysisDetailOverlay";

interface AnalysisHistoryListProps {
  history: AnalysisListItem[];
}

export function AnalysisHistoryList({ history }: AnalysisHistoryListProps) {
  const t = useTranslations("jobs");
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("analysis");

  const [selected, setSelected] = useState<AnalysisListItem | null>(() =>
    openId ? (history.find((a) => a.id === openId) ?? null) : null,
  );

  const cleanedUrl = useRef(false);
  useEffect(() => {
    if (openId && !cleanedUrl.current) {
      cleanedUrl.current = true;
      router.replace(ROUTES.JOBS_HISTORY);
    }
  }, [openId, router]);

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
