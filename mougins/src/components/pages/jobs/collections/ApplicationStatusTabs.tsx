"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { InfoMessage } from "@/components/ui";
import { Tabs } from "@/components/ui/Tabs";
import { updateAnalysisTrackingRequest } from "@/lib/jobs/updateTracking";
import { APPLICATION_STATUSES, type AnalysisListItem } from "@/types/job";

interface ApplicationStatusTabsProps {
  analysis: AnalysisListItem;
}

export function ApplicationStatusTabs({
  analysis,
}: ApplicationStatusTabsProps) {
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
        <Tabs
          tabs={APPLICATION_STATUSES.map((value) => t(`status.${value}`))}
          activeTab={APPLICATION_STATUSES.indexOf(status)}
          onChange={handleStatusChange}
          layoutId="applicationStatus"
        />
      </div>
      <InfoMessage message={failed ? t("detail.tracking.saveError") : null} />
    </div>
  );
}
