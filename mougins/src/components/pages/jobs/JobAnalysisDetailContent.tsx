"use client";

import { Suspense, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PageLayout } from "../../layout";
import { AnalysisLoader } from "./collections/AnalysisLoader";
import { AnalysisDetailSkeleton } from "./JobsSkeleton";
import type { AnalysisListItem, AnalysisStatusEvent } from "@/types/job";

interface JobAnalysisDetailContentProps {
  analysisPromise: Promise<AnalysisListItem | null>;
  eventsPromise: Promise<AnalysisStatusEvent[]>;
  contacts: ReactNode;
}

export function JobAnalysisDetailContent({
  analysisPromise,
  eventsPromise,
  contacts,
}: JobAnalysisDetailContentProps) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");

  return (
    <PageLayout title={t("title")} backLabel={tCommon("backButton")} fullHeight>
      <div className="flex h-full w-full max-w-7xl flex-col gap-8">
        <Suspense fallback={<AnalysisDetailSkeleton />}>
          <AnalysisLoader
            analysisPromise={analysisPromise}
            eventsPromise={eventsPromise}
            contacts={contacts}
          />
        </Suspense>
      </div>
    </PageLayout>
  );
}
