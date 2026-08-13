"use client";

import { Suspense, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { BackButton } from "@/components/ui";
import { PageLayout } from "../../layout";
import { AnalysisLoader } from "./collections/AnalysisLoader";
import { AnalysisHeadingLoader } from "./collections/AnalysisHeadingLoader";
import { AnalysisDetailSkeleton, AnalysisHeadingSkeleton } from "./JobsSkeleton";
import type { AnalysisListItem } from "@/types/job";

interface JobAnalysisDetailContentProps {
  analysisPromise: Promise<AnalysisListItem | null>;
  contacts: ReactNode;
}

export function JobAnalysisDetailContent({
  analysisPromise,
  contacts,
}: JobAnalysisDetailContentProps) {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");

  return (
    <PageLayout
      title={
        <>
          <Suspense fallback={<AnalysisHeadingSkeleton />}>
            <AnalysisHeadingLoader analysisPromise={analysisPromise} />
          </Suspense>
          <div className="shrink-0">
            <BackButton label={tCommon("backButton")} />
          </div>
        </>
      }
      documentTitle={t("title")}
      showNavigationBar={false}
    >
      <div className="flex w-full max-w-7xl min-w-0 flex-col gap-8">
        <Suspense fallback={<AnalysisDetailSkeleton />}>
          <AnalysisLoader analysisPromise={analysisPromise} contacts={contacts} />
        </Suspense>
      </div>
    </PageLayout>
  );
}
