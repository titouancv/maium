"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { InfoMessage, Selector } from "@/components/ui";
import { APPLICATION_STATUS_COLORS } from "@/constants/ui";
import { updateAnalysisTrackingRequest } from "@/lib/jobs/updateTracking";
import { APPLICATION_STATUSES, type AnalysisListItem } from "@/types/job";

interface ApplicationStatusSelectorProps {
  analysis: AnalysisListItem;
}

export function ApplicationStatusSelector({
  analysis,
}: ApplicationStatusSelectorProps) {
  const t = useTranslations("jobs");
  const router = useRouter();

  const [status, setStatus] = useState(analysis.status);
  const [failed, setFailed] = useState(false);

  const handleStatusChange = async (index: number) => {
    const next = APPLICATION_STATUSES[index];
    setStatus(next);
    const saved = await updateAnalysisTrackingRequest(analysis.id, {
      status: next,
    });
    setFailed(!saved);
    if (saved) router.refresh();
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 md:self-start">
        <Selector
          values={APPLICATION_STATUSES.map((value) => ({
            label: t(`status.${value}`),
            color: APPLICATION_STATUS_COLORS[value],
          }))}
          activeIndex={APPLICATION_STATUSES.indexOf(status)}
          onChange={handleStatusChange}
        />
      </div>
      <InfoMessage message={failed ? t("detail.tracking.saveError") : null} />
    </div>
  );
}
