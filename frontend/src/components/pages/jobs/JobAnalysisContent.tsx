"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "../../layout";
import { AnalyzeJob } from "./collections/AnalyzeJob";

export function JobAnalysisContent() {
  const t = useTranslations("jobs");
  const tCommon = useTranslations("common");

  return (
    <PageLayout title={t("title")} backLabel={tCommon("backButton")}>
      <div className="flex h-full w-full max-w-2xl flex-col gap-8 md:overflow-hidden">
        <AnalyzeJob />
      </div>
    </PageLayout>
  );
}
